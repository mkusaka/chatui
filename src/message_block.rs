use crate::markdown::{parse_markdown, MarkdownElement};
use crate::{Message, Role};
use ratatui::{
    layout::Rect,
    style::{Color, Modifier, Style},
    text::Span,
};

pub struct MessageBlock<'a> {
    message: &'a Message,
    is_selected: bool,
}

impl<'a> MessageBlock<'a> {
    pub fn new(message: &'a Message, is_selected: bool) -> Self {
        Self {
            message,
            is_selected,
        }
    }

    pub fn render(&self, area: Rect) -> Vec<Span<'a>> {
        let mut spans = Vec::new();
        
        let role_color = match self.message.role {
            Role::System => Color::Blue,
            Role::User => Color::Green,
            Role::Assistant => Color::Yellow,
        };
        
        let role_prefix = match self.message.role {
            Role::System => "System: ",
            Role::User => "User: ",
            Role::Assistant => "Assistant: ",
        };
        
        spans.push(Span::styled(
            role_prefix,
            Style::default()
                .fg(role_color)
                .add_modifier(Modifier::BOLD)
        ));

        let elements = parse_markdown(&self.message.content);
        for element in elements {
            match element {
                MarkdownElement::Text(text) => {
                    spans.push(Span::raw(text));
                }
                MarkdownElement::Header(text, level) => {
                    spans.push(Span::styled(
                        format!("{} {}", "#".repeat(level as usize), text),
                        Style::default().add_modifier(Modifier::BOLD)
                    ));
                }
                MarkdownElement::CodeBlock(lines, language) => {
                    spans.push(Span::raw("\n"));
                    spans.push(Span::styled(
                        format!("```{}\n", language),
                        Style::default().fg(Color::DarkGray)
                    ));
                    for line in lines {
                        spans.push(Span::raw(format!("{}\n", line)));
                    }
                    spans.push(Span::styled(
                        "```\n",
                        Style::default().fg(Color::DarkGray)
                    ));
                }
                MarkdownElement::BlockQuote(text) => {
                    spans.push(Span::styled(
                        format!("> {}\n", text),
                        Style::default().fg(Color::Gray)
                    ));
                }
                MarkdownElement::List(text) => {
                    spans.push(Span::raw(format!("• {}\n", text)));
                }
            }
        }
        
        spans
    }
}
