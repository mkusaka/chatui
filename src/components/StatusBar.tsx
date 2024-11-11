import React from 'react';
import { Box, Text } from 'ink';

interface StatusBarProps {
  mode: 'normal' | 'insert' | 'command';
}

export const StatusBar: React.FC<StatusBarProps> = ({ mode }) => {
  const getModeColor = () => {
    switch (mode) {
      case 'insert':
        return 'green';
      case 'command':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  const getKeyBindings = () => {
    switch (mode) {
      case 'insert':
        return '← → to move cursor | Esc: Normal Mode';
      case 'command':
        return ':w: Send Message | :q: Quit | Esc: Normal Mode';
      default:
        return 'i: Insert | j/k: Navigate | y: Copy | p: Paste | :: Command';
    }
  };

  return (
    <Box borderStyle="single" padding={1}>
      <Box flexGrow={1}>
        <Text color={getModeColor()} bold>
          {mode.toUpperCase()} MODE
        </Text>
        <Text> | </Text>
        <Text dimColor>{getKeyBindings()}</Text>
      </Box>
    </Box>
  );
};
