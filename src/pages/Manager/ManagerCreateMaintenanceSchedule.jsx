import { useEffect, useState } from "react";
import api from "../../config/axios";
import dayjs from "dayjs";
import { message, Spin } from "antd";
import Sidebar from "../../components/Sidebar";

export default function ManagerCreateMaintenanceSchedule() {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form fields
  const [equipmentId, setEquipmentId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [description, setDescription] = useState("");
  const [estimatedDuration, setEstimatedDuration] = useState("");
  const [notes, setNotes] = useState("");

  // Fetch list of equipment
  const fetchEquipments = async () => {
    setLoading(true);
    try {
      const res = await api.get("/Equipment");
      const data = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.data || [];

      setEquipments(data);
    } catch (err) {
      message.error("Lỗi khi tải danh sách thiết bị");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEquipments();
  }, []);

  // Submit API
  const handleSubmit = async () => {
    if (!equipmentId) return message.warning("Vui lòng chọn thiết bị");
    if (!scheduledDate) return message.warning("Vui lòng chọn thời gian bảo trì");
    if (!description.trim()) return message.warning("Vui lòng nhập mô tả");

    try {
      await api.post("/MaintenanceSchedule", {
        equipmentId: Number(equipmentId),
        scheduledDate: new Date(scheduledDate).toISOString(),
        description,
        estimatedDuration: Number(estimatedDuration) || 0,
        notes
      });

      message.success("Tạo lịch bảo trì thành công!");

      // Reset form
      setEquipmentId("");
      setScheduledDate("");
      setDescription("");
      setEstimatedDuration("");
      setNotes("");
    } catch (err) {
      message.error("Không thể tạo lịch bảo trì");
    }
  };

  return (
    <div className="container-fluid py-5">
      <div className="row g-4">

        <div className="col-lg-3">
          <Sidebar role="Manager" />
        </div>

        <div className="col-lg-9">
          <h3 className="mb-4 text-center">Tạo Lịch Bảo Trì Thiết Bị</h3>

          {loading ? (
            <div className="text-center py-5"><Spin /></div>
          ) : (
            <div className="card shadow-sm p-4">

              {/* === Chọn thiết bị === */}
              <div className="mb-3">
                <label className="form-label fw-bold">Thiết bị</label>
                <select
                  className="form-select"
                  value={equipmentId}
                  onChange={(e) => setEquipmentId(e.target.value)}
                >
                  <option value="">-- Chọn thiết bị --</option>
                  {equipments.map((eq) => (
                    <option key={eq.id} value={eq.id}>
                      {eq.equipmentName} – {eq.model}
                    </option>
                  ))}
                </select>
              </div>

              {/* === Thời gian bảo trì === */}
              <div className="mb-3">
                <label className="form-label fw-bold">Thời gian bảo trì</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
              </div>

              {/* === Mô tả === */}
              <div className="mb-3">
                <label className="form-label fw-bold">Mô tả</label>
                <textarea
                  className="form-control"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {/* === Thời gian dự kiến === */}
              <div className="mb-3">
                <label className="form-label fw-bold">Thời lượng dự kiến (phút)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="Ví dụ: 60"
                  value={estimatedDuration}
                  onChange={(e) => setEstimatedDuration(e.target.value)}
                />
              </div>

              {/* === Notes === */}
              <div className="mb-3">
                <label className="form-label fw-bold">Ghi chú</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              {/* === Submit === */}
              <div className="text-end">
                <button className="btn btn-primary" onClick={handleSubmit}>
                  Tạo lịch bảo trì
                </button>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
