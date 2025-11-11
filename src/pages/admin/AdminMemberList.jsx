import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Table, Space, Button } from "antd";

export default function AdminMemberList() {
  const [members, setMembers] = useState([
    {
      id: 1,
      name: "Nguyễn Văn A",
      gender: "Nam",
      dob: "1998-06-12",
      phone: "0987654321",
      email: "vana@example.com",
      photo: "/img/testimonial-1.jpg",
    },
    {
      id: 2,
      name: "Trần Thị B",
      gender: "Nữ",
      dob: "2001-02-23",
      phone: "0912345678",
      email: "thib@example.com",
      photo: "",
    },
  ]);

  // Form thêm mới
  const [newMember, setNewMember] = useState({
    name: "",
    gender: "Nam",
    dob: "",
    phone: "",
    email: "",
    photo: "",
  });

  // Dữ liệu đang chỉnh sửa (mở modal khi khác null)
  const [editingMember, setEditingMember] = useState(null);

  // yyyy-mm-dd -> dd/mm/yyyy
  const formatDateDisplay = (dateStr) => {
    if (!dateStr) return "—";
    const [y, m, d] = dateStr.split("-");
    return `${d}/${m}/${y}`;
  };

  // Thêm hội viên
  const handleAdd = (e) => {
    e.preventDefault();
    if (!newMember.name || !newMember.phone || !newMember.email) {
      alert("Vui lòng nhập đầy đủ họ tên, SĐT và email!");
      return;
    }
    const entry = { ...newMember, id: Date.now() };
    setMembers((prev) => [entry, ...prev]);
    setNewMember({
      name: "",
      gender: "Nam",
      dob: "",
      phone: "",
      email: "",
      photo: "",
    });
  };

  // Xóa hội viên
  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc muốn xóa hội viên này?")) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
  };

  // Cập nhật hội viên
  const handleUpdate = (e) => {
    e.preventDefault();
    setMembers((prev) =>
      prev.map((m) => (m.id === editingMember.id ? editingMember : m))
    );
    setEditingMember(null);
  };

  // ===== AntD Table Columns =====
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
            width: 50,
            height: 50,
            borderRadius: "50%",
            objectFit: "cover",
            border: "1px solid #ddd",
          }}
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
          <Button size="small" onClick={() => setEditingMember(record)}>
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
        {/* Sidebar */}
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        {/* Nội dung chính */}
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý hội viên</h2>

          {/* Form thêm mới (giữ nguyên) */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm hội viên mới</h5>
              <form onSubmit={handleAdd}>
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Họ và tên</label>
                    <input
                      className="form-control"
                      value={newMember.name}
                      onChange={(e) =>
                        setNewMember((p) => ({ ...p, name: e.target.value }))
                      }
                      placeholder="Nhập họ tên"
                    />
                  </div>

                  <div className="col-md-2">
                    <label className="form-label">Giới tính</label>
                    <select
                      className="form-select"
                      value={newMember.gender}
                      onChange={(e) =>
                        setNewMember((p) => ({ ...p, gender: e.target.value }))
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
                      value={newMember.dob}
                      onChange={(e) =>
                        setNewMember((p) => ({ ...p, dob: e.target.value }))
                      }
                    />
                  </div>

                  <div className="col-md-3">
                    <label className="form-label">Số điện thoại</label>
                    <input
                      className="form-control"
                      value={newMember.phone}
                      onChange={(e) =>
                        setNewMember((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="VD: 0987xxxxxx"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={newMember.email}
                      onChange={(e) =>
                        setNewMember((p) => ({ ...p, email: e.target.value }))
                      }
                      placeholder="VD: example@gmail.com"
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Ảnh đại diện (URL)</label>
                    <input
                      className="form-control"
                      placeholder="Dán link ảnh hoặc để trống"
                      value={newMember.photo}
                      onChange={(e) =>
                        setNewMember((p) => ({ ...p, photo: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="mt-3 text-end">
                  <button type="submit" className="btn btn-add">
                    Thêm hội viên
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Danh sách hội viên (AntD Table) */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách hội viên</h5>
              <Table
                rowKey="id"
                columns={columns}
                dataSource={members}
                pagination={{ pageSize: 8 }}
                scroll={{ x: "max-content" }}
              />
            </div>
          </div>

          {/* Modal chỉnh sửa hội viên (giữ nguyên Bootstrap modal) */}
          {editingMember && (
            <div
              className="modal fade show"
              style={{ display: "block", background: "rgba(0,0,0,.4)" }}
              role="dialog"
              aria-modal="true"
            >
              <div className="modal-dialog modal-lg modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Cập nhật hội viên</h5>
                    <button
                      type="button"
                      className="btn-close"
                      onClick={() => setEditingMember(null)}
                    ></button>
                  </div>
                  <form onSubmit={handleUpdate}>
                    <div className="modal-body">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label">Họ và tên</label>
                          <input
                            className="form-control"
                            value={editingMember.name}
                            onChange={(e) =>
                              setEditingMember((p) => ({
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
                            value={editingMember.gender}
                            onChange={(e) =>
                              setEditingMember((p) => ({
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
                            value={editingMember.dob}
                            onChange={(e) =>
                              setEditingMember((p) => ({
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
                            value={editingMember.email}
                            onChange={(e) =>
                              setEditingMember((p) => ({
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
                            value={editingMember.phone}
                            onChange={(e) =>
                              setEditingMember((p) => ({
                                ...p,
                                phone: e.target.value,
                              }))
                            }
                          />
                        </div>

                        <div className="col-12">
                          <label className="form-label">Ảnh đại diện (URL)</label>
                          <input
                            className="form-control"
                            value={editingMember.photo || ""}
                            onChange={(e) =>
                              setEditingMember((p) => ({
                                ...p,
                                photo: e.target.value,
                              }))
                            }
                            placeholder="Dán link ảnh hoặc để trống"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="modal-footer">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setEditingMember(null)}
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
