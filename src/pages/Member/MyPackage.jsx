import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
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
  background:#fff; border-radius: .75rem; width: min(680px, 92vw);
  box-shadow: 0 1rem 2rem rgba(0,0,0,.2);
}
.modal-header, .modal-footer { padding: 1rem 1.25rem; }
.modal-body { padding: 0 1.25rem 1.25rem; }
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

export default function MyPackage() {
  // danh sách lịch sử gói (từ API my-packages)
  const [gymPackagesHistory, setGymPackagesHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // modal / confirm state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // {history, master?}
  const [confirmOpen, setConfirmOpen] = useState(false); // bật/tắt confirm

  // ===== GỌI API my-packages (history) =====
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        setLoadError("");

        const res = await api.get("/MemberPackage/my-packages");
        const data = res.data;

        const list = Array.isArray(data) ? data : [];

        // Map từng phần tử:
        // {
        //   "id": 30,
        //   "memberId": 39,
        //   "trainerId": 12,
        //   "packageId": 1,
        //   "packageName": "Standard Monthly Test Package",
        //   "packagePrice": 50,
        //   "purchaseDate": "2025-11-22T03:49:05.883536",
        //   "startDate": "2025-11-22T03:31:54.449",
        //   "endDate": "2025-12-22T03:31:54.449",
        //   "remainingSessionsCount": null,
        //   "totalSessionsCount": null,
        //   "status": "Cancelled",
        //   "isAutoRenewal": true,
        //   "cancellationDate": "...",
        //   "cancellationReason": "Payment failed",
        //   "daysRemaining": 30,
        //   "isExpiringSoon": false
        // }
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
      } finally {
        setLoading(false);
      }
    };

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

  const handleOpen = (historyItem) => {
    // Chưa có packagesData master -> dùng luôn historyItem trong modal
    const master = null;
    setSelected({ history: historyItem, master });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setConfirmOpen(false);
  };

  // Khi bấm "Hủy gói" trong modal -> mở confirm
  const handleRequestCancel = () => {
    setConfirmOpen(true);
  };

  const handleCancelNo = () => {
    setConfirmOpen(false);
  };

  const handleCancelYes = () => {
    // TODO: gọi API hủy gói tại đây khi backend có endpoint
    alert(`Đã gửi yêu cầu hủy gói #${selected?.history?.id}`);
    // đóng confirm + modal
    setConfirmOpen(false);
    handleClose();
  };

  return (
    <div className="container py-4">
      <style>{styles}</style>

      <div className="row mb-4 text-center">
        <div className="col-12">
          <h3 className="mb-0 fw-bold">Lịch sử gói tập</h3>
        </div>
      </div>

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

      {sortedPackages.map((pkg) => {
        const status = getStatus(pkg);
        return (
          <div className="row justify-content-center mb-3" key={pkg.id}>
            <div className="col-12 col-xl-10">
              <div className="card shadow-0 border rounded-3 card-shadow">
                <div className="card-body">
                  <div className="row g-3 align-items-center">
                    <div className="col-12 col-md-6">
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

                    <div className="col-12 col-md-4">
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
                      {typeof pkg.daysRemaining === "number" && (
                        <div className="text-muted small mt-2">
                          Còn lại:{" "}
                          <strong>{pkg.daysRemaining} ngày</strong>
                        </div>
                      )}
                    </div>

                    <div className="col-12 col-md-2 text-md-end">
                      <button
                        className="btn btn-primary btn-sm mb-1"
                        onClick={() => handleOpen(pkg)}
                      >
                        Detail
                      </button>
                      <div
                        className={status.className}
                        style={{ fontSize: "0.9rem" }}
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
          <div
            className="modal-card"
            onClick={(e) => e.stopPropagation()}
          >
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
                {typeof selected.history.daysRemaining === "number" && (
                  <div className="text-muted small mt-1">
                    Còn lại:{" "}
                    <strong>
                      {selected.history.daysRemaining} ngày
                    </strong>
                  </div>
                )}
                {selected.history.cancellationReason && (
                  <div className="text-muted small mt-1">
                    Lý do hủy:{" "}
                    <strong>
                      {selected.history.cancellationReason}
                    </strong>
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
                    {durationLabel(
                      selected.history.durationMonths
                    ) || "—"}
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
            </div>

            <div className="modal-footer d-flex justify-content-end gap-2">
              <button
                className="btn btn-outline-secondary"
                onClick={handleRequestCancel}
              >
                Hủy gói
              </button>
              <button
                className="btn btn-primary"
                onClick={() =>
                  alert(
                    `Mua lại gói #${selected.history?.packageId ?? "?"}`
                  )
                }
              >
                Mua lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Confirm Dialog ===== */}
      {confirmOpen && (
        <div
          className="confirm-backdrop"
          onClick={handleCancelNo}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="confirm-card"
            onClick={(e) => e.stopPropagation()}
          >
            <h6 className="mb-2">Bạn có chắc chắn muốn hủy gói?</h6>
            <p className="text-muted mb-3">
              Sau khi hủy, các quyền lợi còn lại của gói có thể không được
              khôi phục.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button
                className="btn btn-light"
                onClick={handleCancelNo}
              >
                Không
              </button>
              <button
                className="btn btn-danger"
                onClick={handleCancelYes}
              >
                Hủy gói
              </button>
            </div>
          </div>
        </div>
      )}
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