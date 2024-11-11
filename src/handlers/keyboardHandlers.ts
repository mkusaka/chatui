import { AppState, KeyboardHandler } from "../types";
import clipboard from "clipboardy";

export const handleNormalMode: KeyboardHandler = (
  input,
  key,
  state,
  setState,
) => {
  switch (input.toLowerCase()) {
    case "i":
      setState((prev) => ({ ...prev, mode: "insert" }));
      break;
    case "j":
      setState((prev) => ({
        ...prev,
        selectedMessageIndex: Math.min(
          (prev.selectedMessageIndex ?? -1) + 1,
          prev.messages.length - 1,
        ),
      }));
      break;
    case "k":
      setState((prev) => ({
        ...prev,
        selectedMessageIndex: Math.max((prev.selectedMessageIndex ?? 0) - 1, 0),
      }));
      break;
    case "y":
      if (state.selectedMessageIndex !== null) {
        const selectedMessage = state.messages[state.selectedMessageIndex];
        clipboard.writeSync(selectedMessage.content);
        setState((prev) => ({ ...prev, clipboard: selectedMessage.content }));
      }
      break;
    case "p":
      if (state.clipboard) {
        setState((prev) => ({
          ...prev,
          currentInput: prev.currentInput + state.clipboard!,
        }));
      }
      break;
    case ":":
      setState((prev) => ({
        ...prev,
        mode: "command",
        currentInput: ":",
        cursorPosition: 1,
      }));
      break;
  }
};

export const handleInsertMode = (
  input: string,
  key: any,
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  onMessageSubmit?: (content: string) => Promise<void>,
) => {
  if (key.escape) {
    if (state.currentInput.trim() && onMessageSubmit) {
      onMessageSubmit(state.currentInput);
    } else {
      setState((prev) => ({ ...prev, mode: "normal" }));
    }
    return;
  }

  // Command/Ctrl + V でペースト
  if ((key.meta || key.ctrl) && input === "v") {
    try {
      const clipboardText = clipboard.readSync();
      setState((prev) => ({
        ...prev,
        currentInput:
          prev.currentInput.slice(0, prev.cursorPosition) +
          clipboardText +
          prev.currentInput.slice(prev.cursorPosition),
        cursorPosition: prev.cursorPosition + clipboardText.length,
      }));
    } catch (error) {
      console.error("Failed to paste from clipboard:", error);
    }
    return;
  }

  if (key.return) {
    setState((prev) => ({
      ...prev,
      currentInput:
        prev.currentInput.slice(0, prev.cursorPosition) +
        "\n" +
        prev.currentInput.slice(prev.cursorPosition),
      cursorPosition: prev.cursorPosition + 1,
    }));
    return;
  }

  if (key.leftArrow) {
    setState((prev) => ({
      ...prev,
      cursorPosition: Math.max(0, prev.cursorPosition - 1),
    }));
    return;
  }

  if (key.rightArrow) {
    setState((prev) => ({
      ...prev,
      cursorPosition: Math.min(
        prev.currentInput.length,
        prev.cursorPosition + 1,
      ),
    }));
    return;
  }

  if (key.upArrow) {
    const beforeCursor = state.currentInput.slice(0, state.cursorPosition);
    const lastNewLine = beforeCursor.lastIndexOf("\n");
    const prevNewLine = beforeCursor.lastIndexOf("\n", lastNewLine - 1);
    if (lastNewLine !== -1) {
      const currentLineStart = prevNewLine === -1 ? 0 : prevNewLine + 1;
      const currentLineOffset = state.cursorPosition - lastNewLine;
      const newPosition = Math.min(
        currentLineStart + currentLineOffset - 1,
        lastNewLine,
      );
      setState((prev) => ({
        ...prev,
        cursorPosition: Math.max(currentLineStart, newPosition),
      }));
    }
    return;
  }

  if (key.downArrow) {
    const afterCursor = state.currentInput.slice(state.cursorPosition);
    const nextNewLine = afterCursor.indexOf("\n");
    if (nextNewLine !== -1) {
      const beforeCursor = state.currentInput.slice(0, state.cursorPosition);
      const lastNewLine = beforeCursor.lastIndexOf("\n");
      const currentLineStart = lastNewLine === -1 ? 0 : lastNewLine + 1;
      const currentLineOffset = state.cursorPosition - currentLineStart;
      const nextLineStart = state.cursorPosition + nextNewLine + 1;
      const nextLineEnd = state.currentInput.indexOf("\n", nextLineStart);
      const newPosition = Math.min(
        nextLineStart + currentLineOffset,
        nextLineEnd === -1 ? state.currentInput.length : nextLineEnd,
      );
      setState((prev) => ({
        ...prev,
        cursorPosition: newPosition,
      }));
    }
    return;
  }

  if (key.delete || key.backspace) {
    if (state.cursorPosition > 0) {
      setState((prev) => ({
        ...prev,
        currentInput:
          prev.currentInput.slice(0, prev.cursorPosition - 1) +
          prev.currentInput.slice(prev.cursorPosition),
        cursorPosition: prev.cursorPosition - 1,
      }));
    }
    return;
  }

  if (input && !key.ctrl && !key.meta) {
    setState((prev) => ({
      ...prev,
      currentInput:
        prev.currentInput.slice(0, prev.cursorPosition) +
        input +
        prev.currentInput.slice(prev.cursorPosition),
      cursorPosition: prev.cursorPosition + 1,
    }));
  }
};

type CommandHandler = (command: string, fullInput: string) => void;

export const handleCommandMode = (
  input: string,
  key: any,
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>,
  onCommand?: CommandHandler,
) => {
  if (key.return) {
    const commandMatch = state.currentInput.match(/^:(\w+)/);
    if (commandMatch && onCommand) {
      const [, command] = commandMatch;
      onCommand(command, state.currentInput);
    }
    setState((prev) => ({
      ...prev,
      mode: "normal",
      currentInput: "",
      cursorPosition: 0,
    }));
    return;
  }

  if (key.escape) {
    setState((prev) => ({
      ...prev,
      mode: "normal",
      currentInput: "",
      cursorPosition: 0,
    }));
    return;
  }

  if (key.leftArrow) {
    setState((prev) => ({
      ...prev,
      cursorPosition: Math.max(1, prev.cursorPosition - 1), // コマンドモードでは最低1（:の後）
    }));
    return;
  }

  if (key.rightArrow) {
    setState((prev) => ({
      ...prev,
      cursorPosition: Math.min(
        prev.currentInput.length,
        prev.cursorPosition + 1,
      ),
    }));
    return;
  }

  if (key.delete || key.backspace) {
    if (state.cursorPosition > 1) {
      // :は削除させない
      setState((prev) => ({
        ...prev,
        currentInput:
          prev.currentInput.slice(0, prev.cursorPosition - 1) +
          prev.currentInput.slice(prev.cursorPosition),
        cursorPosition: prev.cursorPosition - 1,
      }));
    }
    return;
  }

  if (input && !key.ctrl && !key.meta) {
    setState((prev) => ({
      ...prev,
      currentInput:
        prev.currentInput.slice(0, prev.cursorPosition) +
        input +
        prev.currentInput.slice(prev.cursorPosition),
      cursorPosition: prev.cursorPosition + 1,
    }));
  }
};
