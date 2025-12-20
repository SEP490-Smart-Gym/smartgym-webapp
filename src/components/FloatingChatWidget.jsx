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
        onClick={() => setOpen(true)}
        sx={{
          position: "fixed",
          bottom: 100,
          right: 50,
          zIndex: 9999,
          height: 60,
          width: 60,
          borderRadius: "50%",
          backgroundColor: "#0c1844",
          color: "white",
          boxShadow: "0 8px 20px rgba(0,0,0,0.3)",
          "&:hover": { backgroundColor: "#152B74" },
        }}
      >
        <IoChatbubbleEllipses size={28} />
      </IconButton>

      {/* Popup Chat – chỉ mount khi open */}
      {open && (
        <Box
          sx={{
            position: "fixed",
            bottom: 80,
            right: 100,
            width: 360,
            height: 520,
            zIndex: 9998,
            animation: "slideUp 0.3s ease",
            "@keyframes slideUp": {
              from: { transform: "translateY(50px)", opacity: 0 },
              to: { transform: "translateY(0)", opacity: 1 },
            },
          }}
        >
          <ChatBot isPopup onClose={() => setOpen(false)} />
        </Box>
      )}
    </>
  );
};

export default FloatingChatWidget;
