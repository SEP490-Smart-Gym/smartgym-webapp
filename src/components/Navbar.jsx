import { NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { HashLink } from "react-router-hash-link";
import { FaSearch } from "react-icons/fa";
import { HiChevronDown, HiChevronUp } from "react-icons/hi2";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

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

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    navigate("/");
  };

  // id an toàn để ghép vào URL
  const safeId = user?.id || user?.uid || "me";

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
          <div className="topbar px-0 py-2 d-none d-lg-block" style={{ height: 45, position: "relative", zIndex: 10 }}>
            <div className="row gx-0 align-items-center">
              <div className="col-lg-8 text-center text-lg-center mb-lg-0">
                <div className="d-flex flex-wrap">
                  <div className="pe-4"></div>
                  <div className="pe-0">
                    <span className=" small" style={{ color: "white" }}>
                      <i className="fa fa-clock text-primary me-2"></i>Mon - Sun: 5.00 am-9.00 pm
                    </span>
                  </div>
                </div>
              </div>

              <div className="col-lg-4 text-center text-lg-end">
                <div className="d-flex justify-content-end align-items-center small">
                  {!user ? (
                    <>
                      <NavLink to="/login" className="login-btn  me-3 pe-3" style={{ color: "white" }}>
                        <span>Login</span>
                      </NavLink>
                      <NavLink to="/register" className=" me-3" style={{ color: "white" }}>
                        Register
                      </NavLink>
                    </>
                  ) : (
                    <div className="dropdown">
                      {/* dùng button thay vì <a href="#"> để tránh scroll lên đầu */}
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
                          style={{ width: 32, height: 32, objectFit: "cover", border: "1px solid #ddd", background: "#f8f9fa" }}
                        />
                        <span className="user-name-text" style={{ color: "white" }}>
                          {user.name || "User"}
                        </span>
                      </button>

                      <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userMenu">
                        {user.email && <li><span className="dropdown-item-text">{user.email}</span></li>}
                        <li><hr className="dropdown-divider" /></li>

                        {/* Admin */}
                        {user.role === "admin" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/admin/packages")}>
                              Quản lý
                            </button>
                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/admin/profile")}>
                              Profile
                            </button>
                          </li>
                        )}

                        {/* Member (role = "member") */}
                        {user.role === "member" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/member/profile")}>
                              Profile
                            </button>

                            <hr className="dropdown-divider" />

                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/member/${safeId}/schedule`)}
                            >
                              My Schedule
                            </button>

                            <hr className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => navigate("/member/mypackages")}>
                              My Packages
                            </button>
                          </li>
                        )}

                        {/* Staff */}
                        {user.role === "staff" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/profile/staff")}>
                              Profile
                            </button>
                          </li>
                        )}

                        {/* Manager */}
                        {user.role === "manager" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/profile/manager")}>
                              Profile
                            </button>
                          </li>
                        )}

                        {/* Trainer */}
                        {user.role === "trainer" && (
                          <li>
                            <button className="dropdown-item" onClick={() => navigate("/trainer/profile")}>
                              Profile
                            </button>
                            <button
                              className="dropdown-item"
                              onClick={() => navigate(`/trainer/${safeId}/schedule`)}
                            >
                              My Schedule
                            </button>
                          </li>
                        )}

                        <hr className="dropdown-divider" />
                        <li>
                          <button className="dropdown-item" onClick={handleLogout}>
                            Logout
                          </button>
                        </li>
                      </ul>
                    </div>
                  )}

                  <div className="d-flex ps-3">
                    <a className="btn p-0 text-primary me-3" href="#"><i className="fab fa-facebook-f"></i></a>
                    <a className="btn p-0 text-primary me-3" href="#"><i className="fab fa-twitter"></i></a>
                    <a className="btn p-0 text-primary me-3" href="#"><i className="fab fa-instagram"></i></a>
                    <a className="btn p-0 text-primary me-0" href="#"><i className="fab fa-linkedin-in"></i></a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Navbar */}
          <div className="nav-bar px-0 py-lg-0" style={{ height: 80 }}>
            <nav className="navbar navbar-expand-lg navbar-light d-flex justify-content-lg-end">
              {/* Brand mobile */}
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
                  <NavLink end to="/" className="nav-item nav-link">Home</NavLink>
                  <HashLink smooth to="/#about-section" className="nav-item nav-link">About</HashLink>
                  <HashLink smooth to="/#package-section" className="nav-item nav-link">Packages</HashLink>
                  <HashLink smooth to="/#blogs-section" className="nav-item nav-link">Blogs</HashLink>

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
                      <span style={{ display: "flex", alignItems: "center" }}>
                        Pages {isOpen ? <HiChevronUp /> : <HiChevronDown />}
                      </span>
                    </button>

                    <div className={`dropdown-menu${isOpen ? " show" : ""}`}>
                      <HashLink smooth to="/#features-section" className="dropdown-item">
                        Our Features
                      </HashLink>
                      <HashLink smooth to="/#trainers-section" className="dropdown-item">
                        Our Trainers
                      </HashLink>
                      <HashLink smooth to="/#testimonial-section" className="dropdown-item">
                        Testimonial
                      </HashLink>
                    </div>
                  </div>

                  <NavLink to="/contact" className="nav-item nav-link">Contact</NavLink>

                  <div className="nav-btn ps-3 d-flex align-items-center" style={{ marginLeft: 300 }}>
                    <button
                      className="btn-search btn btn-primary btn-md-square mt-2 mt-lg-0 mb-4 mb-lg-0 flex-shrink-0"
                      data-bs-toggle="modal"
                      data-bs-target="#searchModal"
                    >
                      <i className="fas fa-search"><FaSearch /></i>
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