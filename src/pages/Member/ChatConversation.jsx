import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { message, Spin } from "antd";
import api from "../../config/axios";

export default function ChatConversation() {
  const { conversationId } = useParams();
  const [messages, setMessages] = useState([]);
  const [conversationInfo, setConversationInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");

  const bottomRef = useRef(null);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/chat/messages/${conversationId}`);
      setMessages(res.data.messages || []);
      setConversationInfo(res.data.conversation || null);

      // Scroll xuống cuối
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    } catch (err) {
      message.error("Không thể tải tin nhắn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Auto refresh mỗi 3 giây
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [conversationId]);

  const sendMessage = async () => {
    if (!text.trim()) return;

    setSending(true);
    try {
      await api.post("/chat/messages/send", {
        conversationId: Number(conversationId),
        content: text,
      });

      setText("");
      fetchMessages();
    } catch (err) {
      message.error("Không gửi được tin nhắn");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 700 }}>
      <h4 className="mb-3">
        Trò chuyện với:{" "}
        <span className="text-primary">
          {conversationInfo?.otherUserName || "Người dùng"}
        </span>
      </h4>

      <div className="card" style={{ height: "70vh" }}>
        {/* message list */}
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
            messages.map((m, i) => (
              <div
                key={i}
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
                  {m.content}
                  <div className="text-muted small mt-1 text-end">
                    {new Date(m.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={bottomRef}></div>
        </div>

        {/* input */}
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
