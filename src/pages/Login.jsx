import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../config/axios";
import GoogleLoginButton from "../components/GoogleLoginButton";
import { ArrowLeftOutlined } from "@ant-design/icons";


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

  // =====================
  // VALIDATE
  // =====================
  const validate = () => {
    const e = { email: "", password: "" };

    if (!email.trim()) e.email = "Vui lòng nhập email.";
    else if (!email.includes("@")) e.email = "Email không hợp lệ.";

    if (!password) e.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6)
      e.password = "Mật khẩu phải có ít nhất 6 ký tự.";

    setErrors((prev) => ({ ...prev, ...e }));
    return !e.email && !e.password;
  };

  // =====================
  // LOGIN EMAIL / PASSWORD
  // =====================
  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setErrors({ email: "", password: "", server: "" });

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await api.post("/Auth/login", { email, password });
      const data = res.data;

      localStorage.setItem("token", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      const me = await api.get("/UserAccount/me");
      const userInfo = me.data;

      localStorage.setItem(
        "user",
        JSON.stringify({
          id: userInfo.userId,
          email: userInfo.email,
          firstName: userInfo.firstName,
          lastName: userInfo.lastName,
          roleName: userInfo.roleName,
          photo: userInfo.profileImageUrl,
        })
      );

      window.dispatchEvent(new Event("app-auth-changed"));

      if (userInfo.roleName === "Admin") navigate("/admin/dashboard");
      else if (userInfo.roleName === "Staff")
        navigate("/staff/equipmentlist");
      else if (userInfo.roleName === "Manager")
        navigate("/manager/equipment-report-all");
      else navigate("/");
    } catch (err) {
      setErrors((prev) => ({
        ...prev,
        server: err.response?.data?.message || "Sai email hoặc mật khẩu.",
      }));
    } finally {
      setLoading(false);
    }
  };

  // =====================
  // UI
  // =====================
  return (
    <div
      className="login-bg container-fluid py-5"
      style={{
        backgroundImage: 'url("/img/gymbg.jpg")',
        backgroundSize: "cover",
        minHeight: "100vh",
      }}
    >
      <div className="row justify-content-center">
        <div className="col-sm-10 col-md-8 col-lg-5">
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
              <h3 className="text-center mb-3">Đăng nhập</h3>

              {errors.server && (
                <div className="alert alert-danger">{errors.server}</div>
              )}

              <form onSubmit={handleSubmit}>
                {/* EMAIL */}
                <div className="mb-3">
                  <label className="form-label">Email</label>
                  <input
                    className={`form-control ${errors.email ? "is-invalid" : ""
                      }`}
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
                      className={`form-control ${errors.password ? "is-invalid" : ""
                        }`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowPass((s) => !s)}
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

                <button
                  className="btn btn-add w-100"
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
              </form>

              {/* GOOGLE LOGIN (GIS) */}
              <div className="text-center my-3 text-muted fw-semibold">
                Hoặc
              </div>

              <GoogleLoginButton />
              <div className="text-center mt-3">
                <span className="text-muted">Bạn chưa có tài khoản? </span>
                <span
                  onClick={() => navigate("/register")}
                  style={{
                    color: "#c4002f",
                    fontWeight: 600,
                    cursor: "pointer",
                    textDecoration: "underline",
                  }}
                >
                  Đăng ký
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
