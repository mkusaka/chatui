mod markdown;
mod message_block;

use anyhow::Result;
use crossterm::{
    event::{self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind},
    execute,
    terminal::{disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen},
};
use message_block::MessageBlock;
use ratatui::{prelude::*, widgets::*};
use std::io::{self, Stdout};
use crossterm::event::KeyModifiers;
use tui_textarea::TextArea;

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
    input: TextArea<'static>,
    mode: Mode,
    selected_index: Option<usize>,
    scroll_position: u16,
}

impl App {
    pub fn new() -> Self {
        let mut input = TextArea::default();
        input.set_block(Block::default().borders(Borders::ALL).title("Input"));
        input.set_style(Style::default().fg(Color::White));
        input.set_placeholder_text("Enter your message... (Ctrl+Enter to send)");

        Self {
            messages: Vec::new(),
            input,
            mode: Mode::Normal,
            selected_index: None,
            scroll_position: 0,
        }
    }
}

fn main() -> Result<()> {
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
    let mut terminal = Terminal::new(CrosstermBackend::new(stdout))?;

    let app = App::new();
    let res = run_app(&mut terminal, app);

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
                        KeyCode::Char('i') => {
                            app.mode = Mode::Insert;
                            app.input.set_style(Style::default().fg(Color::Yellow));
                        }
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
                    Mode::Insert => {
                        match key.code {
                            KeyCode::Esc => {
                                app.mode = Mode::Normal;
                                app.input.set_style(Style::default().fg(Color::White));
                            }
                            KeyCode::Enter => {
                                if key.modifiers.contains(KeyModifiers::CONTROL) {
                                    let content = app.input.lines().join("\n");
                                    if !content.is_empty() {
                                        app.messages.push(Message {
                                            role: Role::User,
                                            content,
                                            is_editing: false,
                                        });
                                        app.input.select_all();
                                        app.input.delete_char();
                                        app.input.move_cursor(tui_textarea::CursorMove::End);
                                    }
                                } else {
                                    app.input.insert_newline();
                                }
                            }
                            KeyCode::Char(c) => {
                                if key.modifiers.contains(KeyModifiers::CONTROL) {
                                    match c {
                                        'u' => { app.input.delete_line_by_head(); }
                                        'w' => { app.input.delete_word(); }
                                        'h' => { app.input.delete_char(); }
                                        _ => {}
                                    }
                                } else {
                                    app.input.insert_char(c);
                                }
                            }
                            KeyCode::Backspace => {
                                app.input.delete_char();
                            }
                            KeyCode::Delete => {
                                app.input.delete_next_char();
                            }
                            KeyCode::Left => {
                                if key.modifiers.contains(KeyModifiers::CONTROL) {
                                    app.input.move_cursor(tui_textarea::CursorMove::ParagraphBack);
                                } else {
                                    app.input.move_cursor(tui_textarea::CursorMove::Back);
                                }
                            }
                            KeyCode::Right => {
                                if key.modifiers.contains(KeyModifiers::CONTROL) {
                                    app.input.move_cursor(tui_textarea::CursorMove::ParagraphForward);
                                } else {
                                    app.input.move_cursor(tui_textarea::CursorMove::Forward);
                                }
                            }
                            KeyCode::Up => {
                                app.input.move_cursor(tui_textarea::CursorMove::Up);
                            }
                            KeyCode::Down => {
                                app.input.move_cursor(tui_textarea::CursorMove::Down);
                            }
                            KeyCode::Home => {
                                app.input.move_cursor(tui_textarea::CursorMove::Head);
                            }
                            KeyCode::End => {
                                app.input.move_cursor(tui_textarea::CursorMove::End);
                            }
                            _ => {}
                        }
                    }
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
            Constraint::Length(5),
        ])
        .split(f.size());

    let messages: Vec<ListItem> = app
        .messages
        .iter()
        .enumerate()
        .map(|(i, m)| {
            let message_block = MessageBlock::new(m, Some(i) == app.selected_index);
            let spans = message_block.render(chunks[0]);
            let line = Line::from(spans);
            ListItem::new(line).style(
                if Some(i) == app.selected_index {
                    Style::default().bg(Color::DarkGray)
                } else {
                    Style::default()
                }
            )
        })
        .collect();

    let messages = List::new(messages)
        .block(Block::default().title("Chat History").borders(Borders::ALL))
        .highlight_style(Style::default().bg(Color::DarkGray));

    f.render_widget(messages, chunks[0]);
    f.render_widget(app.input.widget(), chunks[1]);
}
