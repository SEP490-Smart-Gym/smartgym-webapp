import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { message } from "antd";
import api from "../../config/axios";

const FEEDBACK_TYPE_LABELS = {
  GymRoom: "Phòng tập",
  Equipment: "Thiết bị",
  Facilities: "Cơ sở vật chất",
  Service: "Dịch vụ",
  Staff: "Nhân viên",
  Cleanliness: "Vệ sinh",
  Other: "Khác",
};

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

function formatDDMMYYYY_HHmm(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
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

  if (apiStatus === "cancelled") {
    return { text: "Đã hủy", className: "status-expired" };
  }

  if (today < start) {
    return { text: "Chưa bắt đầu", className: "text-secondary fw-semibold" };
  }
  if (today > end) {
    return { text: "Hết hạn", className: "status-expired" };
  }

  return { text: "Đang hoạt động", className: "status-active" };
}

function currencyVND(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  try {
    return n.toLocaleString("vi-VN", {
      style: "currency",
      currency: "VND",
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });
  } catch {
    return `${n}₫`;
  }
}

function calcDurationMonths(startIso, endIso) {
  if (!startIso || !endIso) return null;
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diffMs = end - start;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return Math.round(diffDays / 30);
}

function getDaysRemainingDisplay(pkg) {
  if (!pkg) return null;

  const baseVal = typeof pkg.daysRemaining === "number" ? pkg.daysRemaining : null;
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

function getRefundStatusDisplay(statusRaw) {
  const s = (statusRaw || "").toLowerCase();

  if (s === "pending") return { text: "Chờ xác nhận", className: "text-warning fw-semibold" };
  if (s === "rejected") return { text: "Từ chối hoàn tiền", className: "text-danger fw-semibold" };
  if (s === "approved") return { text: "Hoàn tiền thành công", className: "text-success fw-semibold" };

  return { text: statusRaw || "—", className: "text-muted" };
}

const ITEMS_PER_PAGE = 5;

export default function MyPackage() {
  const [gymPackagesHistory, setGymPackagesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [refundRequests, setRefundRequests] = useState([]);
  const [refundRequestsLoading, setRefundRequestsLoading] = useState(false);

  const [filterStatus, setFilterStatus] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);

  const [refundOpen, setRefundOpen] = useState(false);
  const [refundReason, setRefundReason] = useState("");
  const [refundLoading, setRefundLoading] = useState(false);
  const [refundInfo, setRefundInfo] = useState(null);
  const [refundCalcLoading, setRefundCalcLoading] = useState(false);
  const [refundRequestedAmount, setRefundRequestedAmount] = useState(0);

  const [viewRefundOpen, setViewRefundOpen] = useState(false);
  const [viewRefund, setViewRefund] = useState(null);

  // feedback state
  const [gymRating, setGymRating] = useState(5);

  // ✅ dropdown type (key) + custom input cho Other
  const [gymFeedbackType, setGymFeedbackType] = useState(""); // GymRoom/Equipment/.../Other
  const [gymCustomFeedbackType, setGymCustomFeedbackType] = useState("");

  const [gymComments, setGymComments] = useState("");
  const [trainerRating, setTrainerRating] = useState(5);
  const [trainerComments, setTrainerComments] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // ✅ check trainer feedback
  const [checkingTrainerFeedback, setCheckingTrainerFeedback] = useState(false);
  const [trainerFeedbackExists, setTrainerFeedbackExists] = useState(false);
  const [checkedTrainerFeedbackForPkgId, setCheckedTrainerFeedbackForPkgId] = useState(null);

  // ✅ check gym feedback by memberPackageId (from /guest/feedback/gym)
  const [checkingGymFeedback, setCheckingGymFeedback] = useState(false);
  const [gymFeedbackExists, setGymFeedbackExists] = useState(false);
  const [checkedGymFeedbackForPkgId, setCheckedGymFeedbackForPkgId] = useState(null);

  function resetFeedbackForms() {
    setGymRating(5);
    setGymFeedbackType("");
    setGymCustomFeedbackType("");
    setGymComments("");
    setTrainerRating(5);
    setTrainerComments("");
  }

  const resetRefundState = () => {
    setRefundReason("");
    setRefundInfo(null);
    setRefundRequestedAmount(0);
    setRefundCalcLoading(false);
    setRefundLoading(false);
  };

  const resetViewRefundState = () => {
    setViewRefund(null);
    setViewRefundOpen(false);
  };

  const resetTrainerFeedbackCheck = () => {
    setCheckingTrainerFeedback(false);
    setTrainerFeedbackExists(false);
    setCheckedTrainerFeedbackForPkgId(null);
  };

  const resetGymFeedbackCheck = () => {
    setCheckingGymFeedback(false);
    setGymFeedbackExists(false);
    setCheckedGymFeedbackForPkgId(null);
  };

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

  const fetchRefundRequests = async () => {
    try {
      setRefundRequestsLoading(true);
      const res = await api.get("/MemberPackage/my-refund-requests");
      const data = res.data;
      const list = Array.isArray(data) ? data : [];
      const mapped = list.map((r) => ({
        id: r.id,
        memberPackageId: r.memberPackageId,
        memberId: r.memberId,
        paymentId: r.paymentId,
        requestedAmount: r.requestedAmount,
        reason: r.reason,
        status: r.status,
        requestedAt: r.requestedAt,
        reviewedAt: r.reviewedAt,
        adminNotes: r.adminNotes,
        memberName: r.memberName,
        packageName: r.packageName,
        reviewerName: r.reviewerName,
      }));
      setRefundRequests(mapped);
    } catch (err) {
      console.error("Error fetching my-refund-requests:", err);
    } finally {
      setRefundRequestsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
    fetchRefundRequests();
  }, []);

  const getActiveRefundRequestForPackage = (pkgId) => {
    if (!pkgId) return null;
    return refundRequests.find((r) => {
      const s = (r.status || "").toLowerCase();
      return r.memberPackageId === pkgId && s !== "rejected";
    });
  };

  const getRefundRequestsForPackage = (pkgId) => {
    if (!pkgId) return [];
    const list = refundRequests.filter((r) => r.memberPackageId === pkgId);
    if (list.length === 0) return [];
    return list
      .slice()
      .sort((a, b) => {
        const da = a.requestedAt ? new Date(a.requestedAt).getTime() : 0;
        const db = b.requestedAt ? new Date(b.requestedAt).getTime() : 0;
        if (da !== db) return db - da;
        return (b.id || 0) - (a.id || 0);
      });
  };

  const sortedPackages = useMemo(
    () => [...gymPackagesHistory].sort((a, b) => new Date(b.endDate) - new Date(a.endDate)),
    [gymPackagesHistory]
  );

  const filteredPackages = useMemo(() => {
    const today = new Date();

    return sortedPackages.filter((pkg) => {
      const apiStatus = (pkg.apiStatus || "").toLowerCase();
      const end = pkg.endDate ? new Date(pkg.endDate) : null;
      const isExpiredByDate = end && end < today;

      if (filterStatus === "all") return true;

      if (filterStatus === "active") return apiStatus === "active";
      if (filterStatus === "cancelled") return apiStatus === "cancelled";

      if (filterStatus === "expired") {
        if (apiStatus === "expired") return true;
        if (apiStatus !== "cancelled" && isExpiredByDate) return true;
        return false;
      }

      return true;
    });
  }, [sortedPackages, filterStatus]);

  const totalPages = Math.max(1, Math.ceil(filteredPackages.length / ITEMS_PER_PAGE) || 1);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedPackages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPackages.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPackages, currentPage]);

  // ✅ check trainer feedback: /guest/trainers/{trainerId}/feedbacks
  const checkTrainerFeedbackForPackage = async (pkg) => {
    const pkgId = Number(pkg?.id || 0);
    const trainerId = Number(pkg?.trainerId || 0);

    setTrainerFeedbackExists(false);
    setCheckedTrainerFeedbackForPkgId(pkgId || null);

    if (!pkgId || !trainerId) return;

    try {
      setCheckingTrainerFeedback(true);
      const res = await api.get(`/guest/trainers/${trainerId}/feedbacks`);
      const raw = res.data;

      const list = Array.isArray(raw)
        ? raw
        : raw?.items && Array.isArray(raw.items)
        ? raw.items
        : raw
        ? [raw]
        : [];

      const exists = list.some((f) => Number(f.memberPackageId) === pkgId);
      setTrainerFeedbackExists(exists);
    } catch (err) {
      console.error("Error checking trainer feedback:", err);
      setTrainerFeedbackExists(false);
    } finally {
      setCheckingTrainerFeedback(false);
    }
  };

  // ✅ check gym feedback: /guest/feedback/gym
  // Rule user yêu cầu: nếu memberPackageId trùng với id package => ẩn phần viết gym feedback
  const checkGymFeedbackForPackage = async (pkg) => {
    const pkgId = Number(pkg?.id || 0);

    setGymFeedbackExists(false);
    setCheckedGymFeedbackForPkgId(pkgId || null);

    if (!pkgId) return;

    try {
      setCheckingGymFeedback(true);
      const res = await api.get("/guest/feedback/gym");
      const raw = res.data;

      const list = Array.isArray(raw)
        ? raw
        : raw?.items && Array.isArray(raw.items)
        ? raw.items
        : raw
        ? [raw]
        : [];

      const exists = list.some((f) => Number(f.memberPackageId) === pkgId);
      setGymFeedbackExists(exists);
    } catch (err) {
      console.error("Error checking gym feedback:", err);
      // lỗi check thì cho hiện form để tránh chặn nhầm
      setGymFeedbackExists(false);
    } finally {
      setCheckingGymFeedback(false);
    }
  };

  const handleOpen = (historyItem) => {
    const master = null;
    setSelected({ history: historyItem, master });
    resetFeedbackForms();
    resetTrainerFeedbackCheck();
    resetGymFeedbackCheck();
    setOpen(true);

    checkTrainerFeedbackForPackage(historyItem);
    checkGymFeedbackForPackage(historyItem);
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setRefundOpen(false);
    resetRefundState();
    resetFeedbackForms();
    resetViewRefundState();
    resetTrainerFeedbackCheck();
    resetGymFeedbackCheck();
  };

  const fetchRefundCalculation = async (memberPackageId) => {
    if (!memberPackageId) return;
    try {
      setRefundCalcLoading(true);
      setRefundInfo(null);
      const res = await api.get(`/MemberPackage/${memberPackageId}/refund-calculation`);
      const data = res.data;

      const rawAmount = data.calculatedRefundAmount ?? 0;
      const roundedAmount = Math.round(rawAmount);

      const usedPctRaw = data.usedCapacityPercentage ?? 0;
      const refundPctRaw = data.refundPercentage ?? 0;

      const usedPctRounded = Math.round(usedPctRaw * 100) / 100;
      const refundPctRounded = Math.round(refundPctRaw * 100) / 100;

      setRefundInfo({
        ...data,
        calculatedRefundAmount: roundedAmount,
        usedCapacityPercentage: usedPctRounded,
        refundPercentage: refundPctRounded,
      });

      setRefundRequestedAmount(roundedAmount);
    } catch (err) {
      console.error("Error fetching refund calculation:", err);
      const detail =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Không lấy được thông tin tính toán hoàn tiền.";
      message.error(detail);
      setRefundOpen(false);
      resetRefundState();
    } finally {
      setRefundCalcLoading(false);
    }
  };

  const handleOpenRefund = () => {
    if (!selected || !selected.history) return;

    const activeRefund = getActiveRefundRequestForPackage(selected.history.id);
    if (activeRefund) return;

    resetRefundState();
    setRefundOpen(true);
    fetchRefundCalculation(selected.history.id);
  };

  const handleOpenRefundFromList = (pkg) => {
    const activeRefund = getActiveRefundRequestForPackage(pkg.id);
    if (activeRefund) return;

    setSelected({ history: pkg, master: null });
    resetFeedbackForms();
    resetTrainerFeedbackCheck();
    resetGymFeedbackCheck();
    setRefundOpen(true);
    fetchRefundCalculation(pkg.id);
  };

  const handleRefundModalClose = () => {
    if (refundLoading || refundCalcLoading) return;
    setRefundOpen(false);
    resetRefundState();
  };

  const handleRefundSubmit = async () => {
    if (!selected || !selected.history) return;

    const id = selected.history.id;
    if (!id) {
      message.error("Không tìm được ID gói để hoàn tiền.");
      return;
    }

    if (!refundRequestedAmount || Number(refundRequestedAmount) <= 0) {
      message.warning("Số tiền yêu cầu hoàn phải lớn hơn 0.");
      return;
    }

    if (!refundReason.trim()) {
      message.warning("Vui lòng nhập lý do yêu cầu hoàn tiền.");
      return;
    }

    try {
      setRefundLoading(true);
      await api.post(`/MemberPackage/${id}/refund-request`, {
        requestedAmount: Number(refundRequestedAmount) || 0,
        reason: refundReason.trim(),
      });

      message.success("Gửi yêu cầu hoàn tiền thành công.");

      setRefundOpen(false);
      resetRefundState();

      await fetchRefundRequests();
      await fetchPackages();
    } catch (err) {
      console.error("Error requesting refund:", err);
      const detail =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Gửi yêu cầu hoàn tiền thất bại. Vui lòng thử lại sau.";
      message.error(detail);
    } finally {
      setRefundLoading(false);
    }
  };

  const handleOpenViewRefund = (refund) => {
    if (!refund) return;
    setViewRefund(refund);
    setViewRefundOpen(true);
  };

  const handleCloseViewRefund = () => {
    resetViewRefundState();
  };

  // ==== Feedback handlers ====
  const handleSubmitGymFeedback = async () => {
    if (!selected || !selected.history) return;

    // ✅ nếu đã có gym feedback theo memberPackageId này => chặn
    if (gymFeedbackExists) {
      message.warning("Bạn đã đánh giá cho phòng gym (theo gói này) rồi.");
      return;
    }

    if (!gymComments.trim()) {
      message.warning("Vui lòng nhập nội dung đánh giá cho phòng gym.");
      return;
    }

    const finalType =
      gymFeedbackType === "Other"
        ? (gymCustomFeedbackType || "").trim() || "Other"
        : gymFeedbackType || "GymRoom";

    try {
      setFeedbackLoading(true);
      const payload = {
        memberPackageId: Number(selected.history.id), // ✅ để match backend dạng list /guest/feedback/gym
        rating: Number(gymRating) || 5,
        feedbackType: finalType,
        comments: gymComments.trim(),
      };

      await api.post("/member/feedback/gym", payload);
      message.success("Đã gửi đánh giá cho phòng gym. Cảm ơn bạn!");

      setGymComments("");
      setGymFeedbackType("");
      setGymCustomFeedbackType("");

      // ✅ ẩn UI ngay
      setGymFeedbackExists(true);
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

    if (trainerFeedbackExists) {
      message.warning("Bạn đã đánh giá cho huấn luyện viên rồi.");
      return;
    }

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
      message.success("Đã gửi đánh giá huấn luyện viên. Cảm ơn bạn!");
      setTrainerComments("");
      setTrainerFeedbackExists(true);
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
          className={"nav-link " + (filterStatus === "cancelled" ? "active" : "")}
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
          className={"nav-link " + (filterStatus === "expired" ? "active" : "")}
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
            <h3 className="mb-0 fw-bold" style={{ color: "#fde6e6ff", fontSize: "50px" }}>
              Lịch sử gói tập
            </h3>
          </div>
        </div>

        {renderFilterTabs()}

        {loading && (
          <div className="row justify-content-center mb-3">
            <div className="col-12 col-xl-10">
              <div className="alert alert-info text-center mb-0">Đang tải thông tin gói tập...</div>
            </div>
          </div>
        )}

        {loadError && (
          <div className="row justify-content-center mb-3">
            <div className="col-12 col-xl-10">
              <div className="alert alert-danger text-center mb-0">{loadError}</div>
            </div>
          </div>
        )}

        {paginatedPackages.map((pkg) => {
          const status = getStatus(pkg);
          const daysRemainDisplay = getDaysRemainingDisplay(pkg);
          const isCancelled = (pkg.apiStatus || "").toLowerCase() === "cancelled";

          const activeRefund = getActiveRefundRequestForPackage(pkg.id);
          const refundList = getRefundRequestsForPackage(pkg.id);

          return (
            <div className="row justify-content-center mb-3" key={pkg.id}>
              <div className="col-12 col-xl-10">
                <div className="card shadow-0 border rounded-3 card-shadow">
                  <div className="card-body">
                    <div className="row g-3 align-items-start">
                      <div className="col-12 col-md-5">
                        <div className="pkg-title mb-1">{pkg.name}</div>
                        <div className="text-muted">
                          Thời hạn: <strong>{durationLabel(pkg.durationMonths)}</strong>
                        </div>
                        {pkg.apiStatus && (
                          <div className="text-muted small mt-1">
                            Trạng thái hệ thống: <strong>{pkg.apiStatus}</strong>
                          </div>
                        )}
                      </div>

                      <div className="col-12 col-md-3">
                        <div className="text-muted small">Ngày bắt đầu</div>
                        <div className="fw-semibold">{formatDDMMYYYY(pkg.startDate)}</div>
                        <div className="text-muted small mt-2">Ngày kết thúc</div>
                        <div className="fw-semibold">{formatDDMMYYYY(pkg.endDate)}</div>
                        {daysRemainDisplay !== null && (
                          <div className="text-muted small mt-2">
                            Còn lại: <strong>{daysRemainDisplay} ngày</strong>
                          </div>
                        )}
                      </div>

                      <div className="col-12 col-md-4 d-flex flex-column align-items-md-end align-items-start">
                        <div className="d-flex justify-content-md-end justify-content-start align-items-center gap-2 flex-wrap flex-md-nowrap">
                          {isCancelled && !activeRefund && (
                            <button className="btn btn-warning btn-sm" onClick={() => handleOpenRefundFromList(pkg)}>
                              {refundList.length > 0 ? "Yêu cầu hoàn tiền mới" : "Yêu cầu hoàn tiền"}
                            </button>
                          )}

                          <button className="btn btn-primary btn-sm" onClick={() => handleOpen(pkg)}>
                            Chi tiết
                          </button>
                        </div>

                        <div className={status.className} style={{ fontSize: "0.9rem", marginTop: 8 }}>
                          {status.text}
                        </div>
                      </div>
                    </div>

                    {refundList.length > 0 && (
                      <div className="mt-3 border-top pt-2">
                        <div className="small fw-semibold mb-1">Đơn hủy gói ({refundList.length})</div>
                        <ul className="list-unstyled mb-0 small">
                          {refundList.map((r) => {
                            const disp = getRefundStatusDisplay(r.status);
                            return (
                              <li key={r.id} className="d-flex justify-content-between align-items-center py-1">
                                <div>
                                  <span className="text-muted">{formatDDMMYYYY_HHmm(r.requestedAt)} - </span>
                                  <span className={disp.className}>{disp.text}</span>
                                  {typeof r.requestedAmount === "number" && (
                                    <span className="text-muted ms-1">({currencyVND(r.requestedAmount)})</span>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm p-0 ms-2"
                                  onClick={() => handleOpenViewRefund(r)}
                                >
                                  Chi tiết
                                </button>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {!loading && !loadError && filteredPackages.length > 0 && (
          <div className="row justify-content-center mt-3">
            <div className="col-12 col-xl-10 d-flex justify-content-center">
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      className="page-link"
                      onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)}
                    >
                      «
                    </button>
                  </li>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <li key={page} className={"page-item " + (page === currentPage ? "active" : "")}>
                      <button
                        type="button"
                        className="page-link"
                        style={{ marginLeft: 10 }}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    </li>
                  ))}

                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      type="button"
                      style={{ marginLeft: 10 }}
                      className="page-link"
                      onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)}
                    >
                      »
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}

        {!loading && !loadError && filteredPackages.length === 0 && sortedPackages.length > 0 && (
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              <div className="alert alert-light border text-center" role="alert">
                Không có gói nào trong mục này.
              </div>
            </div>
          </div>
        )}

        {!loading && !loadError && sortedPackages.length === 0 && (
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              <div className="alert alert-light border text-center" role="alert">
                Chưa có lịch sử gói tập.
              </div>
            </div>
          </div>
        )}

        {/* ===== Modal Detail ===== */}
        {open && selected && (
          <div className="modal-backdrop-custom" onClick={handleClose} role="dialog" aria-modal="true">
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header d-flex justify-content-between align-items-center">
                <h5 className="m-0">{selected.history?.name || "Chi tiết gói"}</h5>
                <button className="btn btn-sm btn-outline-secondary" onClick={handleClose}>
                  <AiOutlineClose />
                </button>
              </div>

              <div className="modal-body">
                <div className="mb-3">
                  {(() => {
                    const st = getStatus(selected.history);
                    return (
                      <div className={st.className} style={{ fontSize: "0.95rem" }}>
                        Trạng thái: {st.text}
                        {selected.history.apiStatus && (
                          <span className="text-muted ms-2">({selected.history.apiStatus})</span>
                        )}
                      </div>
                    );
                  })()}
                  <div className="text-muted small">
                    Thời gian sử dụng: <strong>{formatDDMMYYYY(selected.history.startDate)}</strong> –{" "}
                    <strong>{formatDDMMYYYY(selected.history.endDate)}</strong>
                  </div>
                  {(() => {
                    const daysRemainDisplay = getDaysRemainingDisplay(selected.history);
                    if (daysRemainDisplay === null) return null;
                    return (
                      <div className="text-muted small mt-1">
                        Còn lại: <strong>{daysRemainDisplay} ngày</strong>
                      </div>
                    );
                  })()}
                  {selected.history.cancellationReason && (
                    <div className="text-muted small mt-1">
                      Lý do hủy: <strong>{selected.history.cancellationReason}</strong>
                    </div>
                  )}
                </div>

                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Số buổi</div>
                    <div className="fw-semibold">{selected.history.totalSessionsCount ?? "—"} buổi</div>
                    {typeof selected.history.remainingSessionsCount === "number" && (
                      <div className="text-muted small mt-1">
                        Còn lại: <strong>{selected.history.remainingSessionsCount} buổi</strong>
                      </div>
                    )}
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Thời lượng gói (ước tính)</div>
                    <div className="fw-semibold">{durationLabel(selected.history.durationMonths) || "—"}</div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Huấn luyện viên</div>
                    <div className="fw-semibold">
                      {selected.history.trainerName || <span className="text-muted">Không rõ</span>}
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Giá niêm yết</div>
                    <div className="fw-semibold">{currencyVND(selected.history.packagePrice)}</div>
                  </div>
                </div>

                {/* Feedback */}
                <hr className="mt-4 mb-3" />
                <h6 className="mb-3">Đánh giá & phản hồi</h6>

                <div className="row g-3">
                  {/* Gym feedback */}
                  <div className="col-12 col-md-6">
                    <div className="border rounded p-3 h-100">
                      <h6 className="mb-2">Phòng gym</h6>

                      {/* ✅ Loading check */}
                      {checkingGymFeedback && checkedGymFeedbackForPkgId === Number(selected.history.id) && (
                        <div className="alert alert-info py-2 small">
                          Đang kiểm tra trạng thái đánh giá phòng gym...
                        </div>
                      )}

                      {/* ✅ nếu đã có feedback theo memberPackageId => ẨN form */}
                      {!checkingGymFeedback && gymFeedbackExists && (
                        <div className="alert alert-success py-2 small mb-0" style={{ color: "#7c7c7cff" }}>
                          Bạn đã đánh giá phòng gym cho gói này rồi.
                        </div>
                      )}

                      {/* ✅ Form chỉ hiện khi CHƯA feedback */}
                      {!gymFeedbackExists && (
                        <>
                          <div className="mb-2">
                            <label className="form-label small mb-1">Mức độ hài lòng</label>
                            <StarRating value={gymRating} onChange={setGymRating} disabled={feedbackLoading || checkingGymFeedback} />
                          </div>

                          {/* ✅ Dropdown feedback type từ FEEDBACK_TYPE_LABELS */}
                          <div className="mb-2">
                            <label className="form-label small mb-1">Loại phản hồi</label>
                            <select
                              className="form-select form-select-sm"
                              value={gymFeedbackType}
                              onChange={(e) => {
                                const v = e.target.value;
                                setGymFeedbackType(v);
                                if (v !== "Other") setGymCustomFeedbackType("");
                              }}
                              disabled={feedbackLoading || checkingGymFeedback}
                            >
                              <option value="">-- Chọn loại --</option>
                              {Object.entries(FEEDBACK_TYPE_LABELS).map(([key, label]) => (
                                <option key={key} value={key}>
                                  {label}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* ✅ Nếu chọn Other thì show input */}
                          {gymFeedbackType === "Other" && (
                            <div className="mb-2">
                              <label className="form-label small mb-1">Nhập loại phản hồi</label>
                              <input
                                type="text"
                                className="form-control form-control-sm"
                                placeholder="VD: Chỗ đậu xe, âm nhạc, nhiệt độ..."
                                value={gymCustomFeedbackType}
                                onChange={(e) => setGymCustomFeedbackType(e.target.value)}
                                disabled={feedbackLoading || checkingGymFeedback}
                              />
                            </div>
                          )}

                          <div className="mb-2">
                            <label className="form-label small mb-1">Nội dung đánh giá</label>
                            <textarea
                              className="form-control"
                              rows={3}
                              value={gymComments}
                              onChange={(e) => setGymComments(e.target.value)}
                              disabled={feedbackLoading || checkingGymFeedback}
                            />
                          </div>

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-primary mt-1"
                            onClick={handleSubmitGymFeedback}
                            disabled={feedbackLoading || checkingGymFeedback}
                          >
                            {feedbackLoading ? "Đang gửi..." : "Gửi đánh giá phòng gym"}
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Trainer feedback */}
                  {selected.history?.trainerName && (
                    <div className="col-12 col-md-6">
                      <div className="border rounded p-3 h-100">
                        <h6 className="mb-2">
                          Huấn luyện viên <span className="fw-semibold">{selected.history.trainerName}</span>
                        </h6>

                        {checkingTrainerFeedback && checkedTrainerFeedbackForPkgId === Number(selected.history.id) && (
                          <div className="alert alert-info py-2 small">
                            Đang kiểm tra trạng thái đánh giá huấn luyện viên...
                          </div>
                        )}

                        {!checkingTrainerFeedback && trainerFeedbackExists && (
                          <div className="alert alert-success py-2 small mb-0" style={{ color: "#7c7c7cff" }}>
                            Bạn đã đánh giá cho huấn luyện viên rồi.
                          </div>
                        )}

                        {!trainerFeedbackExists && (
                          <>
                            <div className="mb-2">
                              <label className="form-label small mb-1">Mức độ hài lòng</label>
                              <StarRating
                                value={trainerRating}
                                onChange={setTrainerRating}
                                disabled={feedbackLoading || checkingTrainerFeedback}
                              />
                            </div>
                            <div className="mb-2">
                              <label className="form-label small mb-1">Nội dung đánh giá</label>
                              <textarea
                                className="form-control"
                                rows={3}
                                value={trainerComments}
                                onChange={(e) => setTrainerComments(e.target.value)}
                                disabled={feedbackLoading || checkingTrainerFeedback}
                              />
                            </div>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success mt-1"
                              onClick={handleSubmitTrainerFeedback}
                              disabled={feedbackLoading || checkingTrainerFeedback}
                            >
                              {feedbackLoading ? "Đang gửi..." : "Gửi đánh giá huấn luyện viên"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-end gap-2">
                {(() => {
                  if (!selected || !selected.history) return null;
                  const hist = selected.history;
                  const apiStatusLower = (hist.apiStatus || "").toLowerCase();
                  const hasActiveRefund = getActiveRefundRequestForPackage(hist.id);
                  if (hasActiveRefund) return null;

                  if (apiStatusLower === "cancelled") {
                    return (
                      <button className="btn btn-warning" onClick={handleOpenRefund}>
                        {getRefundRequestsForPackage(hist.id).length > 0 ? "Yêu cầu hoàn tiền mới" : "Yêu cầu hoàn tiền"}
                      </button>
                    );
                  }

                  if (apiStatusLower === "active") {
                    return (
                      <button className="btn btn-outline-secondary" onClick={handleOpenRefund}>
                        Hủy gói &amp; yêu cầu hoàn tiền
                      </button>
                    );
                  }

                  return null;
                })()}

                <button
                  className="btn btn-primary"
                  onClick={() =>
                    message.info(`Chức năng mua lại gói #${selected.history?.packageId ?? "?"} đang được phát triển.`)
                  }
                >
                  Mua lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Modal yêu cầu hoàn tiền ===== */}
        {refundOpen && (
          <div className="confirm-backdrop" onClick={handleRefundModalClose} role="dialog" aria-modal="true">
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h6 className="mb-2">Yêu cầu hoàn tiền</h6>

              {refundCalcLoading && <p className="text-muted mb-3">Đang tính toán số tiền hoàn cho gói của bạn...</p>}

              {!refundCalcLoading && refundInfo && (
                <>
                  <p className="text-muted mb-2">
                    Thông tin hoàn tiền cho gói: <strong>{refundInfo.packageName}</strong>
                  </p>

                  <div className="mb-2 small">
                    <div>
                      <span className="text-muted">Giá gốc: </span>
                      <strong>{currencyVND(refundInfo.originalAmount ?? 0)}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Giá đã thanh toán: </span>
                      <strong>{currencyVND(refundInfo.finalAmount ?? 0)}</strong>
                    </div>
                    <div>
                      <span className="text-muted">Buổi còn lại: </span>
                      <strong>
                        {refundInfo.remainingSessions} / {refundInfo.totalSessions}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted">Ngày còn lại: </span>
                      <strong>
                        {refundInfo.remainingDays} / {refundInfo.totalDays}
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted">% đã sử dụng: </span>
                      <strong>
                        {typeof refundInfo.usedCapacityPercentage === "number"
                          ? refundInfo.usedCapacityPercentage.toFixed(2)
                          : refundInfo.usedCapacityPercentage}
                        %
                      </strong>
                    </div>
                    <div>
                      <span className="text-muted">Tỷ lệ được hoàn: </span>
                      <strong>
                        {typeof refundInfo.refundPercentage === "number"
                          ? refundInfo.refundPercentage.toFixed(2)
                          : refundInfo.refundPercentage}
                      </strong>
                    </div>
                    <div className="mt-1">
                      <span className="text-muted">Số tiền dự kiến hoàn: </span>
                      <strong>{currencyVND(Number(refundInfo.calculatedRefundAmount) || 0)}</strong>
                    </div>
                    {refundInfo.calculationDetails && (
                      <div className="mt-1">
                        <span className="text-muted">Chi tiết tính toán: </span>
                        <span>{refundInfo.calculationDetails}</span>
                      </div>
                    )}
                  </div>

                  <hr className="my-3" />

                  <div className="mb-3">
                    <label className="form-label small">Lý do hoàn tiền</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      disabled={refundLoading || refundCalcLoading}
                      placeholder="Ví dụ: không thể tiếp tục sử dụng gói do chuyển nơi ở..."
                    />
                  </div>
                </>
              )}

              {!refundCalcLoading && !refundInfo && (
                <p className="text-muted mb-3">Không lấy được thông tin tính toán hoàn tiền.</p>
              )}

              <div className="d-flex justify-content-end gap-2 mt-3">
                <button className="btn btn-light" onClick={handleRefundModalClose} disabled={refundLoading || refundCalcLoading}>
                  Đóng
                </button>
                <button
                  className="btn btn-warning"
                  onClick={handleRefundSubmit}
                  disabled={refundLoading || refundCalcLoading || !refundInfo || !selected}
                >
                  {refundLoading ? "Đang gửi..." : "Gửi yêu cầu hoàn tiền"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Modal xem chi tiết đơn hoàn tiền ===== */}
        {viewRefundOpen && viewRefund && (
          <div className="confirm-backdrop" onClick={handleCloseViewRefund} role="dialog" aria-modal="true">
            <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
              <h6 className="mb-2">Chi tiết đơn hủy gói</h6>

              <div className="small mb-2">
                <div>
                  <span className="text-muted">Gói: </span>
                  <strong>{viewRefund.packageName}</strong>
                </div>
                <div>
                  <span className="text-muted">Số tiền yêu cầu hoàn: </span>
                  <strong>{currencyVND(viewRefund.requestedAmount ?? 0)}</strong>
                </div>
                <div>
                  <span className="text-muted">Trạng thái: </span>
                  {(() => {
                    const disp = getRefundStatusDisplay(viewRefund.status);
                    return <span className={disp.className}>{disp.text}</span>;
                  })()}
                </div>
                <div>
                  <span className="text-muted">Ngày gửi yêu cầu: </span>
                  <strong>{formatDDMMYYYY_HHmm(viewRefund.requestedAt)}</strong>
                </div>
                {viewRefund.reviewedAt && (
                  <div>
                    <span className="text-muted">Ngày xử lý: </span>
                    <strong>{formatDDMMYYYY_HHmm(viewRefund.reviewedAt)}</strong>
                  </div>
                )}
                {viewRefund.reviewerName && (
                  <div>
                    <span className="text-muted">Người xử lý: </span>
                    <strong>{viewRefund.reviewerName}</strong>
                  </div>
                )}
              </div>

              <div className="mb-2">
                <span className="text-muted small d-block">Lý do bạn yêu cầu hoàn:</span>
                <div className="border rounded p-2 small bg-light">{viewRefund.reason || "—"}</div>
              </div>

              {viewRefund.adminNotes && (
                <div className="mb-2">
                  <span className="text-muted small d-block">Ghi chú từ quản trị:</span>
                  <div className="border rounded p-2 small bg-light">{viewRefund.adminNotes}</div>
                </div>
              )}

              <div className="d-flex justify-content-end mt-3">
                <button className="btn btn-light" onClick={handleCloseViewRefund}>
                  Đóng
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
          Đã có lỗi khi hiển thị gói tập. Vui lòng tải lại trang hoặc thử lại sau.
        </div>
      );
    }
    return this.props.children;
  }
}
