import { BsArrowUp } from "react-icons/bs";
import FloatingChatWidget from "./FloatingChatWidget";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
export default function Footer() {

  const user = JSON.parse(localStorage.getItem("user")) || { roleName: "guest" };
  const location = useLocation();

  const isChatPage =
    location.pathname.startsWith("/chat") ||
    location.pathname.startsWith("/member/chat") ||
    location.pathname.startsWith("/staff/chat") ||
    location.pathname.startsWith("/trainer/chat");

  return (
    <>
      {/* Footer */}
      <div className="container-fluid footer py-5">
        <div className="container py-5">
          <div className="row g-5 mb-5 align-items-center">
            <div className="col-lg-7">
              <div className="position-relative d-flex" style={{ transform: "skew(18deg)" }}>
                <input className="form-control border-0 w-100 py-3 pe-5" type="text" placeholder="Email address to Subscribe" />
                <button type="button" className="btn-primary py-2 px-4 ms-3">
                  <span>Subscribe</span>
                </button>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="d-flex align-items-center justify-content-center justify-content-lg-end">
                <a className="btn btn-primary btn-md-square me-3" href=""><i className="fab fa-facebook-f"></i></a>
                <a className="btn btn-primary btn-md-square me-3" href=""><i className="fab fa-twitter"></i></a>
                <a className="btn btn-primary btn-md-square me-3" href=""><i className="fab fa-instagram"></i></a>
                <a className="btn btn-primary btn-md-square me-0" href=""><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
          </div>

          <div className="row g-5">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-white mb-4">
                  <i className="fas fa-hand-rock text-primary me-2"></i> Fitness
                </h4>
                <p className="mb-0">
                  Phòng gym của chúng tôi được trang bị hiện đại, không gian thoáng rộng và luôn duy trì môi trường luyện tập thoải mái nhất cho mọi hội viên.                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-white mb-4">Các Đường Dẫn Nhanh</h4>
                <a href="#"> Trang Chủ</a>
                <a href="#"> Về Chúng Tôi</a>
                <a href="#"> Các Khóa Của Chúng Tôi</a>
                <a href="#"> Các Tính Năng Của Chúng Tôi</a>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-white mb-4"> Thông Tin Liên Hệ</h4>
                <div className="row g-2">
                  <div className="col-12">
                    <div className="d-flex">
                      <i className="fas fa-map-marker-alt text-primary me-2"></i>
                      <div>
                        <h5 className="text-white mb-2">Địa Chỉ</h5>
                        <p className="mb-0">7 Đường D1, Long Thạnh Mỹ, Thủ Đức, Hồ Chí Minh</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex">
                      <i className="fas fa-envelope text-primary me-2"></i>
                      <div>
                        <h5 className="text-white mb-2">Gửi Mail Cho Chúng Tôi</h5>
                        <p className="mb-0">fitness@gmail.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex">
                      <i className="fa fa-phone-alt text-primary me-2"></i>
                      <div>
                        <h5 className="text-white mb-2">Số Điện Thoại</h5>
                        <p className="mb-0">(+084) 123456789</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-white mb-4">Recent Work</h4>
                <div className="row g-2">
                  {["work-9.jpg", "work-10.jpg", "work-11.jpg", "work-12.jpg", "work-1.jpg", "work-2.jpg", "work-3.jpg", "work-4.jpg", "work-5.jpg", "work-6.jpg", "work-7.jpg", "work-8.jpg"].map((w, i) => (
                    <div className="col-3" key={i}>
                      <div className="footer-item-img">
                        <a href="#"><img src={`/img/${w}`} className="img-fluid" alt="" /></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="container-fluid copyright py-4">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-6 text-center text-md-start mb-md-0">
              <span className="text-body">
                {/* <a href="#" className="border-bottom text-white">
                  <i className="fas fa-copyright text-light me-2"></i>Your Site Name
                </a> */}
                , All right reserved.
              </span>
            </div>
            {/* <div className="col-md-6 text-center text-md-end text-body">
              Designed By{" "}
              <a className="border-bottom text-white" href="https://htmlcodex.com" target="_blank" rel="noreferrer">
                HTML Codex
              </a>{" "}
              Distributed By{" "}
              <a href="https://themewagon.com/" target="_blank" rel="noreferrer">
                ThemeWagon
              </a>
            </div> */}
          </div>
        </div>
      </div>
      {!isChatPage && (user.roleName === "Member" || user.roleName === "guest") && (
        <FloatingChatWidget />
      )}

      {!isChatPage && (user.roleName === "Member" || user.roleName === "guest") && (
        <>
          {user.roleName !== "Admin" && (
            <div className="back-to-top">
              <button
                className="btn"
                onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                aria-label="Back to top"
              >
                <BsArrowUp />
              </button>
            </div>
          )}
        </>
      )}



    </>
  );
}
