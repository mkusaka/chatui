use crate::{
    gemini::ChatHandler,
    git::RepoContext,
    models::{AppState, Message, Mode},
    ui,
};
use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{backend::CrosstermBackend, widgets::ListState, widgets::ScrollbarState, Terminal};
use std::{io, path::PathBuf, time::Duration};
use tokio::sync::mpsc;

pub struct App {
    state: AppState,
    should_quit: bool,
    scroll_state: ScrollbarState,
    list_state: ListState,
    chat_tx: mpsc::Sender<Message>,
}

impl App {
    pub fn new(repo_path: PathBuf, api_key: String, model: Option<String>) -> Result<Self> {
        let (mut state, chat_tx) = {
            let mut state = AppState::new(repo_path.clone());
            let (mut handler, tx) = ChatHandler::new(api_key, model);

            // Initialize git context
            let mut repo_context = RepoContext::new(&repo_path)?;
            state.repo_context = Some(repo_context.update_context()?.to_string());

            // Spawn chat handler
            let mut state_clone = state.clone();
            tokio::spawn(async move {
                if let Err(e) = handler.run(&mut state_clone).await {
                    eprintln!("Chat handler error: {}", e);
                }
            });

            (state, tx)
        };

        // Add initial system message
        state.add_message(
            "System".to_string(),
            "Welcome to ChatRepo! Repository context loaded. Type your questions about the code."
                .to_string(),
        );

        Ok(Self {
            state,
            should_quit: false,
            scroll_state: ScrollbarState::default(),
            list_state: ListState::default(),
            chat_tx,
        })
    }

    pub async fn run(&mut self) -> Result<()> {
        // Terminal initialization
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
        let backend = CrosstermBackend::new(stdout);
        let mut terminal = Terminal::new(backend)?;

        // Main event loop
        while !self.should_quit {
            terminal.draw(|f| {
                ui::render(
                    f,
                    &mut self.state,
                    &mut self.scroll_state,
                    &mut self.list_state,
                )
            })?;

            if event::poll(Duration::from_millis(100))? {
                if let Event::Key(key) = event::read()? {
                    if key.kind == KeyEventKind::Press {
                        self.handle_key(key.code).await?;
                    }
                }
            }
        }

        // Cleanup
        disable_raw_mode()?;
        execute!(
            terminal.backend_mut(),
            LeaveAlternateScreen,
            DisableMouseCapture
        )?;
        terminal.show_cursor()?;
        Ok(())
    }

    async fn handle_key(&mut self, key: KeyCode) -> Result<()> {
        match self.state.mode {
            Mode::Normal => self.handle_normal_mode(key),
            Mode::Insert => self.handle_insert_mode(key).await,
            Mode::Command => self.handle_command_mode(key).await,
        }
    }

    fn handle_normal_mode(&mut self, key: KeyCode) -> Result<()> {
        match key {
            KeyCode::Char('q') => self.should_quit = true,
            KeyCode::Char('i') => self.state.enter_insert_mode(),
            KeyCode::Char('j') => self.scroll_down(),
            KeyCode::Char('k') => self.scroll_up(),
            KeyCode::Char(':') => {
                self.state.mode = Mode::Command;
                self.state.input.clear();
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_insert_mode(&mut self, key: KeyCode) -> Result<()> {
        match key {
            KeyCode::Esc => self.state.enter_normal_mode(),
            KeyCode::Enter => self.submit_message().await?,
            KeyCode::Char(c) => self.state.input.push(c),
            KeyCode::Backspace => {
                self.state.input.pop();
            }
            _ => {}
        }
        Ok(())
    }

    async fn handle_command_mode(&mut self, key: KeyCode) -> Result<()> {
        match key {
            KeyCode::Esc => self.state.enter_normal_mode(),
            KeyCode::Enter => {
                if self.state.input.starts_with("update") {
                    let mut repo_context = RepoContext::new(&self.state.repo_path)?;
                    self.state.repo_context = Some(repo_context.update_context()?.to_string());
                    self.state.input.clear();
                    self.state.add_message(
                        "System".to_string(),
                        "Repository context updated.".to_string(),
                    );
                }
                self.state.mode = Mode::Normal;
            }
            KeyCode::Char(c) => self.state.input.push(c),
            KeyCode::Backspace => {
                self.state.input.pop();
            }
            _ => {}
        }
        Ok(())
    }

    fn scroll_up(&mut self) {
        let current = self.list_state.selected().unwrap_or(0);
        if current > 0 {
            self.list_state.select(Some(current - 1));
        }
    }

    fn scroll_down(&mut self) {
        let current = self.list_state.selected().unwrap_or(0);
        if current < self.state.messages.len().saturating_sub(1) {
            self.list_state.select(Some(current + 1));
        }
    }

    async fn submit_message(&mut self) -> Result<()> {
        if !self.state.input.is_empty() {
            let message = Message {
                role: "User".to_string(),
                content: self.state.input.clone(),
                timestamp: chrono::Utc::now(),
            };

            self.chat_tx.send(message).await?;
            self.state.input.clear();
        }
        Ok(())
    }
}

impl Drop for App {
    fn drop(&mut self) {
        // Ensure terminal is properly cleaned up even if app panics
        let _ = disable_raw_mode();
        let mut stdout = io::stdout();
        let _ = execute!(stdout, LeaveAlternateScreen, DisableMouseCapture);
    }
}
