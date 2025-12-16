import { useEffect, useMemo, useState } from "react";
import api from "../../config/axios";
import { Modal, Descriptions, Image, Tag, Button, Spin } from "antd";
import dayjs from "dayjs";

import StaffSidebar from "../../components/StaffSidebar";

const STATUS_OPTIONS = ["Tất cả", "Đang Hoạt Động", "Đang Bảo Trì"];

function statusBadgeClass(s) {
  switch (s) {
    case "Đang Hoạt Động":
      return "bg-success";
    case "Đang Bảo Trì":
      return "bg-warning text-dark";
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

  // Maintenance log
  const [schedule, setSchedule] = useState([]);
  const [todayTask, setTodayTask] = useState(null);
  const [activeTask, setActiveTask] = useState({});
  const [showMaintenanceLog, setShowMaintenanceLog] = useState(false);
  const [maintenanceLogText, setMaintenanceLogText] = useState("");

  // Damage report
  const [showDamageReport, setShowDamageReport] = useState(false);
  const [damageText, setDamageText] = useState("");
  const [severity, setSeverity] = useState("Medium");

  // Return log
  const [showReturnLog, setShowReturnLog] = useState(false);
  const [returnLogText, setReturnLogText] = useState("");
  const [returnFromStatus, setReturnFromStatus] = useState(null);

  /* =======================================================
      FETCH EQUIPMENTS
  ======================================================= */
  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Equipment");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.data || [];

      const mapped = data.map((it) => ({
        id: it.id ?? it.equipmentId,
        equipmentName: it.equipmentName ?? "—",
        model: it.model ?? "—",
        code: it.serialNumber ?? "",
        status: it.status ?? "Tồn kho",
        photo: it.imageUrl ?? "/img/noimg.jpg",
        description: it.description ?? "",
        purchaseDate: it.purchaseDate ?? null,
        purchaseCost: it.purchaseCost ?? null,
        location: it.location ?? "",
      }));

      setItems(mapped);
    } catch (err) {
      message.error("Lấy dữ liệu thiết bị thất bại");
    } finally {
      setLoading(false);
    }
  };
  const fetchMaintenanceSchedule = async () => {
    try {
      const res = await api.get("/MaintenanceSchedule");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.data || [];

      setSchedule(data);
    } catch (err) {
      message.error("Không thể tải lịch bảo trì");
    }
  };


  useEffect(() => {
    fetchEquipments();
    fetchMaintenanceSchedule();
  }, []);

  /* =======================================================
      FILTER
  ======================================================= */
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((it) => {
      const matchStatus = statusFilter === "Tất cả" || it.status === statusFilter;
      const matchText =
        !q ||
        it.equipmentName.toLowerCase().includes(q) ||
        it.model.toLowerCase().includes(q) ||
        it.code.toLowerCase().includes(q);

      return matchStatus && matchText;
    });
  }, [items, query, statusFilter]);

  /* =======================================================
      DETAIL HANDLING
  ======================================================= */
  const openDetail = (it) => {
    setSelected(it);

    // Nếu task đã accept → vẫn show panel khi mở lại modal
    if (activeTask[it.id]) {
      setShowMaintenanceLog(true);
    } else {
      // reset khi chưa có nhiệm vụ
      setShowMaintenanceLog(false);
    }

    setShowDamageReport(false);
    setShowReturnLog(false);
    setMaintenanceLogText("");
    setDamageText("");
    setReturnLogText("");
    setSeverity("Medium");
    setReturnFromStatus(null);
  };


  const closeDetail = () => setSelected(null);

  /* =======================================================
      START MAINTENANCE
  ======================================================= */
  const handleStartMaintenance = async () => {
    const today = dayjs().format("YYYY-MM-DD");

    const task = schedule.find(
      (s) =>
        s.equipmentId === selected.id &&
        dayjs(s.scheduledDate).format("YYYY-MM-DD") === today &&
        s.status === "Pending" &&
        !s.isCompleted
    );

    if (!task) {
      return message.error("Thiết bị này không có lịch bảo trì vào hôm nay");
    }

    try {
      await api.post(`/MaintenanceSchedule/${task.id}/accept`);
      message.success("Đã nhận nhiệm vụ bảo trì");

      // 👉 Lưu nhiệm vụ ở cấp component
      setActiveTask((prev) => ({
        ...prev,
        [selected.id]: {
          ...task,
          status: "Accepted",
        },
      }));

      // mở panel log
      setShowMaintenanceLog(true);
      setMaintenanceLogText("");

    } catch (err) {
      message.error("Không thể nhận nhiệm vụ bảo trì");
    }
  };

  /* =======================================================
       SAVE MAINTENANCE LOG
   ======================================================= */


  const saveMaintenanceLog = async () => {
    const text = maintenanceLogText.trim();
    if (!text) return message.warning("Nhập nội dung log!");

    const task = activeTask[selected.id];
    if (!task) return message.error("Không tìm thấy nhiệm vụ bảo trì.");

    try {
      await api.post(`/MaintenanceSchedule/${task.id}/complete`, {
        notes: text,
      });

      message.success("Hoàn tất bảo trì");

      // Xóa nhiệm vụ khỏi bộ nhớ
      setActiveTask((prev) => {
        const newState = { ...prev };
        delete newState[selected.id];
        return newState;
      });

      setShowMaintenanceLog(false);
      closeDetail();
      fetchMaintenanceSchedule();
      fetchEquipments();

    } catch (err) {
      message.error("Không thể hoàn tất bảo trì");
    }
  };




  /* =======================================================
      DAMAGE REPORT (HAS API)
  ======================================================= */
  const handleReportDamage = () => {
    setShowMaintenanceLog(false);
    setShowReturnLog(false);

    setShowDamageReport(true);
    setDamageText("");
  };

  const saveDamageReport = async () => {
    if (!damageText.trim())
      return message.warning("Nhập mô tả sự cố!");

    try {
      await api.post("/EquipmentRepairReport", {
        equipmentId: selected.id,
        issueDescription: damageText,
        severity,
      });

      message.success("Đã gửi báo cáo hỏng");
      setShowDamageReport(false);
      fetchEquipments();
      closeDetail();
    } catch (err) {
      message.error("Không thể gửi báo cáo hỏng");
    }
  };

  /* =======================================================
      RETURN TO ACTIVE (LOCAL ONLY)
  ======================================================= */
  const handleBackToActive = () => {
    setReturnFromStatus(selected.status);
    setShowMaintenanceLog(false);
    setShowDamageReport(false);
    setShowReturnLog(true);
  };

  const saveReturnLog = () => {
    if (!returnLogText.trim())
      return message.warning("Nhập nội dung log!");

    message.success("Đã ghi log hoàn tất (LOCAL ONLY – không có API)");

    setShowReturnLog(false);
    closeDetail();
  };

  const formatDate = (d) =>
    d ? dayjs(d).format("DD/MM/YYYY") : "—";

  /* =======================================================
      RENDER
  ======================================================= */
  return (
    <div className="container py-5">
      <div className="row g-4">

        {/* SIDEBAR */}
        <div className="col-lg-3">
          <StaffSidebar />
        </div>

        {/* MAIN CONTENT */}
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Thiết bị phòng tập</h2>

          {/* FILTER */}
          <div className="row g-3 align-items-end mb-4">
            <div className="col-md-6">
              <label className="form-label">Tìm kiếm</label>
              <input
                className="form-control"
                placeholder="Nhập tên máy / mã máy..."
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
                  <option key={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="col-md-3 text-md-end">
              <span className="text-muted small">
                Tổng: <strong>{filtered.length}</strong> thiết bị
              </span>
            </div>
          </div>

          {/* LIST */}
          <div className="row g-4">
            {loading ? (
              <div className="col-12 text-center py-5">
                <Spin />
              </div>
            ) : filtered.length ? (
              filtered.map((it) => (
                <div key={it.id} className="col-sm-6 col-lg-4 col-xl-3">
                  <div className="card h-100 shadow-sm">

                    {/* IMAGE */}
                    <div className="ratio ratio-4x3 position-relative">
                      <img
                        src={it.photo || "/img/noimg.jpg"}
                        className="card-img-top object-fit-cover"
                        alt={it.equipmentName}
                        onError={(e) =>
                          (e.currentTarget.src = "/img/noimg.jpg")
                        }
                      />
                    </div>

                    {/* BODY */}
                    <div className="card-body d-flex flex-column">
                      <div className="d-flex justify-content-between">
                        <h5 className="equip-title mb-0">{it.equipmentName}</h5>
                        <span className={`badge ${statusBadgeClass(it.status)}`}>
                          {it.status}
                        </span>
                      </div>

                      <p className="card-text text-muted small mb-3">
                        Mẫu máy: <strong>{it.model}</strong>
                        <br />
                        Mua: {formatDate(it.purchaseDate)}
                        <br />
                        Giá:{" "}
                        {it.purchaseCost
                          ? Number(it.purchaseCost).toLocaleString() + " đ"
                          : "—"}
                      </p>

                      <button
                        className="btn btn-outline-primary mt-auto"
                        onClick={() => openDetail(it)}
                      >
                        Chi tiết
                      </button>
                    </div>

                  </div>
                </div>
              ))
            ) : (
              <div className="col-12">
                <div className="alert alert-light border">
                  <i className="fa fa-info-circle me-2"></i>
                  Không tìm thấy thiết bị phù hợp.
                </div>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* =============== DETAIL MODAL =============== */}
      <Modal
        open={!!selected}
        title="Chi tiết thiết bị"
        onCancel={closeDetail}
        width={800}
        footer={[
          <Button key="close" onClick={closeDetail}>
            Đóng
          </Button>,
        ]}
      >
        {/* ===== MAIN INFO ===== */}
        <div className="row g-4">
          {/* IMAGE */}
          <div className="col-md-5 text-center">
            <Image
              src={selected?.photo || "/img/noimg.jpg"}
              fallback="/img/noimg.jpg"
              style={{ borderRadius: 10 }}
            />
          </div>

          {/* INFO */}
          <div className="col-md-7">
            <h4 className="mb-1">{selected?.equipmentName}</h4>

            <Tag
              color={
                selected?.status === "Đang Hoạt Động"
                  ? "green"
                  : selected?.status === "Đang Bảo Trì"
                    ? "orange"
                    : "red"
              }
            >
              {selected?.status}
            </Tag>

            <Descriptions bordered column={1} size="small" className="mt-3">
              <Descriptions.Item label="Mã máy">
                {selected?.code || selected?.serialNumber || "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Model">
                {selected?.model || "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày mua">
                {selected?.purchaseDate
                  ? dayjs(selected.purchaseDate).format("DD/MM/YYYY")
                  : "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Vị trí">
                {selected?.location || "—"}
              </Descriptions.Item>
            </Descriptions>

            {/* ===== ACTION BUTTONS ===== */}
            <div className="d-flex flex-wrap gap-2 mt-3">
              {selected?.status === "Đang Hoạt Động" && (
                <>
                  <Button type="primary" onClick={handleStartMaintenance}>
                    🛠 Bảo trì
                  </Button>

                  <Button danger onClick={handleReportDamage}>
                    ⚠ Báo cáo thiệt hại
                  </Button>
                </>
              )}

              {selected?.status === "Đang Bảo Trì" && (
                <Button type="primary" onClick={handleBackToActive}>
                  ✔ Trở về hoạt động
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ===== MAINTENANCE LOG ===== */}
        {showMaintenanceLog && (
          <div className="mt-4">
            <h6>Ghi log bảo trì</h6>
            <textarea
              className="form-control mb-2"
              rows={3}
              value={maintenanceLogText}
              onChange={(e) => setMaintenanceLogText(e.target.value)}
            />
            <div className="d-flex gap-2">
              <Button type="primary" onClick={saveMaintenanceLog}>
                Ghi log
              </Button>
              <Button onClick={() => setShowMaintenanceLog(false)}>Huỷ</Button>
            </div>
          </div>
        )}

        {/* ===== DAMAGE REPORT ===== */}
        {showDamageReport && (
          <div className="mt-4">
            <h6>Báo cáo thiệt hại</h6>

            <label className="form-label fw-bold">Mức độ nghiêm trọng</label>
            <select
              className="form-select mb-3"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="Low">Thấp</option>
              <option value="Medium">Trung bình</option>
              <option value="High">Cao</option>
              <option value="Critical">Nghiêm trọng</option>
            </select>

            <textarea
              className="form-control mb-2"
              rows={3}
              value={damageText}
              onChange={(e) => setDamageText(e.target.value)}
            />

            <div className="d-flex gap-2">
              <Button danger onClick={saveDamageReport}>
                Gửi báo cáo
              </Button>
              <Button onClick={() => setShowDamageReport(false)}>Huỷ</Button>
            </div>
          </div>
        )}

        {/* ===== RETURN LOG ===== */}
        {showReturnLog && (
          <div className="mt-4">
            <h6>
              {returnFromStatus === "Đang Bảo Trì"
                ? "Ghi log hoàn tất bảo trì"
                : "Ghi log hoàn tất sửa chữa"}
            </h6>

            <textarea
              className="form-control mb-2"
              rows={3}
              value={returnLogText}
              onChange={(e) => setReturnLogText(e.target.value)}
            />

            <div className="d-flex gap-2">
              <Button type="primary" onClick={saveReturnLog}>
                Lưu log & về hoạt động
              </Button>
              <Button onClick={() => setShowReturnLog(false)}>Huỷ</Button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
