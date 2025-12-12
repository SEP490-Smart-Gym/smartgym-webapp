// src/views/Admin/AdminPromotionGifts.jsx
import React, { useEffect, useMemo, useState } from "react";
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
  Spin,
  Switch,
  Upload,
  Image,
  Tooltip,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GiftOutlined,
  UploadOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";

const { Title, Text } = Typography;
const { Option } = Select;

/** ===== Helpers: normalize data từ API về format UI ===== */
function pick(obj, keys, fallback = undefined) {
  for (const k of keys) {
    if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
  }
  return fallback;
}

function normalizeReward(raw) {
  // API có thể trả về PascalCase hoặc camelCase
  const id = pick(raw, ["id", "rewardId", "Id", "RewardId"]);
  const name = pick(raw, ["rewardName", "RewardName", "name", "Name"], "");
  const description = pick(
    raw,
    ["description", "Description", "desc", "Desc"],
    ""
  );
  const pointsRequired = Number(
    pick(raw, ["pointsRequired", "PointsRequired", "pointRequired"], 0)
  );
  const category = pick(raw, ["category", "Category"], "");
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

  return {
    id,
    rewardName: name,
    description,
    pointsRequired,
    category,
    stockQuantity,
    isActive,
    imageUrl,
    _raw: raw,
  };
}

export default function AdminPromotionGifts() {
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(null); // normalized
  const [saving, setSaving] = useState(false);

  const [form] = Form.useForm();

  // giữ file ảnh (không auto upload)
  const [pickedFile, setPickedFile] = useState(null);

  const fetchRewards = async () => {
    setLoading(true);
    try {
      // axios instance đã có baseURL /api => gọi "/Reward"
      const res = await api.get("/Reward");
      const data = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.items)
        ? res.data.items
        : [];

      const normalized = data.map(normalizeReward).filter((x) => x.id != null);
      setRewards(normalized);
    } catch (err) {
      console.error("GET /Reward error:", err?.response?.data || err);
      message.error("Không tải được danh sách quà tặng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, []);

  const resetModalState = () => {
    setCurrentRecord(null);
    setPickedFile(null);
    form.resetFields();
  };

  // mở modal thêm / sửa
  const handleOpenEdit = async (record = null) => {
    setEditOpen(true);
    setSaving(false);
    setPickedFile(null);

    if (!record) {
      resetModalState();
      form.setFieldsValue({
        RewardName: "",
        Description: "",
        PointsRequired: 0,
        Category: "",
        StockQuantity: 0,
        IsActive: true,
      });
      return;
    }

    // Edit: gọi GET by id để lấy data mới nhất
    try {
      setSaving(true);
      const id = record.id;
      const res = await api.get(`/Reward/${id}`);
      const normalized = normalizeReward(res.data);

      setCurrentRecord(normalized);

      form.setFieldsValue({
        RewardName: normalized.rewardName,
        Description: normalized.description,
        PointsRequired: normalized.pointsRequired,
        Category: normalized.category,
        StockQuantity: normalized.stockQuantity,
        IsActive: normalized.isActive,
      });
    } catch (err) {
      console.error("GET /Reward/{id} error:", err?.response?.data || err);
      message.error("Không tải được chi tiết quà tặng.");
      setEditOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseEdit = () => {
    setEditOpen(false);
    resetModalState();
  };

  // DELETE (nếu backend có)
  const handleDelete = async (record) => {
    const id = record?.id;
    if (!id) return;

    try {
      setLoading(true);
      await api.delete(`/Reward/${id}`);
      message.success("Đã xóa quà tặng.");
      await fetchRewards();
    } catch (err) {
      console.error("DELETE /Reward/{id} error:", err?.response?.data || err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        "Xóa thất bại. Backend có thể chưa hỗ trợ DELETE /Reward/{id}.";
      message.error(apiMsg);
    } finally {
      setLoading(false);
    }
  };

  // Submit form thêm / sửa
  const handleSubmitForm = async (values) => {
    // values theo field PascalCase đúng backend
    // RewardName, Description, PointsRequired, Category, StockQuantity, IsActive
    try {
      setSaving(true);

      const fd = new FormData();
      fd.append("RewardName", values.RewardName ?? "");
      fd.append("Description", values.Description ?? "");
      fd.append("PointsRequired", String(values.PointsRequired ?? 0));
      fd.append("Category", values.Category ?? "");
      fd.append("StockQuantity", String(values.StockQuantity ?? 0));
      fd.append("IsActive", values.IsActive ? "true" : "false");

      if (!currentRecord) {
        // CREATE yêu cầu ImageFile
        if (!pickedFile) {
          message.warning("Vui lòng chọn ảnh quà tặng (ImageFile).");
          return;
        }
        fd.append("ImageFile", pickedFile);
        await api.post("/Reward", fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        message.success("Thêm quà tặng mới thành công.");
        handleCloseEdit();
        await fetchRewards();
        return;
      }

      // UPDATE (nếu backend có). Nếu muốn cho phép đổi ảnh khi cập nhật:
      if (pickedFile) fd.append("ImageFile", pickedFile);

      // Nếu backend không có PUT, server sẽ trả lỗi → mình show message
      await api.put(`/Reward/${currentRecord.id}`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success("Cập nhật quà tặng thành công.");
      handleCloseEdit();
      await fetchRewards();
    } catch (err) {
      console.error("SUBMIT Reward error:", err?.response?.data || err);
      const apiMsg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        "Thao tác thất bại. Kiểm tra lại API (PUT/POST) và field name.";
      message.error(apiMsg);
    } finally {
      setSaving(false);
    }
  };

  const columns = useMemo(
    () => [
      {
        title: "Ảnh quà",
        dataIndex: "imageUrl",
        key: "imageUrl",
        width: 140,
        align: "center",
        render: (url, record) => (
          <div style={{ display: "flex", justifyContent: "center" }}>
            {url ? (
              <Image
                src={url}
                alt={record.rewardName}
                width={80}
                height={80}
                style={{ objectFit: "cover", borderRadius: 8 }}
                fallback="https://via.placeholder.com/100x100?text=Gift"
              />
            ) : (
              <img
                src="https://via.placeholder.com/100x100?text=Gift"
                alt="Gift"
                style={{
                  width: 80,
                  height: 80,
                  objectFit: "cover",
                  borderRadius: 8,
                }}
              />
            )}
          </div>
        ),
      },
      {
        title: "Tên phần quà",
        dataIndex: "rewardName",
        key: "rewardName",
        width: 260,
        render: (text) => (
          <div style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
            <Text strong>{text || "—"}</Text>
          </div>
        ),
      },
      {
        title: "Mô tả",
        dataIndex: "description",
        key: "description",
        width: 360,
        render: (text) => (
          <div style={{ whiteSpace: "normal", wordWrap: "break-word" }}>
            {text || "—"}
          </div>
        ),
      },
      {
        title: "Danh mục",
        dataIndex: "category",
        key: "category",
        width: 160,
        render: (v) => v || "—",
      },
      {
        title: "Điểm cần để đổi",
        dataIndex: "pointsRequired",
        key: "pointsRequired",
        width: 160,
        align: "right",
        render: (val) => (
          <Text strong>{Number(val || 0).toLocaleString("vi-VN")} điểm</Text>
        ),
      },
      {
        title: "Tồn kho",
        dataIndex: "stockQuantity",
        key: "stockQuantity",
        width: 120,
        align: "right",
        render: (q) => <Text>{Number(q || 0).toLocaleString("vi-VN")}</Text>,
      },
      {
        title: "Trạng thái",
        dataIndex: "isActive",
        key: "isActive",
        width: 140,
        align: "center",
        render: (isActive) => (
          <Tag color={isActive ? "green" : "red"}>
            {isActive ? "Active" : "Inactive"}
          </Tag>
        ),
      },
      {
        title: "Thao tác",
        key: "actions",
        width: 200,
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
              description={`Bạn chắc chắn muốn xóa "${record.rewardName}"?`}
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
    ],
    [rewards]
  );

  return (
    <div className="container-fluid" style={{ padding: 24 }}>
      <div className="row">
        {/* Sidebar */}
        <div className="col-lg-3 col-md-4 mb-3">
          <AdminSidebar />
        </div>

        {/* Content */}
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
              <Space>
                <Tooltip title="Tải lại danh sách">
                  <Button
                    icon={<ReloadOutlined />}
                    onClick={fetchRewards}
                    disabled={loading}
                  />
                </Tooltip>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleOpenEdit(null)}
                >
                  Thêm quà tặng
                </Button>
              </Space>
            }
            bordered={false}
            style={{
              borderRadius: 12,
              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
            }}
          >
            {loading ? (
              <div className="text-center py-5">
                <Spin />
              </div>
            ) : (
              <Table
                rowKey="id"
                columns={columns}
                dataSource={rewards}
                pagination={{ pageSize: 6 }}
                scroll={{ x: 1200, y: 450 }}
              />
            )}
          </Card>
        </div>
      </div>

      {/* MODAL THÊM / CẬP NHẬT */}
      <Modal
        open={editOpen}
        centered
        title={currentRecord ? "Cập nhật quà tặng" : "Thêm quà tặng mới"}
        onCancel={handleCloseEdit}
        onOk={() => form.submit()}
        okText={currentRecord ? "Lưu thay đổi" : "Thêm mới"}
        cancelText="Hủy"
        confirmLoading={saving}
        destroyOnClose
      >
        {saving && currentRecord ? (
          <div className="text-center py-4">
            <Spin />
          </div>
        ) : (
          <Form layout="vertical" form={form} onFinish={handleSubmitForm}>
            <Form.Item
              name="RewardName"
              label="Tên phần quà"
              rules={[{ required: true, message: "Vui lòng nhập tên phần quà" }]}
            >
              <Input placeholder="VD: Voucher giảm 50% gói PT 1 tháng" />
            </Form.Item>

            <Form.Item
              name="Category"
              label="Danh mục"
              rules={[{ required: true, message: "Vui lòng nhập danh mục" }]}
            >
              <Input placeholder="VD: Voucher / Sản phẩm / Dịch vụ..." />
            </Form.Item>

            <Form.Item
              name="Description"
              label="Mô tả"
              rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
            >
              <Input.TextArea
                rows={3}
                placeholder="Mô tả ngắn gọn về quà tặng, điều kiện sử dụng..."
              />
            </Form.Item>

            <Form.Item
              name="PointsRequired"
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
                parser={(val) => (val ? val.replace(/\./g, "") : "0")}
              />
            </Form.Item>

            <Form.Item
              name="StockQuantity"
              label="Số lượng tồn kho"
              rules={[
                { required: true, message: "Vui lòng nhập số lượng tồn kho" },
              ]}
            >
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item
              name="IsActive"
              label="Trạng thái hoạt động"
              valuePropName="checked"
              initialValue={true}
            >
              <Switch
                checkedChildren="Active"
                unCheckedChildren="Inactive"
                defaultChecked
              />
            </Form.Item>

            <Form.Item
              label="Ảnh quà tặng (ImageFile)"
              required={!currentRecord} // tạo mới bắt buộc ảnh
              help={
                currentRecord
                  ? "Nếu muốn đổi ảnh, chọn file mới. Nếu không, bỏ trống."
                  : "Bắt buộc chọn ảnh khi thêm mới."
              }
            >
              <Upload
                maxCount={1}
                beforeUpload={(file) => {
                  setPickedFile(file);
                  return false; // chặn auto upload
                }}
                onRemove={() => {
                  setPickedFile(null);
                }}
                accept="image/*"
              >
                <Button icon={<UploadOutlined />}>Chọn file ảnh</Button>
              </Upload>

              {currentRecord?.imageUrl && !pickedFile && (
                <div style={{ marginTop: 10 }}>
                  <Text type="secondary">Ảnh hiện tại:</Text>
                  <div style={{ marginTop: 8 }}>
                    <Image
                      src={currentRecord.imageUrl}
                      width={140}
                      height={140}
                      style={{ objectFit: "cover", borderRadius: 10 }}
                      fallback="https://via.placeholder.com/140x140?text=Gift"
                    />
                  </div>
                </div>
              )}
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
