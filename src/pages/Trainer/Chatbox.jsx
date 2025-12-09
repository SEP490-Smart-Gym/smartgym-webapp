// src/pages/Chat/ChatBot.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  TextField,
  IconButton,
  Typography,
  Avatar,
  Chip,
  Paper,
  Stack,
  CircularProgress,
} from "@mui/material";
import { styled } from "@mui/system";
import { IoSend, IoRefresh, IoCopy } from "react-icons/io5";
import { format } from "date-fns";
import { GiNinjaStar } from "react-icons/gi";
import { BsEmojiLaughingFill } from "react-icons/bs";
import { useParams } from "react-router-dom";

const StyledCard = styled(Card)(({ isPopup }) => ({
  maxWidth: isPopup ? "100%" : "900px",         // 👉 tăng chiều ngang tối đa
  minWidth: isPopup ? "100%" : "700px",         // 👉 rộng hơn trên desktop
  width: "100%",
  height: isPopup ? "100%" : "80vh",            // cho gọn hơn 120vh, vẫn đủ dùng
  borderRadius: isPopup ? "20px" : "25px",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 8px 32px rgba(99, 102, 241, 0.2)",
  background: "linear-gradient(145deg, #ffffff 0%, #e8f5fe 100%)",
}));

const MessageContainer = styled(Box)({
  flex: 1,
  overflowY: "auto",
  overflowX: "auto",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  scrollbarWidth: "thin",
  scrollbarColor: "rgba(79, 70, 229, 0.5) transparent",
  "&::-webkit-scrollbar": {
    width: "6px",
    height: "6px",
  },
  "&::-webkit-scrollbar-track": {
    background: "rgba(148, 163, 184, 0.15)",
    borderRadius: "999px",
  },
  "&::-webkit-scrollbar-thumb": {
    background: "rgba(79, 70, 229, 0.4)",
    borderRadius: "999px",
  },
  "&:hover::-webkit-scrollbar-thumb": {
    background: "rgba(79, 70, 229, 0.75)",
  },
});

const MessageBubble = styled(Paper)(({ isUser }) => ({
  padding: "12px 18px",
  maxWidth: "70%",
  alignSelf: isUser ? "flex-end" : "flex-start",
  backgroundColor: isUser ? "#6366f1" : "#ffffff",
  color: isUser ? "#ffffff" : "#000000",
  borderRadius: "22px",
  boxShadow: "0 2px 12px rgba(99, 102, 241, 0.15)",
  animation: "bounce 0.5s ease-in",
  "@keyframes bounce": {
    "0%": { transform: "scale(0.8)" },
    "50%": { transform: "scale(1.1)" },
    "100%": { transform: "scale(1)" },
  },
}));

const InputContainer = styled(Box)({
  padding: "20px",
  borderTop: "1px solid rgba(0, 0, 0, 0.1)",
});

const ChatBot = ({ isPopup = false, onClose }) => {
  const { id } = useParams();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const role = user?.roleName;
  const roleLabel =
    role === "Trainer" ? "Trainer" : role === "Staff" ? "Staff" : "";

  const chatTitle = id
    ? `Chat với hội viên #${id}${roleLabel ? ` (${roleLabel})` : ""}`
    : "Chat Box";

  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm your friendly chat assistant. How can I help you today? 😊",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const quickOptions = [
    "Ask a question 💭",
    "Need assistance 🤝",
    "Share feedback 📝",
    "Technical help 💻",
    "General chat 👋",
  ];

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      text: input,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInput("");
    setIsLoading(true);

    try {
      setTimeout(() => {
        const responses = [
          "Thank you for sharing! How can I assist you further? 👍",
          "I understand. Let me help you with that! 💡",
          "Interesting point! Would you like to explore this topic more? 🤔",
          "I'm here to help! What specific information do you need? 📚",
          "Great question! Let's work on this together! ✨",
        ];
        const botResponse = {
          id: messages.length + 2,
          text: responses[Math.floor(Math.random() * responses.length)],
          isUser: false,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botResponse]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error:", error);
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleOptionClick = (option) => {
    setInput(option);
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const clearChat = () => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your friendly chat assistant. How can I help you today? 😊",
        isUser: false,
        timestamp: new Date(),
      },
    ]);
  };

  const tryAgain = () => {
    if (messages.length > 1) {
      const lastUserMessage = [...messages].reverse().find((m) => m.isUser);
      if (lastUserMessage) {
        setInput(lastUserMessage.text);
      }
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        py: 4,
        px: 2,
        display: "flex",
        justifyContent: "center",   // 👉 căn giữa ngang
        alignItems: "flex-start",
        backgroundColor: "#f3f4f6", // nền xám nhẹ cho nổi card
      }}
    >
      <StyledCard isPopup={isPopup}>
        {/* HEADER */}
        <Box
          sx={{
            p: 2,
            borderBottom: "1px solid rgba(99, 102, 241, 0.1)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#0c1844",
            color: "white",
            borderRadius: "25px 25px 0 0",
          }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            <GiNinjaStar size={24} />
            <Typography variant="h6">{chatTitle}</Typography>
          </Stack>
          <Box>
            <IconButton
              onClick={tryAgain}
              aria-label="Try again"
              sx={{ color: "white", mr: 1 }}
            >
              <IoRefresh />
            </IconButton>
            <IconButton
              onClick={clearChat}
              aria-label="Clear chat"
              sx={{ color: "white" }}
            >
              <IoRefresh />
            </IconButton>
            {isPopup && (
              <IconButton
                onClick={onClose}
                sx={{
                  color: "white",
                  width: 32,
                  height: 32,
                  ml: 1,
                  "&:hover": { color: "#ffb3b3" },
                }}
              >
                X
              </IconButton>
            )}
          </Box>
        </Box>

        {/* MESSAGES */}
        <MessageContainer sx={{ backgroundColor: "#f8faff" }}>
          {messages.map((message) => (
            <Box
              key={message.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: message.isUser ? "flex-end" : "flex-start",
              }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                {!message.isUser && (
                  <Avatar
                    src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04"
                    sx={{
                      width: 35,
                      height: 35,
                      border: "2px solid #1c389bff",
                    }}
                  />
                )}
                <MessageBubble isUser={message.isUser}>
                  <Typography variant="body1">{message.text}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.7, mt: 0.5, display: "block" }}
                  >
                    {format(message.timestamp, "HH:mm")}
                  </Typography>
                </MessageBubble>
                <IconButton
                  size="small"
                  onClick={() => handleCopy(message.text)}
                  aria-label="Copy message"
                  sx={{ color: "#253f9cff" }}
                >
                  <IoCopy />
                </IconButton>
              </Stack>
            </Box>
          ))}
          {isLoading && (
            <Box
              sx={{
                display: "flex",
                gap: 1,
                alignItems: "center",
                ml: 2,
              }}
            >
              <CircularProgress size={20} sx={{ color: "#6366f1" }} />
              <Typography variant="body2">
                Thinking of something cool...
              </Typography>
            </Box>
          )}
        </MessageContainer>

        {/* QUICK OPTIONS */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(62, 65, 255, 0.1)",
            backgroundColor: "#f8faff",
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            sx={{ mb: 2, overflowX: "auto", pb: 1 }}
          >
            {quickOptions.map((option) => (
              <Chip
                key={option}
                label={option}
                onClick={() => handleOptionClick(option)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: "#304db7ff",
                  color: "white",
                  "&:hover": {
                    backgroundColor: "#1c3799ff",
                    transform: "scale(1.05)",
                  },
                  transition: "all 0.2s ease",
                }}
              />
            ))}
          </Stack>
        </Box>

        {/* INPUT */}
        <InputContainer sx={{ backgroundColor: "#f8faff" }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Drop your message here... 💭"
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "25px",
                  backgroundColor: "white",
                  "&:hover": {
                    "& fieldset": {
                      borderColor: "#0432daff",
                    },
                  },
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!input.trim()}
              sx={{
                backgroundColor: "#0131e0ff",
                color: "white",
                "&:hover": { backgroundColor: "#0432d8ff" },
              }}
            >
              <IoSend />
            </IconButton>
            {/* Emoji button (nếu cần) */}
            {/* <IconButton
              sx={{
                backgroundColor: "#002ccbff",
                color: "white",
                "&:hover": { backgroundColor: "#0733d3ff" }
              }}
            >
              <BsEmojiLaughingFill />
            </IconButton> */}
          </Box>
        </InputContainer>
      </StyledCard>
    </Box>
  );
};

export default ChatBot;
