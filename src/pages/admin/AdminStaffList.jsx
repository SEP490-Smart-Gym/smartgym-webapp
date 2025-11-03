import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminStaffList() {
  const [staffs, setStaffs] = useState([
    {
      id: 1,
      name: "Nguyễn Thành Công",
      gender: "Nam",
      dob: "1995-03-10",
      phone: "0911222333",
      email: "cong@example.com",
      photo: "/img/testimonial-2.jpg",
    },
    {
      id: 2,
      name: "Lê Thị Hoa",
      gender: "Nữ",
      dob: "1999-12-22",
      phone: "0977123456",
      email: "hoa@example.com",
      photo: "",
    },
  ]);

  const [newStaff, setNewStaff] = useState({
    name: "",
    gender: "Nam",
    dob: "",
    phone: "",
    email: "",
    photo: "",
  });

  const [editingStaff, setEditingStaff] = useState(null);

  // Format yyyy-mm-dd -> dd/mm/yyyy
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  // Thêm nhân viên mới
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.phone || !newStaff.email)
      return alert("Vui lòng nhập đầy đủ thông tin!");

    const newEntry = { ...newStaff, id: Date.now() };
    setStaffs((prev) => [...prev, newEntry]);
    setNewStaff({
      name: "",
      gender: "Nam",
      dob: "",
      phone: "",
      email: "",
      photo: "",
    });
  };

  // Xóa
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      setStaffs((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // Cập nhật
  const handleUpdate = (e) => {
    e.preventDefault();
    setStaffs((prev) =>
      prev.map((s) => (s.id === editingStaff.id ? editingStaff : s))
    );
    setEditingStaff(null);
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
          <h2 className="mb-4 text-center">Quản lý nhân viên</h2>

          {/* Form thêm nhân viên */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm nhân viên mới</h5>
              <form onSubmit={handleAdd}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Họ và tên</label>
                    <input
                      name="name"
                      className="form-control"
                      value={newStaff.name}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Giới tính</label>
                    <select
                      className="form-select"
                      value={newStaff.gender}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, gender: e.target.value }))
                      }
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Ngày sinh</label>
                    <input
                      type="date"
                      className="form-control"
                      value={newStaff.dob}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, dob: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="form-control"
                      value={newStaff.phone}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="VD: 0987xxxxxx"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newStaff.email}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="VD: example@gmail.com"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Ảnh đại diện (URL)</label>
                    <input
                      className="form-control"
                      placeholder="Dán link ảnh hoặc để trống"
                      value={newStaff.photo}
                      onChange={(e) =>
                        setNewStaff((p) => ({ ...p, photo: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-3 text-end">
                  <button type="submit" className="btn btn-primary">
                    Thêm nhân viên
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Danh sách nhân viên */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách nhân viên</h5>

              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Ảnh</th>
                      <th>Tên</th>
                      <th>Giới tính</th>
                      <th>Ngày sinh</th>
                      <th>SĐT</th>
                      <th>Email</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffs.length > 0 ? (
                      staffs.map((s) => (
                        <tr key={s.id}>
                          <td>
                            <img
                              src={s.photo || "/img/useravt.jpg"}
                              alt="avatar"
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: "50%",
                                objectFit: "cover",
                                border: "1px solid #ddd",
                              }}
                              onError={(e) =>
                                (e.currentTarget.src = "/img/useravt.jpg")
                              }
                            />
                          </td>
                          <td>{s.name}</td>
                          <td>{s.gender}</td>
                          <td>{formatDateDisplay(s.dob)}</td>
                          <td>{s.phone}</td>
                          <td>{s.email}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-warning me-2"
                              onClick={() => setEditingStaff(s)}
                            >
                              <i className="fas fa-edit me-1"></i>Sửa
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(s.id)}
                            >
                              <i className="fas fa-trash me-1"></i>Xóa
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center text-muted py-3">
                          Chưa có nhân viên nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Modal cập nhật */}
          {editingStaff && (
            <>
              <div
                className="modal fade show"
                style={{ display: "block", background: "rgba(0,0,0,.4)" }}
              >
                <div className="modal-dialog modal-lg modal-dialog-centered">
                  <div className="modal-content">
                    <div className="modal-header">
                      <h5 className="modal-title">Cập nhật nhân viên</h5>
                      <button
                        type="button"
                        className="btn-close"
                        onClick={() => setEditingStaff(null)}
                      ></button>
                    </div>
                    <form onSubmit={handleUpdate}>
                      <div className="modal-body">
                        <div className="row g-3">
                          <div className="col-md-6">
                            <label className="form-label">Họ và tên</label>
                            <input
                              className="form-control"
                              value={editingStaff.name}
                              onChange={(e) =>
                                setEditingStaff((p) => ({
                                  ...p,
                                  name: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="col-md-3">
                            <label className="form-label">Giới tính</label>
                            <select
                              className="form-select"
                              value={editingStaff.gender}
                              onChange={(e) =>
                                setEditingStaff((p) => ({
                                  ...p,
                                  gender: e.target.value,
                                }))
                              }
                            >
                              <option value="Nam">Nam</option>
                              <option value="Nữ">Nữ</option>
                              <option value="Khác">Khác</option>
                            </select>
                          </div>

                          <div className="col-md-3">
                            <label className="form-label">Ngày sinh</label>
                            <input
                              type="date"
                              className="form-control"
                              value={editingStaff.dob}
                              onChange={(e) =>
                                setEditingStaff((p) => ({
                                  ...p,
                                  dob: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Email</label>
                            <input
                              type="email"
                              className="form-control"
                              value={editingStaff.email}
                              onChange={(e) =>
                                setEditingStaff((p) => ({
                                  ...p,
                                  email: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="col-md-6">
                            <label className="form-label">Số điện thoại</label>
                            <input
                              className="form-control"
                              value={editingStaff.phone}
                              onChange={(e) =>
                                setEditingStaff((p) => ({
                                  ...p,
                                  phone: e.target.value,
                                }))
                              }
                            />
                          </div>

                          <div className="col-md-12">
                            <label className="form-label">Ảnh đại diện (URL)</label>
                            <input
                              className="form-control"
                              value={editingStaff.photo}
                              onChange={(e) =>
                                setEditingStaff((p) => ({
                                  ...p,
                                  photo: e.target.value,
                                }))
                              }
                            />
                          </div>
                        </div>
                      </div>

                      <div className="modal-footer">
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => setEditingStaff(null)}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
