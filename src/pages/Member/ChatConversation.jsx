import { useEffect, useState, useRef, useMemo } from "react";
import { useParams } from "react-router-dom";
import { message as antdMessage, Spin } from "antd";
import api from "../../config/axios";

export default function ChatConversation() {
  const { conversationId } = useParams();

  /* ================= CURRENT USER ================= */
  const currentUser = useMemo(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  }, []);

  const currentUserId = currentUser?.id;

  /* ================= STATE ================= */
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);
  const prevLengthRef = useRef(0);

  /* ================= FETCH (LOAD 1 LẦN) ================= */
  const fetchMessages = async () => {
    setLoading(true);
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

      // scroll khi load lần đầu
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
      }, 0);

      prevLengthRef.current = mapped.length;
    } catch {
      antdMessage.error("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [conversationId]);

  /* ================= SEND MESSAGE ================= */
  const sendMessage = async () => {
  if (!text.trim()) return;

  const messageText = text;
  setSending(true);

  try {
    const res = await api.post("/chat/messages", {
      conversationId: Number(conversationId),
      messageText,
    });

    const m = res.data; // backend trả message vừa tạo

    const mapped = {
      id: m.messageId,
      senderUserId: m.senderUserId,
      senderName: m.senderName,
      text: m.messageText,
      sentAt: m.sentAt,
      isMine: true,
    };

    setMessages((prev) => [...prev, mapped]);
    setText("");

  } catch (err) {
    message.error("Không gửi được tin nhắn");
  } finally {
    setSending(false);
  }
};



  /* ================= RENDER ================= */
  return (
    <div className="container py-4" style={{ maxWidth: 700 }}>
      <h4 className="mb-3">Trò chuyện</h4>

      <div className="card" style={{ height: "70vh" }}>
        {/* MESSAGE LIST */}
        <div
          className="card-body overflow-auto"
          style={{ background: "#f5f5f5" }}
        >
          {loading ? (
            <div className="text-center py-4">
              <Spin />
            </div>
          ) : messages.length === 0 ? (
            <p className="text-muted">Chưa có tin nhắn nào</p>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`d-flex mb-2 ${
                  m.isMine ? "justify-content-end" : "justify-content-start"
                }`}
              >
                <div
                  className={`p-2 rounded ${
                    m.isMine ? "bg-primary text-white" : "bg-white border"
                  }`}
                  style={{ maxWidth: "70%" }}
                >
                  {!m.isMine && (
                    <div className="small fw-bold text-muted mb-1">
                      {m.senderName}
                    </div>
                  )}

                  {m.text}

                  <div className="text-muted small mt-1 text-end">
                    {new Date(m.sentAt).toLocaleTimeString("vi-VN")}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* INPUT */}
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
            onClick={sendMessage}
            disabled={sending}
          >
            Gửi
          </button>
        </div>
      </div>
    </div>
  );
}
