import React, { useState } from "react";
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
} from "reactstrap";
import { HiGift } from "react-icons/hi2";
import { FiStar } from "react-icons/fi";
import { message } from "antd";

// ===== MOCK DATA QUÀ TẶNG CÓ THỂ ĐỔI =====
const MOCK_GIFTS = [
  {
    id: 1,
    name: "Voucher giảm 50% gói PT 1 tháng",
    image:
      "https://images.pexels.com/photos/6695769/pexels-photo-6695769.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsRequired: 1500,
    shortDescription: "Tiết kiệm một nửa chi phí cho gói PT 1-1 trong 1 tháng.",
    description:
      "Voucher áp dụng cho tất cả các huấn luyện viên trong hệ thống, có hiệu lực trong vòng 30 ngày kể từ khi đổi quà. Không áp dụng đồng thời với các chương trình khuyến mãi khác.",
    quantityLeft: 20,
    terms: [
      "Không quy đổi ra tiền mặt.",
      "Mỗi hội viên chỉ được sử dụng tối đa 1 voucher cho mỗi hóa đơn.",
      "Không áp dụng cùng lúc với các chương trình khuyến mãi khác.",
    ],
  },
  {
    id: 2,
    name: "Bình nước thể thao cao cấp",
    image:
      "https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsRequired: 800,
    shortDescription:
      "Bình nước 1L chống rò rỉ, giúp bạn luôn đủ nước trong buổi tập.",
    description:
      "Bình nước thể thao làm từ nhựa cao cấp, không BPA, dung tích 1 lít. Có vạch chia ml, nắp chống rò, phù hợp mang theo khi tập gym hoặc đi làm.",
    quantityLeft: 45,
    terms: [
      "Nhận quà trực tiếp tại quầy lễ tân.",
      "Không hỗ trợ giao hàng.",
    ],
  },
  {
    id: 3,
    name: "Khăn tập Gym cao cấp",
    image:
      "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsRequired: 500,
    shortDescription:
      "Khăn cotton mềm mại, thấm hút tốt cho mỗi buổi tập của bạn.",
    description:
      "Khăn tập gym kích thước 35x80cm, chất liệu cotton mềm, thấm hút tốt, nhanh khô. Thích hợp sử dụng trong phòng tập hoặc mang theo hàng ngày.",
    quantityLeft: 100,
    terms: [
      "Không đổi trả sau khi nhận quà.",
      "Mẫu mã có thể thay đổi tùy đợt nhập hàng.",
    ],
  },
  {
    id: 4,
    name: "Voucher 1 lần xông hơi miễn phí",
    image:
      "https://images.pexels.com/photos/3738046/pexels-photo-3738046.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsRequired: 600,
    shortDescription:
      "Thư giãn cơ bắp và giải tỏa căng thẳng sau buổi tập với 1 lần xông hơi.",
    description:
      "Voucher xông hơi miễn phí 1 lần tại phòng xông hơi của hệ thống. Hiệu lực 14 ngày kể từ ngày đổi quà.",
    quantityLeft: 30,
    terms: [
      "Cần đặt lịch trước ít nhất 24h.",
      "Không áp dụng vào các ngày lễ/tết.",
    ],
  },
];

// ===== MOCK DATA QUÀ ĐÃ ĐỔI =====
const MOCK_REDEEMED_GIFTS = [
  {
    id: 101,
    name: "Khăn tập Gym cao cấp",
    image:
      "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsUsed: 500,
    redeemedAt: "20/11/2025 18:30",
    status: "Đã nhận",
    pickupLocation: "Quầy lễ tân - Chi nhánh Quận 1",
    note: "Vui lòng mang theo thẻ hội viên khi tới nhận quà.",
  },
  {
    id: 102,
    name: "Voucher 1 lần xông hơi miễn phí",
    image:
      "https://images.pexels.com/photos/3738046/pexels-photo-3738046.jpeg?auto=compress&cs=tinysrgb&w=1200",
    pointsUsed: 600,
    redeemedAt: "05/12/2025 09:15",
    status: "Chưa sử dụng",
    pickupLocation: "Quầy lễ tân - Chi nhánh Quận 7",
    note: "Cần đặt lịch trước ít nhất 24h. Hạn sử dụng đến 20/12/2025.",
  },
];

const RewardGifts = () => {
  // Mock điểm hiện có của member
  const [currentPoints] = useState(1200);

  const [gifts] = useState(MOCK_GIFTS);
  const [redeemedGifts] = useState(MOCK_REDEEMED_GIFTS);

  // 'store' = Đổi quà, 'my' = Quà của tôi
  const [activeTab, setActiveTab] = useState("store");

  // filter theo điểm cho tab ĐỔI QUÀ: all | 0-500 | 500-1000 | 1000+
  const [pointFilter, setPointFilter] = useState("all");

  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedSource, setSelectedSource] = useState("store"); // 'store' | 'my'
  const [detailOpen, setDetailOpen] = useState(false);
  const [redeeming, setRedeeming] = useState(false);

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

  const handleRedeem = () => {
    if (!selectedGift) return;

    if (currentPoints < selectedGift.pointsRequired) {
      message.warning("Bạn chưa đủ điểm để đổi quà này.");
      return;
    }

    try {
      setRedeeming(true);
      setTimeout(() => {
        message.success(
          `Đổi quà thành công (mock): ${selectedGift.name}. Vui lòng liên hệ lễ tân để nhận quà!`
        );
        setRedeeming(false);
        setDetailOpen(false);
        setSelectedGift(null);
      }, 700);
    } catch (err) {
      console.error("Redeem error (mock):", err);
      message.error("Đổi quà thất bại (mock), vui lòng thử lại!");
      setRedeeming(false);
    }
  };

  // ====== ÁP DỤNG FILTER THEO ĐIỂM CHO TAB ĐỔI QUÀ ======
  const filteredStoreGifts = gifts.filter((gift) => {
    const p = gift.pointsRequired || 0;

    if (pointFilter === "0-500") {
      return p <= 500;
    }
    if (pointFilter === "500-1000") {
      return p > 500 && p <= 1000;
    }
    if (pointFilter === "1000+") {
      return p > 1000;
    }
    return true; // all
  });

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
                    <h3
                      className="mb-0"
                      style={{ fontWeight: 700, letterSpacing: 0.3 }}
                    >
                      Quà tặng đổi điểm thưởng
                    </h3>
                    <small style={{ opacity: 0.9 }}>
                      Tích điểm mỗi lần check-in và thanh toán, đổi lấy quà
                      tặng hấp dẫn dành riêng cho hội viên.
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
                  <div
                    style={{
                      fontSize: 22,
                      fontWeight: 700,
                      marginTop: 2,
                    }}
                  >
                    {currentPoints.toLocaleString("vi-VN")}{" "}
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      điểm
                    </span>
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
                <div
                  className="btn-group"
                  role="group"
                  aria-label="Reward tabs"
                >
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
                    <div
                      className="btn-group"
                      role="group"
                      aria-label="Point filter"
                    >
                      <Button
                        size="sm"
                        color={pointFilter === "all" ? "danger" : "secondary"}
                        style={{
                          fontSize: 12,
                          borderRadius: "999px 0 0 999px",
                        }}
                        onClick={() => setPointFilter("all")}
                      >
                        Tất cả
                      </Button>
                      <Button
                        size="sm"
                        color={
                          pointFilter === "0-500" ? "danger" : "secondary"
                        }
                        style={{ fontSize: 12 }}
                        onClick={() => setPointFilter("0-500")}
                      >
                        0 – 500
                      </Button>
                      <Button
                        size="sm"
                        color={
                          pointFilter === "500-1000" ? "danger" : "secondary"
                        }
                        style={{ fontSize: 12 }}
                        onClick={() => setPointFilter("500-1000")}
                      >
                        500 – 1000
                      </Button>
                      <Button
                        size="sm"
                        color={
                          pointFilter === "1000+" ? "danger" : "secondary"
                        }
                        style={{
                          fontSize: 12,
                          borderRadius: "0 999px 999px 0",
                        }}
                        onClick={() => setPointFilter("1000+")}
                      >
                        1000+
                      </Button>
                    </div>
                  </div>

                  {filteredStoreGifts.length === 0 && (
                    <div className="alert alert-light border text-center mb-0">
                      Không có quà nào trong khoảng điểm đã chọn.
                    </div>
                  )}

                  {filteredStoreGifts.length > 0 && (
                    <Row className="mt-2">
                      {filteredStoreGifts.map((gift) => {
                        const canRedeem =
                          currentPoints >= gift.pointsRequired;

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
                                  src={gift.image}
                                  top
                                  style={{
                                    height: 180,
                                    objectFit: "cover",
                                    filter: "brightness(0.95)",
                                  }}
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://via.placeholder.com/400x240?text=Gift";
                                  }}
                                />
                                <Badge
                                  color="warning"
                                  style={{
                                    position: "absolute",
                                    left: 12,
                                    top: 12,
                                    borderRadius: 999,
                                    padding: "6px 10px",
                                    fontSize: 11,
                                  }}
                                >
                                  {gift.quantityLeft > 0
                                    ? `Còn ${gift.quantityLeft} quà`
                                    : "Sắp hết quà"}
                                </Badge>
                              </div>

                              <CardBody
                                style={{
                                  display: "flex",
                                  flexDirection: "column",
                                }}
                              >
                                <CardTitle
                                  tag="h5"
                                  style={{
                                    fontSize: 17,
                                    fontWeight: 700,
                                    color: "#111827",
                                  }}
                                  className="mb-1"
                                >
                                  {gift.name}
                                </CardTitle>
                                <CardText
                                  style={{
                                    fontSize: 13,
                                    color: "#6b7280",
                                    minHeight: 40,
                                  }}
                                  className="mb-2"
                                >
                                  {gift.shortDescription}
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
                                    {gift.pointsRequired.toLocaleString(
                                      "vi-VN"
                                    )}{" "}
                                    điểm
                                  </div>
                                  {!canRedeem && (
                                    <span
                                      style={{
                                        fontSize: 11,
                                        marginLeft: 8,
                                        color: "#b91c1c",
                                      }}
                                    >
                                      Bạn chưa đủ điểm
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
                                    onClick={() =>
                                      handleOpenDetail(gift, "store")
                                    }
                                  >
                                    Chi tiết
                                  </Button>
                                  <Button
                                    size="sm"
                                    color={
                                      canRedeem ? "primary" : "secondary"
                                    }
                                    style={{
                                      borderRadius: 999,
                                      fontSize: 13,
                                      opacity: canRedeem ? 1 : 0.8,
                                    }}
                                    disabled={!canRedeem}
                                    onClick={() =>
                                      handleOpenDetail(gift, "store")
                                    }
                                  >
                                    {canRedeem ? "Đổi ngay" : "Chưa đủ điểm"}
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
                  {redeemedGifts.length === 0 && (
                    <div className="alert alert-light border text-center mb-0">
                      Bạn chưa đổi quà nào. Hãy tích điểm và đổi những phần
                      quà hấp dẫn nhé!
                    </div>
                  )}

                  {redeemedGifts.length > 0 && (
                    <Row className="mt-2">
                      {redeemedGifts.map((gift) => (
                        <Col
                          key={gift.id}
                          lg="6"
                          md="6"
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
                            <div style={{ width: 140, flexShrink: 0 }}>
                              <CardImg
                                alt={gift.name}
                                src={gift.image}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "cover",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src =
                                    "https://via.placeholder.com/240x240?text=Gift";
                                }}
                              />
                            </div>

                            <CardBody
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                backgroundColor: "#f9fafb",
                              }}
                            >
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <CardTitle
                                  tag="h5"
                                  className="mb-0"
                                  style={{
                                    fontSize: 16,
                                    fontWeight: 700,
                                    color: "#111827",
                                  }}
                                >
                                  {gift.name}
                                </CardTitle>
                                <Badge
                                  color={
                                    gift.status === "Đã nhận"
                                      ? "success"
                                      : "info"
                                  }
                                  pill
                                  style={{ fontSize: 11 }}
                                >
                                  {gift.status}
                                </Badge>
                              </div>

                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#4b5563",
                                  marginBottom: 4,
                                }}
                              >
                                Đã sử dụng{" "}
                                <strong>
                                  {gift.pointsUsed.toLocaleString("vi-VN")} điểm
                                </strong>
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6b7280",
                                  marginBottom: 4,
                                }}
                              >
                                Thời gian đổi:{" "}
                                <strong>{gift.redeemedAt}</strong>
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: "#6b7280",
                                  marginBottom: 8,
                                }}
                              >
                                Nhận tại:{" "}
                                <strong>{gift.pickupLocation}</strong>
                              </div>

                              <div className="mt-auto d-flex justify-content-end">
                                <Button
                                  size="sm"
                                  color="light"
                                  style={{
                                    borderRadius: 999,
                                    borderColor: "#e5e7eb",
                                    fontSize: 13,
                                  }}
                                  onClick={() =>
                                    handleOpenDetail(gift, "my")
                                  }
                                >
                                  Xem chi tiết
                                </Button>
                              </div>
                            </CardBody>
                          </Card>
                        </Col>
                      ))}
                    </Row>
                  )}
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ========== MODAL CHI TIẾT QUÀ TẶNG ========== */}
      <Modal isOpen={detailOpen} toggle={handleCloseDetail} centered size="md">
        <ModalHeader
          toggle={handleCloseDetail}
          style={{
            borderBottom: "none",
            paddingBottom: 0,
            fontWeight: 700,
          }}
        >
          {selectedGift?.name || "Chi tiết quà tặng"}
        </ModalHeader>
        <ModalBody style={{ paddingTop: 0 }}>
          {selectedGift && (
            <>
              <div
                style={{
                  borderRadius: "0.75rem",
                  overflow: "hidden",
                  marginBottom: 12,
                }}
              >
                <img
                  src={selectedGift.image}
                  alt={selectedGift.name}
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

              {/* Nếu mở từ tab ĐỔI QUÀ */}
              {selectedSource === "store" && (
                <>
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
                      {selectedGift.pointsRequired.toLocaleString("vi-VN")} điểm
                      cần để đổi
                    </div>
                    <Badge color="warning" pill>
                      {selectedGift.quantityLeft > 0
                        ? `Còn ${selectedGift.quantityLeft} quà`
                        : "Sắp hết quà"}
                    </Badge>
                  </div>
                </>
              )}

              {/* Nếu mở từ tab QUÀ CỦA TÔI */}
              {selectedSource === "my" && (
                <div
                  className="mb-2"
                  style={{ fontSize: 13, color: "#4b5563" }}
                >
                  <div>
                    Đã dùng{" "}
                    <strong>
                      {selectedGift.pointsUsed.toLocaleString("vi-VN")} điểm
                    </strong>
                  </div>
                  <div>
                    Thời gian đổi:{" "}
                    <strong>{selectedGift.redeemedAt}</strong>
                  </div>
                  <div>
                    Nhận tại:{" "}
                    <strong>{selectedGift.pickupLocation}</strong>
                  </div>
                </div>
              )}

              {/* Mô tả / ghi chú */}
              <p
                style={{
                  fontSize: 13,
                  color: "#4b5563",
                  marginBottom: 8,
                }}
              >
                {selectedGift.description || selectedGift.note}
              </p>

              {/* Điều kiện & lưu ý */}
              {selectedSource === "store" &&
                selectedGift.terms &&
                selectedGift.terms.length > 0 && (
                  <div
                    style={{
                      fontSize: 12,
                      color: "#6b7280",
                      backgroundColor: "#f9fafb",
                      borderRadius: "0.75rem",
                      padding: "10px 12px",
                      marginTop: 8,
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
                      Điều kiện & lưu ý:
                    </div>
                    <ul style={{ paddingLeft: "1.1rem", marginBottom: 0 }}>
                      {selectedGift.terms.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                )}

              {selectedSource === "my" && selectedGift.note && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#6b7280",
                    backgroundColor: "#f9fafb",
                    borderRadius: "0.75rem",
                    padding: "10px 12px",
                    marginTop: 8,
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
                  <div>{selectedGift.note}</div>
                </div>
              )}
            </>
          )}
        </ModalBody>
        <ModalFooter style={{ borderTop: "none" }}>
          <Button color="secondary" outline onClick={handleCloseDetail}>
            Đóng
          </Button>

          {/* Nút xác nhận đổi quà chỉ hiện ở TAB ĐỔI QUÀ */}
          {selectedGift && selectedSource === "store" && (
            <Button
              color={
                currentPoints >= selectedGift.pointsRequired
                  ? "primary"
                  : "secondary"
              }
              disabled={
                currentPoints < selectedGift.pointsRequired || redeeming
              }
              onClick={handleRedeem}
            >
              {redeeming
                ? "Đang xử lý..."
                : currentPoints >= selectedGift.pointsRequired
                ? "Xác nhận đổi quà (mock)"
                : "Chưa đủ điểm"}
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default RewardGifts;
