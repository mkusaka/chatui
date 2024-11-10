use pulldown_cmark::{CodeBlockKind, Event, Parser, Tag};
use ratatui::style::{Color, Modifier, Style};
use syntect::easy::HighlightLines;
use syntect::highlighting::ThemeSet;
use syntect::parsing::SyntaxSet;
use syntect::util::LinesWithEndings;

#[derive(Debug)]
pub enum MarkdownElement {
    Text(String),
    Header(String, u32),
    CodeBlock(Vec<String>, String), // (highlighted_lines, language)
    BlockQuote(String),
    List(String),
}

pub fn parse_markdown(input: &str) -> Vec<MarkdownElement> {
    let mut elements = Vec::new();
    let parser = Parser::new(input);
    let ss = SyntaxSet::load_defaults_newlines();
    let ts = ThemeSet::load_defaults();
    let theme = &ts.themes["base16-ocean.dark"];
    
    let mut in_code_block = false;
    let mut code_block_content = String::new();
    let mut current_language = String::new();

    for event in parser {
        match event {
            Event::Start(Tag::Heading(level)) => {
                if let Some(Event::Text(text)) = parser.next() {
                    elements.push(MarkdownElement::Header(text.to_string(), level as u32));
                }
            }
            Event::Start(Tag::CodeBlock(CodeBlockKind::Fenced(lang))) => {
                in_code_block = true;
                current_language = lang.to_string();
                code_block_content.clear();
            }
            Event::Text(text) => {
                if in_code_block {
                    code_block_content.push_str(&text);
                } else {
                    elements.push(MarkdownElement::Text(text.to_string()));
                }
            }
            Event::End(Tag::CodeBlock(_)) => {
                in_code_block = false;
                let syntax = ss
                    .find_syntax_by_extension(&current_language)
                    .unwrap_or_else(|| ss.find_syntax_plain_text());
                let mut h = HighlightLines::new(syntax, theme);
                let highlighted: Vec<String> = LinesWithEndings::from(&code_block_content)
                    .map(|line| {
                        let ranges = h.highlight_line(line, &ss).unwrap();
                        syntect::util::as_24_bit_terminal_escaped(&ranges[..], false)
                    })
                    .collect();
                elements.push(MarkdownElement::CodeBlock(highlighted, current_language.clone()));
            }
            Event::Start(Tag::BlockQuote) => {
                if let Some(Event::Text(text)) = parser.next() {
                    elements.push(MarkdownElement::BlockQuote(text.to_string()));
                }
            }
            Event::Start(Tag::List(_)) => {
                if let Some(Event::Text(text)) = parser.next() {
                    elements.push(MarkdownElement::List(text.to_string()));
                }
            }
            _ => {}
        }
    }
    elements
}
