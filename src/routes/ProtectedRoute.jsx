import { Navigate, Outlet } from "react-router-dom";

/**
 * Route bảo vệ — kiểm tra login và role
 * @param {Array} allowedRoles - Danh sách role được phép truy cập
 */
export default function ProtectedRoute({ allowedRoles }) {
  const user = JSON.parse(localStorage.getItem("user"));
  const token = localStorage.getItem("token");

  // Nếu chưa đăng nhập → chuyển về /login
  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  // Nếu có giới hạn quyền, nhưng user không nằm trong danh sách → 403
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/403" replace />;
  }

  // Ngược lại cho phép vào route con
  return <Outlet />;
}
