import React, { useEffect, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  CardImg,
  CardTitle,
  CardText,
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
import { FiStar } from "react-icons/fi";
import { message } from "antd";
import api from "../../config/axios";

// ===== helpers =====
function pick(obj, keys, fallback = undefined) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

// backend trả datetime không có Z/offset => ép coi là UTC để hiển thị đúng giờ VN
function toISODateSafe(s) {
  if (!s) return null;
  let str = String(s).trim();

  // cắt nano -> milli (Date parse ổn nhất với <= 3 chữ số ms)
  str = str.replace(/(\.\d{3})\d+(?=(Z|[+-]\d{2}:\d{2})?$)/, "$1");

  const hasTZ = /Z$|[+-]\d{2}:\d{2}$/.test(str);
  return hasTZ ? str : `${str}Z`;
}

function formatDateTimeVN(dateStr) {
  const iso = toISODateSafe(dateStr);
  if (!iso) return "—";
  const d = new Date(iso);

  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");

  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
}

// ✅ Map status backend -> label VN + màu hợp lý
function mapRedemptionStatusVN(rawStatus) {
  const s = String(rawStatus || "").trim().toLowerCase();

  // theo yêu cầu:
  if (s === "pending") return { label: "Chờ nhận", color: "warning" }; // vàng
  if (s === "approved") return { label: "Đã nhận", color: "success" }; // xanh
  if (s === "rejected") return { label: "Từ chối nhận", color: "danger" }; // đỏ

  // fallback thêm cho an toàn
  if (s === "cancelled" || s === "canceled") return { label: "Đã hủy", color: "secondary" };
  if (s === "completed") return { label: "Đã nhận", color: "success" };

  return { label: "Không xác định", color: "secondary" };
}

function normalizeReward(raw) {
  const id = pick(raw, ["id", "rewardId", "Id", "RewardId"]);
  const name = pick(raw, ["rewardName", "RewardName", "name", "Name"], "");
  const description = pick(raw, ["description", "Description"], "");
  const pointsRequired = Number(pick(raw, ["pointsRequired", "PointsRequired"], 0));
  const stockQuantity = Number(
    pick(raw, ["stockQuantity", "StockQuantity", "quantity", "Quantity"], 0)
  );
  const isActive = Boolean(pick(raw, ["isActive", "IsActive"], true));
  const imageUrl = pick(
    raw,
    [
      "imageUrl",
      "ImageUrl",
      "image",
      "Image",
      "imagePath",
      "ImagePath",
      "fileUrl",
      "FileUrl",
    ],
    ""
  );

  return { id, name, description, pointsRequired, stockQuantity, isActive, imageUrl };
}

function normalizeMyRedemption(raw) {
  return {
    redemptionId: raw?.redemptionId ?? raw?.id,
    rewardId: raw?.rewardId,
    rewardName: raw?.rewardName || "—",
    pointsRedeemed: Number(raw?.pointsRedeemed ?? 0),
    redemptionDate: raw?.redemptionDate,
    status: raw?.status || "—",
    deliveryDate: raw?.deliveryDate,
    notes: raw?.notes,
    processorName: raw?.processorName,
  };
}

function formatPoints(n) {
  return Number(n || 0).toLocaleString("vi-VN");
}

const RewardGifts = () => {
  // ===== API states =====
  const [currentPoints, setCurrentPoints] = useState(0);
  const [pointsLoading, setPointsLoading] = useState(false);

  const [gifts, setGifts] = useState([]);
  const [giftsLoading, setGiftsLoading] = useState(false);

  // My redemptions
  const [myGifts, setMyGifts] = useState([]);
  const [myLoading, setMyLoading] = useState(false);

  // 'store' = Đổi quà, 'my' = Quà của tôi
  const [activeTab, setActiveTab] = useState("store");

  // filter theo điểm cho tab ĐỔI QUÀ: all | 0-500 | 500-1000 | 1000+
  const [pointFilter, setPointFilter] = useState("all");

  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedSource, setSelectedSource] = useState("store"); // 'store' | 'my'
  const [detailOpen, setDetailOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

  const fetchBalance = async () => {
    setPointsLoading(true);
    try {
      const res = await api.get("/Loyalty/balance");
      const available = Number(pick(res.data, ["availablePoints", "AvailablePoints"], 0));
      setCurrentPoints(available);
    } catch (err) {
      console.error("GET /Loyalty/balance error:", err?.response?.data || err);
      message.error("Không tải được số dư điểm.");
    } finally {
      setPointsLoading(false);
    }
  };

  const fetchRewards = async () => {
    setGiftsLoading(true);
    try {
      const res = await api.get("/Reward");
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];
      const normalized = arr
        .map(normalizeReward)
        .filter((x) => x.id != null)
        .filter((x) => x.isActive !== false);
      setGifts(normalized);
    } catch (err) {
      console.error("GET /Reward error:", err?.response?.data || err);
      message.error("Không tải được danh sách quà tặng.");
    } finally {
      setGiftsLoading(false);
    }
  };

  const fetchMyRedemptions = async () => {
    setMyLoading(true);
    try {
      const res = await api.get("/RewardRedemption/me");
      const arr = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];
      const mapped = arr.map(normalizeMyRedemption).filter((x) => x.redemptionId != null);

      // sort mới -> cũ theo redemptionDate
      mapped.sort((a, b) => {
        const ta = new Date(toISODateSafe(a.redemptionDate) || 0).getTime();
        const tb = new Date(toISODateSafe(b.redemptionDate) || 0).getTime();
        return tb - ta;
      });

      setMyGifts(mapped);
    } catch (err) {
      console.error("GET /RewardRedemption/me error:", err?.response?.data || err);
      message.error("Không tải được danh sách “Quà của tôi”.");
      setMyGifts([]);
    } finally {
      setMyLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    fetchRewards();
    // load luôn để chuyển tab không phải chờ
    fetchMyRedemptions();
  }, []);

  const handleOpenDetail = (gift, source = "store") => {
    setSelectedGift(gift);
    setSelectedSource(source);
    setDetailOpen(true);
  };

  const handleCloseDetail = () => {
    if (redeeming) return;
    setDetailOpen(false);
    setSelectedGift(null);
    setSelectedSource("store");
  };

  const handleRedeem = async () => {
    if (!selectedGift?.id) return;

    if (currentPoints < selectedGift.pointsRequired) {
      message.warning("Bạn chưa đủ điểm để đổi quà này.");
      return;
    }

    if (selectedGift.stockQuantity <= 0) {
      message.warning("Quà này đã hết. Vui lòng chọn quà khác.");
      return;
    }

    try {
      setRedeeming(true);

      await api.post("/RewardRedemption", { rewardId: selectedGift.id });

      message.success("Đổi quà thành công! Vui lòng liên hệ lễ tân để nhận quà.");

      await Promise.all([fetchBalance(), fetchRewards(), fetchMyRedemptions()]);
      // ✅ bắn event update điểm (silent)
      window.dispatchEvent(new Event("points:updated"));
      handleCloseDetail();
    } catch (err) {
      console.error("POST /RewardRedemption error:", err?.response?.data || err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        "Đổi quà thất bại. Vui lòng thử lại!";
      message.error(apiMsg);
    } finally {
      setRedeeming(false);
    }
  };

  // ===== Filter gifts (tab store) =====
  const filteredStoreGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const p = gift.pointsRequired || 0;
      if (pointFilter === "0-500") return p <= 500;
      if (pointFilter === "500-1000") return p > 500 && p <= 1000;
      if (pointFilter === "1000+") return p > 1000;
      return true;
    });
  }, [gifts, pointFilter]);

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
                    <h3 className="mb-0" style={{ fontWeight: 700, letterSpacing: 0.3 }}>
                      Quà tặng đổi điểm thưởng
                    </h3>
                    <small style={{ opacity: 0.9 }}>
                      Tích điểm mỗi lần check-in và thanh toán, đổi lấy quà tặng hấp dẫn
                      dành riêng cho hội viên.
                    </small>
                  </div>
                </div>

                {/* Điểm hiện có */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.12)",
                    borderRadius: "0.75rem",
                    padding: "10px 14px",
                    minWidth: 220,
                  }}
                >
                  <div
                    className="d-flex justify-content-between align-items-center"
                    style={{ fontSize: 13 }}
                  >
                    <span style={{ opacity: 0.85 }}>Điểm hiện có</span>
                    <FiStar style={{ opacity: 0.9 }} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginTop: 2 }}>
                    {pointsLoading ? (
                      <span style={{ fontSize: 14, opacity: 0.9 }}>Đang tải...</span>
                    ) : (
                      <>
                        {formatPoints(currentPoints)}{" "}
                        <span style={{ fontSize: 13, fontWeight: 500 }}>điểm</span>
                      </>
                    )}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.85, marginTop: 2 }}>
                    Đổi quà trước khi điểm hết hạn.
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardBody style={{ backgroundColor: "#f3f4f6" }}>
              {/* TAB SWITCHER */}
              <div className="d-flex justify-content-center mb-3">
                <div className="btn-group" role="group" aria-label="Reward tabs">
                  <Button
                    size="sm"
                    color={activeTab === "store" ? "danger" : "secondary"}
                    style={{
                      fontWeight: activeTab === "store" ? 700 : 500,
                      borderRadius: "999px 0 0 999px",
                    }}
                    onClick={() => setActiveTab("store")}
                  >
                    Đổi quà
                  </Button>
                  <Button
                    size="sm"
                    color={activeTab === "my" ? "danger" : "secondary"}
                    style={{
                      fontWeight: activeTab === "my" ? 700 : 500,
                      borderRadius: "0 999px 999px 0",
                    }}
                    onClick={() => setActiveTab("my")}
                  >
                    Quà của tôi
                  </Button>
                </div>
              </div>

              {/* ========== TAB: ĐỔI QUÀ ========== */}
              {activeTab === "store" && (
                <>
                  {/* Filter theo điểm */}
                  <div className="d-flex justify-content-center mb-3">
                    <div className="btn-group" role="group" aria-label="Point filter">
                      <Button
                        size="sm"
                        color={pointFilter === "all" ? "danger" : "secondary"}
                        style={{ fontSize: 12, borderRadius: "999px 0 0 999px" }}
                        onClick={() => setPointFilter("all")}
                      >
                        Tất cả
                      </Button>
                      <Button
                        size="sm"
                        color={pointFilter === "0-500" ? "danger" : "secondary"}
                        style={{ fontSize: 12 }}
                        onClick={() => setPointFilter("0-500")}
                      >
                        0 – 500
                      </Button>
                      <Button
                        size="sm"
                        color={pointFilter === "500-1000" ? "danger" : "secondary"}
                        style={{ fontSize: 12 }}
                        onClick={() => setPointFilter("500-1000")}
                      >
                        500 – 1000
                      </Button>
                      <Button
                        size="sm"
                        color={pointFilter === "1000+" ? "danger" : "secondary"}
                        style={{ fontSize: 12, borderRadius: "0 999px 999px 0" }}
                        onClick={() => setPointFilter("1000+")}
                      >
                        1000+
                      </Button>
                    </div>
                  </div>

                  {giftsLoading && (
                    <div className="text-center py-4">
                      <Spinner size="sm" />{" "}
                      <span style={{ fontSize: 13, color: "#6b7280" }}>
                        Đang tải danh sách quà...
                      </span>
                    </div>
                  )}

                  {!giftsLoading && filteredStoreGifts.length === 0 && (
                    <div className="alert alert-light border text-center mb-0">
                      Không có quà nào trong khoảng điểm đã chọn.
                    </div>
                  )}

                  {!giftsLoading && filteredStoreGifts.length > 0 && (
                    <Row className="mt-2">
                      {filteredStoreGifts.map((gift) => {
                        const canRedeem = currentPoints >= gift.pointsRequired;
                        const outOfStock = (gift.stockQuantity ?? 0) <= 0;

                        return (
                          <Col
                            key={gift.id}
                            lg="4"
                            md="6"
                            className="mb-4 d-flex align-items-stretch"
                          >
                            <Card
                              className="shadow-sm border-0 w-100"
                              style={{
                                borderRadius: "0.75rem",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <div style={{ position: "relative" }}>
                                <CardImg
                                  alt={gift.name}
                                  src={gift.imageUrl || "/img/noimg.jpg"}
                                  top
                                  style={{
                                    height: 180,
                                    objectFit: "cover",
                                    filter: outOfStock ? "grayscale(0.6)" : "brightness(0.95)",
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://via.placeholder.com/400x240?text=Gift";
                                  }}
                                />
                                <Badge
                                  color={outOfStock ? "secondary" : "warning"}
                                  style={{
                                    position: "absolute",
                                    left: 12,
                                    top: 12,
                                    borderRadius: 999,
                                    padding: "6px 10px",
                                    fontSize: 11,
                                  }}
                                >
                                  {outOfStock ? "Hết quà" : `Còn ${gift.stockQuantity} quà`}
                                </Badge>
                              </div>

                              <CardBody style={{ display: "flex", flexDirection: "column" }}>
                                <CardTitle
                                  tag="h5"
                                  style={{ fontSize: 17, fontWeight: 700, color: "#111827" }}
                                  className="mb-1"
                                >
                                  {gift.name}
                                </CardTitle>

                                <CardText
                                  style={{ fontSize: 13, color: "#6b7280", minHeight: 40 }}
                                  className="mb-2"
                                >
                                  {gift.description ? gift.description : "—"}
                                </CardText>

                                <div className="d-flex align-items-center mb-3">
                                  <div
                                    style={{
                                      backgroundColor: "#eff6ff",
                                      borderRadius: 999,
                                      padding: "6px 12px",
                                      fontSize: 12,
                                      fontWeight: 600,
                                      color: "#1d4ed8",
                                    }}
                                  >
                                    {formatPoints(gift.pointsRequired)} điểm
                                  </div>

                                  {!canRedeem && (
                                    <span style={{ fontSize: 11, marginLeft: 8, color: "#b91c1c" }}>
                                      Bạn chưa đủ điểm
                                    </span>
                                  )}
                                  {outOfStock && (
                                    <span style={{ fontSize: 11, marginLeft: 8, color: "#6b7280" }}>
                                      Hết hàng
                                    </span>
                                  )}
                                </div>

                                <div className="d-flex justify-content-between mt-auto">
                                  <Button
                                    size="sm"
                                    color="light"
                                    style={{
                                      borderRadius: 999,
                                      borderColor: "#e5e7eb",
                                      fontSize: 13,
                                    }}
                                    onClick={() => handleOpenDetail(gift, "store")}
                                  >
                                    Chi tiết
                                  </Button>

                                  <Button
                                    size="sm"
                                    color={canRedeem && !outOfStock ? "primary" : "secondary"}
                                    style={{
                                      borderRadius: 999,
                                      fontSize: 13,
                                      opacity: canRedeem && !outOfStock ? 1 : 0.85,
                                    }}
                                    disabled={!canRedeem || outOfStock}
                                    onClick={() => handleOpenDetail(gift, "store")}
                                  >
                                    {outOfStock ? "Hết quà" : canRedeem ? "Đổi ngay" : "Chưa đủ điểm"}
                                  </Button>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </>
              )}

              {/* ========== TAB: QUÀ CỦA TÔI ========== */}
              {activeTab === "my" && (
                <>
                  {myLoading && (
                    <div className="text-center py-4">
                      <Spinner size="sm" />{" "}
                      <span style={{ fontSize: 13, color: "#6b7280" }}>
                        Đang tải quà của tôi...
                      </span>
                    </div>
                  )}

                  {!myLoading && myGifts.length === 0 && (
                    <div className="alert alert-light border text-center mb-0">
                      Bạn chưa đổi quà nào.
                    </div>
                  )}

                  {!myLoading && myGifts.length > 0 && (
                    <Row className="mt-2">
                      {myGifts.map((r) => {
                        const st = mapRedemptionStatusVN(r.status);

                        return (
                          <Col
                            key={r.redemptionId}
                            lg="4"
                            md="6"
                            className="mb-4 d-flex align-items-stretch"
                          >
                            <Card
                              className="shadow-sm border-0 w-100"
                              style={{
                                borderRadius: "0.75rem",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                              }}
                            >
                              <CardBody style={{ display: "flex", flexDirection: "column" }}>
                                <div className="d-flex justify-content-between align-items-start mb-2">
                                  <CardTitle
                                    tag="h5"
                                    style={{ fontSize: 16, fontWeight: 800, color: "#111827" }}
                                    className="mb-0"
                                  >
                                    {r.rewardName}
                                  </CardTitle>

                                  <Badge color={st.color} pill>
                                    {st.label}
                                  </Badge>
                                </div>

                                <CardText
                                  style={{ fontSize: 13, color: "#6b7280" }}
                                  className="mb-2"
                                >
                                  Đổi lúc: <b>{formatDateTimeVN(r.redemptionDate)}</b>
                                </CardText>

                                <div className="d-flex align-items-center mb-3">
                                  <div
                                    style={{
                                      backgroundColor: "#fff7ed",
                                      borderRadius: 999,
                                      padding: "6px 12px",
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: "#c2410c",
                                    }}
                                  >
                                    -{formatPoints(r.pointsRedeemed)} điểm
                                  </div>
                                </div>

                                <div className="d-flex justify-content-between mt-auto">
                                  <Button
                                    size="sm"
                                    color="light"
                                    style={{
                                      borderRadius: 999,
                                      borderColor: "#e5e7eb",
                                      fontSize: 13,
                                    }}
                                    onClick={() => handleOpenDetail(r, "my")}
                                  >
                                    Chi tiết
                                  </Button>
                                </div>
                              </CardBody>
                            </Card>
                          </Col>
                        );
                      })}
                    </Row>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ========== MODAL CHI TIẾT ========== */}
      <Modal isOpen={detailOpen} toggle={handleCloseDetail} centered size="md">
        <ModalHeader
          toggle={handleCloseDetail}
          style={{
            borderBottom: "none",
            paddingBottom: 0,
            fontWeight: 700,
          }}
        >
          {selectedSource === "my"
            ? selectedGift?.rewardName || "Chi tiết quà đã đổi"
            : selectedGift?.name || "Chi tiết quà tặng"}
        </ModalHeader>

        <ModalBody style={{ paddingTop: 0 }}>
          {selectedGift && selectedSource === "store" && (
            <>
              <div style={{ borderRadius: "0.75rem", overflow: "hidden", marginBottom: 12 }}>
                <img
                  src={selectedGift.imageUrl || "https://via.placeholder.com/600x340?text=Gift"}
                  alt={selectedGift.name}
                  style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }}
                  onError={(e) => {
                    e.currentTarget.src = "https://via.placeholder.com/600x340?text=Gift";
                  }}
                />
              </div>

              <div className="d-flex justify-content-between align-items-center mb-2">
                <div
                  style={{
                    backgroundColor: "#eff6ff",
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#1d4ed8",
                  }}
                >
                  {formatPoints(selectedGift.pointsRequired)} điểm cần để đổi
                </div>

                <Badge color={(selectedGift.stockQuantity ?? 0) > 0 ? "warning" : "secondary"} pill>
                  {(selectedGift.stockQuantity ?? 0) > 0
                    ? `Còn ${selectedGift.stockQuantity} quà`
                    : "Hết quà"}
                </Badge>
              </div>

              <p style={{ fontSize: 13, color: "#4b5563", marginBottom: 8 }}>
                {selectedGift.description || "—"}
              </p>
            </>
          )}

          {selectedGift && selectedSource === "my" && (
            <>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div
                  style={{
                    backgroundColor: "#fff7ed",
                    borderRadius: 999,
                    padding: "6px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#c2410c",
                  }}
                >
                  -{formatPoints(selectedGift.pointsRedeemed)} điểm
                </div>

                {(() => {
                  const st = mapRedemptionStatusVN(selectedGift.status);
                  return (
                    <Badge color={st.color} pill>
                      {st.label}
                    </Badge>
                  );
                })()}
              </div>

              <div style={{ fontSize: 13, color: "#4b5563" }}>
                <div className="mb-1">
                  Thời gian đổi: <b>{formatDateTimeVN(selectedGift.redemptionDate)}</b>
                </div>
                <div className="mb-1">
                  Ngày giao (nếu có):{" "}
                  <b>{selectedGift.deliveryDate ? formatDateTimeVN(selectedGift.deliveryDate) : "—"}</b>
                </div>
                <div className="mb-1">
                  Người xử lý: <b>{selectedGift.processorName || "—"}</b>
                </div>
                <div className="mb-1">
                  Ghi chú: <b>{selectedGift.notes || "—"}</b>
                </div>
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter style={{ borderTop: "none" }}>
          <Button color="secondary" outline onClick={handleCloseDetail} disabled={redeeming}>
            Đóng
          </Button>

          {/* chỉ cho redeem ở store */}
          {selectedGift && selectedSource === "store" && (
            <Button
              color={
                currentPoints >= selectedGift.pointsRequired && (selectedGift.stockQuantity ?? 0) > 0
                  ? "primary"
                  : "secondary"
              }
              disabled={
                redeeming ||
                currentPoints < selectedGift.pointsRequired ||
                (selectedGift.stockQuantity ?? 0) <= 0
              }
              onClick={handleRedeem}
            >
              {redeeming
                ? "Đang xử lý..."
                : (selectedGift.stockQuantity ?? 0) <= 0
                ? "Hết quà"
                : currentPoints >= selectedGift.pointsRequired
                ? "Xác nhận đổi quà"
                : "Chưa đủ điểm"}
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default RewardGifts;
