import React, { useEffect, useMemo, useState } from "react";
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
  Spinner,
} from "reactstrap";
import { HiGift } from "react-icons/hi2";
import { FiSearch, FiCheckCircle, FiClock, FiXCircle } from "react-icons/fi";
import { message } from "antd";
import api from "../../config/axios";

// ===== time helpers (fix giờ VN) =====
// backend trả datetime không có Z/offset => ép coi là UTC để hiển thị đúng giờ VN
function toISODateSafe(s) {
  if (!s) return null;
  let str = String(s).trim();
  // cắt nano -> milli
  str = str.replace(/(\.\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})?$)/, "$1");
  const hasTZ = /Z$|[+-]\d{2}:\d{2}$/.test(str);
  return hasTZ ? str : `${str}Z`;
}

function formatDateTimeVN(dateStr) {
  const iso = toISODateSafe(dateStr);
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

// ===== status mapping =====
const STATUS_VI = {
  Pending: "Chưa xử lý",
  Approved: "Đã nhận",
  Cancelled: "Đã hủy",
};

function getStatusVi(apiStatus) {
  return STATUS_VI[apiStatus] || apiStatus || "—";
}

function getBadgeColor(apiStatus) {
  if (apiStatus === "Approved") return "success";
  if (apiStatus === "Cancelled") return "secondary";
  return "warning"; // Pending / others
}

// ===== normalize API item =====
function normalizeRedemption(raw) {
  return {
    redemptionId: raw?.redemptionId,
    memberName: raw?.memberName || "—",
    memberEmail: raw?.memberEmail || "—",
    rewardId: raw?.rewardId,
    rewardName: raw?.rewardName || "—",
    imageUrl: raw?.imageUrl || "", // ✅ NEW
    pointsRedeemed: Number(raw?.pointsRedeemed ?? 0),
    redemptionDate: raw?.redemptionDate,
    status: raw?.status, // Pending | Approved | Cancelled
    deliveryDate: raw?.deliveryDate,
    notes: raw?.notes,
    processedBy: raw?.processedBy,
    processorName: raw?.processorName,
  };
}

const PLACEHOLDER_IMG_SMALL = "https://via.placeholder.com/240x240?text=Gift";
const PLACEHOLDER_IMG_LARGE = "https://via.placeholder.com/600x340?text=Gift";

const StaffRewardRedemptions = () => {
  const [redemptions, setRedemptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter trạng thái: all | pending | received | cancelled
  const [statusFilter, setStatusFilter] = useState("all");

  // Search theo tên hoặc email
  const [searchText, setSearchText] = useState("");

  // Modal chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedRedemption, setSelectedRedemption] = useState(null);

  // Updating
  const [updating, setUpdating] = useState(false);

  const fetchRedemptions = async () => {
    setLoading(true);
    try {
      const res = await api.get("/RewardRedemption");
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];

      const mapped = arr
        .map(normalizeRedemption)
        .filter((x) => x.redemptionId != null);

      // sort mới -> cũ theo redemptionDate
      mapped.sort((a, b) => {
        const ta = new Date(toISODateSafe(a.redemptionDate) || 0).getTime();
        const tb = new Date(toISODateSafe(b.redemptionDate) || 0).getTime();
        return tb - ta;
      });

      setRedemptions(mapped);
    } catch (err) {
      console.error("GET /RewardRedemption error:", err?.response?.data || err);
      message.error("Không tải được danh sách yêu cầu đổi quà.");
      setRedemptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRedemptions();
  }, []);

  const handleOpenDetail = (item) => {
    setSelectedRedemption(item);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    if (updating) return;
    setDetailOpen(false);
    setSelectedRedemption(null);
  };

  const updateStatus = async (item, nextStatus) => {
    if (!item?.redemptionId) return;

    const isApprove = nextStatus === "Approved";

    const ok = window.confirm(
      isApprove
        ? `Xác nhận hội viên "${item.memberName}" đã nhận quà "${item.rewardName}"?`
        : `Xác nhận TỪ CHỐI yêu cầu đổi quà của "${item.memberName}" (${item.rewardName})?`
    );
    if (!ok) return;

    try {
      setUpdating(true);

      const body = {
        status: nextStatus,
        deliveryDate: isApprove ? new Date().toISOString() : null,
        notes: item?.notes || null,
      };

      await api.put(`/RewardRedemption/${item.redemptionId}/status`, body);

      message.success(
        isApprove ? "Đã cập nhật: Đã nhận quà." : "Đã cập nhật: Đã hủy yêu cầu."
      );

      // refresh list
      await fetchRedemptions();

      // sync modal (nếu đang mở đúng item)
      setSelectedRedemption((prev) =>
        prev && prev.redemptionId === item.redemptionId
          ? { ...prev, status: nextStatus, deliveryDate: body.deliveryDate }
          : prev
      );
    } catch (err) {
      console.error(
        "PUT /RewardRedemption/{id}/status error:",
        err?.response?.data || err
      );
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        "Cập nhật trạng thái thất bại, vui lòng thử lại!";
      message.error(apiMsg);
    } finally {
      setUpdating(false);
    }
  };

  // Dữ liệu đã lọc theo trạng thái + search
  const filteredRedemptions = useMemo(() => {
    return redemptions
      .filter((item) => {
        if (statusFilter === "pending") return item.status === "Pending";
        if (statusFilter === "received") return item.status === "Approved";
        if (statusFilter === "cancelled") return item.status === "Cancelled";
        return true;
      })
      .filter((item) => {
        if (!searchText.trim()) return true;
        const s = searchText.toLowerCase();
        return (
          String(item.memberName || "").toLowerCase().includes(s) ||
          String(item.memberEmail || "").toLowerCase().includes(s)
        );
      });
  }, [redemptions, statusFilter, searchText]);

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
                    style={{ borderRadius: "999px", fontSize: 13 }}
                  />
                </div>
              </div>
            </CardHeader>

            {/* BODY */}
            <CardBody style={{ backgroundColor: "#f3f4f6" }}>
              {/* Filter trạng thái căn giữa */}
              <div className="d-flex justify-content-center mb-3">
                <div className="btn-group" role="group" aria-label="Status filter">
                  <Button
                    size="sm"
                    color={statusFilter === "all" ? "danger" : "secondary"}
                    style={{ fontSize: 12, borderRadius: "999px 0 0 999px" }}
                    onClick={() => setStatusFilter("all")}
                  >
                    Tất cả
                  </Button>
                  <Button
                    size="sm"
                    color={statusFilter === "pending" ? "danger" : "secondary"}
                    style={{ fontSize: 12 }}
                    onClick={() => setStatusFilter("pending")}
                  >
                    Chưa xử lý
                  </Button>
                  <Button
                    size="sm"
                    color={statusFilter === "received" ? "danger" : "secondary"}
                    style={{ fontSize: 12 }}
                    onClick={() => setStatusFilter("received")}
                  >
                    Đã nhận
                  </Button>
                  <Button
                    size="sm"
                    color={statusFilter === "cancelled" ? "danger" : "secondary"}
                    style={{ fontSize: 12, borderRadius: "0 999px 999px 0" }}
                    onClick={() => setStatusFilter("cancelled")}
                  >
                    Đã hủy
                  </Button>
                </div>
              </div>

              {/* Loading */}
              {loading && (
                <div className="text-center py-4">
                  <Spinner size="sm" />{" "}
                  <span style={{ fontSize: 13, color: "#6b7280" }}>
                    Đang tải danh sách yêu cầu...
                  </span>
                </div>
              )}

              {!loading && filteredRedemptions.length === 0 && (
                <div className="alert alert-light border text-center mb-0">
                  Không tìm thấy yêu cầu đổi quà nào phù hợp.
                </div>
              )}

              {!loading && filteredRedemptions.length > 0 && (
                <Row className="mt-2">
                  {filteredRedemptions.map((item) => {
                    const isPending = item.status === "Pending";
                    const isApproved = item.status === "Approved";
                    const isCancelled = item.status === "Cancelled";

                    const initials = String(item.memberName || "")
                      .split(" ")
                      .filter(Boolean)
                      .slice(-2)
                      .map((w) => w[0]?.toUpperCase())
                      .join("");

                    const imgSmall = item.imageUrl || PLACEHOLDER_IMG_SMALL;

                    return (
                      <Col
                        key={item.redemptionId}
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
                          {/* ✅ imageUrl từ API */}
                          <div
                            style={{
                              width: 130,
                              flexShrink: 0,
                              background: "#e5e7eb",
                            }}
                          >
                            <img
                              src={imgSmall}
                              alt={item.rewardName}
                              onError={(e) => {
                                e.currentTarget.src = PLACEHOLDER_IMG_SMALL;
                              }}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                display: "block",
                                opacity: isCancelled ? 0.7 : 1,
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
                                  <div style={{ fontSize: 12, color: "#6b7280" }}>
                                    {item.memberEmail}
                                  </div>
                                </div>
                              </div>

                              <Badge
                                color={getBadgeColor(item.status)}
                                pill
                                style={{ fontSize: 11 }}
                              >
                                {getStatusVi(item.status)}
                              </Badge>
                            </div>

                            {/* Gift info */}
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 700,
                                color: "#111827",
                                marginBottom: 2,
                              }}
                            >
                              🎁 {item.rewardName}
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
                                {item.pointsRedeemed.toLocaleString("vi-VN")} điểm
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
                                <strong>{formatDateTimeVN(item.redemptionDate)}</strong>
                              </span>
                            </div>
                            <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>
                              Nhận tại: <strong>Quầy lễ tân – Phòng gym</strong>
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

                              {/* Pending: cho Approve/Reject */}
                              {isPending && (
                                <div className="d-flex align-items-center gap-2">
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
                                    onClick={() => updateStatus(item, "Approved")}
                                    disabled={updating}
                                  >
                                    <FiCheckCircle size={14} />
                                    <span>{updating ? "Đang..." : "Duyệt"}</span>
                                  </Button>

                                  <Button
                                    size="sm"
                                    color="danger"
                                    outline
                                    style={{
                                      borderRadius: 999,
                                      fontSize: 13,
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                    onClick={() => updateStatus(item, "Cancelled")}
                                    disabled={updating}
                                  >
                                    <FiXCircle size={14} />
                                    <span>{updating ? "Đang..." : "Từ chối"}</span>
                                  </Button>
                                </div>
                              )}

                              {isApproved && (
                                <span style={{ fontSize: 11, color: "#16a34a", fontWeight: 700 }}>
                                  Đã xác nhận
                                </span>
                              )}

                              {isCancelled && (
                                <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>
                                  Đã hủy
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
          {selectedRedemption?.rewardName || "Chi tiết đổi quà"}
        </ModalHeader>

        <ModalBody style={{ paddingTop: 0 }}>
          {selectedRedemption && (
            <>
              {/* ✅ imageUrl từ API */}
              <div style={{ borderRadius: "0.75rem", overflow: "hidden", marginBottom: 12 }}>
                <img
                  src={selectedRedemption.imageUrl || PLACEHOLDER_IMG_LARGE}
                  alt={selectedRedemption.rewardName}
                  onError={(e) => {
                    e.currentTarget.src = PLACEHOLDER_IMG_LARGE;
                  }}
                  style={{
                    width: "100%",
                    height: 220,
                    objectFit: "cover",
                    display: "block",
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
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#111827" }}>
                  Thông tin hội viên
                </div>
                <div style={{ fontSize: 13, color: "#4b5563" }}>
                  Họ tên: <strong>{selectedRedemption.memberName}</strong>
                </div>
                <div style={{ fontSize: 13, color: "#4b5563" }}>
                  Email: <strong>{selectedRedemption.memberEmail}</strong>
                </div>
                <div style={{ fontSize: 13, color: "#4b5563" }}>
                  Nhận quà tại: <strong>Quầy lễ tân – Phòng gym</strong>
                </div>
              </div>

              {/* Redemption info */}
              <div style={{ fontSize: 13, color: "#4b5563" }} className="mb-3">
                <div>
                  Đã trừ{" "}
                  <strong>{selectedRedemption.pointsRedeemed.toLocaleString("vi-VN")} điểm</strong>
                </div>
                <div>
                  Thời gian đổi: <strong>{formatDateTimeVN(selectedRedemption.redemptionDate)}</strong>
                </div>
                <div className="mt-1">
                  Trạng thái:{" "}
                  <Badge
                    color={getBadgeColor(selectedRedemption.status)}
                    pill
                    style={{ fontSize: 11 }}
                  >
                    {getStatusVi(selectedRedemption.status)}
                  </Badge>
                </div>

                <div className="mt-2" style={{ fontSize: 12, color: "#6b7280" }}>
                  Ngày giao (nếu có):{" "}
                  <strong>
                    {selectedRedemption.deliveryDate
                      ? formatDateTimeVN(selectedRedemption.deliveryDate)
                      : "—"}
                  </strong>
                </div>

                <div style={{ fontSize: 12, color: "#6b7280" }}>
                  Người xử lý: <strong>{selectedRedemption.processorName || "—"}</strong>
                </div>
              </div>

              {selectedRedemption.notes && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.75rem",
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 12, marginBottom: 4, color: "#111827" }}>
                    Ghi chú:
                  </div>
                  <div>{selectedRedemption.notes}</div>
                </div>
              )}
            </>
          )}
        </ModalBody>

        <ModalFooter style={{ borderTop: "none" }}>
          <Button color="secondary" outline onClick={handleCloseDetail} disabled={updating}>
            Đóng
          </Button>

          {selectedRedemption?.status === "Pending" && (
            <>
              <Button
                color="danger"
                outline
                disabled={updating}
                onClick={() => updateStatus(selectedRedemption, "Cancelled")}
              >
                {updating ? "Đang cập nhật..." : "Từ chối"}
              </Button>
              <Button
                color="success"
                disabled={updating}
                onClick={() => updateStatus(selectedRedemption, "Approved")}
              >
                {updating ? "Đang cập nhật..." : "Duyệt (Đã nhận)"}
              </Button>
            </>
          )}
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default StaffRewardRedemptions;
