import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/axios";
import { Modal } from "antd";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    gender: "male",       // API sample: "male"
    address: "",
    dateOfBirth: "",      // yyyy-mm-dd (input type="date")
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // chỉ nhận số cho phone
    if (name === "phoneNumber") {
      const onlyDigits = value.replace(/\D/g, "");
      return setForm((p) => ({ ...p, phoneNumber: onlyDigits }));
    }
    setForm((p) => ({ ...p, [name]: value }));
  };

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = "Vui lòng nhập tên (first name).";
    if (!form.lastName.trim()) e.lastName = "Vui lòng nhập họ (last name).";

    if (!form.email) e.email = "Vui lòng nhập email.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ.";

    if (!form.password) e.password = "Vui lòng nhập mật khẩu.";
    else if (form.password.length < 6) e.password = "Mật khẩu phải có ít nhất 6 ký tự.";

    if (form.password !== form.confirmPassword) e.confirmPassword = "Mật khẩu xác nhận không khớp.";

    if (!form.phoneNumber) e.phoneNumber = "Vui lòng nhập số điện thoại.";
    else if (form.phoneNumber.length !== 10) e.phoneNumber = "Số điện thoại phải đúng 10 số.";

    if (!form.gender) e.gender = "Vui lòng chọn giới tính.";
    if (!form.address.trim()) e.address = "Vui lòng nhập địa chỉ.";

    if (!form.dateOfBirth) e.dateOfBirth = "Vui lòng chọn ngày sinh.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      // API yêu cầu ISO-8601
      const payload = {
        email: form.email,
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phoneNumber: form.phoneNumber,
        gender: form.gender, // "male" | "female" | "other" nếu backend cho phép
        address: form.address.trim(),
        dateOfBirth: new Date(form.dateOfBirth).toISOString(),
      };

      // Ví dụ endpoint theo swagger: /api/Auth/register
      await api.post("/Auth/register", payload);

      Modal.success({
        title: "Đăng ký thành công!",
        content: "Vui lòng kiểm tra email để xác nhận tài khoản.",
      });
      navigate("/login");
    } catch (err) {
      // cố gắng đọc message từ server
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        "Đăng ký thất bại. Vui lòng thử lại.";
      setErrors((p) => ({ ...p, server: msg }));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        backgroundImage: 'url("/img/gymbg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-sm-10 col-md-8 col-lg-6">
            <div className="d-flex justify-content-start mb-3">
              <button
                onClick={() => navigate("/")}
                style={{
                  position: "absolute",
                  top: 24,
                  left: 24,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "rgba(255,255,255,0.85)",
                  border: "none",
                  padding: "6px 12px",
                  borderRadius: 20,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
                }}
              >
                ← Trang chủ
              </button>
            </div>
            <div className="card shadow-sm">
              <div className="card-body p-4">
                <h3 className="card-title mb-3 text-center">Đăng ký</h3>
                {errors.server && (
                  <div className="alert alert-danger py-2">{errors.server}</div>
                )}

                <form onSubmit={handleSubmit} noValidate>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Họ</label>
                      <input
                        name="lastName"
                        className={`form-control ${errors.lastName ? "is-invalid" : ""}`}
                        placeholder="VD: Nguyen"
                        value={form.lastName}
                        onChange={handleChange}
                      />
                      {errors.lastName && (
                        <div className="invalid-feedback">{errors.lastName}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Tên</label>
                      <input
                        name="firstName"
                        className={`form-control ${errors.firstName ? "is-invalid" : ""}`}
                        placeholder="VD: Quang"
                        value={form.firstName}
                        onChange={handleChange}
                      />
                      {errors.firstName && (
                        <div className="invalid-feedback">{errors.firstName}</div>
                      )}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email</label>
                      <input
                        name="email"
                        type="email"
                        className={`form-control ${errors.email ? "is-invalid" : ""}`}
                        placeholder="VD: example@gmail.com"
                        value={form.email}
                        onChange={handleChange}
                      />
                      {errors.email && (
                        <div className="invalid-feedback">{errors.email}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Số điện thoại</label>
                      <input
                        name="phoneNumber"
                        inputMode="numeric"
                        maxLength={10}
                        className={`form-control ${errors.phoneNumber ? "is-invalid" : ""}`}
                        placeholder="VD: 0987xxxxxx"
                        value={form.phoneNumber}
                        onChange={handleChange}
                      />
                      {errors.phoneNumber && (
                        <div className="invalid-feedback">{errors.phoneNumber}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Mật khẩu</label>
                      <input
                        name="password"
                        type="password"
                        className={`form-control ${errors.password ? "is-invalid" : ""}`}
                        placeholder="Nhập mật khẩu"
                        value={form.password}
                        onChange={handleChange}
                      />
                      {errors.password && (
                        <div className="invalid-feedback">{errors.password}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Xác nhận mật khẩu</label>
                      <input
                        name="confirmPassword"
                        type="password"
                        className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                        placeholder="Nhập lại mật khẩu"
                        value={form.confirmPassword}
                        onChange={handleChange}
                      />
                      {errors.confirmPassword && (
                        <div className="invalid-feedback">{errors.confirmPassword}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Giới tính</label>
                      <select
                        name="gender"
                        className={`form-select ${errors.gender ? "is-invalid" : ""}`}
                        value={form.gender}
                        onChange={handleChange}
                      >
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                      {errors.gender && (
                        <div className="invalid-feedback">{errors.gender}</div>
                      )}
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Ngày sinh</label>
                      <input
                        name="dateOfBirth"
                        type="date"
                        className={`form-control ${errors.dateOfBirth ? "is-invalid" : ""}`}
                        value={form.dateOfBirth}
                        onChange={handleChange}
                      />
                      {errors.dateOfBirth && (
                        <div className="invalid-feedback">{errors.dateOfBirth}</div>
                      )}
                    </div>

                    <div className="col-12">
                      <label className="form-label">Địa chỉ</label>
                      <input
                        name="address"
                        className={`form-control ${errors.address ? "is-invalid" : ""}`}
                        placeholder="VD: 123 Lý Thường Kiệt, Q.10, TP.HCM"
                        value={form.address}
                        onChange={handleChange}
                      />
                      {errors.address && (
                        <div className="invalid-feedback">{errors.address}</div>
                      )}
                    </div>
                  </div>

                  <button
                    className="btn btn-primary w-100 mt-3"
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? "Đang xử lý..." : "Đăng ký"}
                  </button>
                </form>

                <hr className="my-4" />
                <div className="text-center small">
                  Đã có tài khoản? <a href="/login">Đăng nhập</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
}
