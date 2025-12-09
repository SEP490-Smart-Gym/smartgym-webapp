import React, { useEffect, useState, useMemo } from "react";
import "../../assets/styles/style.css";
import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";
import { Link } from "react-router-dom";
import api from "../../config/axios";
import { message } from "antd";

// ✅ import Slider 2 đầu
import Slider from "rc-slider";
import "rc-slider/assets/index.css";

const PackageList = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);

  // lọc PT: all | with | without
  const [trainerFilter, setTrainerFilter] = useState("all");
  // sort: none | price | sessions
  const [sortField, setSortField] = useState("none");
  // asc | desc
  const [sortOrder, setSortOrder] = useState("asc");

  // khoảng giá [min, max] đang chọn
  const [priceRange, setPriceRange] = useState([0, 0]);

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

  // Tính min / max giá từ tất cả gói
  const { minPrice, maxPrice } = useMemo(() => {
    if (!packages.length) return { minPrice: 0, maxPrice: 0 };
    const prices = packages.map((p) => Number(p.price || 0));
    return {
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
    };
  }, [packages]);

  // Khi có dữ liệu giá -> set khoảng giá mặc định = [min, max]
  useEffect(() => {
    if (minPrice !== 0 || maxPrice !== 0) {
      setPriceRange([minPrice, maxPrice]);
    }
  }, [minPrice, maxPrice]);

  // Áp dụng lọc + sắp xếp
  const displayedPackages = useMemo(() => {
    let list = [...packages];

    // lọc theo PT
    if (trainerFilter === "with") {
      list = list.filter((p) => p.includesPersonalTrainer);
    } else if (trainerFilter === "without") {
      list = list.filter((p) => !p.includesPersonalTrainer);
    }

    // lọc theo khoảng giá (chỉ khi có dữ liệu giá hợp lệ)
    if (minPrice !== maxPrice) {
      const [minSelected, maxSelected] = priceRange;
      list = list.filter((p) => {
        const price = Number(p.price || 0);
        return price >= minSelected && price <= maxSelected;
      });
    }

    // sắp xếp
    if (sortField === "price") {
      list.sort((a, b) => {
        const pa = Number(a.price || 0);
        const pb = Number(b.price || 0);
        return sortOrder === "asc" ? pa - pb : pb - pa;
      });
    } else if (sortField === "sessions") {
      list.sort((a, b) => {
        const sa = Number(a.sessionCount || 0);
        const sb = Number(b.sessionCount || 0);
        return sortOrder === "asc" ? sa - sb : sb - sa;
      });
    }

    return list;
  }, [packages, trainerFilter, sortField, sortOrder, priceRange, minPrice, maxPrice]);

  if (loading) {
    return (
      <div className="mt-5 mb-5 text-center">
        Đang tải danh sách gói tập...
      </div>
    );
  }

  return (
    <div className="mt-5 mb-5">
      {/* Bộ lọc + sắp xếp */}
      <div className="container mb-4">
        <div className="row g-3 align-items-center">
          {/* Lọc PT + thanh trượt giá */}
          <div className="col-12 col-lg-8">
            {/* nút lọc PT */}
            <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
              <button
                type="button"
                className={
                  "btn btn-sm " +
                  (trainerFilter === "all" ? "btn-primary" : "btn-outline-primary")
                }
                onClick={() => setTrainerFilter("all")}
              >
                Tất cả
              </button>
              <button
                type="button"
                className={
                  "btn btn-sm " +
                  (trainerFilter === "with" ? "btn-primary" : "btn-outline-primary")
                }
                onClick={() => setTrainerFilter("with")}
              >
                Có PT kèm
              </button>
              <button
                type="button"
                className={
                  "btn btn-sm " +
                  (trainerFilter === "without"
                    ? "btn-primary"
                    : "btn-outline-primary")
                }
                onClick={() => setTrainerFilter("without")}
              >
                Không có PT
              </button>
            </div>

            {/* Thanh trượt lọc giá 2 đầu (rc-slider) */}
            {minPrice !== maxPrice && (
              <div>
                <div className="small text-muted mb-1">
                  Khoảng giá:{" "}
                  <strong>
                    {fmtVND(priceRange[0])} ₫ - {fmtVND(priceRange[1])} ₫
                  </strong>
                </div>
                <div style={{ width: 260, marginTop: 4 }}>
                  <Slider
                    range
                    min={minPrice}
                    max={maxPrice}
                    value={priceRange}
                    onChange={(val) => setPriceRange(val)}
                    allowCross={false} // 👈 không cho hai nút chồng lên nhau
                    step={100000}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Sắp xếp theo (trên 1 hàng) */}
          <div className="col-12 col-lg-4">
            <div className="d-flex align-items-center justify-content-lg-end gap-2 flex-nowrap">
              <span className="small text-muted">Sắp xếp theo:</span>
              <select
                className="form-select form-select-sm"
                style={{ minWidth: 130 }}
                value={sortField}
                onChange={(e) => setSortField(e.target.value)}
              >
                <option value="none">Mặc định</option>
                <option value="price">Giá gói</option>
                <option value="sessions">Số buổi tập</option>
              </select>

              <select
                className="form-select form-select-sm"
                style={{ minWidth: 110 }}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
              >
                <option value="asc">Tăng dần</option>
                <option value="desc">Giảm dần</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Danh sách gói */}
      <div className="packages">
        {displayedPackages.map((pkg) => (
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
                  <span>Thời hạn: {pkg.durationInDays} ngày</span>
                </div>

                <div className="info-item">
                  <AiOutlineCheck className="icon-check" />
                  <span>
                    Số buổi:{" "}
                    {pkg.sessionCount != null
                      ? `${pkg.sessionCount} buổi`
                      : "—"}
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
              </div>

              <Link to={`/packages/${pkg.id}`} className="btn">
                Chi tiết
              </Link>
            </div>
          </div>
        ))}

        {/* Trường hợp không có gói nào sau khi lọc */}
        {displayedPackages.length === 0 && (
          <div className="mt-4 text-center text-muted">
            Không tìm thấy gói phù hợp với bộ lọc.
          </div>
        )}
      </div>
    </div>
  );
};

export default PackageList;
