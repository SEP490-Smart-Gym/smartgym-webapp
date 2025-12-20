import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../config/axios";

export default function ConfirmEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const userId = searchParams.get("userId");
  const token = searchParams.get("token");

  const [status, setStatus] = useState("loading"); 
  // loading | success | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId || !token) {
      setStatus("error");
      setMessage("Link xác thực không hợp lệ hoặc thiếu thông tin.");
      return;
    }

    const confirmEmail = async () => {
      try {
        await api.get("/Auth/confirm-email", {
          params: {
            userId,
            token,
          },
        });

        setStatus("success");
        setMessage("Xác thực email thành công! 🎉");
      } catch (err) {
        setStatus("error");
        setMessage(
          err?.response?.data?.message ||
          "Xác thực thất bại hoặc link đã hết hạn."
        );
      }
    };

    confirmEmail();
  }, [userId, token]);

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: 'url("/img/gymbg.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        className="card shadow"
        style={{
          maxWidth: 420,
          width: "100%",
          borderRadius: 12,
          backgroundColor: "rgba(255,255,255,0.96)",
        }}
      >
        <div className="card-body p-4 text-center">
          {status === "loading" && (
            <>
              <h4>Đang xác thực email...</h4>
              <p className="text-muted mt-2">
                Vui lòng chờ trong giây lát
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <h4 className="text-success">🎉 Thành công</h4>
              <p className="mt-2">{message}</p>
              <button
                className="btn btn-primary mt-3 w-100"
                onClick={() => navigate("/login")}
              >
                Đi tới đăng nhập
              </button>
            </>
          )}

          {status === "error" && (
            <>
              <h4 className="text-danger">❌ Thất bại</h4>
              <p className="mt-2">{message}</p>
              <button
                className="btn btn-outline-secondary mt-3 w-100"
                onClick={() => navigate("/")}
              >
                Quay về trang chủ
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
