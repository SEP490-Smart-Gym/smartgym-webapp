// src/views/Admin/AdminPromotionGifts.jsx

import React, { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  Card,
  Table,
  Tag,
  Space,
  Button,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Typography,
  Popconfirm,
  message,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;
const { Option } = Select;

// ===== MOCK DATA QUÀ TẶNG KHUYẾN MÃI (PROMOTION GIFTS) =====
const MOCK_PROMOTIONS = [
  {
    id: 1,
    name: "Voucher giảm 50% gói PT 1 tháng",
    imageUrl:
      "https://images.pexels.com/photos/6695769/pexels-photo-6695769.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Voucher áp dụng cho tất cả các PT, hiệu lực 30 ngày kể từ ngày đổi. Không áp dụng đồng thời khuyến mãi khác.",
    pointsRequired: 1500,
    quantity: 20,
    status: "Active",
  },
  {
    id: 2,
    name: "Bình nước thể thao cao cấp",
    imageUrl:
      "https://images.pexels.com/photos/4056723/pexels-photo-4056723.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Bình nước 1L chống rò rỉ, nhựa an toàn không BPA, phù hợp mang theo khi tập luyện.",
    pointsRequired: 800,
    quantity: 45,
    status: "Active",
  },
  {
    id: 3,
    name: "Khăn tập gym cao cấp",
    imageUrl:
      "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=1200",
    description:
      "Khăn cotton mềm, thấm hút tốt, kích thước 35x80cm, nhanh khô.",
    pointsRequired: 500,
    quantity: 100,
    status: "Inactive",
  },
];

export default function AdminPromotionGifts() {
  const [promotions, setPromotions] = useState(MOCK_PROMOTIONS);
  const [editOpen, setEditOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null);
  const [form] = Form.useForm();

  // mở modal thêm / sửa
  const handleOpenEdit = (record = null) => {
    setCurrentRecord(record);
    if (record) {
      form.setFieldsValue({
        name: record.name,
        imageUrl: record.imageUrl,
        description: record.description,
        pointsRequired: record.pointsRequired,
        quantity: record.quantity,
        status: record.status,
      });
    } else {
      form.resetFields();
      form.setFieldsValue({ status: "Active" });
    }
    setEditOpen(true);
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    setCurrentRecord(null);
    form.resetFields();
  };

  // Xóa quà
  const handleDelete = (record) => {
    // Sau này đổi thành API DELETE
    setPromotions((prev) => prev.filter((p) => p.id !== record.id));
    message.success("Đã xóa quà tặng khuyến mãi.");
  };

  // Submit form thêm / sửa
  const handleSubmitForm = (values) => {
    if (currentRecord) {
      // CẬP NHẬT
      const updated = promotions.map((p) =>
        p.id === currentRecord.id ? { ...p, ...values } : p
      );
      setPromotions(updated);
      message.success("Cập nhật quà tặng thành công (mock).");
    } else {
      // THÊM MỚI
      const newItem = {
        id: promotions.length
          ? Math.max(...promotions.map((p) => p.id)) + 1
          : 1,
        ...values,
      };
      setPromotions((prev) => [...prev, newItem]);
      message.success("Thêm quà tặng mới thành công (mock).");
    }
    handleCloseEdit();
  };

  const columns = [
  {
    title: "Ảnh quà",
    dataIndex: "imageUrl",
    key: "imageUrl",
    width: 140,
    render: (url, record) => (
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img
          src={url}
          alt={record.name}
          style={{
            width: 80,
            height: 80,
            objectFit: "cover",
            borderRadius: 8,
          }}
          onError={(e) => {
            e.currentTarget.src =
              "https://via.placeholder.com/100x100?text=Gift";
          }}
        />
      </div>
    ),
  },
  {
    title: "Tên phần quà",
    dataIndex: "name",
    key: "name",
    width: 260,
    render: (text) => (
      <div style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
        <Text strong>{text}</Text>
      </div>
    ),
  },
  {
    title: "Mô tả",
    dataIndex: "description",
    key: "description",
    width: 350,
    render: (text) => (
      <div
        style={{
          whiteSpace: "normal",
          wordWrap: "break-word",
        }}
      >
        {text}
      </div>
    ),
  },
  {
    title: "Điểm cần để đổi",
    dataIndex: "pointsRequired",
    key: "pointsRequired",
    width: 150,
    align: "right",
    render: (val) => (
      <Text strong>{val.toLocaleString("vi-VN")} điểm</Text>
    ),
  },
  {
    title: "Số lượng",
    dataIndex: "quantity",
    key: "quantity",
    width: 120,
    align: "right",
    render: (q) => <Text>{q.toLocaleString("vi-VN")}</Text>,
  },
  {
    title: "Trạng thái",
    dataIndex: "status",
    key: "status",
    width: 120,
    align: "center",
    render: (status) => {
      let color = "default";
      if (status === "Active") color = "green";
      if (status === "Inactive") color = "red";
      if (status === "Expired") color = "orange";
      return <Tag color={color}>{status}</Tag>;
    },
  },
  {
    title: "Thao tác",
    key: "actions",
    width: 180,
    fixed: "right",
    align: "center",
    render: (_, record) => (
      <Space>
        <Button
          size="small"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => handleOpenEdit(record)}
        >
          Cập nhật
        </Button>
        <Popconfirm
          title="Xóa quà tặng"
          description={`Bạn chắc chắn muốn xóa "${record.name}"?`}
          okText="Xóa"
          cancelText="Hủy"
          okButtonProps={{ danger: true }}
          onConfirm={() => handleDelete(record)}
        >
          <Button size="small" danger icon={<DeleteOutlined />}>
            Xóa
          </Button>
        </Popconfirm>
      </Space>
    ),
  },
];


  return (
    <div className="container-fluid" style={{ padding: 24 }}>
      <div className="row">
        {/* Sidebar bên trái */}
        <div className="col-lg-3 col-md-4 mb-3">
          <AdminSidebar />
        </div>

        {/* Nội dung bên phải */}
        <div className="col-lg-9 col-md-8">
          <Card
            title={
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <GiftOutlined style={{ fontSize: 24, color: "#c80036" }} />
                <div>
                  <Title level={4} style={{ margin: 0 }}>
                    Quản lý quà tặng khuyến mãi
                  </Title>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    Admin cấu hình quà tặng để member có thể dùng điểm thưởng
                    đổi.
                  </Text>
                </div>
              </div>
            }
            extra={
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => handleOpenEdit(null)}
              >
                Thêm quà tặng
              </Button>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            <Table
              rowKey="id"
              columns={columns}
              dataSource={promotions}
              pagination={{ pageSize: 5 }}
              scroll={{ x: 1000, y: 450 }} // 👉 bảng có thể cuộn
            />
          </Card>
        </div>
      </div>

      {/* MODAL THÊM / CẬP NHẬT QUÀ TẶNG */}
      <Modal
        open={editOpen}
        centered
        title={currentRecord ? "Cập nhật quà tặng" : "Thêm quà tặng mới"}
        onCancel={handleCloseEdit}
        onOk={() => form.submit()}
        okText={currentRecord ? "Lưu thay đổi" : "Thêm mới"}
        cancelText="Hủy"
      >
        <Form layout="vertical" form={form} onFinish={handleSubmitForm}>
          <Form.Item
            name="name"
            label="Tên phần quà"
            rules={[{ required: true, message: "Vui lòng nhập tên phần quà" }]}
          >
            <Input placeholder="VD: Voucher giảm 50% gói PT 1 tháng" />
          </Form.Item>

          <Form.Item
            name="imageUrl"
            label="Địa chỉ ảnh (URL)"
            rules={[
              { required: true, message: "Vui lòng nhập URL ảnh" },
              { type: "url", message: "URL ảnh không hợp lệ" },
            ]}
          >
            <Input placeholder="https://..." />
          </Form.Item>

          <Form.Item
            name="description"
            label="Mô tả"
            rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
          >
            <Input.TextArea
              rows={3}
              placeholder="Mô tả ngắn gọn về quà tặng, điều kiện sử dụng..."
            />
          </Form.Item>

          <Form.Item
            name="pointsRequired"
            label="Số điểm cần để đổi"
            rules={[
              { required: true, message: "Vui lòng nhập số điểm cần để đổi" },
            ]}
          >
            <InputNumber
              min={0}
              style={{ width: "100%" }}
              formatter={(val) =>
                `${val}`.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
              }
              parser={(val) => val.replace(/\./g, "")}
            />
          </Form.Item>

          <Form.Item
            name="quantity"
            label="Số lượng phần quà"
            rules={[
              { required: true, message: "Vui lòng nhập số lượng phần quà" },
            ]}
          >
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item
            name="status"
            label="Trạng thái"
            rules={[{ required: true, message: "Vui lòng chọn trạng thái" }]}
          >
            <Select>
              <Option value="Active">Active</Option>
              <Option value="Inactive">Inactive</Option>
              <Option value="Expired">Expired</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
