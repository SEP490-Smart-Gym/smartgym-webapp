import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import { AiOutlineTool } from "react-icons/ai";
import { RiFileListLine } from "react-icons/ri";
import { FaUsers } from "react-icons/fa";
import { IoConstructOutline } from "react-icons/io5";
import { MdPendingActions } from "react-icons/md";
import { GoGraph } from "react-icons/go";

export default function ManagerSidebar() {
    const [open, setOpen] = useState(true);
    const [overlay, setOverlay] = useState(false);

    // Responsive: auto collapse on small screens
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
            {/* Toggle button (mobile only) */}
            <button
                className="btn btn-primary admin-sidebar-toggler d-lg-none"
                onClick={() => setOpen((s) => !s)}
                aria-label="Toggle manager sidebar"
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

            {/* SIDEBAR */}
            <aside className={`admin-sidebar ${open ? "open" : ""}`}>
                {/* Header */}
                <div className="admin-sidebar-head">
                    <div className="brand">
                        <i className="fas fa-dumbbell me-2"></i>
                        <span className="brand-text">Manager Panel</span>
                    </div>
                    <button
                        className="btn btn-sm btn-light d-lg-none"
                        onClick={() => setOpen(false)}
                        title="Đóng"
                    >
                        <i className="fa fa-times"></i>
                    </button>
                </div>

                {/* MENU ITEMS */}
                <nav className="admin-sidebar-nav">
                    <NavLink to="/manager/dashboard" className="admin-side-item" end>
                        <GoGraph className="me-2"/>
                        <span className="label">Dashboard</span>
                        <i className="fa fa-angle-right caret" />
                    </NavLink>
                    <NavLink to="/manager/equipment-report-all" className="admin-side-item">
                        <RiFileListLine className="me-2" />
                        <span className="label">Báo cáo tổng hợp</span>
                        <i className="fa fa-angle-right caret" />
                    </NavLink>
                    <NavLink to="/manager/equipment-report-pending" className="admin-side-item">
                        <MdPendingActions className="me-2" />
                        <span className="label">Phê duyệt báo cáo</span>
                        <i className="fa fa-angle-right caret" />
                    </NavLink>
                    {/* <NavLink to="/manager/equipments" className="admin-side-item" end>
                        <AiOutlineTool className="me-2" />
                        <span className="label">Thiết bị</span>
                        <i className="fa fa-angle-right caret" />
                    </NavLink> */}
                    <NavLink to="/manager/equipment-create-maintain" className="admin-side-item">
                        <IoConstructOutline className="me-2" />
                        <span className="label">Tạo lịch bảo trì</span>
                        <i className="fa fa-angle-right caret" />
                    </NavLink>
                    {/* <NavLink to="/manager/work-logs" className="admin-side-item">
                        <IoConstructOutline className="me-2" />
                        <span className="label">Lịch sử bảo trì</span>
                        <i className="fa fa-angle-right caret" />
                    </NavLink> */}


                </nav>
            </aside>
        </>
    );
}
