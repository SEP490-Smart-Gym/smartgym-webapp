import { useEffect, useMemo, useState } from "react";
import api from "../../config/axios";
import dayjs from "dayjs";
import {
  Tabs,
  Card,
  Spin,
  message,
  Modal,
  Descriptions,
  Button,
  Image,
  Tag,
  Input,
} from "antd";
import Sidebar from "../../components/Sidebar";

const { TabPane } = Tabs;
const { TextArea } = Input;

export default function StaffMaintenance() {
  // Status map
  const STATUS_MAP = {
    Pending: {
      label: "Chưa nhận",
      color: "orange",
    },
    Upcoming: {
      label: "Đã nhận",
      color: "blue",
    },
    "In Progress": {
      label: "Đang bảo trì",
      color: "gold",
    },
    Completed: {
      label: "Hoàn thành",
      color: "green",
    },
  };

  const [activeTab, setActiveTab] = useState("upcoming");

  const [upcoming, setUpcoming] = useState([]);
  const [myList, setMyList] = useState([]);
  const [equipments, setEquipments] = useState([]);

  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const [completeOpen, setCompleteOpen] = useState(false);
  const [completeNote, setCompleteNote] = useState("");

  //  get staff id
  const user = JSON.parse(localStorage.getItem("user"));
  const staffId = user?.id;


  /* =========================
      FETCH DATA
  ========================= */
  const fetchEquipments = async () => {
    const res = await api.get("/Equipment");
    const data = Array.isArray(res.data) ? res.data : res.data.data || [];
    setEquipments(data);
  };

  const fetchUpcoming = async () => {
    const res = await api.get("/MaintenanceSchedule/upcoming");
    setUpcoming(Array.isArray(res.data) ? res.data : res.data.data || []);
  };

  const fetchMy = async () => {
    const res = await api.get("/MaintenanceSchedule/in-progress");
    setMyList(Array.isArray(res.data) ? res.data : res.data.data || []);
  };

  const reload = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchEquipments(), fetchUpcoming(), fetchMy()]);
    } catch {
      message.error("Không thể tải dữ liệu bảo trì");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  /* =========================
      EQUIPMENT MAP
  ========================= */
  const equipmentMap = useMemo(() => {
    const map = {};
    equipments.forEach((e) => (map[e.id] = e));
    return map;
  }, [equipments]);

  /* =========================
      ACTIONS
  ========================= */
  const openModal = (item) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedItem(null);
  };

  const handleAccept = async () => {
    await api.post(`/MaintenanceSchedule/${selectedItem.id}/accept`);
    message.success("Đã nhận nhiệm vụ");
    closeModal();
    reload();
  };

  const handleStart = async () => {
    await api.post(`/MaintenanceSchedule/${selectedItem.id}/start`);
    message.success("Đã bắt đầu bảo trì");
    closeModal();
    reload();
  };

  const handleComplete = async () => {
    await api.post(`/MaintenanceSchedule/${selectedItem.id}/complete`, {
      notes: completeNote,
    });
    message.success("Hoàn thành bảo trì");
    setCompleteOpen(false);
    closeModal();
    reload();
  };

  /* =========================
      RENDER CARD
  ========================= */
  const renderCard = (item) => {
    const statusUi = STATUS_MAP[item.status] || {
      label: item.status,
      color: "default",
    };

    return (
      <Card
        key={item.id}
        hoverable
        style={{ borderWidth: 2 }}
        onClick={() => openModal(item)}
      >
        <h5>{equipmentMap[item.equipmentId]?.equipmentName || "Thiết bị"}</h5>

        <p>
          <b>Ngày:</b>{" "}
          {dayjs(item.scheduledDate).format("DD/MM/YYYY HH:mm")}
        </p>

        <p>
          <b>Giao cho:</b>{" "}
          {item.assignedToName || (
            <span style={{ color: "red" }}>Chưa ai nhận</span>
          )}
        </p>

        <Tag color={statusUi.color}>{statusUi.label}</Tag>
      </Card>
    );
  };


  const equipment = selectedItem
    ? equipmentMap[selectedItem.equipmentId]
    : null;

  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        <div className="col-lg-3">
          <Sidebar role="Staff" />
        </div>

        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Quản lý bảo trì</h2>

          <Tabs activeKey={activeTab} onChange={setActiveTab}>
            <TabPane tab="Lịch sắp tới" key="upcoming">
              {loading ? (
                <Spin />
              ) : (
                upcoming
                  .filter((it) => it.status === "Pending")
                  .map(renderCard)
              )}
            </TabPane>



            <TabPane tab="Bảo trì của tôi" key="my">
              {loading ? (
                <Spin />
              ) : (
                <>
                  {/* Upcoming đã nhận bởi staff hiện tại */}
                  {upcoming
                    .filter(
                      (it) => it.status === "Upcoming" && it.assignedTo === staffId
                    )
                    .map(renderCard)}

                  {/* In-progress */}
                  {myList.map(renderCard)}
                </>
              )}
            </TabPane>

          </Tabs>
        </div>
      </div>

      {/* ===== MODAL ===== */}
      <Modal
        open={modalOpen}
        title="Chi tiết thiết bị"
        onCancel={closeModal}
        width={700}
        footer={[
          <Button key="close" onClick={closeModal}>
            Đóng
          </Button>,

          activeTab === "upcoming" && (
            <Button key="accept" type="primary" onClick={handleAccept}>
              Nhận nhiệm vụ
            </Button>
          ),

          activeTab === "my" &&
          selectedItem?.status === "Upcoming" && (
            <Button key="start" type="primary" onClick={handleStart}>
              Bắt đầu bảo trì
            </Button>
          ),

          activeTab === "my" &&
          selectedItem?.status === "In Progress" && (
            <Button
              key="complete"
              danger
              type="primary"
              onClick={() => setCompleteOpen(true)}
            >
              Hoàn thành
            </Button>
          ),
        ].filter(Boolean)}
      >
        {equipment && (
          <>
            {equipment.imageUrl && (
              <div className="text-center mb-3">
                <Image width={220} src={equipment.imageUrl} />
              </div>
            )}

            <Descriptions bordered column={1} size="small">
              <Descriptions.Item label="Tên">
                {equipment.equipmentName}
              </Descriptions.Item>
              <Descriptions.Item label="Model">
                {equipment.model}
              </Descriptions.Item>
              <Descriptions.Item label="Serial">
                {equipment.serialNumber}
              </Descriptions.Item>
              <Descriptions.Item label="Vị trí">
                {equipment.location}
              </Descriptions.Item>
            </Descriptions>
          </>
        )}
      </Modal>

      {/* ===== COMPLETE MODAL ===== */}
      <Modal
        open={completeOpen}
        title="Hoàn thành bảo trì"
        onCancel={() => setCompleteOpen(false)}
        onOk={handleComplete}
      >
        <TextArea
          rows={4}
          placeholder="Ghi chú bảo trì"
          value={completeNote}
          onChange={(e) => setCompleteNote(e.target.value)}
        />
      </Modal>
    </div>
  );
}
