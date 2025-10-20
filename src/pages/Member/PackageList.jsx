import React, { useEffect } from "react";
import "../../assets/styles/style.css";
import { packagesData } from "../Home.jsx";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { Link } from "react-router-dom";

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
                {/* <div className="info-item">
                  <AiOutlineCheck className="icon-check" />
                  <span>{pkg.description}</span>
                </div> */}
              </div>

              <Link to={`/packages/${pkg.id}`} className="btn">
                Read More
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PackageList;
