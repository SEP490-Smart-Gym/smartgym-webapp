import { useEffect, useState } from "react";
import api from "../../config/axios";
import dayjs from "dayjs";
import { Spin, message } from "antd";
import StaffSidebar from "../../components/StaffSidebar";

export default function StaffUpcomingMaintenance() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const res = await api.get("/MaintenanceSchedule/upcoming");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.data || [];

      const mapped = data.map((it) => ({
        id: it.id,
        equipmentId: it.equipmentId,
        equipmentName: it.equipmentName,
        scheduledDate: it.scheduledDate,
        description: it.description,
        assignedToName: it.assignedToName,
        isCompleted: it.isCompleted,
        notes: it.notes,
      }));

      setList(mapped);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải lịch bảo trì sắp tới");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  return (
    <div className="container py-5">
      <div className="row g-4">

        {/* SIDEBAR */}
        <div className="col-lg-3">
          <StaffSidebar />
        </div>

        {/* CONTENT */}
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Lịch Bảo Trì Sắp Tới</h2>

          {loading ? (
            <div className="text-center py-5">
              <Spin />
            </div>
          ) : list.length === 0 ? (
            <div className="alert alert-light border">
              <i className="fa fa-info-circle me-2"></i>
              Không có lịch bảo trì nào sắp diễn ra.
            </div>
          ) : (
            <div className="row g-4">
              {list.map((it) => (
                <div key={it.id} className="col-md-6 col-lg-4">
                  <div className="card shadow-sm h-100">

                    <div className="card-body">
                      <h5 className="card-title">{it.equipmentName}</h5>

                      <p className="small text-muted mb-1">
                        <strong>Ngày bảo trì:</strong>{" "}
                        {dayjs(it.scheduledDate).format("DD/MM/YYYY HH:mm")}
                      </p>

                      <p className="small mb-1">
                        <strong>Mô tả:</strong> {it.description || "—"}
                      </p>

                      <p className="small mb-1">
                        <strong>Giao cho:</strong>{" "}
                        {it.assignedToName || (
                          <span className="text-danger">Chưa ai nhận</span>
                        )}
                      </p>

                      {it.notes && (
                        <p className="small text-muted">
                          <strong>Ghi chú:</strong> {it.notes}
                        </p>
                      )}

                      <button
                        className="btn btn-outline-primary w-100 mt-3"
                        onClick={() =>
                          window.location.href = `/staff/equipment/${it.equipmentId}`
                        }
                      >
                        <i className="fa fa-eye me-1" /> Xem thiết bị
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
