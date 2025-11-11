// src/components/MyPackage.jsx
import React, { useMemo, useState } from "react";
import { packagesData } from "../Home.jsx";

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

const gymPackagesHistory = [
  { id: 101, packageId: 1, name: "Gói Tập Gym 1 Tháng", durationMonths: 1, startDate: "2025-01-10", endDate: "2025-02-09" },
  { id: 102, packageId: 2, name: "Gói Tập Gym 3 Tháng", durationMonths: 3, startDate: "2025-03-01", endDate: "2025-05-31" },
  { id: 103, packageId: 3, name: "Gói PT 10 Buổi (kèm phòng 1 tháng)", durationMonths: 1, startDate: "2025-07-05", endDate: "2025-08-04" },
  { id: 104, packageId: 6, name: "Gói Tập Gym 6 Tháng", durationMonths: 6, startDate: "2024-10-15", endDate: "2025-04-14" },
  { id: 10,  packageId: 5, name: "Gói Tập Gym 6 Tháng", durationMonths: 6, startDate: "2025-10-15", endDate: "2026-04-14" },
];

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
  const today = new Date();
  const start = new Date(pkg.startDate);
  const end = new Date(pkg.endDate);
  if (today < start) return { text: "Chưa bắt đầu", className: "text-secondary fw-semibold" };
  if (today > end) return { text: "Hết hạn", className: "status-expired" };
  return { text: "Đang hoạt động", className: "status-active" };
}

function currencyVND(n) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  try {
    return n.toLocaleString("vi-VN", { style: "currency", currency: "VND", maximumFractionDigits: 0 });
  } catch {
    return `${n}₫`;
  }
}

export default function MyPackage() {
  const sortedPackages = useMemo(
    () => [...gymPackagesHistory].sort((a, b) => new Date(b.endDate) - new Date(a.endDate)),
    []
  );

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);         // {history, master} | null
  const [confirmOpen, setConfirmOpen] = useState(false);  // bật/tắt confirm

  const handleOpen = (historyItem) => {
    const master = packagesData.find(p => p.id === historyItem.packageId) || null;
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
    // TODO: gọi API hủy gói tại đây
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
                        Thời hạn: <strong>{durationLabel(pkg.durationMonths)}</strong>
                      </div>
                    </div>

                    <div className="col-12 col-md-4">
                      <div className="text-muted small">Ngày bắt đầu</div>
                      <div className="fw-semibold">{formatDDMMYYYY(pkg.startDate)}</div>
                      <div className="text-muted small mt-2">Ngày kết thúc</div>
                      <div className="fw-semibold">{formatDDMMYYYY(pkg.endDate)}</div>
                    </div>

                    <div className="col-12 col-md-2 text-md-end">
                      <button
                        className="btn btn-primary btn-sm mb-1"
                        onClick={() => handleOpen(pkg)}
                      >
                        Detail
                      </button>
                      <div className={status.className} style={{ fontSize: "0.9rem" }}>
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

      {sortedPackages.length === 0 && (
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
              <h5 className="m-0">
                {selected.master?.title || selected.history?.name || "Chi tiết gói"}
              </h5>
              <button className="btn btn-sm btn-outline-secondary" onClick={handleClose}>
                Đóng
              </button>
            </div>

            <div className="modal-body">
              {/* Status + thời gian thực tế */}
              <div className="mb-3">
                {(() => {
                  const st = getStatus(selected.history);
                  return (
                    <div className={st.className} style={{ fontSize: "0.95rem" }}>
                      Trạng thái: {st.text}
                    </div>
                  );
                })()}
                <div className="text-muted small">
                  Thời gian sử dụng: <strong>{formatDDMMYYYY(selected.history.startDate)}</strong> –{" "}
                  <strong>{formatDDMMYYYY(selected.history.endDate)}</strong>
                </div>
              </div>

              {selected.master ? (
                <div className="row g-3">
                  <div className="col-12">
                    <p className="mb-2">{selected.master.description || "—"}</p>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Số buổi</div>
                    <div className="fw-semibold">{selected.master.sessions ?? "—"} buổi</div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Thời lượng gói</div>
                    <div className="fw-semibold">{selected.master.duration ?? "—"} tháng</div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Huấn luyện viên</div>
                    <div className="fw-semibold">
  {selected.master.hasPT ? (
    <span className="badge badge-pt" style={{ background: "#0d6efd33", color: "#0d6efd", fontWeight: 600 }}>
      Có PT
    </span>
  ) : (
    <span className="text-muted">Không</span>
  )}
</div>

                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Giá niêm yết</div>
                    <div className="fw-semibold">{currencyVND(selected.master.price)}</div>
                  </div>
                </div>
              ) : (
                <div className="alert alert-warning mt-2">
                  Không tìm thấy dữ liệu gói tương ứng trong danh mục.
                </div>
              )}
            </div>

            <div className="modal-footer d-flex justify-content-end gap-2">
              <button className="btn btn-outline-secondary" onClick={handleRequestCancel}>
                Hủy gói
              </button>
              <button
                className="btn btn-primary"
                onClick={() => alert(`Mua lại gói #${selected.history?.packageId ?? "?"}`)}
              >
                Mua lại
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Confirm Dialog ===== */}
      {confirmOpen && (
        <div className="confirm-backdrop" onClick={handleCancelNo} role="dialog" aria-modal="true">
          <div className="confirm-card" onClick={(e) => e.stopPropagation()}>
            <h6 className="mb-2">Bạn có chắc chắn muốn hủy gói?</h6>
            <p className="text-muted mb-3">
              Sau khi hủy, các quyền lợi còn lại của gói có thể không được khôi phục.
            </p>
            <div className="d-flex justify-content-end gap-2">
              <button className="btn btn-light" onClick={handleCancelNo}>Không</button>
              <button className="btn btn-danger" onClick={handleCancelYes}>Hủy gói</button>
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
  static getDerivedStateFromError(error) { return { hasError: true, err: error }; }
  componentDidCatch(error, info) { console.error("MyPackage crashed:", error, info); }
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
