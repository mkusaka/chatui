use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use ratatui::{prelude::*, widgets::*};
use std::io::{self, Stdout};
use unicode_width::UnicodeWidthStr;

#[derive(Debug, Clone)]
pub enum Role {
    System,
    User,
    Assistant,
}

#[derive(Debug, Clone)]
pub struct Message {
    role: Role,
    content: String,
    is_editing: bool,
}

#[derive(Debug)]
pub enum Mode {
    Normal,
    Insert,
    Command,
}

#[derive(Debug)]
pub struct App {
    messages: Vec<Message>,
    input: String,
    mode: Mode,
    selected_index: Option<usize>,
    scroll_position: u16,
}

impl App {
    pub fn new() -> Self {
        Self {
            messages: Vec::new(),
            input: String::new(),
            mode: Mode::Normal,
            selected_index: None,
            scroll_position: 0,
        }
    }
}

fn main() -> Result<()> {
    // Setup terminal
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let mut terminal = Terminal::new(CrosstermBackend::new(stdout))?;

    // Create app and run it
    let app = App::new();
    let res = run_app(&mut terminal, app);

    // Restore terminal
    disable_raw_mode()?;
    execute!(
        terminal.backend_mut(),
        LeaveAlternateScreen,
        DisableMouseCapture
    )?;
    terminal.show_cursor()?;

    if let Err(err) = res {
        println!("{err:?}");
    }

    Ok(())
}

fn run_app(terminal: &mut Terminal<CrosstermBackend<Stdout>>, mut app: App) -> Result<()> {
    loop {
        terminal.draw(|f| ui(f, &app))?;

        if let Event::Key(key) = event::read()? {
            if key.kind == KeyEventKind::Press {
                match app.mode {
                    Mode::Normal => match key.code {
                        KeyCode::Char('q') => return Ok(()),
                        KeyCode::Char('i') => app.mode = Mode::Insert,
                        KeyCode::Char('j') => {
                            if let Some(idx) = app.selected_index {
                                app.selected_index = Some((idx + 1).min(app.messages.len().saturating_sub(1)));
                            } else {
                                app.selected_index = Some(0);
                            }
                        }
                        KeyCode::Char('k') => {
                            if let Some(idx) = app.selected_index {
                                app.selected_index = Some(idx.saturating_sub(1));
                            }
                        }
                        _ => {}
                    },
                    Mode::Insert => match key.code {
                        KeyCode::Esc => app.mode = Mode::Normal,
                        KeyCode::Char(c) => app.input.push(c),
                        KeyCode::Backspace => {
                            app.input.pop();
                        }
                        KeyCode::Enter => {
                            if !app.input.is_empty() {
                                app.messages.push(Message {
                                    role: Role::User,
                                    content: app.input.drain(..).collect(),
                                    is_editing: false,
                                });
                            }
                        }
                        _ => {}
                    },
                    Mode::Command => match key.code {
                        KeyCode::Char('q') => return Ok(()),
                        _ => {}
                    },
                }
            }
        }
    }
}

fn ui(f: &mut Frame, app: &App) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(3),
            Constraint::Length(3),
        ])
        .split(f.size());

    // Chat history area with enhanced message blocks
    let messages: Vec<ListItem> = app
        .messages
        .iter()
        .enumerate()
        .map(|(i, m)| {
            let message_block = MessageBlock::new(m, Some(i) == app.selected_index);
            let spans = message_block.render(chunks[0]);
            ListItem::new(Spans::from(spans))
                .style(if Some(i) == app.selected_index {
                    Style::default().bg(Color::DarkGray)
                } else {
                    Style::default()
                })
        })
        .collect();

    let messages = List::new(messages)
        .block(Block::default().title("Chat History").borders(Borders::ALL))
        .highlight_style(Style::default().bg(Color::DarkGray))
        .wrap(true);

    f.render_widget(messages, chunks[0]);

    // Input area (unchanged)
    let input = Paragraph::new(app.input.as_str())
        .style(match app.mode {
            Mode::Insert => Style::default().fg(Color::Yellow),
            _ => Style::default(),
        })
        .block(Block::default().borders(Borders::ALL).title("Input"));
    f.render_widget(input, chunks[1]);
}
