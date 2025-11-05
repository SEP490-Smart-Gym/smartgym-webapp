// src/components/PackageDetail.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { packagesData } from "../Home.jsx";
import "../../assets/styles/style.css";

const fmtVND = (n) => Number(n).toLocaleString("vi-VN");

export default function PackageDetail() {
  const { id: routeId } = useParams();

  const pkg = useMemo(
    () => packagesData.find((p) => String(p.id) === String(routeId)),
    [routeId]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const [safeId, setSafeId] = useState(null);
  const navigate = useNavigate();

  // 🆕 Khi load, sinh ID 4 số ngẫu nhiên
  useEffect(() => {
    const random4 = Math.floor(1000 + Math.random() * 9000);
    setSafeId(random4.toString());
  }, []);

  const featureImgs = [
    "/img/feature-1.jpg",
    "/img/feature-2.jpg",
    "/img/feature-3.jpg",
    "/img/feature-4.jpg",
  ];
  const iconIndex = Number.isFinite(pkg?.iconIndex) && pkg.iconIndex > 0 ? pkg.iconIndex : 1;
  const mainCandidate = featureImgs[(iconIndex - 1) % featureImgs.length];
  const thumbnails = [mainCandidate, featureImgs[1], featureImgs[2], featureImgs[3]];
  const mainImage = thumbnails[activeIndex];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % thumbnails.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [thumbnails.length]);

  if (!pkg) {
    return (
      <div className="container mt-5 mb-5 text-center">
        <h3>Không tìm thấy gói tập</h3>
        <Link to="/packages" className="btn btn-primary mt-3">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="container mt-5 mb-5">
      <div className="row align-items-start">
        {/* Left: Gallery */}
        <div className="col-md-6 mb-4">
          <img
            src={mainImage}
            alt={pkg.title}
            className="img-fluid mb-3"
            style={{
              maxHeight: "400px",
              width: "100%",
              objectFit: "cover",
              borderRadius: "10px",
              transition: "opacity 0.5s ease",
            }}
          />

          <div className="d-flex justify-content-between">
            {thumbnails.map((src, idx) => (
              <img
                key={idx}
                src={src}
                alt={`Thumbnail ${idx + 1}`}
                onClick={() => setActiveIndex(idx)}
                style={{
                  width: "80px",
                  height: "80px",
                  objectFit: "cover",
                  cursor: "pointer",
                  borderRadius: "8px",
                  opacity: activeIndex === idx ? 1 : 0.6,
                  transform: activeIndex === idx ? "scale(1.05)" : "scale(1)",
                  transition: "opacity 0.3s ease, transform 0.2s ease",
                }}
              />
            ))}
          </div>
        </div>

        {/* Right: Details */}
        <div className="col-md-6">
          <div
            className="package-name"
            style={{
              marginTop: "0.5rem",
              marginBottom: "0.5rem",
              fontWeight: 800,
              letterSpacing: "0.2px",
              fontSize: "1.75rem",
            }}
          >
            {pkg.title}
          </div>

          <div
            className="package-price"
            style={{
              fontSize: "1.8rem",
              fontWeight: 800,
              color: "#C80036",
              marginBottom: "1rem",
            }}
          >
            {fmtVND(pkg.price)} ₫
          </div>

          <p
            style={{
              marginBottom: "1rem",
              color: "#222",
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            {pkg.description}
          </p>

          <div style={{ marginBottom: "1.5rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <AiOutlineCheck className="icon-check" />
              <strong style={{ marginRight: 6 }}>Thời hạn:</strong>
              <span>{pkg.duration} tháng</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              <AiOutlineCheck className="icon-check" />
              <strong style={{ marginRight: 6 }}>Số buổi:</strong>
              <span>{pkg.sessions} buổi</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              {pkg.hasPT ? (
                <AiOutlineCheck className="icon-check" />
              ) : (
                <AiOutlineClose className="icon-close" />
              )}
              <strong style={{ marginRight: 6 }}>PT kèm:</strong>
              <span>{pkg.hasPT ? "Có" : "Không"}</span>
            </div>
          </div>

          {/* Extra Info */}
          <div style={{ marginTop: "1.5rem" }}>
            <h5 style={{ fontWeight: 800, marginBottom: "0.75rem" }}>
              Lợi ích chính:
            </h5>
            <ul style={{ color: "#333", paddingLeft: "1.2rem" }}>
              <li>Lộ trình tập luyện rõ ràng phù hợp mục tiêu</li>
              <li>Không gian tập sạch sẽ, đầy đủ máy móc</li>
              <li>Hỗ trợ kỹ thuật từ đội ngũ HLV khi cần</li>
            </ul>
          </div>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              marginTop: "1.5rem",
            }}
          >
            <button
              onClick={() => navigate(-1)}
              className="btn btn-outline-secondary btn-lg"
              style={{
                borderRadius: "8px",
                fontWeight: 600,
                color: "#333",
                border: "1px solid #ccc",
              }}
            >
              ← Quay lại
            </button>

            {/* ✅ Nút đăng ký sinh ID 4 số random */}
            <button
              className="btn btn-lg"
              style={{
                backgroundColor: "#C80036",
                color: "#fff",
                fontWeight: 700,
                padding: "0.6rem 1.4rem",
                border: "none",
                borderRadius: "8px",
                transition: "all 0.2s ease",
              }}
              onMouseOver={(e) =>
                (e.currentTarget.style.filter = "brightness(1.1)")
              }
              onMouseOut={(e) =>
                (e.currentTarget.style.filter = "brightness(1)")
              }
              onClick={() => safeId && console.log("Generated ID:", safeId) && navigate(`/${safeId}/cart`)}
              disabled={!safeId}
              title={!safeId ? "Đang tạo ID..." : undefined}
            >
              <span>Đăng ký ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
