# ChatUI - Terminal-based LLM Chat Interface

A terminal-based chat interface for interacting with various LLM providers (OpenAI, Anthropic, Google) with Vim-like keybindings.

## Features

- Vim-like keybindings and modes (Normal, Insert, Command)
- Support for multiple LLM providers (OpenAI, Anthropic, Google)
- Markdown rendering with syntax highlighting
- Multi-line input support with cursor movement
- Copy/paste functionality
- Message history navigation

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/chatui.git
cd chatui

# Install dependencies
pnpm install

# Build the application
pnpm run build
```

## Configuration

Set the following environment variables:

- `LLM_PROVIDER`: The LLM provider to use ('openai', 'anthropic', or 'google')
- `LLM_API_KEY`: Your API key for the chosen provider

Example:
```bash
export LLM_PROVIDER=openai
export LLM_API_KEY=your-api-key
```

## Usage

Start the application:

```bash
pnpm start
```

### Keybindings

Normal Mode:
- `i`: Enter insert mode
- `j/k`: Navigate through messages
- `yy`: Copy current message
- `p`: Paste from clipboard
- `:`: Enter command mode

Insert Mode:
- `←/→`: Move cursor left/right
- `Esc`: Return to normal mode
- Regular typing: Multi-line input supported
- `Backspace`: Delete character before cursor

Command Mode:
- `:w`: Send message
- `:q`: Quit application
- `←/→`: Move cursor left/right
- `Esc`: Return to normal mode
- `Backspace`: Delete character before cursor

## Development

```bash
# Run in development mode with hot reload
pnpm run dev

# Run tests
pnpm test

# Type checking
pnpm run typecheck
```

## Features

- Cursor movement in input field using arrow keys
- Vim-style command mode with :w for sending messages
- Markdown support with syntax highlighting
- Multi-line input with proper cursor positioning
- Support for multiple LLM providers
- Copy/paste functionality
- Message history navigation

## License

ISC
