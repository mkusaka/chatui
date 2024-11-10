use crate::models::Message;
use anyhow::Result;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

#[derive(Debug, Serialize)]
struct GeminiRequest {
    contents: Vec<GeminiContent>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiContent {
    parts: Vec<GeminiPart>,
}

#[derive(Debug, Serialize, Deserialize)]
struct GeminiPart {
    text: String,
}

#[derive(Debug, Deserialize)]
struct GeminiResponse {
    candidates: Vec<GeminiCandidate>,
}

#[derive(Debug, Deserialize)]
struct GeminiCandidate {
    content: GeminiContent,
}

pub struct GeminiClient {
    client: Client,
    api_key: String,
    model: String,
}

impl GeminiClient {
    pub fn new(api_key: String, model: Option<String>) -> Self {
        Self {
            client: Client::new(),
            api_key,
            model: model.unwrap_or_else(|| "gemini-1.5-pro".to_string()),
        }
    }

    pub async fn send_message(
        &self,
        context: &str,
        history: &[Message],
        input: &str,
    ) -> Result<String> {
        let url = format!(
            "https://generativelanguage.googleapis.com/v1beta/models/{}:generateContent?key={}",
            self.model, self.api_key
        );

        let prompt = self.build_prompt(context, history, input);

        let request = GeminiRequest {
            contents: vec![GeminiContent {
                parts: vec![GeminiPart { text: prompt }],
            }],
        };

        let response = self
            .client
            .post(&url)
            .json(&request)
            .send()
            .await?
            .json::<GeminiResponse>()
            .await?;

        response
            .candidates
            .first()
            .and_then(|c| c.content.parts.first())
            .and_then(|p| Some(p.text.clone()))
            .ok_or_else(|| anyhow::anyhow!("No response from Gemini API"))
    }

    fn build_prompt(&self, context: &str, history: &[Message], input: &str) -> String {
        let mut prompt = String::new();

        prompt.push_str(
            "You are a code assistant with access to the following repository context:\n\n",
        );
        prompt.push_str(context);
        prompt.push_str("\n\nChat history:\n");

        for message in history {
            prompt.push_str(&format!("{}: {}\n", message.role, message.content));
        }

        prompt.push_str(&format!("\nUser: {}\n\nAssistant:", input));

        prompt
    }
}

pub struct ChatHandler {
    gemini: GeminiClient,
    tx: mpsc::Sender<Message>,
    rx: mpsc::Receiver<Message>,
}

impl ChatHandler {
    pub fn new(api_key: String, model: Option<String>) -> (Self, mpsc::Sender<Message>) {
        let (tx, rx) = mpsc::channel(100);
        let response_tx = tx.clone();

        (
            Self {
                gemini: GeminiClient::new(api_key, model),
                tx,
                rx,
            },
            response_tx,
        )
    }

    pub async fn run(&mut self, app_state: &mut crate::models::AppState) -> Result<()> {
        while let Some(message) = self.rx.recv().await {
            if let Some(context) = &app_state.repo_context {
                let response = self
                    .gemini
                    .send_message(context, &app_state.messages, &message.content)
                    .await?;

                app_state.add_message(message.role, message.content);
                app_state.add_message("Assistant".to_string(), response);
            }
        }
        Ok(())
    }
}
