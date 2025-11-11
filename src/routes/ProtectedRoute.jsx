import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const token = localStorage.getItem("token");

  // Lắng nghe event thay đổi đăng nhập
  useEffect(() => {
    const syncUser = () => {
      const stored = localStorage.getItem("user");
      setUser(stored ? JSON.parse(stored) : null);
    };
    window.addEventListener("app-auth-changed", syncUser);
    return () => window.removeEventListener("app-auth-changed", syncUser);
  }, []);

  // ✅ Chưa đăng nhập → chuyển login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Kiểm tra role bằng API roleName
  const userRole = user.roleName || user.role || ""; // fallback để tránh lỗi

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
