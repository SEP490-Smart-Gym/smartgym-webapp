import React, { useState } from "react";
import ChatBot from "./ChatBot";
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
          bottom: 25,
          right: 25,
          width: 60,
          height: 60,
          borderRadius: "50%",
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
          bottom: 100,
          right: 25,
          width: { xs: "95%", sm: 380, md: 420 },
          height: "80vh",
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
