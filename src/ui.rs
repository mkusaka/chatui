use crate::models::{AppState, Mode};
use ratatui::{
    prelude::*,
    widgets::{
        Block, Borders, List, ListItem, ListState, Paragraph, Scrollbar, ScrollbarOrientation,
        ScrollbarState,
    },
};

pub fn render(
    f: &mut Frame,
    state: &mut AppState,
    scroll_state: &mut ScrollbarState,
    list_state: &mut ListState,
) {
    let chunks = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Min(3),         // Status line
            Constraint::Percentage(80), // Chat history
            Constraint::Length(3),      // Input box
        ])
        .split(f.size());

    render_status_line(f, state, chunks[0]);
    render_chat_history(f, state, scroll_state, list_state, chunks[1]);
    render_input_box(f, state, chunks[2]);
}

fn render_status_line(f: &mut Frame, state: &AppState, area: Rect) {
    let mode_text = match state.mode {
        Mode::Normal => " NORMAL ",
        Mode::Insert => " INSERT ",
        Mode::Command => " COMMAND ",
    };

    let mut text = format!("{mode_text} | Repository: {}", state.repo_path.display());

    if let Some(error) = &state.error {
        text.push_str(&format!(" | Error: {}", error));
    }

    let status = Paragraph::new(text).style(Style::default().add_modifier(Modifier::REVERSED));

    f.render_widget(status, area);
}

fn render_chat_history(
    f: &mut Frame,
    state: &AppState,
    scroll_state: &mut ScrollbarState,
    list_state: &mut ListState,
    area: Rect,
) {
    let block = Block::default().borders(Borders::ALL).title("Chat History");

    let messages: Vec<ListItem> = state
        .messages
        .iter()
        .map(|msg| {
            let style = match msg.role.as_str() {
                "Assistant" => Style::default().fg(Color::Green),
                "User" => Style::default().fg(Color::Yellow),
                "System" => Style::default().fg(Color::Blue),
                _ => Style::default(),
            };

            let content = format!(
                "[{}] {}: {}",
                msg.timestamp.format("%H:%M:%S"),
                msg.role,
                msg.content
            );

            ListItem::new(content).style(style)
        })
        .collect();

    let list = List::new(messages)
        .block(block)
        .highlight_style(Style::default().add_modifier(Modifier::REVERSED));

    f.render_stateful_widget(list, area, list_state);

    let scrollbar = Scrollbar::default()
        .orientation(ScrollbarOrientation::VerticalRight)
        .begin_symbol(None)
        .end_symbol(None);

    f.render_stateful_widget(
        scrollbar,
        area.inner(&Margin {
            vertical: 1,
            horizontal: 0,
        }),
        scroll_state,
    );
}

fn render_input_box(f: &mut Frame, state: &AppState, area: Rect) {
    let title = match state.mode {
        Mode::Insert => "Input",
        Mode::Command => "Command",
        Mode::Normal => "Press 'i' to insert",
    };

    let input = Paragraph::new(state.input.as_str())
        .style(Style::default())
        .block(Block::default().borders(Borders::ALL).title(title));

    f.render_widget(input, area);
}
