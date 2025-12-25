import { useMemo, useState } from "react";
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

  /** ===================== FORGOT PASSWORD MODAL ===================== */
  const [fpOpen, setFpOpen] = useState(false);
  const [fpEmail, setFpEmail] = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpError, setFpError] = useState("");
  const [fpSuccess, setFpSuccess] = useState("");

  const canSubmitForgot = useMemo(() => {
    return String(fpEmail).trim().length > 0 && !fpLoading;
  }, [fpEmail, fpLoading]);

  const openForgotModal = () => {
    setFpOpen(true);
    setFpEmail(email || ""); // gợi ý sẵn email đang nhập (nếu có)
    setFpError("");
    setFpSuccess("");
  };

  const closeForgotModal = () => {
    if (fpLoading) return; // đang gửi thì không cho đóng (tránh lỗi UX)
    setFpOpen(false);
    setFpError("");
    setFpSuccess("");
  };

  const validateForgotEmail = (val) => {
    const v = String(val || "").trim();
    if (!v) return "Vui lòng nhập email.";
    if (!v.includes("@")) return "Email không hợp lệ.";
    return "";
  };

  const handleForgotPassword = async () => {
    setFpError("");
    setFpSuccess("");

    const vErr = validateForgotEmail(fpEmail);
    if (vErr) {
      setFpError(vErr);
      return;
    }

    setFpLoading(true);
    try {
      await api.post("/Auth/forgot-password", { email: String(fpEmail).trim() });

      setFpSuccess(
        "Yêu cầu đã được gửi. Vui lòng kiểm tra email để nhận link đặt lại mật khẩu."
      );
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        "Không thể gửi yêu cầu. Vui lòng thử lại.";
      setFpError(msg);
    } finally {
      setFpLoading(false);
    }
  };

  // =====================
  // VALIDATE LOGIN
  // =====================
  const validate = () => {
    const e = { email: "", password: "" };

    if (!email.trim()) e.email = "Vui lòng nhập email.";
    else if (!email.includes("@")) e.email = "Email không hợp lệ.";

    if (!password) e.password = "Vui lòng nhập mật khẩu.";
    else if (password.length < 6) e.password = "Mật khẩu phải có ít nhất 6 ký tự.";

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
      else if (userInfo.roleName === "Staff") navigate("/staff/equipmentlist");
      else if (userInfo.roleName === "Manager") navigate("/manager/equipment-report-all");
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
      {/* Modal styles (nhẹ, chuyên nghiệp) */}
      <style>{`
        .sg-modal-backdrop{
          position:fixed; inset:0; background:rgba(15,23,42,.55);
          display:flex; align-items:center; justify-content:center;
          z-index: 2000; padding: 16px;
        }
        .sg-modal{
          width:100%; max-width:520px; border-radius:16px; overflow:hidden;
          background:#fff; box-shadow:0 24px 60px rgba(0,0,0,.25);
          border: 1px solid rgba(226,232,240,.9);
        }
        .sg-modal-header{
          padding:16px 18px; display:flex; align-items:center; justify-content:space-between;
          background: linear-gradient(90deg, rgba(31,59,182,.08), rgba(200,0,54,.06));
          border-bottom:1px solid #e2e8f0;
        }
        .sg-modal-title{ margin:0; font-size:16px; font-weight:900; color:#0f172a; }
        .sg-modal-close{
          border:none; background:transparent; font-size:22px; line-height:1; cursor:pointer;
          color:#64748b; padding:0 6px;
        }
        .sg-modal-body{ padding:16px 18px; }
        .sg-helper{ font-size:13px; color:#475569; margin-bottom:12px; }
        .sg-modal-footer{
          padding:14px 18px; display:flex; gap:10px; justify-content:flex-end;
          border-top:1px solid #e2e8f0; background:#fafafa;
        }
        .sg-btn{
          border-radius:10px; padding:10px 14px; font-weight:800; border:1px solid transparent;
        }
        .sg-btn-secondary{ background:#fff; border-color:#e2e8f0; color:#0f172a; }
        .sg-btn-primary{ background:#c80036; color:#fff; }
        .sg-btn-primary:disabled{ opacity:.6; cursor:not-allowed; }
      `}</style>

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

              {errors.server && <div className="alert alert-danger">{errors.server}</div>}

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
                    autoComplete="email"
                  />
                  {errors.email && <div className="invalid-feedback">{errors.email}</div>}
                </div>

                {/* PASSWORD */}
                <div className="mb-2">
                  <label className="form-label">Mật khẩu</label>
                  <div className="input-group">
                    <input
                      type={showPass ? "text" : "password"}
                      className={`form-control ${errors.password ? "is-invalid" : ""
                        }`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Nhập mật khẩu"
                      autoComplete="current-password"
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
                    <div className="invalid-feedback d-block">{errors.password}</div>
                  )}
                </div>

                {/* FORGOT PASSWORD LINK -> MODAL */}
                <div className="d-flex justify-content-end mb-3">
                  <button
                    type="button"
                    className="btn btn-link p-0 fw-semibold text-decoration-none"
                    onClick={openForgotModal}
                    disabled={loading}
                  >
                    Quên mật khẩu?
                  </button>
                </div>

                <button className="btn btn-add w-100" type="submit" disabled={loading}>
                  {loading ? "Đang xử lý..." : "Đăng nhập"}
                </button>
              </form>

              {/* GOOGLE LOGIN (GIS) */}
              <div className="text-center my-3 text-muted fw-semibold">Hoặc</div>
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

      {/* ===================== FORGOT PASSWORD MODAL ===================== */}
      {fpOpen && (
        <div
          className="sg-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-labelledby="forgotTitle"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeForgotModal();
          }}
        >
          <div className="sg-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="sg-modal-header">
              <h5 id="forgotTitle" className="sg-modal-title">
                Khôi phục mật khẩu
              </h5>
              <button className="sg-modal-close" onClick={closeForgotModal} aria-label="Close">
                ×
              </button>
            </div>

            <div className="sg-modal-body">
              <div className="sg-helper">
                Nhập email tài khoản của bạn. Hệ thống sẽ gửi link đặt lại mật khẩu qua email.
              </div>

              {fpError && <div className="alert alert-danger mb-3">{fpError}</div>}
              {fpSuccess && <div className="alert alert-success mb-3">{fpSuccess}</div>}

              <label className="form-label fw-semibold">Email</label>
              <input
                className={`form-control ${fpError ? "is-invalid" : ""}`}
                value={fpEmail}
                onChange={(e) => setFpEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                disabled={fpLoading}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (canSubmitForgot) handleForgotPassword();
                  }
                }}
              />
              {/* hiển thị lỗi dạng nhỏ nếu muốn */}
              {!fpSuccess && fpError && <div className="invalid-feedback d-block">{fpError}</div>}
            </div>

            <div className="sg-modal-footer">
              <button className="sg-btn sg-btn-secondary" onClick={closeForgotModal} disabled={fpLoading}>
                Đóng
              </button>
              <button
                className="sg-btn sg-btn-primary"
                onClick={handleForgotPassword}
                disabled={!canSubmitForgot}
              >
                {fpLoading ? "Đang gửi..." : "Gửi yêu cầu"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
