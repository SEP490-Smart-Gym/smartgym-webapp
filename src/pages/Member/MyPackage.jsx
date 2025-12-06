import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { message } from "antd";
import api from "../../config/axios";

const styles = `
.card-shadow { box-shadow: 0 .125rem .25rem rgba(0,0,0,.075); }
.pkg-title { font-weight: 700; }
.status-active { color: #198754; font-weight: 600; } /* xanh lá */
.status-expired { color: #dc3545; font-weight: 600; } /* đỏ */
.badge { display:inline-block; padding:.25rem .5rem; border-radius:.375rem; font-size:.75rem; }
.badge-pt { background:#e7f1ff; border:1px solid #cde1ff; }

.modal-backdrop-custom {
  position: fixed; inset: 0; background: rgba(0,0,0,.35);
  display:flex; align-items:center; justify-content:center; z-index:1050;
}
.modal-card {
  background:#fff;
  border-radius: .75rem;
  width: min(680px, 92vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1rem 2rem rgba(0,0,0,.2);
}
.modal-header, .modal-footer { padding: 1rem 1.25rem; }
.modal-body {
  padding: 0 1.25rem 1.25rem;
  overflow-y: auto;
  scroll-behavior: smooth;
}
.modal-header { border-bottom: 1px solid #eee; }
.modal-footer { border-top: 1px solid #eee; }

/* Mini confirm dialog */
.confirm-backdrop {
  position: fixed; inset: 0; background: rgba(0,0,0,.45);
  display:flex; align-items:center; justify-content:center; z-index:1100;
}
.confirm-card {
  width: min(440px, 92vw); background:#fff; border-radius: .75rem;
  box-shadow: 0 .75rem 2rem rgba(0,0,0,.25); padding: 1rem 1.25rem;
}
`;

// ⭐ Component chọn Rating bằng sao
function StarRating({ value, onChange, size = 24, disabled = false }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        fontSize: size,
      }}
    >
      {stars.map((star) => (
        <span
          key={star}
          onClick={() => {
            if (!disabled) onChange(star);
          }}
          style={{
            color: star <= value ? "#FFD700" : "#ccc",
            transition: "color 0.2s",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function formatDDMMYYYY(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function durationLabel(months) {
  if (!months) return "";
  return months === 1 ? "1 tháng" : `${months} tháng`;
}

function getStatus(pkg) {
  const apiStatus = (pkg.apiStatus || "").toLowerCase();
  const today = new Date();
  const start = new Date(pkg.startDate);
  const end = new Date(pkg.endDate);

  // Ưu tiên trạng thái Cancelled từ API
  if (apiStatus === "cancelled") {
    return { text: "Đã hủy", className: "status-expired" };
  }

  if (today < start)
    return {
      text: "Chưa bắt đầu",
      className: "text-secondary fw-semibold",
    };
  if (today > end)
    return {
      text: "Hết hạn",
      className: "status-expired",
    };

  return {
    text: "Đang hoạt động",
    className: "status-active",
  };
}

function currencyVND(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  try {
    return n.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
    });
  } catch {
    return `${n}₫`;
  }
}

// Tính số tháng giữa start và end (gần đúng, để hiển thị label)
function calcDurationMonths(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffMs = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.round(diffDays / 30); // approx
}

/**
 * Lấy số ngày còn lại hiển thị cho UI.
 * - Nếu gói đã hủy: dùng (endDate - cancellationDate) => cố định, không giảm theo thời gian thực
 * - Các trường hợp khác: dùng daysRemaining từ API (nếu là số)
 */
function getDaysRemainingDisplay(pkg) {
  if (!pkg) return null;

  const baseVal =
    typeof pkg.daysRemaining === "number" ? pkg.daysRemaining : null;
  const apiStatus = (pkg.apiStatus || "").toLowerCase();

  if (apiStatus !== "cancelled") {
    return baseVal;
  }

  if (!pkg.cancellationDate || !pkg.endDate) {
    return baseVal;
  }

  const cancel = new Date(pkg.cancellationDate);
  const end = new Date(pkg.endDate);
  if (Number.isNaN(cancel.getTime()) || Number.isNaN(end.getTime())) {
    return baseVal;
  }

  const diffMs = end - cancel;
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

// 10 lý do (có "Khác (tự nhập)")
const CANCEL_REASONS = [
  "Không còn thời gian tập luyện",
  "Lý do sức khỏe",
  "Gặp vấn đề tài chính",
  "Không phù hợp với lịch làm việc/học tập",
  "Không hài lòng về cơ sở vật chất",
  "Không hài lòng về dịch vụ chăm sóc khách hàng",
  "Không hài lòng về chương trình tập",
  "Không hài lòng về huấn luyện viên",
  "Đã tìm được nơi tập khác phù hợp hơn",
  "Khác (tự nhập)",
];

const ITEMS_PER_PAGE = 5;

export default function MyPackage() {
  // danh sách lịch sử gói (từ API my-packages)
  const [gymPackagesHistory, setGymPackagesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // filter tab: all / active / cancelled / expired
  const [filterStatus, setFilterStatus] = useState("all");

  // phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // modal / confirm state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // {history, master?}

  // modal chọn lý do hủy
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);

  // modal yêu cầu hoàn tiền
  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);

  // feedback state
  const [gymRating, setGymRating] = useState(5);
  const [gymFeedbackType, setGymFeedbackType] = useState("");
  const [gymComments, setGymComments] = useState("");
  const [trainerRating, setTrainerRating] = useState(5);
  const [trainerComments, setTrainerComments] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  function resetFeedbackForms() {
    setGymRating(5);
    setGymFeedbackType("");
    setGymComments("");
    setTrainerRating(5);
    setTrainerComments("");
  }

  // ===== GỌI API my-packages (history) =====
  const fetchPackages = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const res = await api.get("/MemberPackage/my-packages");
      const data = res.data;

      const list = Array.isArray(data) ? data : [];

      const mapped = list.map((p) => ({
        id: p.id,
        packageId: p.packageId,
        name: p.packageName,
        durationMonths: calcDurationMonths(p.startDate, p.endDate),
        startDate: p.startDate,
        endDate: p.endDate,
        packagePrice: p.packagePrice,

        totalSessionsCount: p.totalSessionsCount,
        remainingSessionsCount: p.remainingSessionsCount,
        apiStatus: p.status,
        isAutoRenewal: p.isAutoRenewal,
        daysRemaining: p.daysRemaining,
        isExpiringSoon: p.isExpiringSoon,

        trainerId: p.trainerId,
        trainerName: p.trainerName,
        purchaseDate: p.purchaseDate,
        cancellationDate: p.cancellationDate,
        cancellationReason: p.cancellationReason,
      }));

      setGymPackagesHistory(mapped);
    } catch (err) {
      console.error("Error fetching my-packages:", err);
      setLoadError("Không tải được lịch sử gói tập.");
      setGymPackagesHistory([]);
      message.error("Không tải được lịch sử gói tập.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  // sort theo endDate (gói kết thúc gần nhất lên trên)
  const sortedPackages = useMemo(
    () =>
      [...gymPackagesHistory].sort(
        (a, b) => new Date(b.endDate) - new Date(a.endDate)
      ),
    [gymPackagesHistory]
  );

  // lọc theo tab
  const filteredPackages = useMemo(() => {
    const today = new Date();

    return sortedPackages.filter((pkg) => {
      const apiStatus = (pkg.apiStatus || "").toLowerCase();
      const end = pkg.endDate ? new Date(pkg.endDate) : null;
      const isExpiredByDate = end && end < today;

      if (filterStatus === "all") return true;

      if (filterStatus === "active") {
        return apiStatus === "active";
      }

      if (filterStatus === "cancelled") {
        return apiStatus === "cancelled";
      }

      if (filterStatus === "expired") {
        // Ưu tiên status Expired, hoặc hết hạn theo ngày (trừ khi đã Cancelled)
        if (apiStatus === "expired") return true;
        if (apiStatus !== "cancelled" && isExpiredByDate) return true;
        return false;
      }

      return true;
    });
  }, [sortedPackages, filterStatus]);

  // tổng số trang
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPackages.length / ITEMS_PER_PAGE) || 1
  );

  // đảm bảo currentPage không vượt quá totalPages khi filter đổi / data đổi
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // data 5 gói / trang
  const paginatedPackages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPackages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPackages, currentPage]);

  const handleOpen = (historyItem) => {
    const master = null;
    setSelected({ history: historyItem, master });
    resetFeedbackForms();
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setConfirmOpen(false);
    setRefundOpen(false);
    setRefundReason("");
    resetFeedbackForms();
  };

  // Khi bấm "Hủy gói" trong modal -> mở modal chọn lý do
  const handleRequestCancel = () => {
    setSelectedReason("");
    setCustomReason("");
    setConfirmOpen(true);
  };

  const handleCancelModalClose = () => {
    if (cancelLoading) return;
    setConfirmOpen(false);
  };

  const handleCancelSubmit = async () => {
    if (!selected || !selected.history) return;

    const id = selected.history.id;
    if (!id) {
      message.error("Không tìm được ID gói để hủy.");
      return;
    }

    if (!selectedReason) {
      message.warning("Vui lòng chọn lý do hủy gói.");
      return;
    }

    let finalReason = selectedReason;
    const isOther =
      selectedReason === "Khác (tự nhập)" || selectedReason === "Khác";
    if (isOther) {
      if (!customReason.trim()) {
        message.warning("Vui lòng nhập lý do hủy gói.");
        return;
      }
      finalReason = customReason.trim();
    }

    try {
      setCancelLoading(true);

      // Gọi API cancel:
      await api.post(`/MemberPackage/${id}/cancel`, {
        cancellationReason: finalReason,
      });

      message.success("Hủy gói thành công.");

      // Reload lại danh sách lịch sử gói
      await fetchPackages();

      // 👉 tự động tắt cả modal chọn lý do + modal chi tiết
      setConfirmOpen(false);
      setOpen(false);
      setSelected(null);
    } catch (err) {
      console.error("Error cancel package:", err);
      const detail =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Hủy gói thất bại.";
      message.error(detail);
    } finally {
      setCancelLoading(false);
    }
  };

  // ==== Refund request ====
  const handleOpenRefund = () => {
    if (!selected || !selected.history) return;
    setRefundReason("");
    setRefundOpen(true);
  };

  // Refund từ list (không cần mở chi tiết trước)
  const handleOpenRefundFromList = (pkg) => {
    setSelected({ history: pkg, master: null });
    setRefundReason("");
    resetFeedbackForms();
    setRefundOpen(true);
  };

  const handleRefundModalClose = () => {
    if (refundLoading) return;
    setRefundOpen(false);
  };

  const handleRefundSubmit = async () => {
    if (!selected || !selected.history) return;

    if (!refundReason.trim()) {
      message.warning("Vui lòng nhập lý do yêu cầu hoàn tiền.");
      return;
    }

    try {
      setRefundLoading(true);
      // Hiện tại dùng mock, chưa có API chính thức cho hoàn tiền
      console.log("Mock refund request payload:", {
        memberPackageId: selected.history.id,
        reason: refundReason.trim(),
      });
      message.success("Yêu cầu hoàn tiền đã được ghi nhận (mock).");
      setRefundOpen(false);
    } catch (err) {
      console.error("Error requesting refund:", err);
      message.error("Gửi yêu cầu hoàn tiền thất bại. Vui lòng thử lại sau.");
    } finally {
      setRefundLoading(false);
    }
  };

  // ==== Feedback handlers ====
  const handleSubmitGymFeedback = async () => {
    if (!selected || !selected.history) return;

    if (!gymComments.trim()) {
      message.warning("Vui lòng nhập nội dung đánh giá cho phòng gym.");
      return;
    }

    try {
      setFeedbackLoading(true);
      const payload = {
        rating: Number(gymRating) || 5,
        feedbackType: gymFeedbackType || "GYM",
        comments: gymComments.trim(),
      };
      await api.post("/member/feedback/gym", payload);
      message.success("Đã gửi đánh giá cho phòng gym. Cảm ơn bạn!");
      setGymComments("");
      setGymFeedbackType("");
    } catch (err) {
      console.error("Error sending gym feedback:", err);
      const detail =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Gửi đánh giá phòng gym thất bại.";
      message.error(detail);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const handleSubmitTrainerFeedback = async () => {
    if (!selected || !selected.history) return;

    if (!selected.history.id) {
      message.error("Không tìm thấy gói tập để gửi đánh giá HLV.");
      return;
    }
    if (!selected.history.trainerId && !selected.history.trainerName) {
      message.warning("Gói này không có huấn luyện viên để đánh giá.");
      return;
    }
    if (!trainerComments.trim()) {
      message.warning("Vui lòng nhập nội dung đánh giá cho huấn luyện viên.");
      return;
    }

    try {
      setFeedbackLoading(true);
      const payload = {
        memberPackageId: selected.history.id,
        rating: Number(trainerRating) || 5,
        comments: trainerComments.trim(),
      };
      await api.post("/member/feedback/trainer", payload);
      message.success("Đã gửi đánh giá cho huấn luyện viên. Cảm ơn bạn!");
      setTrainerComments("");
    } catch (err) {
      console.error("Error sending trainer feedback:", err);
      const detail =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Gửi đánh giá huấn luyện viên thất bại.";
      message.error(detail);
    } finally {
      setFeedbackLoading(false);
    }
  };

  const renderFilterTabs = () => (
    <ul className="nav nav-pills justify-content-center mb-4">
      <li className="nav-item">
        <button
          type="button"
          className={"nav-link " + (filterStatus === "all" ? "active" : "")}
          onClick={() => {
            setFilterStatus("all");
            setCurrentPage(1);
          }}
        >
          Tất cả
        </button>
      </li>
      <li className="nav-item">
        <button
          type="button"
          className={"nav-link " + (filterStatus === "active" ? "active" : "")}
          onClick={() => {
            setFilterStatus("active");
            setCurrentPage(1);
          }}
        >
          Đang hoạt động
        </button>
      </li>
      <li className="nav-item">
        <button
          type="button"
          className={
            "nav-link " + (filterStatus === "cancelled" ? "active" : "")
          }
          onClick={() => {
            setFilterStatus("cancelled");
            setCurrentPage(1);
          }}
        >
          Đã hủy
        </button>
      </li>
      <li className="nav-item">
        <button
          type="button"
          className={
            "nav-link " + (filterStatus === "expired" ? "active" : "")
          }
          onClick={() => {
            setFilterStatus("expired");
            setCurrentPage(1);
          }}
        >
          Hết hạn
        </button>
      </li>
    </ul>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-yellow-100 flex items-center justify-center p-4">
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('https://setupphonggym.vn/wp-content/uploads/2020/09/mau-thiet-ke-phong-gym-100m2.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "rgba(2, 0, 68, 0.75)",
          backgroundBlendMode: "multiply",
          weight: "90%",
          paddingTop: "50px",
          paddingBottom: "50px",
          zIndex: 1,
        }}
      >
        <style>{styles}</style>

        <div className="row mb-3 text-center">
          <div className="col-12">
            <h3
              className="mb-0 fw-bold"
              style={{ color: "#fde6e6ff", fontSize: "50px" }}
            >
              Lịch sử gói tập
            </h3>
          </div>
        </div>

        {/* Tabs filter */}
        {renderFilterTabs()}

        {loading && (
          <div className="row justify-content-center mb-3">
            <div className="col-12 col-xl-10">
              <div className="alert alert-info text-center mb-0">
                Đang tải thông tin gói tập...
              </div>
            </div>
          </div>
        )}

        {loadError && (
          <div className="row justify-content-center mb-3">
            <div className="col-12 col-xl-10">
              <div className="alert alert-danger text-center mb-0">
                {loadError}
              </div>
            </div>
          </div>
        )}

        {/* Danh sách gói sau khi lọc + phân trang (5 gói / trang) */}
        {paginatedPackages.map((pkg) => {
          const status = getStatus(pkg);
          const daysRemainDisplay = getDaysRemainingDisplay(pkg);
          const isCancelled =
            (pkg.apiStatus || "").toLowerCase() === "cancelled";

          return (
            <div className="row justify-content-center mb-3" key={pkg.id}>
              <div className="col-12 col-xl-10">
                <div className="card shadow-0 border rounded-3 card-shadow">
                  <div className="card-body">
                    <div className="row g-3 align-items-center">
                      {/* Cột tên gói */}
                      <div className="col-12 col-md-5">
                        <div className="pkg-title mb-1">{pkg.name}</div>
                        <div className="text-muted">
                          Thời hạn:{" "}
                          <strong>{durationLabel(pkg.durationMonths)}</strong>
                        </div>
                        {pkg.apiStatus && (
                          <div className="text-muted small mt-1">
                            Trạng thái hệ thống:{" "}
                            <strong>{pkg.apiStatus}</strong>
                          </div>
                        )}
                      </div>

                      {/* Cột ngày bắt đầu / kết thúc */}
                      <div className="col-12 col-md-3">
                        <div className="text-muted small">Ngày bắt đầu</div>
                        <div className="fw-semibold">
                          {formatDDMMYYYY(pkg.startDate)}
                        </div>
                        <div className="text-muted small mt-2">
                          Ngày kết thúc
                        </div>
                        <div className="fw-semibold">
                          {formatDDMMYYYY(pkg.endDate)}
                        </div>
                        {daysRemainDisplay !== null && (
                          <div className="text-muted small mt-2">
                            Còn lại:{" "}
                            <strong>{daysRemainDisplay} ngày</strong>
                          </div>
                        )}
                      </div>

                      {/* Cột button + status */}
                      <div className="col-12 col-md-4 d-flex flex-column align-items-md-end align-items-start">
                        <div className="d-flex justify-content-md-end justify-content-start align-items-center gap-2 flex-wrap flex-md-nowrap">
                          {/* Nút yêu cầu hoàn tiền hiển thị ngay trên list nếu gói đã hủy */}
                          {isCancelled && (
                            <button
                              className="btn btn-warning btn-sm"
                              onClick={() => handleOpenRefundFromList(pkg)}
                            >
                              Yêu cầu hoàn tiền
                            </button>
                          )}

                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleOpen(pkg)}
                          >
                            Chi tiết
                          </button>
                        </div>

                        <div
                          className={status.className}
                          style={{ fontSize: "0.9rem", marginTop: 8 }}
                        >
                          {status.text}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Phân trang: 5 gói / trang */}
        {!loading && !loadError && filteredPackages.length > 0 && (
          <div className="row justify-content-center mt-3">
            <div className="col-12 col-xl-10 d-flex justify-content-center">
              <nav>
                <ul className="pagination mb-0">
                  <li
                    className={`page-item ${
                      currentPage === 1 ? "disabled" : ""
                    }`}
                  >
                    <button
                      type="button"
                      className="page-link"
                      onClick={() =>
                        currentPage > 1 && setCurrentPage(currentPage - 1)
                      }
                    >
                      «
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <li
                        key={page}
                        className={
                          "page-item " +
                          (page === currentPage ? "active" : "")
                        }
                      >
                        <button
                          type="button"
                          className="page-link"
                          style={{ marginLeft: 10 }}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    )
                  )}

                  <li
                    className={`page-item ${
                      currentPage === totalPages ? "disabled" : ""
                    }`}
                  >
                    <button
                      type="button"
                      style={{ marginLeft: 10 }}
                      className="page-link"
                      onClick={() =>
                        currentPage < totalPages &&
                        setCurrentPage(currentPage + 1)
                      }
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}

        {/* Không có gói trong tab hiện tại */}
        {!loading &&
          !loadError &&
          filteredPackages.length === 0 &&
          sortedPackages.length > 0 && (
            <div className="row justify-content-center">
              <div className="col-12 col-xl-10">
                <div
                  className="alert alert-light border text-center"
                  role="alert"
                >
                  Không có gói nào trong mục này.
                </div>
              </div>
            </div>
          )}

        {/* Không có lịch sử gói (tổng) */}
        {!loading && !loadError && sortedPackages.length === 0 && (
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              <div
                className="alert alert-light border text-center"
                role="alert"
              >
                Chưa có lịch sử gói tập.
              </div>
            </div>
          </div>
        )}

        {/* ===== Modal Detail ===== */}
        {open && selected && (
          <div
            className="modal-backdrop-custom"
            onClick={handleClose}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="m-0">
                  {selected.history?.name || "Chi tiết gói"}
                </h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleClose}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div className="modal-body">
                {/* Status + thời gian thực tế */}
                <div className="mb-3">
                  {(() => {
                    const st = getStatus(selected.history);
                    return (
                      <div
                        className={st.className}
                        style={{ fontSize: "0.95rem" }}
                      >
                        Trạng thái: {st.text}
                        {selected.history.apiStatus && (
                          <span className="text-muted ms-2">
                            ({selected.history.apiStatus})
                          </span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="text-muted small">
                    Thời gian sử dụng:{" "}
                    <strong>
                      {formatDDMMYYYY(selected.history.startDate)}
                    </strong>{" "}
                    –{" "}
                    <strong>
                      {formatDDMMYYYY(selected.history.endDate)}
                    </strong>
                  </div>
                  {(() => {
                    const daysRemainDisplay =
                      getDaysRemainingDisplay(selected.history);
                    if (daysRemainDisplay === null) return null;
                    return (
                      <div className="text-muted small mt-1">
                        Còn lại: <strong>{daysRemainDisplay} ngày</strong>
                      </div>
                    );
                  })()}
                  {selected.history.cancellationReason && (
                    <div className="text-muted small mt-1">
                      Lý do hủy:{" "}
                      <strong>{selected.history.cancellationReason}</strong>
                    </div>
                  )}
                </div>

                {/* Info chi tiết – dùng data từ API */}
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Số buổi</div>
                    <div className="fw-semibold">
                      {selected.history.totalSessionsCount ?? "—"} buổi
                    </div>
                    {typeof selected.history.remainingSessionsCount ===
                      "number" && (
                      <div className="text-muted small mt-1">
                        Còn lại:{" "}
                        <strong>
                          {selected.history.remainingSessionsCount} buổi
                        </strong>
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">
                      Thời lượng gói (ước tính)
                    </div>
                    <div className="fw-semibold">
                      {durationLabel(selected.history.durationMonths) || "—"}
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Huấn luyện viên</div>
                    <div className="fw-semibold">
                      {selected.history.trainerName || (
                        <span className="text-muted">Không rõ</span>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Giá niêm yết</div>
                    <div className="fw-semibold">
                      {currencyVND(selected.history.packagePrice)}
                    </div>
                  </div>
                </div>

                {/* Feedback section */}
                <hr className="mt-4 mb-3" />
                <h6 className="mb-3">Đánh giá & phản hồi</h6>
                <div className="row g-3">
                  {/* Gym feedback */}
                  <div className="col-12 col-md-6">
                    <div className="border rounded p-3 h-100">
                      <h6 className="mb-2">Phòng gym</h6>
                      <div className="mb-2">
                        <label className="form-label small mb-1">
                          Mức độ hài lòng
                        </label>
                        <StarRating
                          value={gymRating}
                          onChange={setGymRating}
                          disabled={feedbackLoading}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small mb-1">
                          Loại phản hồi (tuỳ chọn)
                        </label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="VD: Cơ sở vật chất, dịch vụ, không gian..."
                          value={gymFeedbackType}
                          onChange={(e) =>
                            setGymFeedbackType(e.target.value)
                          }
                          disabled={feedbackLoading}
                        />
                      </div>
                      <div className="mb-2">
                        <label className="form-label small mb-1">
                          Nội dung đánh giá
                        </label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={gymComments}
                          onChange={(e) => setGymComments(e.target.value)}
                          disabled={feedbackLoading}
                        />
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-primary mt-1"
                        onClick={handleSubmitGymFeedback}
                        disabled={feedbackLoading}
                      >
                        {feedbackLoading
                          ? "Đang gửi..."
                          : "Gửi đánh giá phòng gym"}
                      </button>
                    </div>
                  </div>

                  {/* Trainer feedback (nếu có trainer) */}
                  {selected.history?.trainerName && (
                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="mb-2">
                          Huấn luyện viên{" "}
                          <span className="fw-semibold">
                            {selected.history.trainerName}
                          </span>
                        </h6>
                        <div className="mb-2">
                          <label className="form-label small mb-1">
                            Mức độ hài lòng
                          </label>
                          <StarRating
                            value={trainerRating}
                            onChange={setTrainerRating}
                            disabled={feedbackLoading}
                          />
                        </div>
                        <div className="mb-2">
                          <label className="form-label small mb-1">
                            Nội dung đánh giá
                          </label>
                          <textarea
                            className="form-control"
                            rows={3}
                            value={trainerComments}
                            onChange={(e) =>
                              setTrainerComments(e.target.value)
                            }
                            disabled={feedbackLoading}
                          />
                        </div>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-success mt-1"
                          onClick={handleSubmitTrainerFeedback}
                          disabled={feedbackLoading}
                        >
                          {feedbackLoading
                            ? "Đang gửi..."
                            : "Gửi đánh giá huấn luyện viên"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-end gap-2">
                {/* Refund chỉ khi đã hủy */}
                {selected.history?.apiStatus?.toLowerCase() === "cancelled" && (
                  <button
                    className="btn btn-warning"
                    onClick={handleOpenRefund}
                  >
                    Yêu cầu hoàn tiền
                  </button>
                )}

                {/* Nút hủy gói chỉ hiện khi status Active */}
                {selected.history?.apiStatus?.toLowerCase() === "active" && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={handleRequestCancel}
                  >
                    Hủy gói
                  </button>
                )}

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    message.info(
                      `Chức năng mua lại gói #${
                        selected.history?.packageId ?? "?"
                      } đang được phát triển.`
                    )
                  }
                >
                  Mua lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Modal chọn lý do hủy gói ===== */}
        {confirmOpen && (
          <div
            className="confirm-backdrop"
            onClick={handleCancelModalClose}
            role="dialog"
            aria-modal="true"
          >
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h6 className="mb-2">Bạn muốn hủy gói vì lý do gì?</h6>
              <p className="text-muted mb-2">
                Vui lòng chọn một lý do dưới đây. Thông tin này giúp chúng tôi
                cải thiện dịch vụ.
              </p>

              <div
                className="mb-3"
                style={{ maxHeight: 260, overflowY: "auto" }}
              >
                {CANCEL_REASONS.map((reason) => (
                  <div className="form-check mb-1" key={reason}>
                    <input
                      className="form-check-input"
                      type="radio"
                      name="cancelReason"
                      id={`cancel-${reason}`}
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      disabled={cancelLoading}
                    />
                    <label
                      className="form-check-label"
                      htmlFor={`cancel-${reason}`}
                    >
                      {reason}
                    </label>
                  </div>
                ))}
              </div>

              {(selectedReason === "Khác (tự nhập)" ||
                selectedReason === "Khác") && (
                <div className="mb-3">
                  <label className="form-label small">
                    Nhập lý do chi tiết
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    disabled={cancelLoading}
                    placeholder="Ví dụ: chuyển chỗ làm xa, không tiện đi tập..."
                  />
                </div>
              )}

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-light"
                  onClick={handleCancelModalClose}
                  disabled={cancelLoading}
                >
                  Không
                </button>
                <button
                  className="btn btn-danger"
                  onClick={handleCancelSubmit}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? "Đang hủy..." : "Xác nhận hủy gói"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Modal yêu cầu hoàn tiền ===== */}
        {refundOpen && (
          <div
            className="confirm-backdrop"
            onClick={handleRefundModalClose}
            role="dialog"
            aria-modal="true"
          >
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h6 className="mb-2">Yêu cầu hoàn tiền</h6>
              <p className="text-muted mb-2">
                Vui lòng mô tả ngắn gọn lý do bạn muốn hoàn tiền cho gói này.
              </p>

              <div className="mb-3">
                <label className="form-label small">Lý do hoàn tiền</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  disabled={refundLoading}
                  placeholder="Ví dụ: không thể tiếp tục sử dụng gói do chuyển nơi ở..."
                />
              </div>

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button
                  className="btn btn-light"
                  onClick={handleRefundModalClose}
                  disabled={refundLoading}
                >
                  Đóng
                </button>
                <button
                  className="btn btn-warning"
                  onClick={handleRefundSubmit}
                  disabled={refundLoading}
                >
                  {refundLoading ? "Đang gửi..." : "Gửi yêu cầu hoàn tiền"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ===== (Tuỳ chọn) ErrorBoundary siêu gọn ===== */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }
  componentDidCatch(error, info) {
    console.error("MyPackage crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-3">
          Đã có lỗi khi hiển thị gói tập. Vui lòng tải lại trang hoặc thử lại
          sau.
        </div>
      );
    }
    return this.props.children;
  }
}
