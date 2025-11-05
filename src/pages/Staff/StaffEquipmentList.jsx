import { useMemo, useState } from "react";

const STATUS_OPTIONS = ["Tất cả", "Đang hoạt động", "Đang bảo trì", "Hư hỏng", "Tồn kho"];

const mockData = [
  {
    id: 1,
    name: "Treadmill Pro 500",
    code: "TM-500",
    brand: "NordicTrack",
    status: "Đang hoạt động",
    photo: "/img/feature-1.jpg",
    description: "Máy chạy bộ cao cấp, hỗ trợ đo nhịp tim, nhiều CT luyện tập.",
    reports: [],
    logs: [],
  },
  {
    id: 2,
    name: "Bench Press HD",
    code: "BP-HD",
    brand: "Rogue",
    status: "Đang bảo trì",
    photo: "/img/feature-2.jpg",
    description: "Ghế đẩy ngực chịu tải lớn, khung thép chắc chắn.",
    reports: [],
    logs: [],
  },
  {
    id: 3,
    name: "Air Bike X",
    code: "AB-X",
    brand: "Assault",
    status: "Hư hỏng",
    photo: "/img/feature-3.jpg",
    description: "Xe đạp kháng lực gió, phù hợp cardio cường độ cao.",
    reports: [],
    logs: [],
  },
  {
    id: 4,
    name: "Rowing Ergo 2",
    code: "RW-2",
    brand: "Concept2",
    status: "Tồn kho",
    photo: "/img/feature-4.jpg",
    description: "Máy chèo thuyền đa năng, mô phỏng chuyển động tự nhiên.",
    reports: [],
    logs: [],
  },
];

function statusBadgeClass(s) {
  switch (s) {
    case "Đang hoạt động":
      return "bg-success";
    case "Đang bảo trì":
      return "bg-warning text-dark";
    case "Hư hỏng":
      return "bg-danger";
    case "Tồn kho":
      return "bg-secondary";
    default:
      return "bg-light text-dark";
  }
}

export default function StaffEquipmentList() {
  const [items, setItems] = useState(mockData);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [selected, setSelected] = useState(null);

  // Panels trong modal
  const [showMaintenanceLog, setShowMaintenanceLog] = useState(false);
  const [maintenanceLogText, setMaintenanceLogText] = useState("");

  const [showDamageReport, setShowDamageReport] = useState(false);
  const [damageText, setDamageText] = useState("");

  const [showReturnLog, setShowReturnLog] = useState(false);
  const [returnLogText, setReturnLogText] = useState("");
  const [returnFromStatus, setReturnFromStatus] = useState(null); // "Đang bảo trì" | "Hư hỏng"

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchStatus = statusFilter === "Tất cả" || it.status === statusFilter;
      const matchText =
        !q ||
        it.name.toLowerCase().includes(q) ||
        it.brand.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q);
      return matchStatus && matchText;
    });
  }, [items, query, statusFilter]);

  const openDetail = (it) => {
    setSelected(it);
    // reset panels
    setShowMaintenanceLog(false);
    setShowDamageReport(false);
    setShowReturnLog(false);
    setMaintenanceLogText("");
    setDamageText("");
    setReturnLogText("");
    setReturnFromStatus(null);
  };

  const closeDetail = () => {
    setSelected(null);
    setShowMaintenanceLog(false);
    setShowDamageReport(false);
    setShowReturnLog(false);
    setMaintenanceLogText("");
    setDamageText("");
    setReturnLogText("");
    setReturnFromStatus(null);
  };

  // ====== Nút: Bảo trì ======
  const handleStartMaintenance = () => {
    if (!selected) return;
    // cập nhật trạng thái ngay sang "Đang bảo trì"
    setItems((prev) => prev.map((it) => (it.id === selected.id ? { ...it, status: "Đang bảo trì" } : it)));
    setSelected((s) => (s ? { ...s, status: "Đang bảo trì" } : s));

    // mở panel log bảo trì
    setShowDamageReport(false);
    setShowReturnLog(false);
    setShowMaintenanceLog(true);
    setMaintenanceLogText("Bắt đầu bảo trì thiết bị...");
  };

  // Lưu log bảo trì (không đổi trạng thái — đã set ở trên)
  const saveMaintenanceLog = () => {
    const text = maintenanceLogText.trim();
    if (!text) return alert("Vui lòng nhập nội dung log bảo trì!");
    const entry = { id: Date.now(), type: "maintenance", text, createdAt: new Date().toISOString() };
    setItems((prev) =>
      prev.map((it) => (it.id === selected.id ? { ...it, logs: [entry, ...(it.logs || [])] } : it))
    );
    setSelected((s) => (s ? { ...s, logs: [entry, ...(s.logs || [])] } : s));
    setShowMaintenanceLog(false);
    setMaintenanceLogText("");
    alert("Đã ghi log bảo trì!");
  };

  // ====== Nút: Báo cáo thiệt hại ======
  const handleReportDamage = () => {
    if (!selected) return;
    // cập nhật trạng thái ngay sang "Hư hỏng"
    setItems((prev) => prev.map((it) => (it.id === selected.id ? { ...it, status: "Hư hỏng" } : it)));
    setSelected((s) => (s ? { ...s, status: "Hư hỏng" } : s));

    // mở panel report
    setShowMaintenanceLog(false);
    setShowReturnLog(false);
    setShowDamageReport(true);
    setDamageText("");
  };

  const saveDamageReport = () => {
    const text = damageText.trim();
    if (!text) return alert("Vui lòng nhập nội dung báo cáo hỏng!");
    const entry = { id: Date.now(), type: "damage_report", text, createdAt: new Date().toISOString() };
    setItems((prev) =>
      prev.map((it) => (it.id === selected.id ? { ...it, reports: [entry, ...(it.reports || [])] } : it))
    );
    setSelected((s) => (s ? { ...s, reports: [entry, ...(s.reports || [])] } : s));
    setShowDamageReport(false);
    setDamageText("");
    alert("Đã gửi báo cáo hỏng!");
  };

  // ====== Nút: Trở về hoạt động ======
  const handleBackToActive = () => {
    if (!selected) return;
    // chỉ áp dụng nếu đang bảo trì hoặc hư hỏng
    if (selected.status !== "Đang bảo trì" && selected.status !== "Hư hỏng") {
      return alert("Chỉ ‘Trở về hoạt động’ khi thiết bị đang bảo trì hoặc hư hỏng.");
    }
    // mở panel log hoàn tất; gợi ý nội dung theo trạng thái hiện tại
    const from = selected.status;
    setReturnFromStatus(from);
    setShowMaintenanceLog(false);
    setShowDamageReport(false);
    setShowReturnLog(true);
    setReturnLogText(
      from === "Đang bảo trì"
        ? "Hoàn tất bảo trì, thiết bị hoạt động bình thường."
        : "Đã sửa chữa xong, thiết bị hoạt động trở lại."
    );
  };

  // Lưu log hoàn tất và tự đổi trạng thái về "Đang hoạt động"
  const saveReturnLog = () => {
    const text = returnLogText.trim();
    if (!text) return alert("Vui lòng nhập nội dung log hoàn tất!");
    const entry = {
      id: Date.now(),
      type: returnFromStatus === "Đang bảo trì" ? "maintenance_done" : "repair_done",
      text,
      createdAt: new Date().toISOString(),
    };

    setItems((prev) =>
      prev.map((it) =>
        it.id === selected.id ? { ...it, status: "Đang hoạt động", logs: [entry, ...(it.logs || [])] } : it
      )
    );
    setSelected((s) =>
      s ? { ...s, status: "Đang hoạt động", logs: [entry, ...(s.logs || [])] } : s
    );

    setShowReturnLog(false);
    setReturnLogText("");
    setReturnFromStatus(null);
    alert("Đã ghi log & chuyển về trạng thái Đang hoạt động!");
  };

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Thiết bị phòng tập</h2>

      {/* Bộ lọc */}
      <div className="row g-3 align-items-end mb-4">
        <div className="col-md-6">
          <label className="form-label">Tìm kiếm</label>
          <input
            className="form-control"
            placeholder="Nhập tên máy / mã máy / thương hiệu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Trạng thái</label>
          <select
            className="form-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3 text-md-end">
          <span className="text-muted small">
            Tổng: <strong>{filtered.length}</strong> thiết bị
          </span>
        </div>
      </div>

      {/* Danh sách thiết bị */}
      <div className="row g-4">
        {filtered.length ? (
          filtered.map((it) => (
            <div key={it.id} className="col-sm-6 col-lg-4 col-xl-3">
              <div className="card h-100 shadow-sm">
                <div className="ratio ratio-4x3">
                  <img
                    src={it.photo || "/img/useravt.jpg"}
                    alt={it.name}
                    className="card-img-top object-fit-cover"
                    onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{it.name}</h5>
                    <span className={`badge ${statusBadgeClass(it.status)}`}>{it.status}</span>
                  </div>
                  <p className="card-text text-muted small mb-3">
                    Thương hiệu: <strong>{it.brand}</strong>
                  </p>
                  <div className="mt-auto">
                    <button className="btn btn-primary w-100" onClick={() => openDetail(it)}>
                      Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-light border d-flex align-items-center" role="alert">
              <i className="fa fa-info-circle me-2"></i>
              Không tìm thấy thiết bị phù hợp.
            </div>
          </div>
        )}
      </div>

      {/* Modal chi tiết */}
      {selected && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", background: "rgba(0,0,0,.4)" }}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Chi tiết thiết bị</h5>
                  <button className="btn-close" onClick={closeDetail} />
                </div>
                <div className="modal-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <div className="ratio ratio-4x3 rounded border">
                        <img
                          src={selected.photo || "/img/useravt.jpg"}
                          alt={selected.name}
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <h4 className="mb-1">{selected.name}</h4>
                      <div className="mb-2">
                        <span className={`badge ${statusBadgeClass(selected.status)}`}>
                          {selected.status}
                        </span>
                      </div>
                      <ul className="list-unstyled small mb-3">
                        <li><strong>Mã máy:</strong> {selected.code}</li>
                        <li><strong>Thương hiệu:</strong> {selected.brand}</li>
                      </ul>

                      {/* Ba nút hành động trạng thái */}
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-warning text-dark"
                          onClick={handleStartMaintenance}
                          disabled={selected.status === "Đang bảo trì"}
                          title="Chuyển sang bảo trì và ghi log"
                        >
                          <i className="fa fa-tools me-1" />
                          Bảo trì
                        </button>
                        <button
                          className="btn btn-danger"
                          onClick={handleReportDamage}
                          disabled={selected.status === "Hư hỏng"}
                          title="Báo cáo hư hỏng và ghi báo cáo"
                        >
                          <i className="fa fa-exclamation-triangle me-1" />
                          Báo cáo thiệt hại
                        </button>
                        <button
                          className="btn btn-success ms-auto"
                          onClick={handleBackToActive}
                          disabled={
                            !(selected.status === "Đang bảo trì" || selected.status === "Hư hỏng")
                          }
                          title="Ghi log hoàn tất và trở về hoạt động"
                        >
                          <i className="fa fa-check me-1" />
                          Trở về hoạt động
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Panel: Log bảo trì */}
                  {showMaintenanceLog && (
                    <div className="mt-4">
                      <h6>Ghi log bảo trì</h6>
                      <textarea
                        className="form-control mb-2"
                        rows={3}
                        value={maintenanceLogText}
                        onChange={(e) => setMaintenanceLogText(e.target.value)}
                        placeholder="Mô tả hạng mục bảo trì, linh kiện, thời gian..."
                      />
                      <div className="d-flex gap-2">
                        <button className="btn btn-primary" onClick={saveMaintenanceLog}>
                          Ghi log
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setShowMaintenanceLog(false);
                            setMaintenanceLogText("");
                          }}
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Panel: Báo cáo hỏng */}
                  {showDamageReport && (
                    <div className="mt-4">
                      <h6>Báo cáo thiệt hại</h6>
                      <textarea
                        className="form-control mb-2"
                        rows={3}
                        value={damageText}
                        onChange={(e) => setDamageText(e.target.value)}
                        placeholder="Mô tả lỗi, tình trạng hư hỏng, thời điểm phát hiện..."
                      />
                      <div className="d-flex gap-2">
                        <button className="btn btn-danger" onClick={saveDamageReport}>
                          Gửi báo cáo
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setShowDamageReport(false);
                            setDamageText("");
                          }}
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Panel: Log hoàn tất để trở về hoạt động */}
                  {showReturnLog && (
                    <div className="mt-4">
                      <h6>
                        {returnFromStatus === "Đang bảo trì"
                          ? "Ghi log hoàn tất bảo trì"
                          : "Ghi log hoàn tất sửa chữa"}
                      </h6>
                      <textarea
                        className="form-control mb-2"
                        rows={3}
                        value={returnLogText}
                        onChange={(e) => setReturnLogText(e.target.value)}
                        placeholder={
                          returnFromStatus === "Đang bảo trì"
                            ? "Đã thay thế/kiểm tra…, thiết bị hoạt động ổn định."
                            : "Đã sửa chữa chi tiết…, test ok, thiết bị hoạt động lại."
                        }
                      />
                      <div className="d-flex gap-2">
                        <button className="btn btn-success" onClick={saveReturnLog}>
                          Lưu log & về hoạt động
                        </button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setShowReturnLog(false);
                            setReturnLogText("");
                            setReturnFromStatus(null);
                          }}
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeDetail}>
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={closeDetail} />
        </>
      )}
    </div>
  );
}
