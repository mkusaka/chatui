use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: String,
    pub content: String,
    pub timestamp: chrono::DateTime<chrono::Utc>,
}

#[derive(Debug, Clone)]
pub enum Mode {
    Normal,
    Insert,
    Command,
}

#[derive(Debug, Clone)]
pub enum InputFocus {
    Chat,
    MessageEdit(usize), // Index of message being edited
}

#[derive(Debug, Clone)]
pub struct AppState {
    pub messages: Vec<Message>,
    pub input: String,
    pub mode: Mode,
    pub focus: InputFocus,
    pub repo_path: PathBuf,
    pub repo_context: Option<String>,
    pub error: Option<String>,
}

impl AppState {
    pub fn new(repo_path: PathBuf) -> Self {
        Self {
            messages: Vec::new(),
            input: String::new(),
            mode: Mode::Normal,
            focus: InputFocus::Chat,
            repo_path,
            repo_context: None,
            error: None,
        }
    }

    pub fn enter_insert_mode(&mut self) {
        self.mode = Mode::Insert;
    }

    pub fn enter_normal_mode(&mut self) {
        self.mode = Mode::Normal;
    }

    pub fn add_message(&mut self, role: String, content: String) {
        let message = Message {
            role,
            content,
            timestamp: chrono::Utc::now(),
        };
        self.messages.push(message);
    }

    pub fn edit_message(&mut self, index: usize) {
        if index < self.messages.len() {
            self.focus = InputFocus::MessageEdit(index);
            self.input = self.messages[index].content.clone();
            self.enter_insert_mode();
        }
    }
}
