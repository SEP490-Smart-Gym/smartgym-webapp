// src/pages/Auth/ResetPassword.jsx
import React, { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import api from "../config/axios";
import { message } from "antd";

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function ResetPassword() {
  const q = useQuery();
  const navigate = useNavigate();

  const token = useMemo(() => (q.get("token") || "").trim(), [q]);

  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);

  const canSubmit = useMemo(() => {
    return !loading && token && newPassword.trim() && confirm.trim();
  }, [loading, token, newPassword, confirm]);

  const validate = () => {
    const np = newPassword.trim();
    const cf = confirm.trim();

    if (!token) return "Link reset không hợp lệ hoặc thiếu token.";
    if (!np) return "Vui lòng nhập mật khẩu mới.";
    if (np.length < 6) return "Mật khẩu mới phải có ít nhất 6 ký tự.";
    if (!cf) return "Vui lòng xác nhận mật khẩu.";
    if (np !== cf) return "Mật khẩu xác nhận không khớp.";
    return "";
  };

  const handleSubmit = async (e) => {
    e?.preventDefault?.();

    const err = validate();
    if (err) {
      message.error(err);
      return;
    }

    setLoading(true);
    try {
      await api.post("/Auth/reset-password", {
        token,
        newPassword: newPassword.trim(),
      });

      message.success("Đổi mật khẩu thành công. Vui lòng đăng nhập lại.");
      navigate("/login", { replace: true });
    } catch (err2) {
      const apiMsg = err2?.response?.data?.message || err2?.response?.data?.title;
      message.error(apiMsg || "Không thể đặt lại mật khẩu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0b1220",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <div style={{ width: "100%", maxWidth: 460, position: "relative" }}>
        {/* glow */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -120,
            width: 260,
            height: 260,
            borderRadius: 260,
            background: "rgba(31,59,182,0.35)",
            filter: "blur(0px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 120,
            right: -140,
            width: 300,
            height: 300,
            borderRadius: 300,
            background: "rgba(16,185,129,0.18)",
          }}
        />

        {/* card */}
        <div
          style={{
            position: "relative",
            background: "rgba(255,255,255,0.96)",
            borderRadius: 18,
            padding: 18,
            border: "1px solid rgba(226,232,240,0.9)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "#1f3bb6",
                color: "#fff",
                display: "grid",
                placeItems: "center",
                fontWeight: 900,
              }}
            >
              SG
            </div>
            <div>
              <div style={{ color: "#0f172a", fontSize: 18, fontWeight: 900 }}>Smart Gym</div>
              <div style={{ color: "#64748b", fontSize: 12, fontWeight: 700 }}>Reset mật khẩu</div>
            </div>
          </div>

          <h2 style={{ margin: "6px 0 0", color: "#0f172a", fontWeight: 900 }}>
            Đặt lại mật khẩu
          </h2>
          <p style={{ margin: "6px 0 0", color: "#475569", fontSize: 13, lineHeight: 1.5 }}>
            Nhập mật khẩu mới và xác nhận. Token được lấy từ đường dẫn.
          </p>

          {!token && (
            <div
              style={{
                marginTop: 12,
                background: "#fee4e2",
                border: "1px solid #fca5a5",
                borderRadius: 12,
                padding: "10px 12px",
                color: "#7f1d1d",
                fontWeight: 800,
                fontSize: 13,
              }}
            >
              Thiếu token. Hãy mở lại link reset từ email.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <label style={labelStyle}>Mật khẩu mới</label>
            <div style={inputWrapStyle}>
              <input
                type={showPw ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••"
                style={inputStyle}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPw((p) => !p)}
                style={eyeBtnStyle}
                aria-label="toggle password"
              >
                {showPw ? "Ẩn" : "Hiện"}
              </button>
            </div>

            <label style={labelStyle}>Xác nhận mật khẩu</label>
            <div style={inputWrapStyle}>
              <input
                type={showCf ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••"
                style={inputStyle}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowCf((p) => !p)}
                style={eyeBtnStyle}
                aria-label="toggle confirm"
              >
                {showCf ? "Ẩn" : "Hiện"}
              </button>
            </div>

            <button
              type="submit"
              disabled={!canSubmit}
              style={{
                marginTop: 16,
                width: "100%",
                height: 50,
                borderRadius: 14,
                border: "none",
                background: "#1f3bb6",
                color: "#fff",
                fontWeight: 900,
                cursor: canSubmit ? "pointer" : "not-allowed",
                opacity: canSubmit ? 1 : 0.6,
                boxShadow: "0 14px 26px rgba(31,59,182,0.25)",
              }}
            >
              {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
            </button>
          </form>

          <div style={{ marginTop: 12, textAlign: "center" }}>
            <Link to="/login" style={{ color: "#1f3bb6", fontWeight: 900, fontSize: 13 }}>
              Quay về đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginTop: 12,
  marginBottom: 6,
  color: "#0f172a",
  fontWeight: 900,
  fontSize: 13,
};

const inputWrapStyle = {
  position: "relative",
  border: "1px solid #e2e8f0",
  borderRadius: 14,
  background: "#fff",
  display: "flex",
  alignItems: "center",
  height: 48,
  padding: "0 12px",
};

const inputStyle = {
  width: "100%",
  border: "none",
  outline: "none",
  fontSize: 14,
  color: "#0f172a",
  paddingRight: 56,
  background: "transparent",
};

const eyeBtnStyle = {
  position: "absolute",
  right: 10,
  height: 34,
  padding: "0 10px",
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  background: "#fff",
  cursor: "pointer",
  fontWeight: 800,
  color: "#334155",
};
