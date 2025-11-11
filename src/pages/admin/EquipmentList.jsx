import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Table, Button, Space, Tag, Input, Select, Modal, Form } from "antd";

const STATUS_OPTIONS = ["Đang hoạt động", "Đang bảo trì", "Hư hỏng", "Tồn kho"];

export default function EquipmentList() {
  const [equipments, setEquipments] = useState([
    {
      id: 1,
      name: "Treadmill Pro 500",
      code: "TM-500",
      brand: "NordicTrack",
      status: "Đang hoạt động",
      photo: "/img/feature-1.jpg",
    },
    {
      id: 2,
      name: "Bench Press HD",
      code: "BP-HD",
      brand: "Rogue",
      status: "Đang bảo trì",
      photo: "/img/feature-2.jpg",
    },
  ]);

  // ======== THÊM MỚI ========
  const [form, setForm] = useState({
    name: "",
    code: "",
    brand: "",
    status: STATUS_OPTIONS[3],
    photo: "",
  });

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validateForm = () => {
    if (!form.name.trim()) return alert("Vui lòng nhập Tên máy!");
    if (!form.code.trim()) return alert("Vui lòng nhập Mã máy!");
    if (!form.brand.trim()) return alert("Vui lòng nhập Thương hiệu!");
    return true;
  };

  const handleAdd = () => {
    if (!validateForm()) return;
    const newItem = {
      id: Date.now(),
      name: form.name.trim(),
      code: form.code.trim(),
      brand: form.brand.trim(),
      status: form.status,
      photo: form.photo || "/img/useravt.jpg",
    };
    setEquipments((prev) => [newItem, ...prev]);
    setForm({
      name: "",
      code: "",
      brand: "",
      status: STATUS_OPTIONS[3],
      photo: "",
    });
  };

  // ======== XÓA ========
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xoá thiết bị này?")) {
      setEquipments((prev) => prev.filter((it) => it.id !== id));
    }
  };

  // ======== SỬA BẰNG MODAL ========
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const openEditModal = (record) => {
    setEditingItem({ ...record });
    setIsEditOpen(true);
  };

  const closeEditModal = () => {
    setIsEditOpen(false);
    setEditingItem(null);
  };

  const saveEditModal = () => {
    if (!editingItem) return;
    if (!editingItem.name?.trim()) return alert("Tên máy không được trống!");
    if (!editingItem.code?.trim()) return alert("Mã máy không được trống!");
    if (!editingItem.brand?.trim()) return alert("Thương hiệu không được trống!");

    setEquipments((prev) =>
      prev.map((it) =>
        it.id === editingItem.id
          ? {
              ...it,
              name: editingItem.name.trim(),
              code: editingItem.code.trim(),
              brand: editingItem.brand.trim(),
              status: editingItem.status,
              photo: editingItem.photo || "/img/useravt.jpg",
            }
          : it
      )
    );
    closeEditModal();
  };

  const statusColor = {
    "Đang hoạt động": "green",
    "Đang bảo trì": "gold",
    "Hư hỏng": "red",
    "Tồn kho": "gray",
  };

  // ======== TABLE COLUMNS ========
  const columns = [
    {
      title: "Ảnh",
      dataIndex: "photo",
      key: "photo",
      width: 90,
      fixed: "left",
      render: (src, record) => (
        <img
          src={src || "/img/useravt.jpg"}
          alt={record.name}
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
      dataIndex: "name",
      key: "name",
      width: 220,
      render: (_, record) => record.name,
    },
    {
      title: "Mã máy",
      dataIndex: "code",
      key: "code",
      width: 150,
    },
    {
      title: "Thương hiệu",
      dataIndex: "brand",
      key: "brand",
      width: 160,
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      key: "status",
      width: 150,
      render: (_, record) => (
        <Tag color={statusColor[record.status] || "default"}>{record.status}</Tag>
      ),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 180,
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

        {/* Nội dung chính */}
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý Thiết bị</h2>

          {/* Form thêm thiết bị */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm thiết bị</h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Tên máy</label>
                  <input
                    name="name"
                    className="form-control"
                    placeholder="VD: Treadmill X9"
                    value={form.name}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Mã máy</label>
                  <input
                    name="code"
                    className="form-control"
                    placeholder="VD: TM-X9"
                    value={form.code}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Thương hiệu</label>
                  <input
                    name="brand"
                    className="form-control"
                    placeholder="VD: Technogym"
                    value={form.brand}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Trạng thái</label>
                  <select
                    name="status"
                    className="form-select"
                    value={form.status}
                    onChange={handleFormChange}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-8">
                  <label className="form-label">Hình ảnh (URL)</label>
                  <input
                    name="photo"
                    className="form-control"
                    placeholder="VD: https://..."
                    value={form.photo}
                    onChange={handleFormChange}
                  />
                  <div className="small text-muted mt-1">
                    Nếu để trống sẽ dùng ảnh mặc định.
                  </div>
                </div>

                <div className="col-md-4 d-flex align-items-end">
                  <div className="d-flex align-items-center gap-3">
                    <div className="photo-preview">
                      <img
                        src={form.photo || "/img/useravt.jpg"}
                        alt="preview"
                        style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }}
                        onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                      />
                    </div>
                    <button className="btn btn-add" onClick={handleAdd}>
                      Thêm thiết bị
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách thiết bị (AntD Table) */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách thiết bị</h5>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={equipments}
                pagination={{ pageSize: 8 }}
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modal Sửa thiết bị */}
      <Modal
        open={isEditOpen}
        title="Cập nhật thiết bị"
        onCancel={closeEditModal}
        onOk={saveEditModal}
        okText="Lưu thay đổi"
        cancelText="Hủy"
        destroyOnClose
      >
        {editingItem && (
          <Form layout="vertical">
            <Form.Item label="Tên máy">
              <Input
                value={editingItem.name}
                onChange={(e) =>
                  setEditingItem((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="VD: Treadmill X9"
              />
            </Form.Item>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item label="Mã máy">
                <Input
                  value={editingItem.code}
                  onChange={(e) =>
                    setEditingItem((p) => ({ ...p, code: e.target.value }))
                  }
                  placeholder="VD: TM-X9"
                />
              </Form.Item>
              <Form.Item label="Thương hiệu">
                <Input
                  value={editingItem.brand}
                  onChange={(e) =>
                    setEditingItem((p) => ({ ...p, brand: e.target.value }))
                  }
                  placeholder="VD: Technogym"
                />
              </Form.Item>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <Form.Item label="Trạng thái">
                <Select
                  value={editingItem.status}
                  onChange={(v) =>
                    setEditingItem((p) => ({ ...p, status: v }))
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <Select.Option key={s} value={s}>
                      {s}
                    </Select.Option>
                  ))}
                </Select>
              </Form.Item>
              <Form.Item label="Ảnh (URL)">
                <Input
                  value={editingItem.photo || ""}
                  onChange={(e) =>
                    setEditingItem((p) => ({ ...p, photo: e.target.value }))
                  }
                  placeholder="https://..."
                />
              </Form.Item>
            </div>

            <div className="d-flex align-items-center gap-3">
              <img
                src={editingItem.photo || "/img/useravt.jpg"}
                alt="preview"
                style={{ width: 64, height: 64, borderRadius: 8, objectFit: "cover", border: "1px solid #eee" }}
                onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
              />
              <span className="text-muted small">Xem trước ảnh</span>
            </div>
          </Form>
        )}
      </Modal>
    </div>
  );
}
