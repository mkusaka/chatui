mod app;
mod gemini;
mod git;
mod models;
mod ui;

use anyhow::Result;
use app::App;
use clap::Parser;
use std::path::PathBuf;

#[derive(Parser)]
#[command(
    name = "chatrepo",
    about = "A TUI chat application for repository exploration using Gemini",
    author,
    version
)]
struct Args {
    #[arg(default_value = ".", help = "Path to git repository")]
    repo_path: PathBuf,

    #[arg(short, long, help = "Gemini model name")]
    model: Option<String>,

    #[arg(
        short,
        long,
        env = "GOOGLE_API_KEY",
        help = "Google API key for Gemini"
    )]
    api_key: String,
}

#[tokio::main]
async fn main() -> Result<()> {
    // Initialize logging
    env_logger::init();

    // Parse command line arguments
    let args = Args::parse();

    // Create and run app
    let mut app = App::new(args.repo_path, args.api_key, args.model)?;
    app.run().await?;

    Ok(())
}
