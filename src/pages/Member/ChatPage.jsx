import { useEffect, useState } from "react";
import { message, Spin } from "antd";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";

export default function ChatPage() {
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [startUserId, setStartUserId] = useState("");
  const navigate = useNavigate();

  // ==========================
  // LOAD CONVERSATIONS
  // ==========================
  const fetchConversations = async () => {
    setLoading(true);
    try {
      const storedUser = localStorage.getItem("user");
      const user = storedUser ? JSON.parse(storedUser) : null;
      const userId = user?.id;


      if (!userId) {
        message.error("Không tìm thấy userId trong localStorage");
        return;
      }

      // BACKEND REQUIRED: /chat/conversations?userId=123
      const res = await api.get(`/chat/conversations?userId=${userId}`);

      setConversations(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách trò chuyện");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // ==========================
  // START NEW CONVERSATION
  // ==========================
  const startConversation = async () => {
    if (!startUserId) {
      return message.warning("Nhập userId người cần chat");
    }

    try {
      await api.post("/chat/conversations/start", {
        otherUserId: Number(startUserId),
      });

      message.success("Bắt đầu trò chuyện thành công");
      fetchConversations();
      setStartUserId("");
    } catch (err) {
      console.error(err);
      message.error("Không thể bắt đầu trò chuyện");
    }
  };

  return (
    <div className="container py-4">
      <h2 className="mb-4">Tin nhắn</h2>

      {/* ========================== */}
      {/* BẮT ĐẦU TRÒ CHUYỆN MỚI */}
      {/* ========================== */}
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

      {/* ========================== */}
      {/* DANH SÁCH CONVERSATION */}
      {/* ========================== */}
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
                key={c.conversationId}
                className="list-group-item d-flex justify-content-between align-items-center"
                style={{ cursor: "pointer" }}
                onClick={() => navigate(`/chat/${c.conversationId}`)}
              >
                <div>
                  {/* PARTNER NAME */}
                  <strong>
                    {c.partner
                      ? `${c.partner.firstName} ${c.partner.lastName}`
                      : "Người dùng"}
                  </strong>

                  {/* LAST MESSAGE PREVIEW */}
                  <div className="text-muted small">
                    {c.lastMessage?.messageText || "Chưa có tin nhắn"}
                  </div>
                </div>

                {/* Unread count (optional) */}
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