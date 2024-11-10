use anyhow::{Context, Result};
use git2::{Repository, StatusOptions};
use std::collections::HashSet;
use std::fs;
use std::path::Path;

pub struct RepoContext {
    repo: Repository,
    tracked_files: HashSet<String>,
    context_cache: Option<String>,
    last_update: std::time::SystemTime,
}

impl RepoContext {
    pub fn new(path: &Path) -> Result<Self> {
        let repo = Repository::open(path)
            .with_context(|| format!("Failed to open repository at {}", path.display()))?;

        Ok(Self {
            repo,
            tracked_files: HashSet::new(),
            context_cache: None,
            last_update: std::time::SystemTime::now(),
        })
    }

    pub fn update_context(&mut self) -> Result<&str> {
        // Return cache if less than 1 minute has passed
        if let Some(ref cached) = self.context_cache {
            if self.last_update.elapsed()?.as_secs() < 60 {
                return Ok(cached);
            }
        }

        let mut files_content = Vec::new();
        self.tracked_files.clear();

        // Get tracked files and their status
        let mut status_opts = StatusOptions::new();
        status_opts.include_unmodified(true);
        status_opts.include_ignored(false);
        status_opts.include_untracked(false);

        for entry in self.repo.statuses(Some(&mut status_opts))?.iter() {
            if let Some(path) = entry.path() {
                self.tracked_files.insert(path.to_string());
            }
        }

        for path in &self.tracked_files {
            if self.is_binary_file(path)? {
                continue;
            }

            // Skip files larger than 1MB
            if fs::metadata(path)?.len() > 1_000_000 {
                continue;
            }

            if let Ok(content) = fs::read_to_string(path) {
                // Take first 1000 characters for preview
                let preview = content.chars().take(1000).collect::<String>();
                files_content.push(format!("File: {}\nPreview:\n{}\n---", path, preview));
            }
        }

        let context = files_content.join("\n");
        self.context_cache = Some(context);
        self.last_update = std::time::SystemTime::now();

        Ok(self.context_cache.as_ref().unwrap())
    }

    pub fn is_binary_file(&self, path: &str) -> Result<bool> {
        const MAGIC_NUMBERS: &[(&[u8], &str)] = &[
            (b"\x89PNG\r\n\x1a\n", "PNG"),
            (b"\xff\xd8\xff", "JPEG"),
            (b"GIF87a", "GIF"),
            (b"GIF89a", "GIF"),
            (b"PK\x03\x04", "ZIP"),
        ];

        let mut buffer = [0u8; 8];
        if let Ok(file) = fs::File::open(path) {
            use std::io::Read;
            if file.take(8).read(&mut buffer).is_ok() {
                for (magic, _) in MAGIC_NUMBERS {
                    if buffer.starts_with(magic) {
                        return Ok(true);
                    }
                }
            }
        }

        const BINARY_EXTENSIONS: &[&str] = &[
            "png", "jpg", "jpeg", "gif", "pdf", "zip", "exe", "dll", "so", "dylib", "class", "pyc",
            "o",
        ];

        if let Some(extension) = Path::new(path).extension() {
            if let Some(ext) = extension.to_str() {
                return Ok(BINARY_EXTENSIONS.contains(&ext.to_lowercase().as_str()));
            }
        }

        Ok(false)
    }

    pub fn get_file_content(&self, path: &str) -> Result<Option<String>> {
        if !self.tracked_files.contains(path) || self.is_binary_file(path)? {
            return Ok(None);
        }

        fs::read_to_string(path)
            .map(Some)
            .with_context(|| format!("Failed to read file content: {}", path))
    }
}
