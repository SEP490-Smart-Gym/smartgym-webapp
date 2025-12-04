import React, { useEffect, useState } from "react";
import { Button, Modal, message, Tag } from "antd";
import dayjs from "dayjs";
import api from "../../config/axios";

const styles = `
.card-shadow { box-shadow: 0 .125rem .25rem rgba(0,0,0,.075); }

/* ===== Voucher Modal Styling ===== */
.voucher-hero {
  background: linear-gradient(135deg, #e3f2fd, #fce4ec);
  border-radius: 12px;
  padding: 14px 18px;
  margin-bottom: 16px;
}

.voucher-hero-code {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 1px;
}

.voucher-hero-discount {
  margin-top: 4px;
  font-weight: 600;
  color: #0d6efd;
  font-size: 0.95rem;
}

.voucher-hero-expiry {
  margin-top: 4px;
  font-size: 0.85rem;
  color: #6c757d;
}

.voucher-description {
  background: #f8f9fa;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 0.9rem;
  margin-bottom: 12px;
}

.voucher-detail-grid {
  display: grid;
  grid-template-columns: 1.1fr 1.4fr;
  row-gap: 8px;
  column-gap: 16px;
  font-size: 0.9rem;
}

.voucher-detail-label {
  color: #6c757d;
}

.voucher-detail-value {
  font-weight: 500;
  text-align: right;
}

@media (max-width: 576px) {
  .voucher-detail-grid {
    grid-template-columns: 1fr;
    row-gap: 6px;
  }
  .voucher-detail-value {
    text-align: left;
  }
}
`;

// ===== Helper format =====
const formatDiscountShort = (v) => {
  if (!v) return "";
  if (v.discountType === "Percentage") {
    const maxText = v.maxDiscountAmount
      ? ` (tối đa ${Number(v.maxDiscountAmount).toLocaleString("vi-VN")} đ)`
      : "";
    return `Giảm ${v.discountValue}%${maxText}`;
  }
  // Fixed
  return `Giảm ${Number(v.discountValue).toLocaleString("vi-VN")} đ`;
};

const formatMinOrder = (v) => {
  if (!v.minimumPurchaseAmount)
    return "Không yêu cầu đơn tối thiểu";
  return `Cho đơn từ ${Number(v.minimumPurchaseAmount).toLocaleString(
    "vi-VN"
  )} đ`;
};

const formatExpiryInfo = (v) => {
  if (!v.validUntil) return "Không giới hạn thời gian";
  const now = dayjs().startOf("day");
  const end = dayjs(v.validUntil).startOf("day");
  const daysLeft = end.diff(now, "day");

  const dateStr = end.format("DD/MM/YYYY");

  if (daysLeft < 0) return `Đã hết hạn vào ${dateStr}`;
  if (daysLeft === 0) return `Hết hạn hôm nay (${dateStr})`;
  if (daysLeft === 1) return `Hết hạn ngày mai (${dateStr})`;
  return `Hết hạn: ${dateStr} (còn ${daysLeft} ngày)`;
};

export default function MemberVoucherList() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [selected, setSelected] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // ===== Lấy danh sách voucher =====
  const fetchList = async () => {
    setLoading(true);
    try {
      const res = await api.get("/DiscountCode/member/available");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data?.items ?? res.data ?? [];

      const now = dayjs();
      const filtered = data.filter((v) => {
        const isActive = v.isActive !== false; // mặc định true
        const notExpired = v.validUntil
          ? dayjs(v.validUntil).isAfter(now)
          : true;
        return isActive && notExpired;
      });

      setList(filtered);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách voucher.");
      setList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openDetail = (record) => {
    setSelected(record);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-yellow-100 flex items-center justify-center p-4">
      <div className="absolute inset-0"
          style={{
            backgroundImage:
              "url('https://enhome.vn/wp-content/uploads/2023/11/thiet-ke-phong-gym-10.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "rgba(2, 0, 68, 0.75)",
            backgroundBlendMode: "multiply",
            minHeight: "100%",
            zIndex: 1,
          }}>

        <style>{styles}</style>

        <div className="row mb-3 text-center">
          <div className="col-12">
            <h3 className="mb-0 fw-bold" 
              style={{ color: "#fde6e6ff", fontSize: "30px" }}>Voucher của bạn</h3>
          </div>
        </div>

        {loading && (
          <div className="row justify-content-center mb-3">
            <div className="col-12 col-xl-10">
              <div className="alert alert-info text-center mb-0">
                Đang tải danh sách voucher...
              </div>
            </div>
          </div>
        )}

        {!loading && list.length === 0 && (
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              <div
                className="alert alert-light border text-center"
                role="alert"
              >
                Hiện tại bạn chưa có voucher khả dụng.
              </div>
            </div>
          </div>
        )}

        {/* Danh sách voucher – style giống PaymentHistory: mỗi voucher 1 card */}
        {list.map((v) => {
          const shortText = formatDiscountShort(v);

          return (
            <div className="row justify-content-center mb-3" key={v.id ?? v.code}>
              <div className="col-12 col-xl-10">
                <div className="card shadow-0 border rounded-3 card-shadow">
                  <div className="card-body">
                    <div className="row g-3 align-items-center">
                      {/* Cột trái: Mã voucher */}
                      <div className="col-12 col-md-4">
                        <div className="text-muted small mb-1">Mã voucher</div>
                        <div className="h6 mb-0">
                          <strong>{v.code}</strong>
                        </div>
                      </div>

                      {/* Cột giữa: Giảm bao nhiêu (căn giữa) */}
                      <div className="col-12 col-md-4 d-flex justify-content-center">
                        <Tag color="blue" style={{ fontSize: "0.9rem" }}>
                          {shortText}
                        </Tag>
                      </div>

                      {/* Cột phải: Nút xem chi tiết */}
                      <div className="col-12 col-md-4 d-flex justify-content-md-end justify-content-center">
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => openDetail(v)}
                        >
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Modal chi tiết voucher – đã design lại đẹp hơn */}
        <Modal
          title={null}
          open={isDetailOpen}
          onCancel={() => setIsDetailOpen(false)}
          footer={[
            <Button key="close" onClick={() => setIsDetailOpen(false)}>
              Đóng
            </Button>,
          ]}
          centered
        >
          {selected && (
            <div className="voucher-modal">
              {/* Hero block */}
              <div className="voucher-hero">
                <div className="voucher-hero-code">{selected.code}</div>
                <div className="voucher-hero-discount">
                  {formatDiscountShort(selected)}
                </div>
                <div className="voucher-hero-expiry">
                  {formatExpiryInfo(selected)}
                </div>
              </div>

              {/* Mô tả */}
              <div className="voucher-description">
                <strong>Mô tả:</strong>{" "}
                {selected.description || "Không có mô tả"}
              </div>

              {/* Grid thông tin chi tiết */}
              <div className="voucher-detail-grid">
                {/* <div className="voucher-detail-label">Giảm bao nhiêu</div>
                <div className="voucher-detail-value">
                  {formatDiscountShort(selected)}
                </div> */}

                <div className="voucher-detail-label">Đơn tối thiểu</div>
                <div className="voucher-detail-value">
                  {formatMinOrder(selected)}
                </div>

                {/* <div className="voucher-detail-label">Ngày hết hạn</div>
                <div className="voucher-detail-value">
                  {formatExpiryInfo(selected)}
                </div> */}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
}
