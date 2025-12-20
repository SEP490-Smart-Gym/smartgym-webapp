import React, { useState } from "react";
import ChatBot from "../pages/chat/ChatBot";
import { IoChatbubbleEllipses } from "react-icons/io5";
import { IconButton, Box } from "@mui/material";

const FloatingChatWidget = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Nút bong bóng chat */}
      <IconButton
        onClick={() => setOpen(!open)}
        sx={{
          position: "fixed",
          bottom: 100,
          right: 50,
          zIndex: 9999,
          height: 60,
          borderRadius: "100%",
          backgroundColor: "#0c1844",
          color: "white",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          "&:hover": { backgroundColor: "#152B74" },
          zIndex: 9999,
        }}
      >
        <IoChatbubbleEllipses size={28} />
      </IconButton>

      {/* Popup Chat */}
      <Box
        sx={{
          position: "fixed",
          bottom: 80,
          right: 100,
          width: 360,         
          height: 520,
          zIndex: 9998,
          transition: "all 0.3s ease",
          transform: open ? "translateY(0)" : "translateY(150%)",
          opacity: open ? 1 : 0,
        }}
      >
        <ChatBot isPopup onClose={() => setOpen(false)} />
      </Box>
    </>
  );
};

export default FloatingChatWidget;
