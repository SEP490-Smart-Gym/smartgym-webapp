import { useEffect, useMemo, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import api from "../../config/axios";
import dayjs from "dayjs";
import { message, Spin } from "antd";

const STATUS_OPTIONS = ["Tất cả", "Đang hoạt động", "Đang bảo trì", "Hư hỏng", "Tồn kho"];

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
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tất cả");
  const [selected, setSelected] = useState(null);

  // Panels / local log text
  const [showMaintenanceLog, setShowMaintenanceLog] = useState(false);
  const [maintenanceLogText, setMaintenanceLogText] = useState("");

  const [showDamageReport, setShowDamageReport] = useState(false);
  const [damageText, setDamageText] = useState("");

  const [showReturnLog, setShowReturnLog] = useState(false);
  const [returnLogText, setReturnLogText] = useState("");
  const [returnFromStatus, setReturnFromStatus] = useState(null); // "Đang bảo trì" | "Hư hỏng"

  // fetch equipment list from API
  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Equipment");
      // try best to extract array
      const data = Array.isArray(res.data) ? res.data : res.data.items || res.data.data || [];
      // map to expected structure (safe)
      const mapped = data.map((it) => ({
        id: it.id ?? it.equipmentId ?? it.equipmentID ?? null,
        equipmentName: it.equipmentName ?? it.name ?? it.equipment_name ?? "—",
        code: it.serialNumber ?? it.code ?? "",
        brand: it.brand ?? it.manufacturer ?? "",
        status: it.status ?? "Tồn kho",
        photo: it.imageUrl ?? it.imageUrl ?? it.image ?? it.photo ?? "/img/useravt.jpg",
        description: it.description ?? "",
        purchaseDate: it.purchaseDate ?? null,
        purchaseCost: it.purchaseCost ?? null,
        location: it.location ?? "",
        raw: it,
      }));
      setItems(mapped);
    } catch (err) {
      console.error("fetch equipments error", err);
      message.error("Lấy dữ liệu thiết bị thất bại");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchStatus = statusFilter === "Tất cả" || it.status === statusFilter;
      const matchText =
        !q ||
        (it.equipmentName && it.equipmentName.toLowerCase().includes(q)) ||
        (it.brand && it.brand.toLowerCase().includes(q)) ||
        (it.code && it.code.toLowerCase().includes(q));
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

  // Helper append log to description (human readable)
  const appendLogToDescription = (oldDesc, tag, text) => {
    const ts = dayjs().format("YYYY-MM-DD HH:mm");
    const base = oldDesc?.trim() ? oldDesc + "\n" : "";
    return `${base}[${tag} ${ts}] ${text}`;
  };

  // server update helper: PUT /Equipment/{id} with required fields
  // We'll try to update only fields known by API: map the sample schema:
  // {
  //  equipmentName, categoryId, model, serialNumber, purchaseDate, purchaseCost,
  //  warranty, status, location, imageUrl, description
  // }
  const sendUpdateToServer = async (id, updatedFields) => {
    try {
      // find raw object from selected or items to preserve missing fields
      const existing = items.find((i) => i.id === id)?.raw || {};
      // build body with fields required by API (use existing values if not provided)
      const body = {
        equipmentName: updatedFields.equipmentName ?? existing.equipmentName ?? existing.name ?? "",
        categoryId: updatedFields.categoryId ?? existing.categoryId ?? 0,
        model: updatedFields.model ?? existing.model ?? "",
        serialNumber: updatedFields.serialNumber ?? existing.serialNumber ?? existing.code ?? "",
        purchaseDate:
          updatedFields.purchaseDate ??
          existing.purchaseDate ??
          existing.purchaseDate ??
          new Date().toISOString(),
        purchaseCost: updatedFields.purchaseCost ?? existing.purchaseCost ?? 0,
        warranty: updatedFields.warranty ?? existing.warranty ?? "",
        status: updatedFields.status ?? existing.status ?? "Tồn kho",
        location: updatedFields.location ?? existing.location ?? "",
        imageUrl: updatedFields.imageUrl ?? existing.imageUrl ?? existing.photo ?? "",
        description: updatedFields.description ?? existing.description ?? "",
      };

      // call API (endpoint assumed: PUT /Equipment/{id})
      await api.put(`/Equipment/${id}`, body);
      return true;
    } catch (err) {
      console.error("sendUpdateToServer error", err);
      // show message but don't block local update
      message.error("Ghi log lên server thất bại (local vẫn cập nhật)");
      return false;
    }
  };

  // ====== Nút: Bảo trì ======
  const handleStartMaintenance = () => {
    if (!selected) return;
    // update local status immediately
    const sId = selected.id;
    setItems((prev) => prev.map((it) => (it.id === sId ? { ...it, status: "Đang bảo trì" } : it)));
    setSelected((s) => (s ? { ...s, status: "Đang bảo trì" } : s));
    // open maintenance panel
    setShowDamageReport(false);
    setShowReturnLog(false);
    setShowMaintenanceLog(true);
    setMaintenanceLogText("Bắt đầu bảo trì thiết bị...");
  };

  const saveMaintenanceLog = async () => {
    const text = maintenanceLogText.trim();
    if (!text) return message.warning("Vui lòng nhập nội dung log bảo trì!");
    const entry = { id: Date.now(), type: "maintenance", text, createdAt: new Date().toISOString() };

    // local update: append to logs-like array inside item object (not persisted server-side unless we send)
    setItems((prev) =>
      prev.map((it) =>
        it.id === selected.id ? { ...it, logs: [entry, ...(it.logs || [])], status: "Đang bảo trì" } : it
      )
    );
    setSelected((s) => (s ? { ...s, logs: [entry, ...(s.logs || [])], status: "Đang bảo trì" } : s));

    // prepare description append
    const newDescription = appendLogToDescription(selected?.description ?? "", "MAINTENANCE", text);

    // send update to server (status + description)
    await sendUpdateToServer(selected.id, { status: "Đang bảo trì", description: newDescription });

    setShowMaintenanceLog(false);
    setMaintenanceLogText("");
    message.success("Đã ghi log bảo trì");
  };

  // ====== Nút: Báo cáo thiệt hại ======
  const handleReportDamage = () => {
    if (!selected) return;
    const sId = selected.id;
    setItems((prev) => prev.map((it) => (it.id === sId ? { ...it, status: "Hư hỏng" } : it)));
    setSelected((s) => (s ? { ...s, status: "Hư hỏng" } : s));
    setShowMaintenanceLog(false);
    setShowReturnLog(false);
    setShowDamageReport(true);
    setDamageText("");
  };

  const saveDamageReport = async () => {
    const text = damageText.trim();
    if (!text) return message.warning("Vui lòng nhập nội dung báo cáo hỏng!");
    const entry = { id: Date.now(), type: "damage_report", text, createdAt: new Date().toISOString() };

    setItems((prev) =>
      prev.map((it) => (it.id === selected.id ? { ...it, reports: [entry, ...(it.reports || [])], status: "Hư hỏng" } : it))
    );
    setSelected((s) => (s ? { ...s, reports: [entry, ...(s.reports || [])], status: "Hư hỏng" } : s));

    // append to description
    const newDescription = appendLogToDescription(selected?.description ?? "", "DAMAGE", text);
    await sendUpdateToServer(selected.id, { status: "Hư hỏng", description: newDescription });

    setShowDamageReport(false);
    setDamageText("");
    message.success("Đã gửi báo cáo hỏng");
  };

  // ====== Nút: Trở về hoạt động ======
  const handleBackToActive = () => {
    if (!selected) return;
    if (selected.status !== "Đang bảo trì" && selected.status !== "Hư hỏng") {
      return message.info("Chỉ 'Trở về hoạt động' khi thiết bị đang bảo trì hoặc hư hỏng.");
    }
    const from = selected.status;
    setReturnFromStatus(from);
    setShowMaintenanceLog(false);
    setShowDamageReport(false);
    setShowReturnLog(true);
    setReturnLogText(
      from === "Đang bảo trì" ? "Hoàn tất bảo trì, thiết bị hoạt động bình thường." : "Đã sửa chữa xong, thiết bị hoạt động trở lại."
    );
  };

  const saveReturnLog = async () => {
    const text = returnLogText.trim();
    if (!text) return message.warning("Vui lòng nhập nội dung log hoàn tất!");
    const entry = {
      id: Date.now(),
      type: returnFromStatus === "Đang bảo trì" ? "maintenance_done" : "repair_done",
      text,
      createdAt: new Date().toISOString(),
    };

    // local update: set status to active and append log
    setItems((prev) =>
      prev.map((it) =>
        it.id === selected.id ? { ...it, status: "Đang hoạt động", logs: [entry, ...(it.logs || [])] } : it
      )
    );
    setSelected((s) => (s ? { ...s, status: "Đang hoạt động", logs: [entry, ...(s.logs || [])] } : s));

    const tag = returnFromStatus === "Đang bảo trì" ? "MAINT_DONE" : "REPAIR_DONE";
    const newDescription = appendLogToDescription(selected?.description ?? "", tag, text);

    await sendUpdateToServer(selected.id, { status: "Đang hoạt động", description: newDescription });

    setShowReturnLog(false);
    setReturnLogText("");
    setReturnFromStatus(null);
    message.success("Đã ghi log & chuyển về trạng thái Đang hoạt động");
  };


  const formatDate = (d) => (d ? dayjs(d).format("DD/MM/YYYY") : "—");

  return (
    <div className="container py-5">
      <h2 className="mb-4 text-center">Thiết bị phòng tập</h2>

      {/* Filter */}
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

      {/* List */}
      <div className="row g-4">
        {loading ? (
          <div className="col-12 text-center py-5"><Spin /></div>
        ) : filtered.length ? (
          filtered.map((it) => (
            <div key={it.id} className="col-sm-6 col-lg-4 col-xl-3">
              <div className="card h-100 shadow-sm">
                <div className="ratio ratio-4x3">
                  <img
                    src={it.photo || "/img/useravt.jpg"}
                    alt={it.equipmentName}
                    className="card-img-top object-fit-cover"
                    onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h5 className="card-title mb-0">{it.equipmentName}</h5>
                    <span className={`badge ${statusBadgeClass(it.status)}`}>{it.status}</span>
                  </div>
                  <p className="card-text text-muted small mb-3">
                    Thương hiệu: <strong>{it.brand || "—"}</strong>
                    <br />
                    Mua: {formatDate(it.purchaseDate)} • Giá: {it.purchaseCost ? `${Number(it.purchaseCost).toLocaleString()} đ` : "—"}
                  </p>
                  <div className="mt-auto">
                    <div className="d-grid gap-2">
                      <button className="btn btn-outline-primary" onClick={() => openDetail(it)}>
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12">
            <div className="alert alert-light border d-flex align-items-center" role="alert">
              <i className="fa fa-info-circle me-2" />
              Không tìm thấy thiết bị phù hợp.
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
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
                          alt={selected.equipmentName}
                          className="w-100 h-100"
                          style={{ objectFit: "cover" }}
                          onError={(e) => (e.currentTarget.src = "/img/useravt.jpg")}
                        />
                      </div>
                    </div>

                    <div className="col-md-6">
                      <h4 className="mb-1">{selected.equipmentName}</h4>
                      <div className="mb-2">
                        <span className={`badge ${statusBadgeClass(selected.status)}`}>{selected.status}</span>
                      </div>

                      <ul className="list-unstyled small mb-3">
                        <li><strong>Mã máy:</strong> {selected.code || "—"}</li>
                        <li><strong>Thương hiệu:</strong> {selected.brand || "—"}</li>
                        <li><strong>Ngày mua:</strong> {formatDate(selected.purchaseDate)}</li>
                        <li><strong>Vị trí:</strong> {selected.location || "—"}</li>
                      </ul>

                      {/* Action buttons */}
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          className="btn btn-warning text-dark"
                          onClick={handleStartMaintenance}
                          disabled={selected.status === "Đang bảo trì"}
                          title="Chuyển sang bảo trì và ghi log"
                        >
                          <i className="fa fa-tools me-1" /> Bảo trì
                        </button>

                        <button
                          className="btn btn-danger"
                          onClick={handleReportDamage}
                          disabled={selected.status === "Hư hỏng"}
                          title="Báo cáo hư hỏng và ghi báo cáo"
                        >
                          <i className="fa fa-exclamation-triangle me-1" /> Báo cáo thiệt hại
                        </button>

                        <button
                          className="btn btn-success ms-auto"
                          onClick={handleBackToActive}
                          disabled={!(selected.status === "Đang bảo trì" || selected.status === "Hư hỏng")}
                          title="Ghi log hoàn tất và trở về hoạt động"
                        >
                          <i className="fa fa-check me-1" /> Trở về hoạt động
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  {selected.description ? (
                    <div className="mt-3">
                      <h6>Mô tả</h6>
                      <pre style={{ whiteSpace: "pre-wrap" }} className="small">{selected.description}</pre>
                    </div>
                  ) : null}

                  {/* Maintenance panel */}
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
                        <button className="btn btn-primary" onClick={saveMaintenanceLog}>Ghi log</button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => { setShowMaintenanceLog(false); setMaintenanceLogText(""); }}
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Damage report */}
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
                        <button className="btn btn-danger" onClick={saveDamageReport}>Gửi báo cáo</button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => { setShowDamageReport(false); setDamageText(""); }}
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Return log */}
                  {showReturnLog && (
                    <div className="mt-4">
                      <h6>{returnFromStatus === "Đang bảo trì" ? "Ghi log hoàn tất bảo trì" : "Ghi log hoàn tất sửa chữa"}</h6>
                      <textarea
                        className="form-control mb-2"
                        rows={3}
                        value={returnLogText}
                        onChange={(e) => setReturnLogText(e.target.value)}
                        placeholder={ returnFromStatus === "Đang bảo trì" ? "Hoàn tất bảo trì, thiết bị hoạt động ổn định." : "Đã sửa chữa chi tiết, test ok..." }
                      />
                      <div className="d-flex gap-2">
                        <button className="btn btn-success" onClick={saveReturnLog}>Lưu log & về hoạt động</button>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => { setShowReturnLog(false); setReturnLogText(""); setReturnFromStatus(null); }}
                        >
                          Huỷ
                        </button>
                      </div>
                    </div>
                  )}

                </div>

                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeDetail}>Đóng</button>
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
