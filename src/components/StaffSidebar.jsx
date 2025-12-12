import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

import { AiOutlineTool, AiOutlineHome } from "react-icons/ai";
import { TbReportSearch, TbReport } from "react-icons/tb";
import { FaUserCog } from "react-icons/fa";
import { MdHistory } from "react-icons/md";

export default function StaffSidebar() {
  const [open, setOpen] = useState(true);
  const [overlay, setOverlay] = useState(false);

  useEffect(() => {
    const handle = () => {
      const small = window.innerWidth < 992;
      setOpen(!small);
      setOverlay(small);
    };
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  return (
    <>
      {/* Toggle button mobile */}
      <button
        className="btn btn-primary admin-sidebar-toggler d-lg-none"
        onClick={() => setOpen((s) => !s)}
        aria-label="Toggle staff sidebar"
      >
        <i className="fa fa-bars" />
      </button>

      {/* Overlay for mobile */}
      {overlay && open && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        <div className="admin-sidebar-head">
          <div className="brand">
            <i className="fas fa-dumbbell me-2"></i>
            <span className="brand-text">Staff Panel</span>
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
          <div className="admin-side-section">Chức năng</div>
          <NavLink to="/staff/equipmentlist" className="admin-side-item">
            <AiOutlineTool className="icon" />
            <span className="label">Danh sách thiết bị</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>

          <NavLink to="/staff/myreports" className="admin-side-item">
            <TbReportSearch className="icon" />
            <span className="label">Báo cáo của tôi</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>
          <NavLink to="/staff/upcomingschedule" className="admin-side-item">
            <MdHistory className="icon" />
            <span className="label">Lịch bảo trì</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>
          {/* <NavLink to="/staff/repair-history" className="admin-side-item">
            <MdHistory className="icon" />
            <span className="label">Lịch sử sửa chữa</span>
            <i className="fa fa-angle-right caret" />
          </NavLink>

          <NavLink to="/staff/new-report" className="admin-side-item">
            <TbReport className="icon" />
            <span className="label">Tạo báo cáo mới</span>
            <i className="fa fa-angle-right caret" />
          </NavLink> */}
        </nav>
      </aside>
    </>
  );
}
