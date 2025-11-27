import { useEffect, useState } from "react";
import { Table, Button, Modal, message, Tag, Space } from "antd";
import dayjs from "dayjs";
import api from "../../config/axios";

const DISCOUNT_LABEL = {
  Percentage: "%",
  Fixed: "đ",
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
      const data = Array.isArray(res.data) ? res.data : (res.data?.items ?? res.data) || [];

      // chỉ lấy voucher đang Active (nếu API có isActive)
      const now = dayjs();
      const filtered = data.filter((v) => {
        const isActive = v.isActive !== false; // mặc định true nếu không có field
        const notExpired = v.validUntil ? dayjs(v.validUntil).isAfter(now) : true;
        return isActive && notExpired;
      });

      setList(filtered);
    } catch (err) {
      console.error(err);
      message.error("Không tải được danh sách voucher.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  // ===== Helper format =====
  const formatDiscountShort = (v) => {
    if (!v) return "";
    if (v.discountType === "Percentage") {
      const maxText = v.maxDiscountAmount
        ? ` (tối đa ${Number(v.maxDiscountAmount).toLocaleString()} đ)`
        : "";
      return `Giảm ${v.discountValue}%${maxText}`;
    }
    // Fixed
    return `Giảm ${Number(v.discountValue).toLocaleString()} đ`;
  };

  const formatMinOrder = (v) => {
    if (!v.minimumPurchaseAmount) return "Không yêu cầu đơn tối thiểu";
    return `Cho đơn từ ${Number(v.minimumPurchaseAmount).toLocaleString()} đ`;
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

  // ===== Mở chi tiết =====
  const openDetail = (record) => {
    setSelected(record);
    setIsDetailOpen(true);
  };

  const columns = [
    {
      title: "Mã voucher",
      dataIndex: "code",
      key: "code",
      width: 220,
      render: (code) => <strong>{code}</strong>,
    },
    {
      title: "Giảm bao nhiêu",
      key: "discount",
      render: (_, record) => {
        const shortText = formatDiscountShort(record);
        return (
          <Tag>
            {shortText}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" type="primary" onClick={() => openDetail(record)}>
            Xem chi tiết
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Voucher</h2>

      <div className="card shadow-sm">
        <div className="card-body">
          <Table
            rowKey={(r) => r.id ?? r.code}
            dataSource={list}
            columns={columns}
            loading={loading}
            pagination={{ pageSize: 10 }}
          />
        </div>
      </div>

      {/* Modal chi tiết voucher */}
      <Modal
        title={selected ? `Chi tiết voucher: ${selected.code}` : "Chi tiết voucher"}
        open={isDetailOpen}
        onCancel={() => setIsDetailOpen(false)}
        footer={[
          <Button key="close" onClick={() => setIsDetailOpen(false)}>
            Đóng
          </Button>,
        ]}
      >
        {selected && (
          <div className="voucher-detail">
            <p>
              <strong>Mã voucher:</strong> {selected.code}
            </p>

            <p>
              <strong>Mô tả:</strong> {selected.description || "Không có mô tả"}
            </p>

            <p>
              <strong>Giảm bao nhiêu:</strong> {formatDiscountShort(selected)}
            </p>

            <p>
              <strong>Đơn tối thiểu:</strong> {formatMinOrder(selected)}
            </p>

            <p>
              <strong>Ngày hết hạn:</strong> {formatExpiryInfo(selected)}
            </p>
          </div>
        )}
      </Modal>
    </div>
  );
}