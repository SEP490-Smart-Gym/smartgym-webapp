import { useEffect, useState } from "react";
import api from "../../config/axios";
import { Spin, Avatar } from "antd";
import { UserOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

export default function StaffChatList() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");

    // ===================== MOCK DATA =====================
    const mockChatList = [
        {
            conversationId: 1,
            otherUserId: 21,
            otherUserName: "Nguyễn Văn Minh",
            otherUserAvatar: "/img/user1.jpg",
            lastMessage: "Em cần đổi lịch tập ngày mai được không ạ?",
            lastMessageTime: "2025-02-15T09:32:00",
            unreadCount: 2,
        },
        {
            conversationId: 2,
            otherUserId: 35,
            otherUserName: "Trần Thị Khánh",
            otherUserAvatar: "/img/user2.jpg",
            lastMessage: "Cảm ơn anh đã sửa bài tập hôm qua!",
            lastMessageTime: "2025-02-14T21:10:00",
            unreadCount: 0,
        },
        {
            conversationId: 3,
            otherUserId: 17,
            otherUserName: "Phạm Hoàng Bảo",
            otherUserAvatar: "/img/user3.jpg",
            lastMessage: "Buổi tập cardio hôm nay khá nặng anh ạ 😅",
            lastMessageTime: "2025-02-14T18:22:00",
            unreadCount: 5,
        },
        {
            conversationId: 4,
            otherUserId: 26,
            otherUserName: "Lê Quốc Thái",
            otherUserAvatar: "/img/user4.jpg",
            lastMessage: "Anh có thể gửi video bài tập lại không?",
            lastMessageTime: "2025-02-13T11:47:00",
            unreadCount: 0,
        }
    ];

    // ===================== FETCH API =====================
    const fetchConversations = async () => {
        setLoading(true);
        try {
            const res = await api.get("/chat/conversations");

            // Nếu API trả về mảng rỗng → dùng mock
            if (res.data && res.data.length > 0) {
                setConversations(res.data);
            } else {
                setConversations(mockChatList);
            }
        } catch (err) {
            console.error(err);
            setConversations(mockChatList); // fallback nếu API lỗi
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    // ===================== SEARCH =====================
    const filtered = conversations.filter((c) =>
        c.otherUserName.toLowerCase().includes(search.toLowerCase())
    );

    const formatTime = (t) =>
        t ? new Date(t).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "";

    // ===================== RENDER =====================
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
                <div className="text-center py-4"><Spin /></div>
            ) : (
                <div className="chatlist-scroll">
                    {filtered.length === 0 ? (
                        <p className="text-muted text-center mt-4">Không có cuộc trò chuyện nào.</p>
                    ) : (
                        filtered.map((cv) => (
                            <Link
                                to={`/staff/chat/${cv.conversationId}`}
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
                                        <span className="chat-time">{formatTime(cv.lastMessageTime)}</span>
                                    </div>

                                    <div className="chat-bottom-row">
                                        <span className="chat-last">{cv.lastMessage || "Chưa có tin nhắn"}</span>

                                        {cv.unreadCount > 0 && (
                                            <span className="chat-unread">{cv.unreadCount}</span>
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
