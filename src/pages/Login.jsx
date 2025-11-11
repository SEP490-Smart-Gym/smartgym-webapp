import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../firebase/firebase";

export default function Login() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ phone: "", password: "", server: "" });

    // Data cứng để test
    const hardcodedUsers = [
        {
            phone: "0123456789",
            password: "123456",
            role: "user",
            name: "Test User",
            email: "test@example.com",
            photo: "/img/useravt.jpg",
        },
        {
            phone: "0987654321",
            password: "admin123",
            role: "admin",
            name: "Admin User",
            email: "admin@example.com",
            photo: "/img/useravt.jpg",
        },
        {
            phone: "0123459876",
            password: "staff123",
            role: "staff",
            name: "Staff User",
            email: "staff@example.com",
            photo: "/img/useravt.jpg",
        },
    ];

  const validate = () => {
    const e = { phone: "", password: "" };
    const phoneDigits = phone.replace(/\D/g, "");

    if (!phoneDigits) e.phone = "Vui lòng nhập số điện thoại.";
    else if (phoneDigits.length !== 10) e.phone = "Số điện thoại phải đúng 10 số.";

    if (!password) e.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6) e.password = "Mật khẩu phải có ít nhất 6 ký tự.";

    setErrors(prev => ({ ...prev, ...e }));
    return !e.phone && !e.password;
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const gUser = result.user;

      let photo = gUser.photoURL || "/img/default-avatar.png";
      if (photo.includes("googleusercontent.com")) {
        photo = photo.replace(/=s\d+-c$/, "=s64-c");
      }

      try {
        const res = await fetch(photo, { credentials: "omit", cache: "no-store" });
        if (res.ok) {
          const blob = await res.blob();
          const base64 = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });
          photo = base64;
        }
      } catch (_) {}

      const userObj = {
        uid: gUser.uid,
        id: gUser.uid,                 // ✅ có id để dùng cho route /member/:id
        name: gUser.displayName || "Google User",
        email: gUser.email,
        photo,
        role: "member",                // ✅ role member
      };

      // ✅ Đồng bộ key: lưu vào "user"
      localStorage.setItem("user", JSON.stringify(userObj));
      window.dispatchEvent(new Event("app-auth-changed"));
      navigate("/");                  // hoặc navigate("/member/profile")
    } catch (err) {
      console.error(err);
      setErrors(prev => ({ ...prev, server: "Đăng nhập Google thất bại" }));
    }
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setErrors({ phone: "", password: "", server: "" });
    if (!validate()) return;

    setLoading(true);
    try {
      const phoneDigits = phone.replace(/\D/g, "");
      const matchedUser = hardcodedUsers.find(
        (u) => u.phone === phoneDigits && u.password === password
      );

      if (matchedUser) {
        // ✅ Đồng bộ key: lưu vào "user"
        localStorage.setItem("member", JSON.stringify(matchedUser));
        window.dispatchEvent(new Event("app-auth-changed"));

        setTimeout(() => {
          if (matchedUser.role === "admin") navigate("/admin/packages");
          else navigate("/"); // hoặc "/member/profile"
        }, 100);
      } else {
        setErrors((prev) => ({
          ...prev,
          server: "Sai số điện thoại hoặc mật khẩu.",
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneChange = (e) => {
    const onlyDigits = e.target.value.replace(/\D/g, "");
    setPhone(onlyDigits);
  };

  return (
    <div
      className="login-bg container-fluid py-5"
      style={{
        backgroundImage: 'url("/img/header-1.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        minHeight: "100vh",
      }}>
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

                <button className="btn btn-primary w-100" type="submit" disabled={loading} style={{ transform: "none" }}>
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
              </form>

              <div className="d-flex align-items-center mt-2 justify-content-center">
                <span className="me-3 text-muted fw-semibold">Hoặc</span>
                <button onClick={loginWithGoogle} className="google-button">
                  {/* SVG Google */}
                  <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262">
                    <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"/>
                    <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"/>
                    <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"/>
                    <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"/>
                  </svg>
                  Đăng nhập bằng Google
                </button>
              </div>

              <hr className="my-4" />

              <div className="text-center small">
                Bạn chưa có tài khoản? <a href="/register">Đăng ký</a>
              </div>

              <div className="text-center small text-muted mt-3">
                Test nhanh:<br />
                <code>0123456789</code> / <code>123456</code> → Member<br />
                <code>0987654321</code> / <code>admin123</code> → Admin
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
