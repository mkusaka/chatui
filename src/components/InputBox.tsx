import React from "react";
import { Box, Text } from "ink";

interface InputBoxProps {
  value: string;
  mode: "normal" | "insert" | "command";
  cursorPosition: number;
  placeholder?: string;
}

export const InputBox: React.FC<InputBoxProps> = ({
  value,
  mode,
  cursorPosition,
  placeholder,
}) => {
  const getBorderColor = () => {
    switch (mode) {
      case "insert":
        return "green";
      case "command":
        return "yellow";
      default:
        return "white";
    }
  };

  const getPrefix = () => {
    switch (mode) {
      case "command":
        return ":";
      case "insert":
        return ">";
      default:
        return "-";
    }
  };

  // カーソルを含むテキストをレンダリング
  const renderTextWithCursor = () => {
    if (!value && mode !== "insert" && mode !== "command") {
      return (
        <Text color="gray" dimColor>
          {placeholder || "Type your message..."}
        </Text>
      );
    }

    if (mode === "insert" || mode === "command") {
      const lines = value.split("\n");
      let currentPos = 0;
      let cursorLine = 0;
      let cursorPosInLine = cursorPosition;

      // カーソルの行と位置を計算
      for (let i = 0; i < lines.length; i++) {
        const lineLength = lines[i].length + (i < lines.length - 1 ? 1 : 0); // 改行文字を考慮
        if (currentPos + lineLength > cursorPosition) {
          cursorLine = i;
          cursorPosInLine = cursorPosition - currentPos;
          break;
        }
        currentPos += lineLength;
      }

      return (
        <Box flexDirection="column">
          {lines.map((line, index) => {
            if (index === cursorLine) {
              const before = line.slice(0, cursorPosInLine);
              const cursorChar = line[cursorPosInLine] || " ";
              const after = line.slice(cursorPosInLine + 1);
              return (
                <Box key={index}>
                  <Text>{before}</Text>
                  <Text backgroundColor="white">{cursorChar}</Text>
                  <Text>{after}</Text>
                </Box>
              );
            }
            return (
              <Box key={index}>
                <Text>{line}</Text>
              </Box>
            );
          })}
        </Box>
      );
    }

    return <Text>{value}</Text>;
  };

  const getModeHint = () => {
    switch (mode) {
      case "insert":
        return "Arrow keys to move cursor, Enter for new line, Esc to send message or exit insert mode";
      case "command":
        return ":w to send message, :q to quit, Esc for normal mode";
      default:
        return "Press i for insert mode, : for command mode";
    }
  };

  return (
    <Box
      flexDirection="column"
      borderStyle="single"
      borderColor={getBorderColor()}
      padding={1}
      minHeight={3}
    >
      <Box>
        <Text color={getBorderColor()}>{getPrefix()}</Text>
        <Text> </Text>
        {renderTextWithCursor()}
      </Box>
      <Box marginTop={1}>
        <Text color="gray" dimColor>
          {getModeHint()}
        </Text>
      </Box>
    </Box>
  );
};
