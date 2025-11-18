// src/components/PackageDetail.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import "../../assets/styles/style.css";
import api from "../../config/axios"; // chỉnh path cho đúng với project của bạn

const fmtVND = (n) => Number(n || 0).toLocaleString("vi-VN");

export default function PackageDetail() {
  const { id: routeId } = useParams();
  const navigate = useNavigate();

  const [pkg, setPkg] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeIndex, setActiveIndex] = useState(0);
  // ID 4 số ngẫu nhiên
  const [safeId] = useState(() =>
    String(Math.floor(1000 + Math.random() * 9000))
  );

  const featureImgs = [
    "/img/feature-1.jpg",
    "/img/feature-2.jpg",
    "/img/feature-3.jpg",
    "/img/feature-4.jpg",
  ];

  // Scroll lên đầu trang khi mở
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Fetch package detail từ API
  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await api.get(`/Package/${routeId}`);
        const data = res.data;

        // data dạng:
        // {
        //   id, packageName, description, price,
        //   durationInDays, sessionCount, includesPersonalTrainer, packageTypeId, ...
        // }

        const normalized = {
          id: data.id,
          title: data.packageName,
          price: data.price,
          description: data.description ?? "",
          // đổi ngày -> tháng (xấp xỉ). Nếu muốn hiển thị theo ngày thì dùng durationInDays trực tiếp
          duration: data.durationInDays
            ? Math.round(data.durationInDays / 30)
            : 0,
          sessions: data.sessionCount ?? 0,
          hasPT: data.includesPersonalTrainer ?? false,
          iconIndex: data.packageTypeId || 1,
        };

        setPkg(normalized);
      } catch (err) {
        console.error("Fetch package detail error:", err);
        if (err.response?.status === 404) {
          setError("Không tìm thấy gói tập.");
        } else if (err.response?.status === 401) {
          setError("Bạn cần đăng nhập để xem thông tin gói tập.");
        } else {
          setError("Không thể tải dữ liệu gói tập. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (routeId) {
      fetchDetail();
    }
  }, [routeId]);

  // Dùng iconIndex nếu có, fallback = 1
  const iconIndex = Number.isFinite(pkg?.iconIndex) && pkg.iconIndex > 0
    ? pkg.iconIndex
    : 1;

  const mainCandidate = featureImgs[(iconIndex - 1) % featureImgs.length];
  const thumbnails = useMemo(
    () => [mainCandidate, featureImgs[1], featureImgs[2], featureImgs[3]],
    [mainCandidate]
  );
  const mainImage = thumbnails[activeIndex];

  // Auto slide ảnh
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % thumbnails.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [thumbnails.length]);

  // Loading
  if (loading) {
    return (
      <div className="container mt-5 mb-5 text-center">
        <h3>Đang tải thông tin gói tập...</h3>
      </div>
    );
  }

  // Error hoặc không có pkg
  if (error || !pkg) {
    return (
      <div className="container mt-5 mb-5 text-center">
        <h3>{error || "Không tìm thấy gói tập"}</h3>
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
              <span>
                {pkg.duration
                  ? `${pkg.duration} tháng`
                  : "Theo thời hạn quy định"}
              </span>
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
              <span>
                {pkg.sessions ? `${pkg.sessions} buổi` : "Không giới hạn / N/A"}
              </span>
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

            <Link
              to={`/${safeId}/cart/${pkg.id}`}
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
            >
              <span>Đăng ký ngay</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
