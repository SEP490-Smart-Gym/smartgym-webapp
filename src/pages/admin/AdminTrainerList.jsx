import { useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";

export default function AdminTrainerList() {
  const [trainers, setTrainers] = useState([
    {
      id: 101,
      name: "John Doe",
      age: 32,
      gender: "Nam",
      experienceYears: 8,
      skills: ["Strength", "Mobility", "HIIT"],
      email: "john@example.com",
      phone: "0901234567",
      certificates: ["NASM-CPT", "CPR/AED"],
      photo: "/img/team-1.jpg",
    },
    {
      id: 102,
      name: "Emily Smith",
      age: 28,
      gender: "Nữ",
      experienceYears: 5,
      skills: ["Yoga", "Pilates"],
      email: "emily@example.com",
      phone: "0912345678",
      certificates: ["RYT-200"],
      photo: "/img/team-2.jpg",
    },
  ]);

  const [newT, setNewT] = useState({
    name: "",
    age: "",
    gender: "Nam",
    experienceYears: "",
    skills: "",        // nhập bằng chuỗi, tách khi lưu
    email: "",
    phone: "",
    certificates: "",  // nhập bằng chuỗi, tách khi lưu
    photo: "",         // URL ảnh hoặc base64 (nếu bạn xử lý upload)
  });

  const handleInput = (e) => {
    const { name, value } = e.target;
    setNewT((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (!newT.name.trim()) return alert("Vui lòng nhập tên HLV!");
    if (!newT.age || Number(newT.age) <= 0) return alert("Tuổi phải là số dương!");
    if (!newT.email.includes("@")) return alert("Email không hợp lệ!");
    if (!newT.phone || newT.phone.replace(/\D/g, "").length < 9) return alert("SĐT không hợp lệ!");
    return true;
  };

  const handleAdd = () => {
    if (!validate()) return;

    const skillsArr = newT.skills
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const certArr = newT.certificates
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);

    const newTrainer = {
      id: Date.now(),
      name: newT.name.trim(),
      age: Number(newT.age),
      gender: newT.gender,
      experienceYears: Number(newT.experienceYears || 0),
      skills: skillsArr,
      email: newT.email.trim(),
      phone: newT.phone.trim(),
      certificates: certArr,
      photo: newT.photo || "/img/useravt.jpg",
    };

    setTrainers((prev) => [newTrainer, ...prev]);
    setNewT({
      name: "",
      age: "",
      gender: "Nam",
      experienceYears: "",
      skills: "",
      email: "",
      phone: "",
      certificates: "",
      photo: "",
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Xoá HLV này?")) {
      setTrainers((prev) => prev.filter((t) => t.id !== id));
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
          <h2 className="mb-4 text-center">Quản lý Huấn luyện viên</h2>

          {/* Form thêm HLV */}
          <div className="card shadow-sm mb-4">
            <div className="card-body">
              <h5 className="mb-3">Thêm HLV mới</h5>

              <div className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Tên</label>
                  <input
                    name="name"
                    className="form-control"
                    placeholder="VD: Nguyễn Văn A"
                    value={newT.name}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Tuổi</label>
                  <input
                    name="age"
                    type="number"
                    min="16"
                    className="form-control"
                    placeholder="VD: 28"
                    value={newT.age}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-2">
                  <label className="form-label">Giới tính</label>
                  <select
                    name="gender"
                    className="form-select"
                    value={newT.gender}
                    onChange={handleInput}
                  >
                    <option>Nam</option>
                    <option>Nữ</option>
                    <option>Khác</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Số năm kinh nghiệm</label>
                  <input
                    name="experienceYears"
                    type="number"
                    min="0"
                    className="form-control"
                    placeholder="VD: 5"
                    value={newT.experienceYears}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Kỹ năng (phân cách bằng dấu phẩy)</label>
                  <input
                    name="skills"
                    className="form-control"
                    placeholder="VD: Strength, Mobility, HIIT"
                    value={newT.skills}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Chứng chỉ (phân cách bằng dấu phẩy)</label>
                  <input
                    name="certificates"
                    className="form-control"
                    placeholder="VD: NASM-CPT, RYT-200"
                    value={newT.certificates}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Email</label>
                  <input
                    name="email"
                    type="email"
                    className="form-control"
                    placeholder="VD: abc@xyz.com"
                    value={newT.email}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    name="phone"
                    className="form-control"
                    placeholder="VD: 0901234567"
                    value={newT.phone}
                    onChange={handleInput}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Ảnh (URL)</label>
                  <input
                    name="photo"
                    className="form-control"
                    placeholder="VD: https://..."
                    value={newT.photo}
                    onChange={handleInput}
                  />
                  <div className="small text-muted mt-1">Nếu để trống sẽ dùng ảnh mặc định.</div>
                </div>

                <div className="col-md-6 d-flex align-items-end">
                  <div className="d-flex align-items-center gap-3">
                    <div className="trainer-photo-preview">
                      <img
                        src={newT.photo || "/img/useravt.jpg"}
                        alt="preview"
                        onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                      />
                    </div>
                    <button className="btn btn-add" onClick={handleAdd}>
                      Thêm HLV
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Danh sách HLV */}
          <div className="card shadow-sm">
            <div className="card-body">
              <h5 className="mb-3">Danh sách HLV</h5>

              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>Ảnh</th>
                      <th>Tên</th>
                      <th>Tuổi</th>
                      <th>Giới tính</th>
                      <th>KN (năm)</th>
                      <th>Kỹ năng</th>
                      <th>Email</th>
                      <th>SĐT</th>
                      <th>Chứng chỉ</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trainers.length ? (
                      trainers.map((t) => (
                        <tr key={t.id}>
                          <td style={{ width: 70 }}>
                            <img
                              src={t.photo || "/img/useravt.jpg"}
                              alt={t.name}
                              className="rounded-circle"
                              style={{ width: 48, height: 48, objectFit: "cover" }}
                              onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                            />
                          </td>
                          <td>{t.name}</td>
                          <td>{t.age}</td>
                          <td>{t.gender}</td>
                          <td>{t.experienceYears}</td>
                          <td>
                            {t.skills?.length
                              ? t.skills.map((s, i) => (
                                  <span key={i} className="badge bg-primary me-1 mb-1">
                                    {s}
                                  </span>
                                ))
                              : <span className="text-muted">—</span>}
                          </td>
                          <td><a href={`mailto:${t.email}`}>{t.email}</a></td>
                          <td><a href={`tel:${t.phone}`}>{t.phone}</a></td>
                          <td>
                            {t.certificates?.length
                              ? t.certificates.map((c, i) => (
                                  <span key={i} className="badge bg-dark me-1 mb-1">
                                    {c}
                                  </span>
                                ))
                              : <span className="text-muted">—</span>}
                          </td>
                          <td>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDelete(t.id)}
                            >
                              <i className="fas fa-trash me-1"></i> Xoá
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="10" className="text-center text-muted py-3">
                          Chưa có HLV nào
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
