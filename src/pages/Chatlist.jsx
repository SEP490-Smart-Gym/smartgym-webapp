// src/pages/Chat/RoleChatList.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/axios"; // để đây, sau dùng API thật thì mở lại
import { message } from "antd";

// ===== MOCK DATA CHAT CONVERSATIONS =====
const MOCK_CONVERSATIONS = [
  {
    id: 1,
    memberId: 101,
    memberName: "Nguyễn Văn A",
    unreadCount: 3,
    lastMessagePreview: "Coach ơi mai mình tập mấy giờ ạ?",
    lastMessageAt: "2025-12-07T14:30:00",
  },
  {
    id: 2,
    memberId: 102,
    memberName: "Trần Thị B",
    unreadCount: 0,
    lastMessagePreview: "Cảm ơn PT, hôm nay buổi tập rất tốt ạ!",
    lastMessageAt: "2025-12-06T19:10:00",
  },
  {
    id: 3,
    memberId: 103,
    memberName: "Lê Hoàng C",
    unreadCount: 12,
    lastMessagePreview: "Em muốn đổi khung giờ buổi tối được không ạ?",
    lastMessageAt: "2025-12-05T09:05:00",
  },
];

export default function RoleChatList() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const isTrainer = user?.roleName === "Trainer";
  const isStaff = user?.roleName === "Staff";

  useEffect(() => {
    if (!user) return;
    if (!isTrainer && !isStaff) return;

    const fetchConversations = async () => {
      try {
        setLoading(true);
        setError("");

        // ====== DÙNG MOCK DATA ĐỂ TEST TRƯỚC ======
        setConversations(MOCK_CONVERSATIONS);
        setLoading(false);
        return;

        // ====== CODE THẬT (UNCOMMENT SAU NÀY) ======
        // const url = isTrainer
        //   ? "/trainer/chat/conversations"
        //   : "/staff/chat/conversations";

        // const res = await api.get(url);
        // const data = Array.isArray(res.data)
        //   ? res.data
        //   : res.data?.items ?? [];

        // setConversations(data);
      } catch (err) {
        console.error("Error fetching conversations:", err);
        setError("Không tải được danh sách cuộc trò chuyện.");
        setConversations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [user, isTrainer, isStaff]);

  const handleOpenChat = (conv) => {
    if (!user) return;

    // ưu tiên memberId -> dùng làm :id
    const memberId =
      conv.memberId ?? conv.memberUserId ?? conv.id ?? null;

    if (!memberId) {
      message.error("Không xác định được hội viên để mở chat.");
      return;
    }

    const base =
      user.roleName === "Trainer" ? "/trainer/chat" : "/staff/chat";

    // 👉 dẫn tới /trainer/chat/:id hoặc /staff/chat/:id
    navigate(`${base}/${memberId}`);
  };

  const formatTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${hh}:${mm} ${d.toLocaleDateString("vi-VN")}`;
  };

  const getInitial = (name) => {
    if (!name) return "?";
    return name.trim().charAt(0).toUpperCase();
  };

  return (
    <div className="container py-4">
      <style>{`
        .chat-card {
          max-width: 800px;
          margin: 0 auto;
        }
        .chat-item {
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .chat-item:hover {
          background-color: #f8fafc;
        }
        .chat-avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: #e5e7eb;
          color: #111827;
          font-weight: 700;
          font-size: 1.1rem;
          position: relative;
          flex-shrink: 0;
        }
        .chat-avatar-icon {
          font-size: 1rem;
          margin-right: 4px;
        }
        .chat-unread-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 18px;
          height: 18px;
          padding: 0 4px;
          border-radius: 999px;
          background-color: #ef4444;
          color: #fff;
          font-size: 11px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .chat-name {
          font-weight: 600;
          margin-bottom: 2px;
        }
        .chat-preview {
          font-size: 0.85rem;
          color: #6b7280;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }
        .chat-time {
          font-size: 0.75rem;
          color: #9ca3af;
        }
      `}</style>

      <div className="chat-card card shadow-sm">
        <div className="card-body">
          <h5 className="card-title mb-1">
            {isTrainer && "Chat với hội viên"}
            {isStaff && "Chat với hội viên"}
            {!isTrainer && !isStaff && "Danh sách chat"}
          </h5>
          <p className="text-muted small mb-3">
            Chọn một hội viên để mở cuộc trò chuyện.
          </p>

          {!user && (
            <div className="alert alert-warning mb-0">
              Vui lòng đăng nhập để xem danh sách chat.
            </div>
          )}

          {user && !isTrainer && !isStaff && (
            <div className="alert alert-info mb-0">
              Tính năng chat list hiện chỉ áp dụng cho Trainer và Staff.
            </div>
          )}

          {user && (isTrainer || isStaff) && (
            <>
              {loading && (
                <div className="alert alert-info mb-2">
                  Đang tải danh sách cuộc trò chuyện...
                </div>
              )}

              {error && !loading && (
                <div className="alert alert-danger mb-2">{error}</div>
              )}

              {!loading && !error && conversations.length === 0 && (
                <div className="alert alert-light border mb-0">
                  Chưa có cuộc trò chuyện nào với hội viên.
                </div>
              )}

              {!loading && !error && conversations.length > 0 && (
                <ul className="list-group list-group-flush">
                  {conversations.map((conv) => {
                    const unread = conv.unreadCount || 0;
                    const memberName =
                      conv.memberName || conv.fullName || "Hội viên";

                    return (
                      <li
                        key={conv.id || conv.conversationId}
                        className="list-group-item chat-item"
                        onClick={() => handleOpenChat(conv)}
                      >
                        <div className="d-flex align-items-center">
                          {/* Avatar + icon member */}
                          <div className="chat-avatar me-3">
                            <i className="fas fa-user chat-avatar-icon" />
                            <span>{getInitial(memberName)}</span>

                            {unread > 0 && (
                              <span className="chat-unread-badge">
                                {unread > 99 ? "99+" : unread}
                              </span>
                            )}
                          </div>

                          {/* Nội dung */}
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between">
                              <div className="chat-name">{memberName}</div>
                              {conv.lastMessageAt && (
                                <div className="chat-time ms-2">
                                  {formatTime(conv.lastMessageAt)}
                                </div>
                              )}
                            </div>
                            <div className="chat-preview">
                              {conv.lastMessagePreview ||
                                conv.lastMessage ||
                                "Chưa có tin nhắn."}
                            </div>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
