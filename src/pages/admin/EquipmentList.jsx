import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import {
  Table,
  Button,
  Space,
  Tag,
  Input,
  Select,
  Modal,
  Form,
  DatePicker,
  InputNumber,
  message,
  Spin,
} from "antd";
import api from "../../config/axios"; 
import dayjs from "dayjs";

const STATUS_OPTIONS = ["Đang hoạt động", "Đang bảo trì", "Hư hỏng", "Tồn kho"];

const statusColor = {
  "Đang hoạt động": "green",
  "Đang bảo trì": "gold",
  "Hư hỏng": "red",
  "Tồn kho": "gray",
};

export default function EquipmentList() {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);

  // form add (on-page)
  const [addForm] = Form.useForm();

  // edit modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editForm] = Form.useForm();

  // fetch list
  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Equipment");
      // robust: res.data có thể là array hoặc object chứa data/items
      const list =
        Array.isArray(res.data) ? res.data : res.data?.data || res.data?.items || [];
      setEquipments(list);
    } catch (err) {
      console.error(err);
      message.error("Lấy dữ liệu thiết bị thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  // ====== Thêm mới (giữ form trên trang, không modal) ======
  const handleAdd = async () => {
    try {
      const values = await addForm.validateFields();
      const body = {
        equipmentName: values.equipmentName,
        categoryId: values.categoryId ?? 0,
        model: values.model || "",
        serialNumber: values.serialNumber || "",
        purchaseDate: values.purchaseDate
          ? values.purchaseDate.toISOString()
          : new Date().toISOString(),
        purchaseCost: values.purchaseCost ?? 0,
        warranty: values.warranty || "",
        status: values.status || STATUS_OPTIONS[0],
        location: values.location || "",
        imageUrl: values.imageUrl || "",
        description: values.description || "",
      };

      await api.post("/Equipment", body);
      message.success("Thêm thiết bị thành công");
      addForm.resetFields();
      fetchEquipments();
    } catch (err) {
      console.error(err);
      if (err?.errorFields) {
        // validation error from antd
        return;
      }
      message.error("Thêm thiết bị thất bại");
    }
  };

  // ====== Xóa ======
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xoá thiết bị này?")) return;
    try {
      await api.delete(`/Equipment/${id}`);
      message.success("Xoá thành công");
      setEquipments((prev) => prev.filter((p) => (p.id || p.equipmentId) !== id));
    } catch (err) {
      console.error(err);
      message.error("Xoá thất bại");
    }
  };

  // ====== Mở modal sửa ======
  const openEditModal = (record) => {
    setEditingItem(record);
    editForm.setFieldsValue({
      equipmentName: record.equipmentName || record.name || "",
      categoryId: record.categoryId ?? null,
      model: record.model || "",
      serialNumber: record.serialNumber || record.code || "",
      purchaseDate: record.purchaseDate ? dayjs(record.purchaseDate) : null,
      purchaseCost: record.purchaseCost ?? 0,
      warranty: record.warranty || "",
      status: record.status || STATUS_OPTIONS[0],
      location: record.location || "",
      imageUrl: record.imageUrl || record.photo || "",
      description: record.description || "",
    });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingItem(null);
    editForm.resetFields();
  };

  const saveEditModal = async () => {
    try {
      const values = await editForm.validateFields();
      if (!editingItem) return;

      const body = {
        equipmentName: values.equipmentName,
        categoryId: values.categoryId ?? 0,
        model: values.model || "",
        serialNumber: values.serialNumber || "",
        purchaseDate: values.purchaseDate
          ? values.purchaseDate.toISOString()
          : new Date().toISOString(),
        purchaseCost: values.purchaseCost ?? 0,
        warranty: values.warranty || "",
        status: values.status || STATUS_OPTIONS[0],
        location: values.location || "",
        imageUrl: values.imageUrl || "",
        description: values.description || "",
      };

      // PUT to /Equipment/{id}
      await api.put(`/Equipment/${editingItem.id}`, body);
      message.success("Cập nhật thiết bị thành công");
      closeEditModal();
      fetchEquipments();
    } catch (err) {
      console.error(err);
      if (err?.errorFields) return;
      message.error("Cập nhật thất bại");
    }
  };

  // ====== TABLE COLUMNS ======
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "imageUrl",
      key: "imageUrl",
      width: 100,
      fixed: "left",
      render: (src, record) => (
        <img
          src={src || record.photo || "/img/useravt.jpg"}
          alt={record.equipmentName || record.name}
          style={{
            width: 56,
            height: 56,
            borderRadius: 8,
            objectFit: "cover",
            border: "1px solid #ddd",
          }}
          onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
        />
      ),
    },
    {
      title: "Tên máy",
      dataIndex: "equipmentName",
      key: "equipmentName",
      width: 260,
      render: (v, r) => v || r.name || "—",
    },
    {
      title: "Mã/Serial",
      dataIndex: "serialNumber",
      key: "serialNumber",
      width: 160,
      render: (v, r) => v || r.serialNumber || r.code || "—",
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      width: 160,
    },
    {
      title: "Thương hiệu",
      dataIndex: "brand",
      key: "brand",
      width: 160,
      render: (_, r) => r.brand || r.manufacturer || "—",
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (v) => <Tag color={statusColor[v] || "default"}>{v}</Tag>,
    },
    {
      title: "Mua ngày",
      dataIndex: "purchaseDate",
      key: "purchaseDate",
      width: 140,
      render: (v) => (v ? dayjs(v).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Giá mua",
      dataIndex: "purchaseCost",
      key: "purchaseCost",
      width: 120,
      render: (v) => (v ? `${Number(v).toLocaleString()} đ` : "—"),
    },
    {
      title: "Vị trí",
      dataIndex: "location",
      key: "location",
      width: 150,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 200,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => openEditModal(record)}>
            Sửa
          </Button>
          <Button danger size="small" onClick={() => handleDelete(record.id)}>
            Xóa
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        {/* Sidebar */}
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        {/* Main */}
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý Thiết bị</h2>

          {/* Add form (on-page) */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm thiết bị</h5>

              <Form form={addForm} layout="vertical" initialValues={{ status: STATUS_OPTIONS[3] }}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <Form.Item
                      name="equipmentName"
                      rules={[{ required: true, message: "Nhập tên máy" }]}
                    >
                      <Input placeholder="Tên máy (VD: Treadmill X9)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-3">
                    <Form.Item
                      name="serialNumber"
                      rules={[{ required: true, message: "Nhập serial/mã máy" }]}
                    >
                      <Input placeholder="Mã/Serial (VD: TM-X9)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-3">
                    <Form.Item name="model">
                      <Input placeholder="Model (VD: Pro-500)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-2">
                    <Form.Item name="status">
                      <Select>
                        {STATUS_OPTIONS.map((s) => (
                          <Select.Option key={s} value={s}>
                            {s}
                          </Select.Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="brand">
                      <Input placeholder="Thương hiệu (VD: NordicTrack)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="purchaseDate">
                      <DatePicker style={{ width: "100%" }} placeholder="Ngày mua máy" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4">
                    <Form.Item name="purchaseCost">
                      <InputNumber style={{ width: "100%" }} min={0} placeholder="Giá mua (VNĐ)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-8">
                    <Form.Item name="location">
                      <Input placeholder="Vị trí (VD: Phòng cardio)" />
                    </Form.Item>
                  </div>

                  <div className="col-md-4 d-flex align-items-end">
                    <div style={{ width: "100%", display: "flex", gap: 8 }}>
                      <Form.Item name="imageUrl" style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="Ảnh (URL)" />
                      </Form.Item>
                      <Button type="primary" onClick={handleAdd}>
                        Thêm thiết bị
                      </Button>
                    </div>
                  </div>

                  <div className="col-12">
                    <Form.Item name="description">
                      <Input.TextArea rows={2} placeholder="Mô tả (tuỳ chọn)" />
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </div>
          </div>

          {/* Table */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách thiết bị</h5>
              {loading ? (
                <div className="text-center py-5"><Spin /></div>
              ) : (
                <Table
                  rowKey={(r) => r.id || r.equipmentId}
                  columns={columns}
                  dataSource={equipments}
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: "max-content" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        open={isEditOpen}
        title="Cập nhật thiết bị"
        onCancel={closeEditModal}
        onOk={saveEditModal}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnClose
      >
        <Form layout="vertical" form={editForm}>
          <Form.Item name="equipmentName" label="Tên máy" rules={[{ required: true }]}>
            <Input />
          </Form.Item>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="serialNumber" label="Mã/Serial" rules={[{ required: true }]}>
              <Input />
            </Form.Item>

            <Form.Item name="model" label="Model">
              <Input />
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="brand" label="Thương hiệu">
              <Input />
            </Form.Item>

            <Form.Item name="status" label="Trạng thái">
              <Select>
                {STATUS_OPTIONS.map((s) => (
                  <Select.Option key={s} value={s}>
                    {s}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Form.Item name="purchaseDate" label="Ngày mua">
              <DatePicker style={{ width: "100%" }} />
            </Form.Item>

            <Form.Item name="purchaseCost" label="Giá mua">
              <InputNumber style={{ width: "100%" }} min={0} />
            </Form.Item>
          </div>

          <Form.Item name="location" label="Vị trí">
            <Input />
          </Form.Item>

          <Form.Item name="warranty" label="Bảo hành">
            <Input />
          </Form.Item>

          <Form.Item name="imageUrl" label="Ảnh (URL)">
            <Input />
          </Form.Item>

          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} />
          </Form.Item>

          <div className="d-flex align-items-center gap-3">
            <img
              src={editingItem?.imageUrl || editingItem?.photo || "/img/useravt.jpg"}
              alt="preview"
              style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid #eee" }}
              onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
            />
            <span className="text-muted small">Xem trước ảnh</span>
          </div>
        </Form>
      </Modal>
    </div>
  );
}
