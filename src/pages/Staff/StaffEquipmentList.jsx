import { useEffect, useState } from "react";
import api from "../../config/axios";
import { Modal, Descriptions, Image, Tag, Button, Spin, message } from "antd";
import dayjs from "dayjs";

import Sidebar from "../../components/Sidebar";

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

  // Maintenance
  const [schedule, setSchedule] = useState([]);
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

  /* ==============================
        FETCH EQUIPMENT (SEARCH)
     ============================== */
  const fetchEquipments = async (keyword = "", status = "Tất cả") => {
    setLoading(true);
    try {
      const params = {};

      if (keyword && keyword.trim() !== "") {
        params.searchTerm = keyword.trim();
      }

      if (status && status !== "Tất cả") {
        params.status = status;
      }

      const res = await api.get("/Equipment/search", { params });

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.data || [];

      setItems(
        data.map((it) => ({
          id: it.id,
          equipmentName: it.equipmentName,
          model: it.model,
          code: it.serialNumber,
          status: it.status,
          photo: it.imageUrl ?? "/img/noimg.jpg",
          purchaseDate: it.purchaseDate,
          purchaseCost: it.purchaseCost,
          location: it.location,
        }))
      );
    } catch (err) {
      message.error("Không thể tìm thiết bị");
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
    } catch {
      message.error("Không thể tải lịch bảo trì");
    }
  };

  /* ==============================
        INIT LOAD
     ============================== */
  useEffect(() => {
    fetchEquipments("", "Tất cả");
    fetchMaintenanceSchedule();
  }, []);


  /* ==============================
        SEARCH DEBOUNCE
     ============================== */
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEquipments(query, statusFilter);
    }, 400);

    return () => clearTimeout(timer);
  }, [query, statusFilter]);


  /* ==============================
        DETAIL
     ============================== */
  const openDetail = (it) => {
    setSelected(it);

    if (activeTask[it.id]) {
      setShowMaintenanceLog(true);
    } else {
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

  /* ==============================
        START MAINTENANCE
     ============================== */
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
      return message.error("Thiết bị này không có lịch bảo trì hôm nay");
    }

    try {
      await api.post(`/MaintenanceSchedule/${task.id}/accept`);
      message.success("Đã nhận nhiệm vụ bảo trì");

      setActiveTask((prev) => ({
        ...prev,
        [selected.id]: { ...task, status: "Accepted" },
      }));

      setShowMaintenanceLog(true);
    } catch {
      message.error("Không thể nhận nhiệm vụ bảo trì");
    }
  };

  const saveMaintenanceLog = async () => {
    if (!maintenanceLogText.trim())
      return message.warning("Nhập nội dung log!");

    const task = activeTask[selected.id];
    if (!task) return message.error("Không tìm thấy nhiệm vụ");

    try {
      await api.post(`/MaintenanceSchedule/${task.id}/complete`, {
        notes: maintenanceLogText,
      });

      message.success("Hoàn tất bảo trì");

      setActiveTask((prev) => {
        const n = { ...prev };
        delete n[selected.id];
        return n;
      });

      closeDetail();
      fetchEquipments();
      fetchMaintenanceSchedule();
    } catch {
      message.error("Không thể hoàn tất bảo trì");
    }
  };

  /* ==============================
        DAMAGE REPORT
     ============================== */
  const handleReportDamage = () => {
    setShowMaintenanceLog(false);
    setShowReturnLog(false);
    setShowDamageReport(true);
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

      message.success("Đã gửi báo cáo");
      closeDetail();
      fetchEquipments();
    } catch {
      message.error("Không thể gửi báo cáo");
    }
  };

  /* ==============================
        RETURN LOG (LOCAL)
     ============================== */
  const handleBackToActive = () => {
    setReturnFromStatus(selected.status);
    setShowReturnLog(true);
  };

  const saveReturnLog = () => {
    if (!returnLogText.trim())
      return message.warning("Nhập nội dung log!");

    message.success("Đã ghi log (local)");
    closeDetail();
  };

  const formatDate = (d) =>
    d ? dayjs(d).format("DD/MM/YYYY") : "—";

  /* ==============================
        RENDER
     ============================== */
  return (
    <div className="container py-5">
      <div className="row g-4">
        <div className="col-lg-3">
          <Sidebar role="Staff" />
        </div>

        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Thiết bị phòng tập</h2>

          {/* FILTER */}
          <div className="row g-3 align-items-end mb-4">
            <div className="col-md-6">
              <label className="form-label">Tìm kiếm</label>
              <input
                className="form-control"
                placeholder="Tên máy / mã máy..."
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
                Tổng: <strong>{items.length}</strong> thiết bị
              </span>
            </div>
          </div>

          {/* LIST */}
          <div className="row g-4">
            {loading ? (
              <div className="col-12 text-center py-5">
                <Spin />
              </div>
            ) : items.length ? (
              items.map((it) => (
                <div key={it.id} className="col-sm-6 col-lg-4 col-xl-3">
                  <div className="card h-100 shadow-sm">
                    <div className="ratio ratio-4x3">
                      <img
                        src={it.photo}
                        className="card-img-top object-fit-cover"
                        onError={(e) =>
                          (e.currentTarget.src = "/img/noimg.jpg")
                        }
                      />
                    </div>

                    <div className="card-body d-flex flex-column">
                      <span className={`status-badge ${statusBadgeClass(it.status)}`}>
                        {it.status}
                      </span>

                      <h5 className="equip-title mb-2">
                        {it.equipmentName}
                      </h5>

                      <p className="text-muted small">
                        Model: {it.model}
                        <br />
                        Mua: {formatDate(it.purchaseDate)}
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
                  Không tìm thấy thiết bị
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== DETAIL MODAL ===== */}
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
        <div className="row g-4">
          <div className="col-md-5 text-center">
            <Image
              src={selected?.photo}
              fallback="/img/noimg.jpg"
              style={{ borderRadius: 10 }}
            />
          </div>

          <div className="col-md-7">
            <h4>{selected?.equipmentName}</h4>

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
                {selected?.code}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {selected?.model}
              </Descriptions.Item>
              <Descriptions.Item label="Ngày mua">
                {formatDate(selected?.purchaseDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí">
                {selected?.location}
              </Descriptions.Item>
            </Descriptions>

            <div className="d-flex gap-2 mt-3">
              {selected?.status === "Đang Hoạt Động" && (
                <>
                  <Button type="primary" onClick={handleStartMaintenance}>
                    🛠 Bảo trì
                  </Button>
                  <Button danger onClick={handleReportDamage}>
                    ⚠ Báo cáo hỏng
                  </Button>
                </>
              )}
              {selected?.status === "Đang Bảo Trì" && (
                <Button onClick={handleBackToActive}>
                  ✔ Trở về hoạt động
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* LOG / REPORT */}
        {showMaintenanceLog && (
          <div className="mt-4">
            <h6>Ghi log bảo trì</h6>
            <textarea
              className="form-control mb-2"
              rows={3}
              value={maintenanceLogText}
              onChange={(e) => setMaintenanceLogText(e.target.value)}
            />
            <Button type="primary" onClick={saveMaintenanceLog}>
              Hoàn tất
            </Button>
          </div>
        )}

        {showDamageReport && (
          <div className="mt-4">
            <h6>Báo cáo thiệt hại</h6>
            <textarea
              className="form-control mb-2"
              rows={3}
              value={damageText}
              onChange={(e) => setDamageText(e.target.value)}
            />
            <Button danger onClick={saveDamageReport}>
              Gửi báo cáo
            </Button>
          </div>
        )}

        {showReturnLog && (
          <div className="mt-4">
            <h6>Ghi log hoàn tất</h6>
            <textarea
              className="form-control mb-2"
              rows={3}
              value={returnLogText}
              onChange={(e) => setReturnLogText(e.target.value)}
            />
            <Button onClick={saveReturnLog}>
              Lưu
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
