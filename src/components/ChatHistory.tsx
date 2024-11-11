import React from "react";
import { Box, Text } from "ink";
import { Message } from "../types";

interface ChatHistoryProps {
  messages: Message[];
  selectedIndex: number | null;
  mode: "normal" | "insert" | "command";
}

const MessageBlock: React.FC<{ message: Message; isSelected: boolean }> = ({
  message,
  isSelected,
}) => {
  const roleColor = getRoleColor(message.role);

  return (
    <Box
      flexDirection="column"
      borderStyle={isSelected ? "double" : "single"}
      borderColor={isSelected ? "green" : roleColor}
      padding={1}
      marginY={1}
    >
      <Box>
        <Text color={roleColor} bold>
          {message.role.toUpperCase()}
        </Text>
        <Text color="gray" dimColor>
          {" "}
          {new Date(message.timestamp).toLocaleTimeString()}
        </Text>
      </Box>
      <Box flexDirection="column" marginTop={1}>
        <Text>{message.content}</Text>
      </Box>
    </Box>
  );
};

const getRoleColor = (role: Message["role"]) => {
  switch (role) {
    case "system":
      return "yellow";
    case "user":
      return "green";
    case "assistant":
      return "blue";
    default:
      return "white";
  }
};

export const ChatHistory: React.FC<ChatHistoryProps> = ({
  messages,
  selectedIndex,
  mode,
}) => {
  return (
    <Box flexDirection="column" flexGrow={1}>
      {messages.map((message, index) => (
        <MessageBlock
          key={message.id}
          message={message}
          isSelected={index === selectedIndex}
        />
      ))}
      {messages.length === 0 && (
        <Box
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          height="100%"
        >
          <Text color="gray" dimColor>
            No messages yet. Press 'i' to start typing.
          </Text>
        </Box>
      )}
    </Box>
  );
};
