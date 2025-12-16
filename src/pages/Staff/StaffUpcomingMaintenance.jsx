import { useEffect, useState } from "react";
import api from "../../config/axios";
import dayjs from "dayjs";
import { Spin, message, Modal, Descriptions, Button, Image, Tag } from "antd";
import StaffSidebar from "../../components/StaffSidebar";

export default function StaffUpcomingMaintenance() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [equipment, setEquipment] = useState(null);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  /* ==========================
        FETCH UPCOMING
     ========================== */
  const fetchUpcoming = async () => {
    setLoading(true);
    try {
      const res = await api.get("/MaintenanceSchedule/upcoming");

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.items || res.data.data || [];

      const mapped = data.map((it) => ({
        id: it.id, // scheduleId
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

  /* ==========================
        OPEN MODAL
     ========================== */
  const handleViewEquipment = async (schedule) => {
    setSelectedSchedule(schedule);
    setOpenModal(true);
    setModalLoading(true);

    try {
      const res = await api.get(`/Equipment/${schedule.equipmentId}`);
      setEquipment(res.data);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải thông tin thiết bị");
    } finally {
      setModalLoading(false);
    }
  };

  /* ==========================
        START MAINTENANCE
     ========================== */
  const handleStartMaintenance = async () => {
    if (!selectedSchedule) return;

    try {
      await api.post(
        `/MaintenanceSchedule/${selectedSchedule.id}/start`
      );
      message.success("Bắt đầu bảo trì thành công");

      setOpenModal(false);
      setEquipment(null);
      setSelectedSchedule(null);

      fetchUpcoming();
    } catch (err) {
      console.error(err);
      message.error("Không thể bắt đầu bảo trì");
    }
  };

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
                        onClick={() => handleViewEquipment(it)}
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

      {/* ==========================
            EQUIPMENT MODAL
         ========================== */}
      <Modal
        open={openModal}
        title="Chi tiết thiết bị"
        onCancel={() => setOpenModal(false)}
        width={700}
        footer={[
          <Button key="cancel" onClick={() => setOpenModal(false)}>
            Đóng
          </Button>,
          <Button
            key="start"
            type="primary"
            onClick={handleStartMaintenance}
          >
            Bắt đầu bảo trì
          </Button>,
        ]}
      >
        {modalLoading ? (
          <div className="text-center py-4">
            <Spin />
          </div>
        ) : equipment ? (
          <>
            {/* IMAGE */}
            {equipment.imageUrl && (
              <div className="text-center mb-3">
                <Image
                  src={equipment.imageUrl}
                  alt={equipment.equipmentName}
                  width={250}
                  style={{ borderRadius: 8 }}
                />
              </div>
            )}

            {/* INFO */}
            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Tên thiết bị">
                {equipment.equipmentName}
              </Descriptions.Item>

              <Descriptions.Item label="Model">
                {equipment.model || "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Serial Number">
                {equipment.serialNumber || "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Trạng thái">
                <Tag color={equipment.status === "Đang Hoạt Động" ? "green" : "red"}>
                  {equipment.status}
                </Tag>
              </Descriptions.Item>

              <Descriptions.Item label="Vị trí">
                {equipment.location || "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Ngày mua">
                {equipment.purchaseDate
                  ? dayjs(equipment.purchaseDate).format("DD/MM/YYYY")
                  : "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Giá mua">
                {equipment.purchaseCost
                  ? `${Number(equipment.purchaseCost).toLocaleString("vi-VN")} ₫`
                  : "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Bảo hành">
                {equipment.warranty || "—"}
              </Descriptions.Item>

              <Descriptions.Item label="Mô tả">
                {equipment.description || "—"}
              </Descriptions.Item>
            </Descriptions>
          </>
        ) : (
          <p>Không có dữ liệu thiết bị</p>
        )}
      </Modal>

    </div>
  );
}
