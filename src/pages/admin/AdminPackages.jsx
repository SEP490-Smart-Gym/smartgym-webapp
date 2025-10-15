import { useState } from "react";

export default function AdminPackages() {
  const [packages, setPackages] = useState([
    { id: 1, name: "Gói 10 buổi", type: "Buổi", price: 800000, hasPT: false },
    { id: 2, name: "Gói 1 tháng (có PT)", type: "Tháng", price: 1200000, hasPT: true },
  ]);

  const [newPackage, setNewPackage] = useState({
    name: "",
    type: "Buổi",
    price: "",
    hasPT: false,
  });

  const handleInput = (e) => {
    const { name, value, type, checked } = e.target;
    setNewPackage((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleAdd = () => {
    if (!newPackage.name || !newPackage.price) return alert("Vui lòng nhập đầy đủ thông tin!");

    const newPkg = {
      ...newPackage,
      id: Date.now(),
      price: parseInt(newPackage.price, 10),
    };
    setPackages((prev) => [...prev, newPkg]);
    setNewPackage({ name: "", type: "Buổi", price: "", hasPT: false });
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa gói này?")) {
      setPackages((prev) => prev.filter((pkg) => pkg.id !== id));
    }
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Quản lý gói tập</h2>

      {/* Form thêm gói mới */}
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h5 className="mb-3">Thêm gói tập mới</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Tên gói</label>
              <input
                name="name"
                className="form-control"
                placeholder="VD: Gói 3 tháng (có PT)"
                value={newPackage.name}
                onChange={handleInput}
              />
            </div>
            <div className="col-md-3">
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

      {/* Danh sách gói */}
      <div className="card shadow-sm">
        <div className="card-body">
          <h5 className="mb-3">Danh sách gói tập</h5>
          <div className="table-responsive">
            <table className="table table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Tên gói</th>
                  <th>Loại</th>
                  <th>Giá</th>
                  <th>PT</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {packages.length > 0 ? (
                  packages.map((pkg) => (
                    <tr key={pkg.id}>
                      <td>{pkg.name}</td>
                      <td>{pkg.type}</td>
                      <td>{pkg.price.toLocaleString()} đ</td>
                      <td>
                        {pkg.hasPT ? (
                          <span className="badge bg-success">Có</span>
                        ) : (
                          <span className="badge bg-secondary">Không</span>
                        )}
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(pkg.id)}
                        >
                          <i className="fas fa-trash me-1"></i> Xóa
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-3">
                      Chưa có gói tập nào
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
