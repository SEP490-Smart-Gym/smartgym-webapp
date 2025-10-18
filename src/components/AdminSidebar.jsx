import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  const [open, setOpen] = useState(true);
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    const handle = () => {
      const isSmall = window.innerWidth < 992;
      setOpen(!isSmall);
      setOverlay(isSmall);
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <>
      <button
        className="btn btn-primary admin-sidebar-toggler d-lg-none"
        onClick={() => setOpen((s) => !s)}
        aria-label="Toggle admin sidebar"
      >
        <i className="fa fa-bars" />
      </button>

      {overlay && open && (
        <div className="admin-sidebar-backdrop" onClick={() => setOpen(false)} />
      )}

      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="admin-sidebar-head">
          <div className="brand">
            <i className="fas fa-dumbbell me-2"></i>
            <span className="brand-text">Admin Panel</span>
          </div>
          <button
            className="btn btn-sm btn-light d-lg-none"
            onClick={() => setOpen(false)}
            title="Đóng"
          >
            <i className="fa fa-times"></i>
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <div className="admin-side-section">Management</div>
          <NavLink to="/admin/packages" className="admin-side-item" end>
            <i className="fa fa-box icon" />
            <span className="label">Gói tập</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>
          <NavLink to="/admin/trainers" className="admin-side-item">
            <i className="fa fa-user-tie icon" />
            <span className="label">Huấn luyện viên</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>
          <NavLink to="/admin/equipments" className="admin-side-item">
            <i className="fa fa-users icon" />
            <span className="label">Thiết bị</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>

          <NavLink to="/admin/members" className="admin-side-item">
            <i className="fa fa-users icon" />
            <span className="label">Hội viên</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>

          <div className="admin-side-section">System</div>
          <NavLink to="/admin/settings" className="admin-side-item">
            <i className="fa fa-cog icon" />
            <span className="label">Cài đặt</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>
        </nav>
      </aside>
    </>
  );
}
