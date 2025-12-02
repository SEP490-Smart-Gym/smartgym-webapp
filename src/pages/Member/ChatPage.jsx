import { useEffect, useState } from "react";
import { message, Spin } from "antd";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";

export default function ChatPage() {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [startUserId, setStartUserId] = useState("");
  const navigate = useNavigate();

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.get("/chat/conversations");
      setConversations(res.data || []);
    } catch (err) {
      message.error("Không tải được danh sách trò chuyện");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  const startConversation = async () => {
    if (!startUserId) return message.warning("Nhập userId người cần chat");

    try {
      await api.post("/chat/conversations/start", {
        otherUserId: Number(startUserId),
      });

      message.success("Bắt đầu trò chuyện thành công");
      fetchConversations();
      setStartUserId("");
    } catch (err) {
      message.error("Không thể bắt đầu trò chuyện");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Tin nhắn</h2>

      {/* Bắt đầu trò chuyện mới */}
      <div className="card p-3 mb-4">
        <h5>Bắt đầu trò chuyện mới</h5>
        <div className="input-group mt-2">
          <input
            type="number"
            className="form-control"
            placeholder="Nhập userId"
            value={startUserId}
            onChange={(e) => setStartUserId(e.target.value)}
          />
          <button className="btn btn-primary" onClick={startConversation}>
            Bắt đầu
          </button>
        </div>
      </div>

      {/* Danh sách chat */}
      <div className="card p-3">
        <h5 className="mb-3">Danh sách cuộc trò chuyện</h5>

        {loading ? (
          <div className="text-center py-3">
            <Spin />
          </div>
        ) : conversations.length === 0 ? (
          <p className="text-muted">Không có cuộc trò chuyện nào</p>
        ) : (
          <ul className="list-group">
            {conversations.map((c) => (
              <li
                key={c.id}
                className="list-group-item d-flex justify-content-between align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/chat/${c.id}`)}
              >
                <div>
                  <strong>{c.otherUserName || "Người dùng"}</strong>
                  <div className="text-muted small">
                    {c.lastMessage || "Chưa có tin nhắn"}
                  </div>
                </div>
                <span className="badge bg-secondary">
                  {c.unreadCount || 0} chưa đọc
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
