import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import api from "../../config/axios";
import { Spin } from "antd";
import { IoSend } from "react-icons/io5";
import { color } from "framer-motion";

export default function ChatBox() {
  const { conversationId } = useParams();

  /* ===== CURRENT USER ===== */
  const currentUser = useMemo(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  }, []);
  const currentUserId = currentUser?.id;

  /* ===== STATE ===== */
  const [partner, setPartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);
  const isFirstLoadRef = useRef(true);


  const staffUserId = currentUser?.id;
  /* ===== FETCH CONVERSATION (HEADER) ===== */
  const fetchConversation = async () => {
    if (!staffUserId) return;

    try {
      const res = await api.get("/chat/conversations", {
        params: { userId: staffUserId },
      });

      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const conversation = raw.find(
        (c) => c.conversationId === Number(conversationId)
      );

      if (!conversation) {
        console.warn("Conversation not found:", conversationId);
        return;
      }

      const p = conversation.partner;

      setPartner({
        userId: p.userId,
        name: `${p.lastName} ${p.firstName}`,
        avatar: p.profileImageUrl || "/img/noimg.jpg",
        role: p.roleName,
      });
    } catch (err) {
      console.error("Fetch conversation error", err);
    }
  };

  /* ===== FETCH MESSAGES ===== */
  const fetchMessages = async () => {
    try {
      const res = await api.get(`/chat/messages/${conversationId}`);

      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const mapped = raw.map((m) => ({
        id: m.messageId,
        senderUserId: m.senderUserId,
        senderName: m.senderName,
        text: m.messageText,
        sentAt: m.sentAt,
        isMine: m.senderUserId === currentUserId,
      }));

      setMessages(mapped);
    } catch (err) {
      console.error("Fetch messages error", err);
    }
  };



  /* ===== INIT LOAD ===== */
  useEffect(() => {
    if (!conversationId) return;

    isFirstLoadRef.current = true;
    prevLengthRef.current = 0;

    setLoading(true);
    Promise.all([fetchConversation(), fetchMessages()]).finally(() =>
      setLoading(false)
    );

    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  /* ===== SCROLL LOGIC ===== */
  useEffect(() => {
    if (messages.length === 0) return;

    // ❌ lần đầu mở chat: không scroll
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      prevLengthRef.current = messages.length;
      return;
    }

    // ✅ chỉ scroll khi có tin mới
    if (messages.length > prevLengthRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

    prevLengthRef.current = messages.length;
  }, [messages]);

  /* ===== SEND MESSAGE ===== */
  const sendMessage = async () => {
  if (!text.trim() || sending) return;

  setSending(true);
  try {
    await api.post("/chat/messages", {
      conversationId: Number(conversationId),
      messageText: text.trim(),
    });

    setText("");
    fetchMessages();

    window.dispatchEvent(new Event("chat-updated"));
  } catch (err) {
    console.error("Send message error", err);
  } finally {
    setSending(false);
  }
};


  /* ===== RENDER ===== */
  return (
    <div className="container-fluid h-100">
      <div className="card h-100">

        {/* ===== HEADER ===== */}
        <div
          className="card-header d-flex align-items-center gap-3"
          style={{ background: "#0c1844", color: "white" }}
        >
          <img
            src={partner?.avatar || "/img/noimg.jpg"}
            alt="avatar"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #fff",
            }}
          />
          <div>
            <div className="fw-bold">
              {partner?.name || "Đang tải..."}
            </div>
            <div className="small opacity-75">
              {partner?.role}
            </div>
          </div>
        </div>

        {/* ===== MESSAGE LIST ===== */}
        <div
          className="card-body overflow-auto"
          style={{ background: "#f5f5f5" }}
        >
          {loading ? (
            <div className="text-center py-4">
              <Spin />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-muted">Chưa có tin nhắn</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`d-flex mb-2 ${m.isMine ? "justify-content-end" : "justify-content-start"
                  }`}
              >
                {/* AVATAR - chỉ hiện với người khác */}
                {!m.isMine && (
                  <img
                    src={partner?.avatar || "/img/noimg.jpg"}
                    alt="avatar"
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: 8,
                      alignSelf: "flex-end",
                    }}
                  />
                )}

                {/* MESSAGE BUBBLE */}
                <div
                  className={`p-2 rounded ${m.isMine ? "text-white" : "bg-white border"}`}
                  style={{
                    maxWidth: "70%",
                    backgroundColor: m.isMine ? "#0c1844" : undefined,
                  }}
                >

                  {m.text}

                  <div
                    className="small text-end mt-1"
                    style={{
                      color: m.isMine ? "rgba(255,255,255,0.65)" : "#6c757d",
                      fontSize: 11,
                    }}
                  >
                    {(() => {
                      const d = new Date(m.sentAt);
                      d.setHours(d.getHours() + 7);
                      return d.toLocaleTimeString("vi-VN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      });
                    })()}

                  </div>
                </div>
              </div>
            ))

          )}
          <div ref={bottomRef} />
        </div>

        {/* ===== INPUT ===== */}
        <div className="card-footer d-flex gap-2">
          <input
            className="form-control"
            placeholder="Nhập tin nhắn..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
          />
          <button
            className="btn btn-primary"
            disabled={sending || !text.trim()}
            onClick={sendMessage}
          >
            <IoSend />
          </button>
        </div>
      </div>
    </div>
  );
}
