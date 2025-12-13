import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { HashLink } from "react-router-hash-link";
import { FaSearch } from "react-icons/fa";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";
import api from "../config/axios"; // ✅ chỉnh path nếu file Navbar nằm chỗ khác

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // ✅ points state lấy từ API
  const [availablePoints, setAvailablePoints] = useState(0);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    setUser(storedUser ? JSON.parse(storedUser) : null);

    const handleAuthChange = () => {
      const updatedUser = localStorage.getItem("user");
      setUser(updatedUser ? JSON.parse(updatedUser) : null);
    };

    window.addEventListener("app-auth-changed", handleAuthChange);
    return () => window.removeEventListener("app-auth-changed", handleAuthChange);
  }, []);

  useEffect(() => {
    const refreshUser = () => {
      const u = localStorage.getItem("user");
      setUser(u ? JSON.parse(u) : null);
    };

    const storageHandler = (e) => {
      if (e.key === "user") refreshUser();
    };

    window.addEventListener("app-auth-changed", refreshUser);
    window.addEventListener("storage", storageHandler);

    return () => {
      window.removeEventListener("app-auth-changed", refreshUser);
      window.removeEventListener("storage", storageHandler);
    };
  }, []);

  // ✅ fetch availablePoints từ /Loyalty/balance
  useEffect(() => {
    let cancelled = false;

    const fetchPoints = async () => {
      try {
        if (!user || user.roleName !== "Member") {
          if (!cancelled) setAvailablePoints(0);
          return;
        }

        const memberId = user?.id ?? user?.memberId ?? user?.uid;
        if (!memberId) {
          if (!cancelled) setAvailablePoints(0);
          return;
        }

        const res = await api.get("/Loyalty/balance", {
          params: { memberId }, // ✅ backend đang trả theo memberId
        });

        const data = res?.data || {};
        const points = Number(data.availablePoints ?? 0);

        if (!cancelled) setAvailablePoints(Number.isFinite(points) ? points : 0);
      } catch (err) {
        console.error("Fetch loyalty balance error:", err);
        if (!cancelled) setAvailablePoints(0);
      }
    };

    fetchPoints();

    return () => {
      cancelled = true;
    };
  }, [user?.roleName, user?.id, user?.memberId, user?.uid]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setAvailablePoints(0);
    navigate("/");
  };

  const safeId = user?.id || user?.uid || "me";

  // route tới trang lịch sử điểm thưởng
  const goToPointsHistory = (e) => {
    e.stopPropagation();
    navigate("/member/points-history");
  };

  return (
    <div className="container-fluid header-top">
      <div className="nav-shaps-2"></div>

      <div className="container d-flex align-items-center">
        {/* Brand trái */}
        <div className="d-flex align-items-center h-100">
          <NavLink to="/" className="navbar-brand" style={{ height: 125 }}>
            <h1 className="text-primary mb-0">
              <i className="fas fa-hand-rock me-2"></i> Fitness
            </h1>
          </NavLink>
        </div>

        {/* Phần phải */}
        <div className="w-100 h-100">
          {/* Topbar */}
          <div
            className="topbar px-0 py-2 d-none d-lg-block"
            style={{ height: 45, position: "relative", zIndex: 10 }}
          >
            <div className="row gx-0 align-items-center">
              <div className="col-lg-8 text-center text-lg-center mb-lg-0">
                <div className="d-flex flex-wrap">
                  <div className="pe-4"></div>
                  <div className="pe-0">
                    <span className=" small" style={{ color: "white" }}>
                      <i className="fa fa-clock text-primary me-2"></i>
                      Thứ Hai - Chủ Nhật: 6.00 am - 10.00 pm
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 text-center text-lg-end">
                <div className="d-flex justify-content-end align-items-center small">
                  {!user ? (
                    <>
                      <NavLink
                        to="/login"
                        className="login-btn  me-3 pe-3"
                        style={{ color: "white" }}
                      >
                        <span>Đăng nhập</span>
                      </NavLink>
                      <NavLink to="/register" className=" me-3" style={{ color: "white" }}>
                        Đăng ký
                      </NavLink>
                    </>
                  ) : (
                    <div className="dropdown">
                      <button
                        className="d-flex align-items-center dropdown-toggle text-body btn btn-link p-0 text-decoration-none"
                        id="userMenu"
                        data-bs-toggle="dropdown"
                        aria-expanded="false"
                        type="button"
                      >
                        <img
                          src={user?.photo || "/img/useravt.jpg"}
                          alt="avatar"
                          className="rounded-circle me-2"
                          referrerPolicy="no-referrer"
                          crossOrigin="anonymous"
                          onError={(e) => {
                            e.currentTarget.src = "/img/useravt.jpg";
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            objectFit: "cover",
                            border: "1px solid #ddd",
                            background: "#f8f9fa",
                          }}
                        />

                        {/* username + điểm thưởng */}
                        <div className="d-flex align-items-center">
                          <span className="user-name-text" style={{ color: "white" }}>
                            {user.lastName && user.firstName ? `${user.lastName} ${user.firstName}` : "User"}
                          </span>

                          {/* ✅ availablePoints from API */}
                          {user.roleName === "Member" && (
                            <span
                              className="d-inline-flex align-items-center reward-points-badge"
                              style={{
                                color: "#ffd966",
                                fontWeight: 600,
                                fontSize: "0.9rem",
                                cursor: "pointer",
                                marginLeft: "20px",
                              }}
                              onClick={goToPointsHistory}
                              title="Xem lịch sử điểm thưởng"
                            >
                              {(Number(availablePoints) || 0).toLocaleString("vi-VN")} điểm
                            </span>
                          )}
                        </div>
                      </button>

                      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                        {user.email && (
                          <li>
                            <span className="dropdown-item-text">{user.email}</span>
                          </li>
                        )}
                        <li>
                          <hr className="dropdown-divider" />
                        </li>

                        {/* Admin */}
                        {user.roleName === "Admin" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/admin/packages")}>
                              Quản lý
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/admin/profile")}>
                              Hồ sơ cá nhân
                            </button>
                          </li>
                        )}

                        {/* Member */}
                        {user.roleName === "Member" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/member/profile")}>
                              Hồ sơ cá nhân
                            </button>

                            <hr className="dropdown-divider" />

                            <button className="dropdown-item" onClick={() => navigate(`/member/${safeId}/schedule`)}>
                              Lịch tập
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/member/workout-meal-plan")}>
                              Kế hoạch tập luyện & dinh dưỡng
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/member/mypackages")}>
                              Gói tập của tôi
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/member/my-payments")}>
                              Lịch sử thanh toán
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/member/reward-gifts")}>
                              Đổi quà
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/member/voucher")}>
                              Mã giảm giá
                            </button>
                          </li>
                        )}

                        {/* Staff */}
                        {user.roleName === "Staff" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/profile/staff")}>
                              Hồ sơ cá nhân
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate(`/staff/chat-list`)}>
                              Chat với Học viên
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/staff/reward-redemption")}>
                              Quản lý đổi quà
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("staff/equipmentlist")}>
                              Quản lý thiết bị
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/staff/schedule")}>
                              Lịch làm việc
                            </button>
                          </li>
                        )}

                        {/* Manager */}
                        {user.roleName === "Manager" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/profile/manager")}>
                              Hồ sơ cá nhân
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/manager/manager-refund")}>
                              Quản lý Hoàn tiền
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/manager/schedule")}>
                              Quản lý lịch làm việc
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/manager/equipment-report-all")}>
                              Quản lý thiết bị
                            </button>
                          </li>
                        )}

                        {/* Trainer */}
                        {user.roleName === "Trainer" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/trainer/profile")}>
                              Hồ sơ cá nhân
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate(`/trainer/${safeId}/schedule`)}>
                              Lịch làm việc
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate(`/trainer/member-list`)}>
                              Quản lý học viên
                            </button>
                          </li>
                        )}

                        <hr className="dropdown-divider" />
                        <li>
                          <button className="dropdown-item" onClick={handleLogout}>
                            Đăng xuất
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="d-flex ps-3">
                    <a className="btn p-0 text-primary me-3" href="#">
                      <i className="fab fa-facebook-f"></i>
                    </a>
                    <a className="btn p-0 text-primary me-3" href="#">
                      <i className="fab fa-twitter"></i>
                    </a>
                    <a className="btn p-0 text-primary me-3" href="#">
                      <i className="fab fa-instagram"></i>
                    </a>
                    <a className="btn p-0 text-primary me-0" href="#">
                      <i className="fab fa-linkedin-in"></i>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navbar */}
          <div className="nav-bar px-0 py-lg-0" style={{ height: 80 }}>
            <nav className="navbar navbar-expand-lg navbar-light d-flex justify-content-lg-end">
              <NavLink to="/" className="navbar-brand-2 d-lg-none">
                <h1 className="text-primary mb-0">
                  <i className="fas fa-hand-rock me-2"></i> Fitness
                </h1>
              </NavLink>

              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarCollapse">
                <span className="fa fa-bars"></span>
              </button>

              <div className="collapse navbar-collapse" id="navbarCollapse">
                <div className="navbar-nav mx-0 mx-lg-auto nav-chip">
                  <NavLink end to="/" className="nav-item nav-link">
                    Trang chủ
                  </NavLink>
                  <HashLink
                    smooth
                    to="/#about-section"
                    className="nav-item nav-link"
                  >
                    Về Chúng Tôi
                  </HashLink>

                  <HashLink smooth to="/#package-section" className="nav-item nav-link">
                    Gói tập
                  </HashLink>

                  <HashLink smooth to="/#blogs-section" className="nav-item nav-link">
                    Blogs
                  </HashLink>

                  {user?.roleName == "Trainer" && (
                    <NavLink to="/trainer/chatlist" className="nav-item nav-link">
                      Chat
                    </NavLink>
                  )}
                  {user?.roleName == "Member" &&(
                    <NavLink to="/chat" className="nav-item nav-link">
                      Chat
                    </NavLink>
                  )}

                  {user?.roleName == "Staff" &&(
                    <NavLink to="/staff/chatlist" className="nav-item nav-link">
                      Chat
                    </NavLink>
                  )}

                  <div
                    className={`nav-item dropdown ${isOpen ? "show" : ""}`}
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                  >
                    <button
                      className="nav-link btn btn-link p-0 text-decoration-none"
                      data-bs-toggle="dropdown"
                      aria-expanded={isOpen}
                      type="button"
                    >
                      <span
                        style={{
                          display: "flex",
                          alignItems: "center",
                        }}
                      >
                        Các Trang {isOpen ? <HiChevronUp /> : <HiChevronDown />}
                      </span>
                    </button>

                    <div
                      className={`dropdown-menu${isOpen ? " show" : ""}`}
                    >
                      <HashLink
                        smooth
                        to="/#features-section"
                        className="dropdown-item"
                      >
                        Tính Năng 
                      </HashLink>
                      <HashLink smooth to="/#trainers-section" className="dropdown-item">
                        Huấn luyện viên
                      </HashLink>
                    </div>
                  </div>

                  <HashLink smooth to="/#feedback-section" className="nav-item nav-link">
                    Đánh giá
                  </HashLink>

                  <NavLink to="/contact" className="nav-item nav-link">
                    Liên hệ
                   </NavLink>

                  <div className="nav-btn ps-3 d-flex align-items-center" style={{ marginLeft: 300 }}>
                    <button
                      className="btn-search btn btn-primary btn-md-square mt-2 mt-lg-0 mb-4 mb-lg-0 flex-shrink-0"
                      data-bs-toggle="modal"
                      data-bs-target="#searchModal"
                    >
                      <i className="fas fa-search">
                        <FaSearch />
                      </i>
                    </button>
                  </div>

                  <div className="nav-shaps-1"></div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
