import { signInWithPopup } from "firebase/auth";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, googleProvider } from "../config/firebase";
import api from "../config/axios";
export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const [errors, setErrors] = useState({
    email: "",
    password: "",
    server: "",
  });

  // ✅ Validate
  const validate = () => {
    const e = { email: "", password: "" };

    if (!email.trim()) e.email = "Vui lòng nhập email.";
    else if (!email.includes("@")) e.email = "Email không hợp lệ.";

    if (!password) e.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6) e.password = "Mật khẩu phải có ít nhất 6 ký tự.";

    setErrors(prev => ({ ...prev, ...e }));
    return !e.email && !e.password;
  };

  // ✅ LOGIN GOOGLE – GIỮ NGUYÊN
  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const gUser = result.user;

      let photo = gUser.photoURL || "/img/default-avatar.png";

      const userObj = {
        id: gUser.uid,
        name: gUser.displayName,
        email: gUser.email,
        photo,
        roleName: "Member",
      };

      localStorage.setItem("user", JSON.stringify(userObj));
      localStorage.setItem("token", "GOOGLE_LOGIN");

      window.dispatchEvent(new Event("app-auth-changed"));
      navigate("/");
    } catch (err) {
      setErrors(prev => ({ ...prev, server: "Đăng nhập Google thất bại" }));
    }
  };

  // ✅ LOGIN BACKEND
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setErrors({ email: "", password: "", server: "" });

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await api.post("/Auth/login", {
        email,
        password,
      });

      const data = res.data;

      // ✅ Lưu token
      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      // ✅ Lưu user
      const userObj = {
        id: data.userId,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        roleName: data.roleName,
      };

      localStorage.setItem("user", JSON.stringify(userObj));

      // ✅ bắn event update UI header/menu
      window.dispatchEvent(new Event("app-auth-changed"));

      // ✅ Điều hướng theo role
      if (data.roleName === "Admin") navigate("/admin/packages");
      else if (data.roleName === "Staff") navigate("/staff/equipment");
      else navigate("/");

    } catch (err) {
      let msg =
        err.response?.data?.message ||
        "Sai email hoặc mật khẩu.";

      setErrors(prev => ({ ...prev, server: msg }));
    }

    setLoading(false);
  };

  return (
    <div
      className="login-bg container-fluid py-5"
      style={{
        backgroundImage: 'url("/img/header-1.jpg")',
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      <div className="row justify-content-center">
        <div className="col-sm-10 col-md-8 col-lg-5">
          <div className="card shadow-sm">
            <div className="card-body p-4">

              <h3 className="text-center mb-3">Đăng nhập</h3>

              {errors.server && (
                <div className="alert alert-danger">{errors.server}</div>
              )}

              <form onSubmit={handleSubmit}>

                {/* EMAIL */}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    className={`form-control ${errors.email ? "is-invalid" : ""}`}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Nhập email"
                  />
                  {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )}
                </div>

                {/* PASSWORD */}
                <div className="mb-3">
                  <label className="form-label">Mật khẩu</label>
                  <div className="input-group">
                    <input
                      type={showPass ? "text" : "password"}
                      className={`form-control ${errors.password ? "is-invalid" : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPass(s => !s)}
                    >
                      {showPass ? "Ẩn" : "Hiện"}
                    </button>
                  </div>
                  {errors.password && (
                    <div className="invalid-feedback d-block">
                      {errors.password}
                    </div>
                  )}
                </div>

                <button className="btn btn-add w-100" type="submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
              </form>
              <span className="me-3 text-muted fw-semibold">Hoặc</span>
              {/* GOOGLE LOGIN */}
              <div className="d-flex justify-content-center mt-3">
                <button onClick={loginWithGoogle} className="google-button"> {/* SVG Google */} <svg xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid" viewBox="0 0 256 262"> <path fill="#4285F4" d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 
                12.04-9.283 30.172-26.69 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 
                38.875-56.282 38.875-96.027" /> <path fill="#34A853" d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 
                7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 
                1.465C35.393 231.798 79.49 261.1 130.55 261.1" /> <path fill="#FBBC05" d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 
                109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782" /> <path fill="#EB4335" d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 
                71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251" />
                </svg>
                  Đăng nhập bằng Google
                </button>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
