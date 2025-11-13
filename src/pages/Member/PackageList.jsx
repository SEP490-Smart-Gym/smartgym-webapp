import React, { useEffect, useState } from "react";
import "../../assets/styles/style.css";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { Link } from "react-router-dom";
import api from "../../config/axios";
import { message } from "antd";

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  const fmtVND = (n) => Number(n || 0).toLocaleString("vi-VN");

  // Scroll lên đầu khi vào trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Gọi API lấy danh sách gói active
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await api.get("/Package/active");
        setPackages(res.data || []);
      } catch (err) {
        console.error("Fetch packages error:", err);
        if (err.response?.status === 401) {
          message.error("Bạn cần đăng nhập để xem danh sách gói tập.");
        } else {
          message.error("Không thể tải danh sách gói tập!");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  if (loading) {
    return (
      <div className="mt-5 mb-5 text-center">
        Đang tải danh sách gói tập...
      </div>
    );
  }

  return (
    <div className="mt-5 mb-5">
      <div className="packages">
        {packages.map((pkg) => (
          <div className="package" key={pkg.id}>
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
              {pkg.packageName}
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
                  {/* durationInDays là số ngày, nếu bạn muốn ghi "tháng" thì đổi chữ hiển thị */}
                  <span>Thời hạn: {pkg.durationInDays} ngày</span>
                </div>

                <div className="info-item">
                  <AiOutlineCheck className="icon-check" />
                  <span>
                    Số buổi:{" "}
                    {pkg.sessionCount != null ? `${pkg.sessionCount} buổi` : "—"}
                  </span>
                </div>

                <div className="info-item">
                  {pkg.includesPersonalTrainer ? (
                    <AiOutlineCheck className="icon-check" />
                  ) : (
                    <AiOutlineClose className="icon-close" />
                  )}
                  <span>
                    PT kèm: {pkg.includesPersonalTrainer ? "Có" : "Không"}
                  </span>
                </div>

                {/* Mở nếu muốn hiện mô tả từ API
                <div className="info-item">
                  <AiOutlineCheck className="icon-check" />
                  <span>{pkg.description}</span>
                </div>
                */}
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
