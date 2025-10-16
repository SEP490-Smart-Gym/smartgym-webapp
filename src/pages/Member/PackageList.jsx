import React, { useEffect } from "react";
import "../../assets/styles/style.css"; // ✅ import CSS ngoài
import { packagesData } from "../Home.jsx";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

const PackageList = () => {
  const fmtVND = (n) => Number(n).toLocaleString("vi-VN");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="mt-5 mb-5">
      <div className="packages">
        {packagesData.map((pkg) => (
          <div className="package" key={pkg.name}>
            {/* Tên gói */}
            <div
              className="package-name"
              style={{
                marginTop: "0.5rem",
                marginBottom: "0.5rem",
                fontWeight: 800,
                letterSpacing: "0.2px",
                textAlign: "center",
              }}
            >
              {pkg.title}
            </div>

            {/* Giá */}
            <div
              className="package-price"
              style={{
                fontSize: "2rem",
                fontWeight: 800,
                lineHeight: 1.1,
                marginTop: "0.25rem",
                textAlign: "center",
              }}
            >
              {fmtVND(pkg.price)} ₫
            </div>

            {/* Thông tin chi tiết */}
            <div className="package-body">
              <div className="package-info">
                <div className="info-item">
                  <AiOutlineCheck className="icon-check" />
                  <span>Thời hạn: {pkg.duration} tháng</span>
                </div>
                <div className="info-item">
                  <AiOutlineCheck className="icon-check" />
                  <span>Số buổi: {pkg.sessions} buổi</span>
                </div>
                <div className="info-item">
                  {pkg.hasPT ? <AiOutlineCheck className="icon-check" /> : <AiOutlineClose className="icon-close"/>}
                  <span>PT kèm: {pkg.hasPT ? "Có" : "Không"}</span>
                </div>
                <div className="info-item">
                  <AiOutlineCheck className="icon-check" />
                  <span>{pkg.description}</span>
                </div>
              </div>

              <button className="btn" type="button">
                Đăng ký ngay
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageList;
