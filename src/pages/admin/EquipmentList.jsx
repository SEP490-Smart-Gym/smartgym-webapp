import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";

const STATUS_OPTIONS = [
  "Đang hoạt động",
  "Đang bảo trì",
  "Hư hỏng",
  "Tồn kho",
];

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

  // Form thêm mới
  const [form, setForm] = useState({
    name: "",
    code: "",
    brand: "",
    status: STATUS_OPTIONS[3], // mặc định: Tồn kho
    photo: "",
  });

  // Sửa inline
  const [editingId, setEditingId] = useState(null);
  const [editRow, setEditRow] = useState({
    name: "",
    code: "",
    brand: "",
    status: STATUS_OPTIONS[0],
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

  const startEdit = (item) => {
    setEditingId(item.id);
    setEditRow({
      name: item.name,
      code: item.code,
      brand: item.brand,
      status: item.status,
      photo: item.photo,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditRow({
      name: "",
      code: "",
      brand: "",
      status: STATUS_OPTIONS[0],
      photo: "",
    });
  };

  const saveEdit = () => {
    if (!editRow.name.trim()) return alert("Tên máy không được trống!");
    if (!editRow.code.trim()) return alert("Mã máy không được trống!");
    if (!editRow.brand.trim()) return alert("Thương hiệu không được trống!");
    setEquipments((prev) =>
      prev.map((it) =>
        it.id === editingId
          ? {
              ...it,
              name: editRow.name.trim(),
              code: editRow.code.trim(),
              brand: editRow.brand.trim(),
              status: editRow.status,
              photo: editRow.photo || "/img/useravt.jpg",
            }
          : it
      )
    );
    cancelEdit();
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xoá thiết bị này?")) {
      setEquipments((prev) => prev.filter((it) => it.id !== id));
    }
  };

  const statusBadge = (s) => {
    switch (s) {
      case "Đang hoạt động":
        return "bg-success";
      case "Đang bảo trì":
        return "bg-warning text-dark";
      case "Hư hỏng":
        return "bg-danger";
      case "Tồn kho":
      default:
        return "bg-secondary";
    }
  };

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
                      <option key={s} value={s}>{s}</option>
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

          {/* Danh sách thiết bị */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách thiết bị</h5>

              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Ảnh</th>
                      <th>Tên máy</th>
                      <th>Mã máy</th>
                      <th>Thương hiệu</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {equipments.length ? (
                      equipments.map((it) => {
                        const isEditing = editingId === it.id;
                        return (
                          <tr key={it.id}>
                            <td style={{ width: 72 }}>
                              <img
                                src={(isEditing ? editRow.photo : it.photo) || "/img/useravt.jpg"}
                                alt={it.name}
                                className="rounded"
                                style={{ width: 56, height: 56, objectFit: "cover" }}
                                onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                              />
                            </td>

                            <td>
                              {isEditing ? (
                                <input
                                  className="form-control form-control-sm"
                                  value={editRow.name}
                                  onChange={(e) =>
                                    setEditRow((p) => ({ ...p, name: e.target.value }))
                                  }
                                />
                              ) : (
                                it.name
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <input
                                  className="form-control form-control-sm"
                                  value={editRow.code}
                                  onChange={(e) =>
                                    setEditRow((p) => ({ ...p, code: e.target.value }))
                                  }
                                />
                              ) : (
                                it.code
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <input
                                  className="form-control form-control-sm"
                                  value={editRow.brand}
                                  onChange={(e) =>
                                    setEditRow((p) => ({ ...p, brand: e.target.value }))
                                  }
                                />
                              ) : (
                                it.brand
                              )}
                            </td>

                            <td>
                              {isEditing ? (
                                <select
                                  className="form-select form-select-sm"
                                  value={editRow.status}
                                  onChange={(e) =>
                                    setEditRow((p) => ({ ...p, status: e.target.value }))
                                  }
                                >
                                  {STATUS_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s}</option>
                                  ))}
                                </select>
                              ) : (
                                <span className={`badge ${statusBadge(it.status)}`}>
                                  {it.status}
                                </span>
                              )}
                            </td>

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
                                  <button
                                    className="btn btn-sm btn-dark me-2"
                                    onClick={() => startEdit(it)}
                                   
                                  >
                                    <i className="fa fa-edit me-1" /> Sửa
                                  </button>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleDelete(it.id)}
                                  >
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
                        <td colSpan="6" className="text-center text-muted py-3">
                          Chưa có thiết bị nào
                        </td>
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
