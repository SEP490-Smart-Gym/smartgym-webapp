import { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Table, Tag, Space, Button, message, Spin } from "antd";
import api from "../../config/axios";

export default function AdminPackages() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  const [newPackage, setNewPackage] = useState({
    packageName: "",
    packageTypeId: 1,
    description: "",
    price: "",
    durationInDays: "",
    sessionCount: "",
    includesPersonalTrainer: false,
  });

  const [editingPkg, setEditingPkg] = useState(null);

  // ================== Lấy danh sách ==================
  const fetchPackages = async () => {
    try {
      setLoading(true);
      const res = await api.get("/Package");
      setPackages(res.data || []);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách gói tập!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // ================== Xử lý input ==================
  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPackage((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // ================== Thêm gói mới ==================
  const handleAdd = async () => {
    if (!newPackage.packageName.trim()) return message.error("Vui lòng nhập tên gói!");
    if (!newPackage.price || +newPackage.price <= 0)
      return message.error("Giá phải lớn hơn 0!");
    if (!newPackage.durationInDays)
      return message.error("Vui lòng nhập thời hạn (ngày)!");

    const body = {
      packageName: newPackage.packageName.trim(),
      packageTypeId: Number(newPackage.packageTypeId),
      description: newPackage.description.trim(),
      price: Number(newPackage.price),
      durationInDays: Number(newPackage.durationInDays),
      sessionCount: Number(newPackage.sessionCount) || 0,
      includesPersonalTrainer: newPackage.includesPersonalTrainer,
    };

    try {
      await api.post("/Package", body);
      message.success("Thêm gói tập thành công!");
      fetchPackages();
      setNewPackage({
        packageName: "",
        packageTypeId: 1,
        description: "",
        price: "",
        durationInDays: "",
        sessionCount: "",
        includesPersonalTrainer: false,
      });
    } catch (err) {
      console.error(err);
      message.error("Thêm gói thất bại!");
    }
  };

  // ================== Xóa gói ==================
  const handleDelete = async (id) => {
    if (!window.confirm("Bạn có chắc muốn xóa gói này?")) return;
    try {
      await api.delete(`/Package/${id}`);
      message.success("Đã xoá gói!");
      fetchPackages();
    } catch (err) {
      console.error(err);
      message.error("Xoá thất bại!");
    }
  };

  // ================== Cập nhật gói ==================
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingPkg.packageName.trim())
      return message.error("Tên gói không được trống!");
    if (!editingPkg.price || +editingPkg.price <= 0)
      return message.error("Giá phải lớn hơn 0!");

    const body = {
      packageName: editingPkg.packageName.trim(),
      packageTypeId: Number(editingPkg.packageTypeId),
      description: editingPkg.description.trim(),
      price: Number(editingPkg.price),
      durationInDays: Number(editingPkg.durationInDays),
      sessionCount: Number(editingPkg.sessionCount) || 0,
      includesPersonalTrainer: editingPkg.includesPersonalTrainer,
    };

    try {
      await api.put(`/Package/${editingPkg.id}`, body);
      message.success("Cập nhật thành công!");
      setEditingPkg(null);
      fetchPackages();
    } catch (err) {
      console.error(err);
      message.error("Cập nhật thất bại!");
    }
  };

  // ================== Cấu hình bảng ==================
  const columns = [
    {
      title: "Tên gói",
      dataIndex: "packageName",
      key: "packageName",
      fixed: "left",
      width: 220,
      ellipsis: true,
    },
    {
      title: "Giá (VNĐ)",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (v) => `${Number(v).toLocaleString("vi-VN")} đ`,
    },
    {
      title: "Thời hạn (ngày)",
      dataIndex: "durationInDays",
      key: "durationInDays",
      width: 150,
    },
    {
      title: "Số buổi",
      dataIndex: "sessionCount",
      key: "sessionCount",
      width: 120,
      render: (v) => (v ? v : "—"),
    },
    {
      title: "PT",
      dataIndex: "includesPersonalTrainer",
      key: "includesPersonalTrainer",
      width: 100,
      render: (v) => (v ? <Tag color="green">Có</Tag> : <Tag color="default">Không</Tag>),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 300,
      ellipsis: true,
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 150,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => setEditingPkg(record)}>
            Sửa
          </Button>
          <Button size="small" danger onClick={() => handleDelete(record.id)}>
            Xoá
          </Button>
        </Space>
      ),
    },
  ];

  // ================== Giao diện ==================
  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý gói tập</h2>

          {/* Form thêm gói mới */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm gói tập mới</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Tên gói</label>
                  <input
                    name="packageName"
                    className="form-control"
                    placeholder="VD: Gói 3 tháng (có PT)"
                    value={newPackage.packageName}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Giá (VNĐ)</label>
                  <input
                    name="price"
                    type="number"
                    className="form-control"
                    placeholder="Nhập giá"
                    value={newPackage.price}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Thời hạn (ngày)</label>
                  <input
                    name="durationInDays"
                    type="number"
                    className="form-control"
                    placeholder="VD: 30"
                    value={newPackage.durationInDays}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Số buổi</label>
                  <input
                    name="sessionCount"
                    type="number"
                    className="form-control"
                    placeholder="VD: 10"
                    value={newPackage.sessionCount}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-2 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="includesPersonalTrainer"
                      checked={newPackage.includesPersonalTrainer}
                      onChange={handleInput}
                      id="ptCheck"
                    />
                    <label className="form-check-label" htmlFor="ptCheck">
                      Có PT
                    </label>
                  </div>
                </div>

                <div className="col-md-9">
                  <label className="form-label">Mô tả</label>
                  <input
                    name="description"
                    className="form-control"
                    placeholder="VD: Gói siêu ưu đãi cho người mới"
                    value={newPackage.description}
                    onChange={handleInput}
                  />
                </div>
              </div>

              <div className="mt-3 text-end">
                <button className="btn btn-add" onClick={handleAdd}>
                  Thêm gói
                </button>
              </div>
            </div>
          </div>

          {/* Bảng danh sách */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách gói tập</h5>
              {loading ? (
                <div className="text-center py-5">
                  <Spin />
                </div>
              ) : (
                <Table
                  rowKey="id"
                  columns={columns}
                  dataSource={packages}
                  pagination={{ pageSize: 8 }}
                  scroll={{ x: "max-content" }}
                />
              )}
            </div>
          </div>

          {/* Modal chỉnh sửa */}
          {editingPkg && (
            <div
              className="modal fade show"
              style={{ display: "block", background: "rgba(0,0,0,.4)" }}
            >
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Cập nhật gói tập</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setEditingPkg(null)}
                    />
                  </div>
                  <form onSubmit={handleUpdate}>
                    <div className="modal-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Tên gói</label>
                          <input
                            className="form-control"
                            value={editingPkg.packageName}
                            onChange={(e) =>
                              setEditingPkg((p) => ({ ...p, packageName: e.target.value }))
                            }
                          />
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Giá (VNĐ)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editingPkg.price}
                            onChange={(e) =>
                              setEditingPkg((p) => ({ ...p, price: e.target.value }))
                            }
                          />
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Thời hạn (ngày)</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editingPkg.durationInDays}
                            onChange={(e) =>
                              setEditingPkg((p) => ({
                                ...p,
                                durationInDays: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Số buổi</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editingPkg.sessionCount}
                            onChange={(e) =>
                              setEditingPkg((p) => ({
                                ...p,
                                sessionCount: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="col-md-12">
                          <label className="form-label">Mô tả</label>
                          <input
                            className="form-control"
                            value={editingPkg.description}
                            onChange={(e) =>
                              setEditingPkg((p) => ({
                                ...p,
                                description: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="col-md-12">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={editingPkg.includesPersonalTrainer}
                              onChange={(e) =>
                                setEditingPkg((p) => ({
                                  ...p,
                                  includesPersonalTrainer: e.target.checked,
                                }))
                              }
                              id="editPT"
                            />
                            <label className="form-check-label" htmlFor="editPT">
                              Có PT
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditingPkg(null)}
                      >
                        Hủy
                      </button>
                      <button type="submit" className="btn btn-add">
                        Lưu thay đổi
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
