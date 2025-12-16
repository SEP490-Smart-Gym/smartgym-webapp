import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

/* ===== ICONS ===== */
// Common
import { GoGraph } from "react-icons/go";
import { AiOutlineTool, AiOutlineUser } from "react-icons/ai";
import { FaUsers, FaGift } from "react-icons/fa";
import { RiFileListLine } from "react-icons/ri";
import { IoTicketOutline, IoConstructOutline } from "react-icons/io5";
import { CiAlarmOn } from "react-icons/ci";
import { MdHistory, MdPendingActions } from "react-icons/md";
import { TbReportSearch } from "react-icons/tb";
import { GiWhistle } from "react-icons/gi";

/* =======================================================
   MENU CONFIG THEO ROLE
======================================================= */
const MENU_BY_ROLE = {
  Admin: {
    title: "Admin Panel",
    section: "Quản lý",
    items: [
      { to: "/admin/dashboard", label: "Dashboard", icon: <GoGraph /> },
      { to: "/admin/packages", label: "Gói tập", icon: <RiFileListLine /> },
      { to: "/admin/managers", label: "Người Quản lý", icon: <GiWhistle /> },
      { to: "/admin/trainers", label: "Huấn luyện viên", icon: <GiWhistle /> },
      { to: "/admin/staffs", label: "Nhân viên", icon: <FaUsers /> },
      { to: "/admin/members", label: "Hội viên", icon: <AiOutlineUser /> },
      { to: "/admin/equipments", label: "Thiết bị", icon: <AiOutlineTool /> },
      { to: "/admin/promotion-gifts", label: "Quà đổi điểm", icon: <FaGift /> },
      { to: "/admin/vouchers", label: "Mã khuyến mãi", icon: <IoTicketOutline /> },
      { to: "/admin/timeslot", label: "Setting Time Slot", icon: <CiAlarmOn /> },
    ],
  },

  Manager: {
    title: "Manager Panel",
    section: "Chức năng",
    items: [
      { to: "/manager/dashboard", label: "Dashboard", icon: <GoGraph /> },
      {
        to: "/manager/equipment-report-all",
        label: "Báo cáo tổng hợp",
        icon: <RiFileListLine />,
      },
      {
        to: "/manager/equipment-report-pending",
        label: "Phê duyệt báo cáo",
        icon: <MdPendingActions />,
      },
      {
        to: "/manager/equipment-create-maintain",
        label: "Tạo lịch bảo trì",
        icon: <IoConstructOutline />,
      },
    ],
  },

  Staff: {
    title: "Staff Panel",
    section: "Chức năng",
    items: [
      {
        to: "/staff/equipmentlist",
        label: "Danh sách thiết bị",
        icon: <AiOutlineTool />,
      },
      {
        to: "/staff/myreports",
        label: "Báo cáo của tôi",
        icon: <TbReportSearch />,
      },
      {
        to: "/staff/upcomingschedule",
        label: "Lịch bảo trì",
        icon: <MdHistory />,
      },
    ],
  },
};

/* =======================================================
   SIDEBAR COMPONENT
======================================================= */
export default function Sidebar({ role }) {
  const [open, setOpen] = useState(true);
  const [overlay, setOverlay] = useState(false);

  const menu = MENU_BY_ROLE[role];

  /* Responsive collapse */
  useEffect(() => {
    const handleResize = () => {
      const isSmall = window.innerWidth < 992;
      setOpen(!isSmall);
      setOverlay(isSmall);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!menu) return null;

  return (
    <>
      {/* Toggle button (mobile) */}
      <button
        className="btn btn-primary admin-sidebar-toggler d-lg-none"
        onClick={() => setOpen((s) => !s)}
        aria-label="Toggle sidebar"
      >
        <i className="fa fa-bars" />
      </button>

      {/* Overlay */}
      {overlay && open && (
        <div
          className="admin-sidebar-backdrop"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${open ? "open" : ""}`}>
        {/* Header */}
        <div className="admin-sidebar-head">
          <div className="brand">
            <i className="fas fa-dumbbell me-2" />
            <span className="brand-text">{menu.title}</span>
          </div>
          <button
            className="btn btn-sm btn-light d-lg-none"
            onClick={() => setOpen(false)}
          >
            <i className="fa fa-times" />
          </button>
        </div>

        {/* Menu */}
        <nav className="admin-sidebar-nav">
          <div className="admin-side-section">{menu.section}</div>

          {menu.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="admin-side-item"
              end
            >
              {item.icon}
              <span className="label">{item.label}</span>
              <i className="fa fa-angle-right caret" />
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
