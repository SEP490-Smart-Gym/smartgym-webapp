import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminPackages() {
  const [packages, setPackages] = useState([
    { id: 1, name: "Gói 10 buổi", limit: "1 tháng", type: "Buổi", amount: 10, price: 800000, description: "Gói siêu ưu đãi cho người mới", hasPT: false },
    { id: 2, name: "Gói 1 tháng (có PT)", limit: "1 tháng", type: "Tháng", amount: "", price: 1200000, description: "Gói siêu ưu đãi cho người mới", hasPT: true },
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
    if (name === "type") {
      setNewPackage((prev) => ({
        ...prev,
        type: value,
        // reset field không dùng
        amount: value === "Buổi" ? prev.amount : "",
        limit: value === "Tháng" ? prev.limit : "",
      }));
      return;
    }
    setNewPackage((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const validateAdd = () => {
    if (!newPackage.name.trim()) return alert("Vui lòng nhập tên gói!");
    if (!newPackage.price || +newPackage.price <= 0) return alert("Giá phải lớn hơn 0!");
    if (newPackage.type === "Buổi" && (!newPackage.amount || +newPackage.amount <= 0)) {
      return alert("Số buổi phải > 0 với gói Buổi!");
    }
    if (newPackage.type === "Tháng" && !newPackage.limit) {
      return alert("Vui lòng chọn thời hạn cho gói Tháng!");
    }
    return true;
  };

  const handleAdd = () => {
    if (!validateAdd()) return;
    const newPkg = {
      id: Date.now(),
      name: newPackage.name.trim(),
      limit: newPackage.type === "Tháng" ? newPackage.limit : "",
      type: newPackage.type,
      amount: newPackage.type === "Buổi" ? Number(newPackage.amount) : "",
      price: parseInt(newPackage.price, 10),
      description: newPackage.description.trim(),
      hasPT: !!newPackage.hasPT,
    };
    setPackages((prev) => [newPkg, ...prev]);
    setNewPackage({ name: "", limit: "", type: "Buổi", amount: "", price: "", description: "", hasPT: false });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa gói này?")) {
      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
    }
  };

  // ------ Sửa (Update) ------
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({
    name: "",
    limit: "",
    type: "Buổi",
    amount: "",
    price: "",
    description: "",
    hasPT: false,
  });

  const startEdit = (pkg) => {
    setEditingId(pkg.id);
    setEditRow({
      name: pkg.name,
      limit: pkg.limit || "",
      type: pkg.type,
      amount: pkg.amount ?? "",
      price: String(pkg.price ?? ""),
      description: pkg.description || "",
      hasPT: !!pkg.hasPT,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRow({
      name: "",
      limit: "",
      type: "Buổi",
      amount: "",
      price: "",
      description: "",
      hasPT: false,
    });
  };

  const validateEdit = () => {
    if (!editRow.name.trim()) return alert("Tên gói không được trống!");
    if (!editRow.price || +editRow.price <= 0) return alert("Giá phải lớn hơn 0!");
    if (editRow.type === "Buổi" && (!editRow.amount || +editRow.amount <= 0)) {
      return alert("Số buổi phải > 0 với gói Buổi!");
    }
    if (editRow.type === "Tháng" && !editRow.limit) {
      return alert("Vui lòng chọn thời hạn cho gói Tháng!");
    }
    return true;
  };

  const saveEdit = () => {
    if (!validateEdit()) return;
    setPackages((prev) =>
      prev.map((p) =>
        p.id === editingId
          ? {
            ...p,
            name: editRow.name.trim(),
            type: editRow.type,
            amount: editRow.type === "Buổi" ? Number(editRow.amount) : "",
            limit: editRow.type === "Tháng" ? editRow.limit : "",
            price: Number(editRow.price),
            description: editRow.description.trim(),
            hasPT: !!editRow.hasPT,
          }
          : p
      )
    );
    cancelEdit();
  };

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

          {/* Form thêm gói mới */}
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
                  <select name="type" className="form-select" value={newPackage.type} onChange={handleInput}>
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
                    <label className="form-check-label" htmlFor="ptCheck">Có PT</label>
                  </div>
                </div>
              </div>

              <div className="mt-3 text-end">
                <button className="btn btn-add" onClick={handleAdd}>Thêm gói</button>
              </div>
            </div>
          </div>

          {/* Danh sách gói */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách gói tập</h5>

              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Tên gói</th>
                      <th>Giới hạn</th>
                      <th>Loại</th>
                      <th>Số buổi</th>
                      <th>Giá</th>
                      <th>Mô tả</th>
                      <th>PT</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {packages.length ? (
                      packages.map((pkg) => {
                        const isEditing = editingId === pkg.id;
                        return (
                          <tr key={pkg.id}>
                            {/* Tên */}
                            <td style={{ minWidth: 180 }}>
                              {isEditing ? (
                                <input
                                  className="form-control form-control-sm"
                                  value={editRow.name}
                                  onChange={(e) => setEditRow((p) => ({ ...p, name: e.target.value }))}
                                />
                              ) : pkg.name}
                            </td>

                            {/* Giới hạn */}
                            <td style={{ minWidth: 120 }}>
                              {isEditing ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={editRow.limit}
                                  onChange={(e) => setEditRow((p) => ({ ...p, limit: e.target.value }))}
                                >
                                  <option value="1 tháng">1 tháng</option>
                                  <option value="3 tháng">3 tháng</option>
                                  <option value="6 tháng">6 tháng</option>
                                </select>
                              ) : (pkg.limit || "—")}
                            </td>

                            {/* Loại */}
                            <td style={{ width: 120 }}>
                              {isEditing ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={editRow.type}
                                  onChange={(e) => {
                                    const v = e.target.value;
                                    setEditRow((p) => ({
                                      ...p,
                                      type: v,
                                      amount: v === "Buổi" ? p.amount : "",
                                      limit: v === "Tháng" ? p.limit : "",
                                    }));
                                  }}
                                >
                                  <option value="Buổi">Buổi</option>
                                  <option value="Tháng">Tháng</option>
                                </select>
                              ) : pkg.type}
                            </td>

                            {/* Số buổi */}
                            <td style={{ width: 110 }}>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={editRow.amount}
                                  onChange={(e) => setEditRow((p) => ({ ...p, amount: e.target.value }))}
                                  disabled={editRow.type !== "Buổi"}
                                />
                              ) : (pkg.amount || "—")}
                            </td>

                            {/* Giá */}
                            <td style={{ minWidth: 120 }}>
                              {isEditing ? (
                                <input
                                  type="number"
                                  className="form-control form-control-sm"
                                  value={editRow.price}
                                  onChange={(e) => setEditRow((p) => ({ ...p, price: e.target.value }))}
                                />
                              ) : `${pkg.price.toLocaleString()} đ`}
                            </td>

                            {/* Mô tả */}
                            <td style={{ minWidth: 220 }}>
                              {isEditing ? (
                                <input
                                  className="form-control form-control-sm"
                                  value={editRow.description}
                                  onChange={(e) => setEditRow((p) => ({ ...p, description: e.target.value }))}
                                />
                              ) : pkg.description}
                            </td>

                            {/* PT */}
                            <td style={{ width: 90 }}>
                              {isEditing ? (
                                <div className="form-check d-flex justify-content-center">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    checked={!!editRow.hasPT}
                                    onChange={(e) => setEditRow((p) => ({ ...p, hasPT: e.target.checked }))}
                                  />
                                </div>
                              ) : (
                                pkg.hasPT
                                  ? <span className="badge bg-success">Có</span>
                                  : <span className="badge bg-secondary">Không</span>
                              )}
                            </td>

                            {/* Thao tác */}
                            <td style={{ whiteSpace: "nowrap" }}>
                              {isEditing ? (
                                <>
                                  <button className="btn btn-sm btn-primary me-2" onClick={saveEdit}>
                                    <i className="fa fa-save me-1" /> Lưu
                                  </button>
                                  <button className="btn btn-sm btn-secondary" onClick={cancelEdit}>
                                    <i className="fa fa-times me-1" /> Hủy
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button className="btn btn-sm btn-dark me-2" onClick={() => startEdit(pkg)}>
                                    <i className="fa fa-edit me-1" /> Sửa
                                  </button>
                                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(pkg.id)}>
                                    <i className="fa fa-trash me-1" /> Xoá
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-3">Chưa có gói tập nào</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
