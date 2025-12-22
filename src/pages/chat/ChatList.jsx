import { useEffect, useState, useMemo } from "react";
import api from "../../config/axios";
import { Spin, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

export default function StaffChatList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  /* ===================== CURRENT USER ===================== */
  const currentUser = useMemo(() => {
    const u = localStorage.getItem("user");
    return u ? JSON.parse(u) : null;
  }, []);

  const staffUserId = currentUser?.id;

  /* ===================== FETCH API ===================== */
  const fetchConversations = async () => {
    if (!staffUserId) return;

    setLoading(true);
    try {
      const res = await api.get("/chat/conversations", {
        params: {
          userId: staffUserId, // ✅ GỬI userId
        },
      });

      const raw = Array.isArray(res.data)
        ? res.data
        : res.data?.data || [];

      const mapped = raw.map((cv) => ({
        conversationId: cv.conversationId,

        otherUserId: cv.partner?.userId,
        otherUserName: ` ${cv.partner?.lastName || ""} ${cv.partner?.firstName || ""}`.trim(),
        otherUserAvatar: cv.partner?.profileImageUrl || null,

        lastMessage: cv.lastMessage?.messageText || "",
        lastMessageTime:
          cv.lastMessage?.sentAt || cv.updatedAt || null,

        unreadCount: 0, // backend chưa trả
      }));

      setConversations(mapped);
    } catch (err) {
      console.error(err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [staffUserId]);

  /* ===================== SEARCH ===================== */
  const filtered = conversations.filter((c) =>
    c.otherUserName.toLowerCase().includes(search.toLowerCase())
  );

  const formatTime = (t) => {
    if (!t) return "";

    const d = new Date(t);
    d.setHours(d.getHours() + 7);

    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  /* ===================== RENDER ===================== */
  return (
    <div className="chatlist-container mt-5 mb-5">
      <div className="chatlist-header">
        <h3>💬 Tin nhắn</h3>
        <input
          type="text"
          className="chat-search"
          placeholder="Tìm kiếm thành viên..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-center py-4">
          <Spin />
        </div>
      ) : (
        <div className="chatlist-scroll">
          {filtered.length === 0 ? (
            <p className="text-muted text-center mt-4">
              Không có cuộc trò chuyện nào.
            </p>
          ) : (
            filtered.map((cv) => (
              <Link
                to={`${cv.conversationId}`}
                key={cv.conversationId}
                className="chat-item"
              >

                <Avatar
                  size={48}
                  src={cv.otherUserAvatar}
                  icon={<UserOutlined />}
                />

                <div className="chat-info">
                  <div className="chat-top-row">
                    <span className="chat-name">{cv.otherUserName}</span>
                    <span className="chat-time">
                      {formatTime(cv.lastMessageTime)}
                    </span>
                  </div>

                  <div className="chat-bottom-row">
                    <span className="chat-last">
                      {cv.lastMessage || "Chưa có tin nhắn"}
                    </span>

                    {cv.unreadCount > 0 && (
                      <span className="chat-unread">
                        {cv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}
