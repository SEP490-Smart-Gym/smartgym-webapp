import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Table, Space, Button } from "antd";

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

  // yyyy-mm-dd -> dd/mm/yyyy
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  // ===== Columns cho AntD Table =====
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
          style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: "1px solid #ddd" }}
          onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
        />
      ),
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Tên",
      dataIndex: "name",
      key: "name",
      width: 220,
      fixed: "left",
      ellipsis: true,
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Giới tính",
      dataIndex: "gender",
      key: "gender",
      width: 120,
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Ngày sinh",
      dataIndex: "dob",
      key: "dob",
      width: 140,
      render: (v) => formatDateDisplay(v),
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "SĐT",
      dataIndex: "phone",
      key: "phone",
      width: 150,
      render: (v) => (v ? <a href={`tel:${v}`}>{v}</a> : "—"),
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      width: 220,
      render: (v) => (v ? <a href={`mailto:${v}`}>{v}</a> : "—"),
      ellipsis: true,
      onCell: () => ({ style: { whiteSpace: "nowrap" } }),
    },
    {
      title: "Thao tác",
      key: "actions",
      fixed: "right",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => setEditingStaff(record)}>
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

  // ===== Add =====
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.phone || !newStaff.email)
      return alert("Vui lòng nhập đầy đủ thông tin!");

    const newEntry = { ...newStaff, id: Date.now() };
    setStaffs((prev) => [newEntry, ...prev]);
    setNewStaff({
      name: "",
      gender: "Nam",
      dob: "",
      phone: "",
      email: "",
      photo: "",
    });
  };

  // ===== Delete =====
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa nhân viên này?")) {
      setStaffs((prev) => prev.filter((s) => s.id !== id));
    }
  };

  // ===== Update (giữ modal bootstrap như cũ) =====
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

          {/* Form thêm nhân viên (giữ nguyên) */}
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
                  <button type="submit" className="btn btn-add">
                    Thêm nhân viên
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Danh sách (AntD Table) */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách nhân viên</h5>

              <Table
                rowKey="id"
                columns={columns}
                dataSource={staffs}
                pagination={{ pageSize: 8 }}
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>

          {/* Modal cập nhật (giữ nguyên bootstrap modal) */}
          {editingStaff && (
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
          )}
        </div>
      </div>
    </div>
  );
}
