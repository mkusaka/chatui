import { AppState, KeyboardHandler } from '../types';
import clipboard from 'clipboardy';

export const handleNormalMode: KeyboardHandler = (input, key, state, setState) => {
  switch (input.toLowerCase()) {
    case 'i':
      setState(prev => ({ ...prev, mode: 'insert' }));
      break;
    case 'j':
      setState(prev => ({
        ...prev,
        selectedMessageIndex: Math.min(
          (prev.selectedMessageIndex ?? -1) + 1,
          prev.messages.length - 1
        ),
      }));
      break;
    case 'k':
      setState(prev => ({
        ...prev,
        selectedMessageIndex: Math.max((prev.selectedMessageIndex ?? 0) - 1, 0),
      }));
      break;
    case 'y':
      if (state.selectedMessageIndex !== null) {
        const selectedMessage = state.messages[state.selectedMessageIndex];
        clipboard.writeSync(selectedMessage.content);
        setState(prev => ({ ...prev, clipboard: selectedMessage.content }));
      }
      break;
    case 'p':
      if (state.clipboard) {
        setState(prev => ({ ...prev, currentInput: prev.currentInput + state.clipboard! }));
      }
      break;
    case ':':
      setState(prev => ({ ...prev, mode: 'command', currentInput: ':', cursorPosition: 1 }));
      break;
  }
};

export const handleInsertMode = (
  input: string,
  key: any,
  state: AppState,
  setState: React.Dispatch<React.SetStateAction<AppState>>
) => {
  if (key.escape) {
    setState(prev => ({ ...prev, mode: 'normal' }));
    return;
  }

  if (key.return) {
    setState(prev => ({
      ...prev,
      currentInput: prev.currentInput.slice(0, state.cursorPosition) + '\n' + prev.currentInput.slice(state.cursorPosition),
      cursorPosition: state.cursorPosition + 1,
    }));
    return;
  }

  if (key.leftArrow) {
    setState(prev => ({
      ...prev,
      cursorPosition: Math.max(0, prev.cursorPosition - 1),
    }));
    return;
  }

  if (key.rightArrow) {
    setState(prev => ({
      ...prev,
      cursorPosition: Math.min(prev.currentInput.length, prev.cursorPosition + 1),
    }));
    return;
  }

  if (key.delete || key.backspace) {
    if (state.cursorPosition > 0) {
      setState(prev => ({
        ...prev,
        currentInput: 
          prev.currentInput.slice(0, prev.cursorPosition - 1) + 
          prev.currentInput.slice(prev.cursorPosition),
        cursorPosition: prev.cursorPosition - 1,
      }));
    }
    return;
  }

  if (input && !key.ctrl && !key.meta && !key.shift) {
    setState(prev => ({
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
  onCommand?: CommandHandler
) => {
  if (key.return) {
    const commandMatch = state.currentInput.match(/^:(\w+)/);
    if (commandMatch && onCommand) {
      const [, command] = commandMatch;
      onCommand(command, state.currentInput);
    }
    setState(prev => ({ ...prev, mode: 'normal', currentInput: '', cursorPosition: 0 }));
    return;
  }

  if (key.escape) {
    setState(prev => ({ ...prev, mode: 'normal', currentInput: '', cursorPosition: 0 }));
    return;
  }

  if (key.leftArrow) {
    setState(prev => ({
      ...prev,
      cursorPosition: Math.max(1, prev.cursorPosition - 1), // コマンドモードでは最低1（:の後）
    }));
    return;
  }

  if (key.rightArrow) {
    setState(prev => ({
      ...prev,
      cursorPosition: Math.min(prev.currentInput.length, prev.cursorPosition + 1),
    }));
    return;
  }

  if (key.delete || key.backspace) {
    if (state.cursorPosition > 1) { // :は削除させない
      setState(prev => ({
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
    setState(prev => ({
      ...prev,
      currentInput: 
        prev.currentInput.slice(0, prev.cursorPosition) + 
        input + 
        prev.currentInput.slice(prev.cursorPosition),
      cursorPosition: prev.cursorPosition + 1,
    }));
  }
};
