import React, { useState, useMemo } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "reactstrap";
import { HiGift } from "react-icons/hi2";
import { FiSearch, FiCheckCircle, FiClock } from "react-icons/fi";
import { message } from "antd";

// ===== MOCK DATA YÊU CẦU ĐỔI QUÀ =====
const MOCK_REDEMPTIONS = [
  {
    id: 201,
    memberName: "Nguyễn Văn A",
    memberEmail: "nguyenvana@example.com",
    giftName: "Khăn tập Gym cao cấp",
    image:
      "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsUsed: 500,
    redeemedAt: "20/11/2025 18:30",
    status: "Đã nhận", // hoặc "Chưa nhận"
    note: "Đã nhận trực tiếp tại quầy.",
  },
  {
    id: 202,
    memberName: "Trần Thị B",
    memberEmail: "tranthib@example.com",
    giftName: "Voucher 1 lần xông hơi miễn phí",
    image:
      "https://images.pexels.com/photos/3738046/pexels-photo-3738046.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsUsed: 600,
    redeemedAt: "05/12/2025 09:15",
    status: "Chưa nhận",
    note: "Cần xác nhận hội viên đủ điều kiện trước khi sử dụng.",
  },
  {
    id: 203,
    memberName: "Lê Hoàng C",
    memberEmail: "lehoangc@example.com",
    giftName: "Bình nước thể thao cao cấp",
    image:
      "https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsUsed: 800,
    redeemedAt: "03/12/2025 15:10",
    status: "Chưa nhận",
    note: "Hội viên sẽ ghé nhận trong tuần này.",
  },
];

const StaffRewardRedemptions = () => {
  // Mock data (sau này thay bằng API)
  const [redemptions, setRedemptions] = useState(MOCK_REDEMPTIONS);

  // Filter trạng thái: all | pending | received
  const [statusFilter, setStatusFilter] = useState("all");

  // Search theo tên hoặc email
  const [searchText, setSearchText] = useState("");

  // Modal chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState(null);
  const [updating, setUpdating] = useState(false);

  const handleOpenDetail = (item) => {
    setSelectedRedemption(item);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    if (updating) return;
    setDetailOpen(false);
    setSelectedRedemption(null);
  };

  // Cập nhật trạng thái "Chưa nhận" -> "Đã nhận"
  const handleMarkAsReceived = (item) => {
    if (!item || item.status === "Đã nhận") return;

    const ok = window.confirm(
      `Xác nhận hội viên "${item.memberName}" đã nhận quà "${item.giftName}"?`
    );
    if (!ok) return;

    try {
      setUpdating(true);

      // Mock gọi API bằng timeout
      setTimeout(() => {
        setRedemptions((prev) =>
          prev.map((r) =>
            r.id === item.id ? { ...r, status: "Đã nhận" } : r
          )
        );

        // Nếu đang mở modal chi tiết -> sync lại
        setSelectedRedemption((prev) =>
          prev && prev.id === item.id ? { ...prev, status: "Đã nhận" } : prev
        );

        message.success("Cập nhật trạng thái: Đã nhận quà.");
        setUpdating(false);
      }, 600);
    } catch (err) {
      console.error("Update status error (mock):", err);
      message.error("Cập nhật trạng thái thất bại (mock), vui lòng thử lại!");
      setUpdating(false);
    }
  };

  // Dữ liệu đã lọc theo trạng thái + search
  const filteredRedemptions = useMemo(
    () =>
      redemptions
        .filter((item) => {
          if (statusFilter === "pending") return item.status === "Chưa nhận";
          if (statusFilter === "received") return item.status === "Đã nhận";
          return true;
        })
        .filter((item) => {
          if (!searchText.trim()) return true;
          const s = searchText.toLowerCase();
          return (
            item.memberName.toLowerCase().includes(s) ||
            item.memberEmail.toLowerCase().includes(s)
          );
        }),
    [redemptions, statusFilter, searchText]
  );

  return (
    <Container className="mt-5 mb-5" fluid>
      <Row className="justify-content-center">
        <Col xl="10">
          <Card className="shadow-lg border-0">
            {/* HEADER */}
            <CardHeader
              style={{
                background:
                  "linear-gradient(135deg, #0c1844 0%, #1f3b8f 50%, #2f7dd1 100%)",
                color: "#fff",
                borderRadius: "0.5rem 0.5rem 0 0",
                borderBottom: "none",
              }}
            >
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center align-items-start">
                {/* Left: tiêu đề */}
                <div className="d-flex align-items-center mb-3 mb-md-0">
                  <div
                    style={{
                      width: 46,
                      height: 46,
                      borderRadius: "999px",
                      background: "rgba(255,255,255,0.12)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
                    }}
                  >
                    <HiGift size={24} />
                  </div>
                  <div>
                    <h3
                      className="mb-0"
                      style={{ fontWeight: 700, letterSpacing: 0.3 }}
                    >
                      Quản lý đổi quà bằng điểm
                    </h3>
                    <small style={{ opacity: 0.9 }}>
                      Staff cập nhật trạng thái hội viên đã nhận quà tại{" "}
                      <strong>quầy lễ tân – Phòng gym</strong>.
                    </small>
                  </div>
                </div>

                {/* Right: ô search căn phải */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    padding: "6px 10px",
                    minWidth: 260,
                    alignSelf: "stretch",
                  }}
                  className="mt-2 mt-md-0"
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      marginBottom: 4,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <FiSearch size={14} />
                    <span>Tìm kiếm hội viên</span>
                  </div>
                  <input
                    type="text"
                    placeholder="Tên hoặc email..."
                    className="form-control form-control-sm"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    style={{
                      borderRadius: "999px",
                      fontSize: 13,
                    }}
                  />
                </div>
              </div>
            </CardHeader>

            {/* BODY */}
            <CardBody style={{ backgroundColor: "#f3f4f6" }}>
              {/* Filter trạng thái căn giữa */}
              <div className="d-flex justify-content-center mb-3">
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Status filter"
                >
                  <Button
                    size="sm"
                    color={statusFilter === "all" ? "danger" : "secondary"}
                    style={{
                      fontSize: 12,
                      borderRadius: "999px 0 0 999px",
                    }}
                    onClick={() => setStatusFilter("all")}
                  >
                    Tất cả
                  </Button>
                  <Button
                    size="sm"
                    color={
                      statusFilter === "pending" ? "danger" : "secondary"
                    }
                    style={{ fontSize: 12 }}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Chưa nhận
                  </Button>
                  <Button
                    size="sm"
                    color={
                      statusFilter === "received" ? "danger" : "secondary"
                    }
                    style={{
                      fontSize: 12,
                      borderRadius: "0 999px 999px 0",
                    }}
                    onClick={() => setStatusFilter("received")}
                  >
                    Đã nhận
                  </Button>
                </div>
              </div>

              {filteredRedemptions.length === 0 && (
                <div className="alert alert-light border text-center mb-0">
                  Không tìm thấy yêu cầu đổi quà nào phù hợp.
                </div>
              )}

              {filteredRedemptions.length > 0 && (
                <Row className="mt-2">
                  {filteredRedemptions.map((item) => {
                    const isPending = item.status === "Chưa nhận";
                    const initials = item.memberName
                      .split(" ")
                      .filter(Boolean)
                      .slice(-2)
                      .map((w) => w[0]?.toUpperCase())
                      .join("");

                    return (
                      <Col
                        key={item.id}
                        xl="6"
                        lg="6"
                        className="mb-4 d-flex align-items-stretch"
                      >
                        <Card
                          className="shadow-sm border-0 w-100"
                          style={{
                            borderRadius: "0.75rem",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "row",
                          }}
                        >
                          {/* Ảnh quà */}
                          <div style={{ width: 130, flexShrink: 0 }}>
                            <img
                              src={item.image}
                              alt={item.giftName}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                              }}
                              onError={(e) => {
                                e.currentTarget.src =
                                  "https://via.placeholder.com/240x240?text=Gift";
                              }}
                            />
                          </div>

                          {/* Nội dung */}
                          <div
                            style={{
                              flex: 1,
                              backgroundColor: "#ffffff",
                              padding: "12px 14px",
                              display: "flex",
                              flexDirection: "column",
                            }}
                          >
                            {/* Member + status */}
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <div className="d-flex align-items-center">
                                <div
                                  style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: "999px",
                                    background: "#e5e7eb",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: 14,
                                    fontWeight: 700,
                                    marginRight: 8,
                                    color: "#374151",
                                  }}
                                >
                                  {initials || "M"}
                                </div>
                                <div>
                                  <div
                                    style={{
                                      fontSize: 14,
                                      fontWeight: 700,
                                      color: "#111827",
                                    }}
                                  >
                                    {item.memberName}
                                  </div>
                                  <div
                                    style={{
                                      fontSize: 12,
                                      color: "#6b7280",
                                    }}
                                  >
                                    {item.memberEmail}
                                  </div>
                                </div>
                              </div>

                              <Badge
                                color={isPending ? "warning" : "success"}
                                pill
                                style={{ fontSize: 11 }}
                              >
                                {item.status}
                              </Badge>
                            </div>

                            {/* Gift info */}
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: "#111827",
                                marginBottom: 2,
                              }}
                            >
                              🎁 {item.giftName}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#4b5563",
                                marginBottom: 2,
                              }}
                            >
                              Đã trừ{" "}
                              <strong>
                                {item.pointsUsed.toLocaleString("vi-VN")} điểm
                              </strong>
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#6b7280",
                                marginBottom: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 4,
                              }}
                            >
                              <FiClock size={13} />
                              <span>
                                Thời gian đổi:{" "}
                                <strong>{item.redeemedAt}</strong>
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: "#6b7280",
                                marginBottom: 6,
                              }}
                            >
                              Nhận tại:{" "}
                              <strong>Quầy lễ tân – Phòng gym</strong>
                            </div>

                            {/* Actions */}
                            <div className="mt-auto d-flex justify-content-between align-items-center">
                              <Button
                                size="sm"
                                color="light"
                                style={{
                                  borderRadius: 999,
                                  borderColor: "#e5e7eb",
                                  fontSize: 13,
                                }}
                                onClick={() => handleOpenDetail(item)}
                              >
                                Chi tiết
                              </Button>

                              {isPending && (
                                <Button
                                  size="sm"
                                  color="success"
                                  style={{
                                    borderRadius: 999,
                                    fontSize: 13,
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 6,
                                  }}
                                  onClick={() => handleMarkAsReceived(item)}
                                  disabled={updating}
                                >
                                  <FiCheckCircle size={14} />
                                  <span>
                                    {updating
                                      ? "Đang cập nhật..."
                                      : "Xác nhận đã nhận"}
                                  </span>
                                </Button>
                              )}

                              {!isPending && (
                                <span
                                  style={{
                                    fontSize: 11,
                                    color: "#16a34a",
                                    fontWeight: 600,
                                  }}
                                >
                                  Đã xác nhận
                                </span>
                              )}
                            </div>
                          </div>
                        </Card>
                      </Col>
                    );
                  })}
                </Row>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ========== MODAL CHI TIẾT ĐỔI QUÀ ========== */}
      <Modal isOpen={detailOpen} toggle={handleCloseDetail} centered size="md">
        <ModalHeader
          toggle={handleCloseDetail}
          style={{ borderBottom: "none", paddingBottom: 0, fontWeight: 700 }}
        >
          {selectedRedemption?.giftName || "Chi tiết đổi quà"}
        </ModalHeader>
        <ModalBody style={{ paddingTop: 0 }}>
          {selectedRedemption && (
            <>
              <div
                style={{
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                <img
                  src={selectedRedemption.image}
                  alt={selectedRedemption.giftName}
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                    display: "block",
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/600x340?text=Gift";
                  }}
                />
              </div>

              {/* Member info */}
              <div
                className="mb-3"
                style={{
                  padding: "10px 12px",
                  borderRadius: "0.75rem",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    marginBottom: 4,
                    color: "#111827",
                  }}
                >
                  Thông tin hội viên
                </div>
                <div style={{ fontSize: 13, color: "#4b5563" }}>
                  Họ tên:{" "}
                  <strong>{selectedRedemption.memberName}</strong>
                </div>
                <div style={{ fontSize: 13, color: "#4b5563" }}>
                  Email: <strong>{selectedRedemption.memberEmail}</strong>
                </div>
                <div style={{ fontSize: 13, color: "#4b5563" }}>
                  Nhận quà tại:{" "}
                  <strong>Quầy lễ tân – Phòng gym</strong>
                </div>
              </div>

              {/* Gift info */}
              <div
                className="mb-3"
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                }}
              >
                <div>
                  Đã trừ{" "}
                  <strong>
                    {selectedRedemption.pointsUsed.toLocaleString("vi-VN")} điểm
                  </strong>
                </div>
                <div>
                  Thời gian đổi:{" "}
                  <strong>{selectedRedemption.redeemedAt}</strong>
                </div>
                <div className="mt-1">
                  Trạng thái:{" "}
                  <Badge
                    color={
                      selectedRedemption.status === "Đã nhận"
                        ? "success"
                        : "warning"
                    }
                    pill
                    style={{ fontSize: 11 }}
                  >
                    {selectedRedemption.status}
                  </Badge>
                </div>
              </div>

              {selectedRedemption.note && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.75rem",
                    padding: "10px 12px",
                  }}
                >
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 12,
                      marginBottom: 4,
                      color: "#111827",
                    }}
                  >
                    Ghi chú:
                  </div>
                  <div>{selectedRedemption.note}</div>
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter style={{ borderTop: "none" }}>
          <Button color="secondary" outline onClick={handleCloseDetail}>
            Đóng
          </Button>

          {selectedRedemption &&
            selectedRedemption.status === "Chưa nhận" && (
              <Button
                color="success"
                disabled={updating}
                onClick={() => handleMarkAsReceived(selectedRedemption)}
              >
                {updating ? "Đang cập nhật..." : "Xác nhận đã nhận quà"}
              </Button>
            )}
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default StaffRewardRedemptions;
