import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Table, Tag, Space, Button, message } from "antd";

export default function AdminPackages() {
  const [packages, setPackages] = useState([
    {
      id: 1,
      name: "Gói 10 buổi",
      limit: "1 tháng",
      type: "Buổi",
      amount: 10,
      price: 800000,
      description: "Gói siêu ưu đãi cho người mới",
      hasPT: false,
    },
    {
      id: 2,
      name: "Gói 1 tháng (có PT)",
      limit: "1 tháng",
      type: "Tháng",
      amount: "",
      price: 1200000,
      description: "Gói siêu ưu đãi cho người mới",
      hasPT: true,
    },
  ]);

  // ------ Form thêm mới ------
  const [newPackage, setNewPackage] = useState({
    name: "",
    limit: "",
    type: "Buổi",
    amount: "",
    price: "",
    description: "",
    hasPT: false,
  });

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPackage((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateAdd = () => {
    if (!newPackage.name.trim()) return alert("Vui lòng nhập tên gói!");
    if (!newPackage.price || +newPackage.price <= 0) return alert("Giá phải lớn hơn 0!");
    if (newPackage.type === "Buổi" && (!newPackage.amount || +newPackage.amount <= 0))
      return alert("Số buổi phải > 0 với gói Buổi!");
    return true;
  };

  const handleAdd = () => {
    if (!validateAdd()) return;
    const newPkg = {
      id: Date.now(),
      name: newPackage.name.trim(),
      limit: newPackage.limit,
      type: newPackage.type,
      amount: newPackage.type === "Buổi" ? Number(newPackage.amount) : "",
      price: parseInt(newPackage.price, 10),
      description: newPackage.description.trim(),
      hasPT: !!newPackage.hasPT,
    };
    setPackages((prev) => [newPkg, ...prev]);
    setNewPackage({
      name: "",
      limit: "",
      type: "Buổi",
      amount: "",
      price: "",
      description: "",
      hasPT: false,
    });
    message.success("Đã thêm gói tập");
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa gói này?")) {
      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
      message.success("Đã xoá gói");
    }
  };

  // ------ Modal cập nhật (giữ nguyên luồng CRUD) ------
  const [editingPkg, setEditingPkg] = useState(null);

  const handleUpdate = (e) => {
    e.preventDefault();
    if (!editingPkg.name.trim()) return alert("Tên gói không được trống!");
    if (!editingPkg.price || +editingPkg.price <= 0) return alert("Giá phải lớn hơn 0!");

    setPackages((prev) =>
      prev.map((p) =>
        p.id === editingPkg.id ? { ...editingPkg, price: +editingPkg.price } : p
      )
    );
    setEditingPkg(null);
    message.success("Cập nhật gói thành công");
  };

  // ======= AntD Table columns (chỉ thay phần bảng) =======
  const columns = [
    {
      title: "Tên gói",
      dataIndex: "name",
      key: "name",
      fixed: "left",
      width: 220,
      ellipsis: true,
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Giới hạn",
      dataIndex: "limit",
      key: "limit",
      width: 140,
      render: (v) => v || "—",
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Loại",
      dataIndex: "type",
      key: "type",
      width: 110,
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Số buổi",
      dataIndex: "amount",
      key: "amount",
      width: 110,
      render: (v) => (v || v === 0 ? v : "—"),
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Giá",
      dataIndex: "price",
      key: "price",
      width: 150,
      render: (v) => `${Number(v).toLocaleString("vi-VN")} đ`,
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Mô tả",
      dataIndex: "description",
      key: "description",
      width: 280,
      ellipsis: true,
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "PT",
      dataIndex: "hasPT",
      key: "hasPT",
      width: 100,
      render: (v) =>
        v ? <Tag color="green">Có</Tag> : <Tag color="default">Không</Tag>,
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 170,
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
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
  ];

  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        {/* Sidebar trái */}
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        {/* Nội dung chính */}
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý gói tập</h2>

          {/* Form thêm gói mới (giữ nguyên) */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm gói tập mới</h5>
              <div className="row g-3">
                <div className="col-md-3">
                  <label className="form-label">Tên gói</label>
                  <input
                    name="name"
                    className="form-control"
                    placeholder="VD: Gói 3 tháng (có PT)"
                    value={newPackage.name}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Loại gói</label>
                  <select
                    name="type"
                    className="form-select"
                    value={newPackage.type}
                    onChange={handleInput}
                  >
                    <option value="Buổi">Buổi</option>
                    <option value="Tháng">Tháng</option>
                  </select>
                </div>

                <div className="col-md-1">
                  <label className="form-label">Số buổi</label>
                  <input
                    name="amount"
                    type="number"
                    className="form-control"
                    placeholder="VD: 10"
                    value={newPackage.amount}
                    onChange={handleInput}
                    disabled={newPackage.type !== "Buổi"}
                  />
                </div>

                <div className="col-md-3">
                  <label className="form-label">Thời hạn</label>
                  <select
                    name="limit"
                    className="form-select"
                    value={newPackage.limit}
                    onChange={handleInput}
                  >
                    <option value="">-- Chọn thời hạn --</option>
                    <option value="1 tháng">1 tháng</option>
                    <option value="3 tháng">3 tháng</option>
                    <option value="6 tháng">6 tháng</option>
                  </select>
                </div>

                <div className="col-md-3">
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

                <div className="col-md-2 d-flex align-items-end">
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="hasPT"
                      checked={newPackage.hasPT}
                      onChange={handleInput}
                      id="ptCheck"
                    />
                    <label className="form-check-label" htmlFor="ptCheck">
                      Có PT
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-end">
                <button className="btn btn-add" onClick={handleAdd}>
                  Thêm gói
                </button>
              </div>
            </div>
          </div>

          {/* Danh sách gói (AntD Table) */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách gói tập</h5>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={packages}
                pagination={{ pageSize: 8 }}
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>

          {/* Modal chỉnh sửa (giữ nguyên bootstrap modal) */}
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
                            value={editingPkg.name}
                            onChange={(e) =>
                              setEditingPkg((p) => ({ ...p, name: e.target.value }))
                            }
                          />
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Loại gói</label>
                          <select
                            className="form-select"
                            value={editingPkg.type}
                            onChange={(e) =>
                              setEditingPkg((p) => ({ ...p, type: e.target.value }))
                            }
                          >
                            <option value="Buổi">Buổi</option>
                            <option value="Tháng">Tháng</option>
                          </select>
                        </div>

                        <div className="col-md-3">
                          <label className="form-label">Số buổi</label>
                          <input
                            type="number"
                            className="form-control"
                            value={editingPkg.amount || ""}
                            onChange={(e) =>
                              setEditingPkg((p) => ({ ...p, amount: e.target.value }))
                            }
                            disabled={editingPkg.type !== "Buổi"}
                          />
                        </div>

                        <div className="col-md-4">
                          <label className="form-label">Thời hạn</label>
                          <select
                            className="form-select"
                            value={editingPkg.limit}
                            onChange={(e) =>
                              setEditingPkg((p) => ({ ...p, limit: e.target.value }))
                            }
                          >
                            <option value="">-- Chọn thời hạn --</option>
                            <option value="1 tháng">1 tháng</option>
                            <option value="3 tháng">3 tháng</option>
                            <option value="6 tháng">6 tháng</option>
                          </select>
                        </div>

                        <div className="col-md-4">
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
                              checked={editingPkg.hasPT}
                              onChange={(e) =>
                                setEditingPkg((p) => ({ ...p, hasPT: e.target.checked }))
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
