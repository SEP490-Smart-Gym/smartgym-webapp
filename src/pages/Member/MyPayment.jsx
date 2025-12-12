// src/pages/Payment/PaymentHistory.jsx
import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import api from "../../config/axios";

const styles = `
.card-shadow { box-shadow: 0 .125rem .25rem rgba(0,0,0,.075); }

.status-pending { color: #0d6efd; font-weight: 600; } /* vẫn giữ đề phòng nếu dùng nơi khác */
.status-failed { color: #dc3545; font-weight: 600; }
.status-completed { color: #198754; font-weight: 600; }
.status-refunded { color: #6f42c1; font-weight: 600; }

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
`;

// số item mỗi trang
const ITEMS_PER_PAGE = 5;

// ==== helper formatters ====
function formatDDMMYYYYHHMM(iso) {
  if (!iso) return "";

  const isoUtc = iso.endsWith("Z") ? iso : `${iso}Z`;
  const d = new Date(isoUtc);
  if (Number.isNaN(d.getTime())) return iso;

  const options = {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };

  const vnTime = new Intl.DateTimeFormat("vi-VN", options).format(d);
  return vnTime.replace(",", "");
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

function getPaymentStatusDisplay(payment) {
  const raw = (payment?.paymentStatus || "").toString();
  const status = raw.toLowerCase();

  if (status === "pending") {
    return { text: "Đang chờ thanh toán", className: "status-pending" };
  }
  if (status === "failed") {
    return { text: "Thanh toán thất bại", className: "status-failed" };
  }
  if (status === "completed" || status === "success") {
    return { text: "Thanh toán thành công", className: "status-completed" };
  }
  if (status === "refunded") {
    return { text: "Đã hoàn tiền", className: "status-refunded" };
  }
  return { text: raw || "Không rõ", className: "text-muted fw-semibold" };
}

/**
 * Lấy Stripe Payment Intent Id từ object payment:
 *  - Ưu tiên: stripePaymentIntentId
 *  - Fallback: nếu transactionReference bắt đầu bằng "pi_" thì dùng nó
 */
function getStripePaymentIntentId(payment) {
  if (!payment) return null;

  const direct = payment.stripePaymentIntentId || payment.paymentIntentId;
  if (direct) return direct;

  const tr = payment.transactionReference || "";
  if (typeof tr === "string" && tr.startsWith("pi_")) {
    return tr;
  }

  return null;
}

export default function PaymentHistory() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  // filter tab: all / failed / completed / refunded (❌ không còn pending)
  const [filterStatus, setFilterStatus] = useState("all");

  // phân trang
  const [currentPage, setCurrentPage] = useState(1);

  // modal state
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null); // payment item (list + detail)
  const [detailLoading, setDetailLoading] = useState(false);

  // cache tên gói: { [memberPackageId]: packageName }
  const [packageNames, setPackageNames] = useState({});

  // ===== GỌI API /Payment/my-payments (list) =====
  const fetchPayments = async () => {
    try {
      setLoading(true);
      setLoadError("");

      const res = await api.get("/Payment/my-payments");
      const data = Array.isArray(res.data) ? res.data : [];

      const mapped = data.map((p) => ({
        id: p.id,
        memberPackageId: p.memberPackageId,
        memberId: p.memberId,
        memberName: p.memberName,
        memberEmail: p.memberEmail,
        amount: p.amount,
        discountAmount: p.discountAmount,
        finalAmount: p.finalAmount,
        paymentMethodId: p.paymentMethodId,
        paymentMethodName: p.paymentMethodName,
        paymentStatus: p.paymentStatus,
        transactionReference: p.transactionReference,
        stripePaymentIntentId: p.stripePaymentIntentId,
        paymentDate: p.paymentDate,
        notes: p.notes,
      }));

      setPayments(mapped);
    } catch (err) {
      console.error("Error fetching my-payments:", err);
      setLoadError("Không tải được lịch sử thanh toán.");
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // khi mở chi tiết: nếu có memberPackageId mà chưa có name thì gọi API lấy
  useEffect(() => {
    const fetchPackageName = async () => {
      if (!selected?.memberPackageId) return;
      const pkgId = selected.memberPackageId;
      if (packageNames[pkgId]) return;

      try {
        const res = await api.get(`/MemberPackage/${pkgId}`);
        const pkg = res.data;
        const name = pkg?.packageName || pkg?.name || `Gói #${pkgId}`;
        setPackageNames((prev) => ({
          ...prev,
          [pkgId]: name,
        }));
      } catch (err) {
        console.error("Error fetching member package:", err);
        setPackageNames((prev) => ({
          ...prev,
          [pkgId]: `Gói #${pkgId}`,
        }));
      }
    };

    fetchPackageName();
  }, [selected, packageNames]);

  const getSelectedPackageName = () => {
    if (!selected?.memberPackageId) return "Không có";
    const id = selected.memberPackageId;
    return packageNames[id] || `Gói #${id}`;
  };

  // sort theo paymentDate mới nhất lên trên
  const sortedPayments = useMemo(
    () =>
      [...payments].sort(
        (a, b) =>
          new Date(b.paymentDate || 0).getTime() -
          new Date(a.paymentDate || 0).getTime()
      ),
    [payments]
  );

  // lọc theo tab + loại bỏ Pending
  const filteredPayments = useMemo(() => {
    // luôn loại Pending khỏi mọi tab
    const nonPending = sortedPayments.filter(
      (p) => (p.paymentStatus || "").toLowerCase() !== "pending"
    );

    if (filterStatus === "all") return nonPending;

    return nonPending.filter((p) => {
      const st = (p.paymentStatus || "").toLowerCase();
      if (filterStatus === "failed") return st === "failed";
      if (filterStatus === "completed")
        return st === "completed" || st === "success";
      if (filterStatus === "refunded") return st === "refunded";
      return true;
    });
  }, [sortedPayments, filterStatus]);

  // tổng số trang
  const totalPages = Math.max(
    1,
    Math.ceil(filteredPayments.length / ITEMS_PER_PAGE) || 1
  );

  // đảm bảo currentPage không vượt quá totalPages khi filter/data đổi
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  // data hiển thị: tối đa 5 payment / trang
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  // ===== Mở modal + load detail từ /Payment/{id} =====
  const handleOpen = async (paymentItem) => {
    setSelected(paymentItem); // set trước để có gì đó hiển thị
    setOpen(true);
    setDetailLoading(true);

    try {
      const res = await api.get(`/Payment/${paymentItem.id}`);
      const detail = res.data; // dạng như mẫu bạn gửi

      // merge detail lên trên (ưu tiên field từ detail)
      setSelected((prev) => ({
        ...(prev || {}),
        ...detail,
      }));
    } catch (err) {
      console.error("Error fetching payment detail:", err);
      // Nếu lỗi vẫn giữ selected từ list, chỉ log thôi
    } finally {
      setDetailLoading(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
    setDetailLoading(false);
  };

  // ===== Tiếp tục thanh toán cho payment Pending =====
  // (Thực tế sẽ không dùng nữa vì Pending đã bị lọc ra, nhưng để code an toàn vẫn giữ)
  const handleContinuePayment = () => {
    if (!selected) return;

    const piId = getStripePaymentIntentId(selected);
    if (!piId) {
      alert(
        "Giao dịch này không có Stripe Payment Intent Id, không thể tiếp tục thanh toán."
      );
      return;
    }

    navigate(`/payment/${encodeURIComponent(piId)}`, {
      state: { payment: selected },
    });
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
          className={
            "nav-link " + (filterStatus === "completed" ? "active" : "")
          }
          onClick={() => {
            setFilterStatus("completed");
            setCurrentPage(1);
          }}
        >
          Thành công
        </button>
      </li>
      <li className="nav-item">
        <button
          type="button"
          className={"nav-link " + (filterStatus === "failed" ? "active" : "")}
          onClick={() => {
            setFilterStatus("failed");
            setCurrentPage(1);
          }}
        >
          Thất bại
        </button>
      </li>
      <li className="nav-item">
        <button
          type="button"
          className={
            "nav-link " + (filterStatus === "refunded" ? "active" : "")
          }
          onClick={() => {
            setFilterStatus("refunded");
            setCurrentPage(1);
          }}
        >
          Đã hoàn tiền
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
            "url('https://ptfitness.vn/wp-content/uploads/2021/03/setup-mo-phong-gym-tu-a-den-z-anh-bia.jpg')",
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
              Lịch sử thanh toán
            </h3>
          </div>
        </div>

        {/* Tabs filter */}
        {renderFilterTabs()}

        {loading && (
          <div className="row justify-content-center mb-3">
            <div className="col-12 col-xl-10">
              <div className="alert alert-info text-center mb-0">
                Đang tải lịch sử thanh toán...
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

        {/* Danh sách thanh toán sau khi lọc + phân trang */}
        {paginatedPayments.map((p) => {
          const statusObj = getPaymentStatusDisplay(p);

          return (
            <div className="row justify-content-center mb-3" key={p.id}>
              <div className="col-12 col-xl-10">
                <div className="card shadow-0 border rounded-3 card-shadow">
                  <div className="card-body">
                    <div className="row g-3 align-items-center">
                      <div className="col-12 col-md-8">
                        <div className="text-muted small mb-1">
                          Thanh toán #{p.id}
                        </div>

                        <div
                          className={statusObj.className}
                          style={{ fontSize: "0.95rem" }}
                        >
                          {statusObj.text}
                        </div>

                        <div className="text-muted small mt-2">
                          Ngày giờ thanh toán
                        </div>
                        <div className="fw-semibold">
                          {formatDDMMYYYYHHMM(p.paymentDate)}
                        </div>
                      </div>

                      <div className="col-12 col-md-4 d-flex justify-content-md-end align-items-center gap-3">
                        <div className="text-end me-2">
                          <div className="text-muted small">Thực thu</div>
                          <div className="fw-semibold">
                            {currencyVND(p.finalAmount ?? 0)}
                          </div>
                        </div>

                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handleOpen(p)}
                        >
                          Detail
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Phân trang: 5 mục / trang */}
        {!loading && !loadError && filteredPayments.length > 0 && (
          <div className="row justify-content-center mt-3">
            <div className="col-12 col-xl-10 d-flex justify-content-center">
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      type="button"
                      style={{ marginBottom: 10 }}
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
                          style={{ marginBottom: 10, marginLeft: 10 }}
                          className="page-link"
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
                      style={{ marginBottom: 10, marginLeft: 10 }}
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

        {/* Không có payment trong tab hiện tại */}
        {!loading &&
          !loadError &&
          filteredPayments.length === 0 &&
          sortedPayments.length > 0 && (
            <div className="row justify-content-center">
              <div className="col-12 col-xl-10">
                <div
                  className="alert alert-light border text-center"
                  role="alert"
                >
                  Không có giao dịch nào trong mục này.
                </div>
              </div>
            </div>
          )}

        {/* Không có lịch sử thanh toán tổng */}
        {!loading && !loadError && sortedPayments.length === 0 && (
          <div className="row justify-content-center">
            <div className="col-12 col-xl-10">
              <div className="alert alert-light border text-center" role="alert">
                Chưa có lịch sử thanh toán.
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
                  Chi tiết thanh toán #{selected.id}
                </h5>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleClose}
                >
                  <AiOutlineClose />
                </button>
              </div>

              <div className="modal-body">
                {detailLoading && (
                  <div className="alert alert-info py-2 mb-3">
                    Đang tải chi tiết thanh toán...
                  </div>
                )}

                {/* Status + mã giao dịch + ngày giờ + ghi chú */}
                <div className="mb-3">
                  {(() => {
                    const st = getPaymentStatusDisplay(selected);
                    return (
                      <div
                        className={st.className}
                        style={{ fontSize: "0.95rem" }}
                      >
                        Trạng thái: {st.text}
                        {selected.paymentStatus && (
                          <span className="text-muted ms-2">
                            ({selected.paymentStatus})
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  <div className="text-muted small mt-1">
                    Mã giao dịch:{" "}
                    <strong>
                      {selected.transactionReference || "Không có"}
                    </strong>
                  </div>

                  <div className="text-muted small mt-1">
                    Ngày giờ thanh toán:{" "}
                    <strong>
                      {formatDDMMYYYYHHMM(selected.paymentDate) || "—"}
                    </strong>
                  </div>

                  {selected.notes && (
                    <div className="text-muted small mt-1">
                      Ghi chú: <strong>{selected.notes}</strong>
                    </div>
                  )}
                </div>

                {/* Thông tin chi tiết */}
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="text-muted small">Gói tập</div>
                    <div className="fw-semibold">
                      {getSelectedPackageName()}
                    </div>
                  </div>

                  <div className="col-12 col-md-6">
                    <div className="text-muted small">
                      Phương thức thanh toán
                    </div>
                    <div className="fw-semibold">
                      {selected.paymentMethodName || (
                        <span className="text-muted">Không rõ</span>
                      )}
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="text-muted small">Số tiền gốc</div>
                    <div className="fw-semibold">
                      {currencyVND(selected.amount ?? 0)}
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="text-muted small">Giảm giá</div>
                    <div className="fw-semibold">
                      {currencyVND(selected.discountAmount ?? 0)}
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div className="text-muted small">Thực thu</div>
                    <div className="fw-semibold">
                      {currencyVND(selected.finalAmount ?? 0)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer d-flex justify-content-end gap-2">
                <button
                  className="btn btn-outline-secondary"
                  onClick={handleClose}
                >
                  Đóng
                </button>

                {/* Chỉ cho phép tiếp tục thanh toán khi Pending + có Stripe PI Id
                    => do Pending đã bị lọc nên thực tế nút này không xuất hiện nữa */}
                {(() => {
                  const rawStatus = (selected.paymentStatus || "").toLowerCase();
                  const piId = getStripePaymentIntentId(selected);
                  const canContinue = rawStatus === "pending" && !!piId;

                  if (!canContinue) return null;

                  return (
                    <button
                      className="btn btn-primary"
                      onClick={handleContinuePayment}
                    >
                      Tiếp tục thanh toán
                    </button>
                  );
                })()}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** ===== ErrorBoundary ===== */
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, err: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, err: error };
  }
  componentDidCatch(error, info) {
    console.error("PaymentHistory crashed:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="alert alert-danger m-3">
          Đã có lỗi khi hiển thị lịch sử thanh toán. Vui lòng tải lại trang
          hoặc thử lại sau.
        </div>
      );
    }
    return this.props.children;
  }
}