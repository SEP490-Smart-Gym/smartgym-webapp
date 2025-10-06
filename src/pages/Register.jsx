import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    const phoneDigits = form.phone.replace(/\D/g, "");

    if (!form.name) e.name = "Vui lòng nhập tên.";
    if (!phoneDigits) e.phone = "Vui lòng nhập số điện thoại.";
    else if (phoneDigits.length !== 10) e.phone = "Số điện thoại phải đúng 10 số.";
    if (!form.email) e.email = "Vui lòng nhập email.";
    else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = "Email không hợp lệ.";
    if (!form.password) e.password = "Vui lòng nhập mật khẩu.";
    else if (form.password.length < 6) e.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Mật khẩu xác nhận không khớp.";

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Giả lập lưu user (cứng) -> localStorage
    const newUser = {
      name: form.name,
      phone: form.phone,
      email: form.email,
      password: form.password
    };

    localStorage.setItem("registeredUser", JSON.stringify(newUser));
    alert("Đăng ký thành công! Vui lòng đăng nhập.");
    navigate("/login");
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-sm-10 col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title mb-3 text-center">Đăng ký</h3>

              <form onSubmit={handleSubmit} noValidate>
                {/* Name */}
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Tên</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    placeholder="Nhập tên của bạn"
                    value={form.name}
                    onChange={handleChange}
                  />
                  {errors.name && <div className="invalid-feedback">{errors.name}</div>}
                </div>

                {/* Phone */}
                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">Số điện thoại</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    placeholder="Nhập số điện thoại"
                    value={form.phone}
                    onChange={handleChange}
                  />
                  {errors.phone && <div className="invalid-feedback">{errors.phone}</div>}
                </div>

                {/* Email */}
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    placeholder="Nhập email"
                    value={form.email}
                    onChange={handleChange}
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* Password */}
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Mật khẩu</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className={`form-control ${errors.password ? "is-invalid" : ""}`}
                    placeholder="Nhập mật khẩu"
                    value={form.password}
                    onChange={handleChange}
                  />
                  {errors.password && <div className="invalid-feedback">{errors.password}</div>}
                </div>

                {/* Confirm Password */}
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                    placeholder="Xác nhận mật khẩu"
                    value={form.confirmPassword}
                    onChange={handleChange}
                  />
                  {errors.confirmPassword && <div className="invalid-feedback">{errors.confirmPassword}</div>}
                </div>

                <button className="btn btn-primary w-100" type="submit">
                  Đăng ký
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
  );
}
