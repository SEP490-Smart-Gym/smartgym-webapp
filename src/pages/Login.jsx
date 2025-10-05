import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext"; // lấy context

export default function Login() {
  const navigate = useNavigate();
  const { loginWithGoogle } = useAuth(); // từ context
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phone: "", password: "", server: "" });

  // Data cứng để test
  const hardcodedUser = {
    phone: "0123456789",
    password: "123456",
  };

  const validate = () => {
    const e = { phone: "", password: "" };
    const phoneDigits = phone.replace(/\D/g, "");

    if (!phoneDigits) {
      e.phone = "Vui lòng nhập số điện thoại.";
    } else if (phoneDigits.length !== 10) {
      e.phone = "Số điện thoại phải đúng 10 số.";
    }

    if (!password) {
      e.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 6) {
      e.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    setErrors(prev => ({ ...prev, ...e }));
    return !e.phone && !e.password;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setErrors({ phone: "", password: "", server: "" });
    if (!validate()) return;

    setLoading(true);
    try {
      const phoneDigits = phone.replace(/\D/g, "");
      if (phoneDigits === hardcodedUser.phone && password === hardcodedUser.password) {
        // giả lập user
        const fakeUser = {
          uid: "hardcoded-uid",
          name: "Test User",
          email: "test@example.com",
          photo: "/img/default-avatar.png",
        };
        localStorage.setItem("user", JSON.stringify(fakeUser));
        navigate("/");
        window.location.reload(); // để context đọc lại user
      } else {
        setErrors(prev => ({ ...prev, server: "Sai số điện thoại hoặc mật khẩu." }));
      }
    } finally {
      setLoading(false);
    }
  };

  // Chỉ cho phép nhập số
  const handlePhoneChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, "");
    setPhone(onlyDigits);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center">
        <div className="col-sm-10 col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <h3 className="card-title mb-3 text-center">Đăng nhập</h3>
              {errors.server && <div className="alert alert-danger py-2">{errors.server}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label htmlFor="phone" className="form-label">Số điện thoại</label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    className={`form-control ${errors.phone ? "is-invalid" : ""}`}
                    placeholder="Nhập số điện thoại của bạn"
                    value={phone}
                    onChange={handlePhoneChange}
                    aria-invalid={errors.phone ? "true" : "false"}
                    aria-describedby={errors.phone ? "phoneHelp" : undefined}
                  />
                  {errors.phone && <div id="phoneHelp" className="invalid-feedback">{errors.phone}</div>}
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Mật khẩu</label>
                  <div className="input-group">
                    <input
                      id="password"
                      name="password"
                      type={showPass ? "text" : "password"}
                      className={`form-control ${errors.password ? "is-invalid" : ""}`}
                      placeholder="Nhập mật khẩu"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      aria-invalid={errors.password ? "true" : "false"}
                      aria-describedby={errors.password ? "pwdHelp" : undefined}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPass(s => !s)}
                      aria-label={showPass ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                    >
                      {showPass ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                  {errors.password && <div id="pwdHelp" className="invalid-feedback d-block">{errors.password}</div>}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="remember" />
                    <label className="form-check-label" htmlFor="remember">Ghi nhớ</label>
                  </div>
                  <a href="/forgot" className="small">Quên mật khẩu?</a>
                </div>

                <button className="btn btn-primary w-100" type="submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
              </form>

              {/* Nút đăng nhập bằng Google */}
              <div className="mt-3">
                <button
                  onClick={loginWithGoogle}
                  className="btn btn-danger w-100"
                  type="button"
                >
                  <i className="fab fa-google me-2"></i> Đăng nhập bằng Google
                </button>
              </div>

              <hr className="my-4" />

              <div className="text-center small">
                Bạn chưa có tài khoản? <a href="/register">Đăng ký</a>
              </div>

              {/* Thông tin test nhanh */}
              <div className="text-center small text-muted mt-3">
                Test nhanh: SĐT <code>0123456789</code> / Mật khẩu <code>123456</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
