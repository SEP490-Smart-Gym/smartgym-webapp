import React, { useState, useEffect, useRef } from "react";
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
import { IoSend, IoCopy } from "react-icons/io5";
import { format } from "date-fns";
import { GiNinjaStar } from "react-icons/gi";
import api from "../../config/axios";

/* ======================= STYLED ======================= */

const StyledCard = styled(Card)(({ isPopup }) => ({
  maxWidth: isPopup ? "100%" : "50%",
  minWidth: isPopup ? "100%" : "450px",
  height: isPopup ? "100%" : "120vh",
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
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
});

const MessageBubble = styled(Paper)(({ isUser }) => ({
  padding: "8px 12px",


  inlineSize: "fit-content",
  maxInlineSize: "420px",

  alignSelf: isUser ? "flex-end" : "flex-start",
  backgroundColor: isUser ? "#0c1844" : "#ffffff",
  color: isUser ? "#ffffff" : "#000000",
  borderRadius: "18px",
  boxShadow: "0 1px 4px rgba(0,0,0,0.12)",

  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
}));




/* ======================= COMPONENT ======================= */

export default function ChatBot({ isPopup = false, onClose }) {
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef(null);

  /* ======================= INIT CONVERSATION ======================= */
  useEffect(() => {
    let isMounted = true;

    const initConversation = async () => {
      try {
        const res = await api.get("/member-ai-chat/conversation");
        if (!isMounted) return;
        setConversation(res.data);
      } catch (err) {
        if (err.code !== "ECONNABORTED") {
          console.error("Init AI conversation error", err);
        }
      }
    };

    initConversation();

    return () => {
      isMounted = false;
    };
  }, []);


  /* ======================= FETCH MESSAGES ======================= */
  const fetchMessages = async (cid) => {
    try {
      const res = await api.get("/member-ai-chat/messages", {
        params: { conversationId: cid },
      });

      const mapped = res.data.map((m) => ({
        id: m.messageId,
        text: m.messageText,
        isUser: m.senderType === "Human",
        senderName: m.senderName,
        timestamp: new Date(m.sentAt),
      }));

      setMessages(mapped);
    } catch (err) {
      console.error("Fetch AI messages error", err);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages(conversationId);
    }
  }, [conversationId]);

  /* ======================= AUTO SCROLL ======================= */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* ======================= SEND MESSAGE ======================= */
  const handleSend = async () => {
    if (!input.trim() || !conversationId) return;

    const tempMessage = {
      id: Date.now(),
      text: input.trim(),
      isUser: true,
      senderName: "You",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInput("");
    setLoading(true);

    try {
      await api.post("/member-ai-chat/messages", {
        conversationId,
        messageText: tempMessage.text,
      });

      // Fetch lại để lấy phản hồi AI
      await fetchMessages(conversationId);
    } catch (err) {
      console.error("Send AI message error", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  /* ======================= RENDER ======================= */

  return (
    <Box sx={{ height: "100%" }}>
      <StyledCard isPopup={isPopup}>
        {/* ===== HEADER ===== */}
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
            <Typography variant="h6">AI Coach</Typography>
          </Stack>
          {isPopup && (
            <IconButton
              onClick={onClose}
              sx={{ color: "white", "&:hover": { color: "#ffb3b3" } }}
            >
              X
            </IconButton>
          )}
        </Box>

        {/* ===== MESSAGES ===== */}
        <MessageContainer>
          {messages.map((m) => (
            <Box
              key={m.id}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: m.isUser ? "flex-end" : "flex-start",
              }}
            >
              <Stack
                direction="row"
                spacing={0.5}
                alignItems="flex-end"
                justifyContent={m.isUser ? "flex-end" : "flex-start"}
              >
                {/* USER: copy bên TRÁI */}
                {m.isUser && (
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(m.text)}
                    sx={{
                      color: "#64748b",
                      opacity: 0.6,
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <IoCopy size={14} />
                  </IconButton>
                )}

                {/* AI AVATAR */}
                {!m.isUser && (
                  <Avatar
                    sx={{
                      width: 30,
                      height: 30,
                      bgcolor: "#0c1844",
                      fontSize: 13,
                    }}
                  >
                    AI
                  </Avatar>
                )}

                {/* MESSAGE BUBBLE */}
                <MessageBubble isUser={m.isUser}>
                  <Typography
                    sx={{
                      fontSize: "0.88rem",
                      lineHeight: 1.45,
                      wordBreak: "break-word",
                    }}
                  >
                    {m.text}
                  </Typography>

                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      opacity: 0.55,
                      mt: 0.4,
                      textAlign: "right",
                      display: "block",
                    }}
                  >
                    {format(m.timestamp, "HH:mm")}
                  </Typography>
                </MessageBubble>

                {/* AI: copy bên PHẢI */}
                {!m.isUser && (
                  <IconButton
                    size="small"
                    onClick={() => handleCopy(m.text)}
                    sx={{
                      color: "#64748b",
                      opacity: 0.6,
                      "&:hover": { opacity: 1 },
                    }}
                  >
                    <IoCopy size={14} />
                  </IconButton>
                )}
              </Stack>


            </Box>
          ))}

          {loading && (
            <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2 }}>
              <CircularProgress size={20} sx={{ color: "#0c1844" }} />
              <Typography variant="body2">AI đang suy nghĩ...</Typography>
            </Stack>
          )}

          <div ref={bottomRef} />
        </MessageContainer>

        {/* ===== INPUT ===== */}
        <Box
          sx={{
            p: 2,
            borderTop: "1px solid rgba(62, 65, 255, 0.1)",
            backgroundColor: "#f8faff",
          }}
        >
          <Stack direction="row" spacing={1}>
            <TextField
              fullWidth
              multiline
              maxRows={4}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Nhập câu hỏi cho AI..."
              variant="outlined"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: "25px",
                  backgroundColor: "white",
                },
              }}
            />
            <IconButton
              onClick={handleSend}
              disabled={!input.trim()}
              sx={{
                backgroundColor: "#0c1844",
                color: "white",
                "&:hover": { backgroundColor: "#102a63" },
              }}
            >
              <IoSend />
            </IconButton>
          </Stack>
        </Box>
      </StyledCard>
    </Box>
  );
}
