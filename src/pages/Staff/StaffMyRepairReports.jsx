import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Button,
  Modal,
  InputNumber,
  Input,
  message,
  Space,
  Spin,
} from "antd";
import dayjs from "dayjs";
import api from "../../config/axios";
import StaffSidebar from "../../components/StaffSidebar";

export default function StaffMyRepairReports() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);

  // modal start repair confirm
  const [startModalOpen, setStartModalOpen] = useState(false);
  const [startReport, setStartReport] = useState(null);

  // modal complete repair
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeReport, setCompleteReport] = useState(null);
  const [repairCost, setRepairCost] = useState(null);
  const [repairDetails, setRepairDetails] = useState("");

  /* =======================================================
        FETCH MY REPORTS
     ======================================================= */
  const fetchMyReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/EquipmentRepairReport/my-reports");

      const raw = Array.isArray(res.data) ? res.data : res.data.items || [];

      const list = raw.map((r) => ({
        id: r.id,
        equipmentId: r.equipmentId,
        equipmentName: r.equipmentName,
        reportDate: r.reportDate,
        issueDescription: r.issueDescription,
        severity: r.severity,
        status: r.status,

        approvedBy: r.approvedBy,
        approverName: r.approverName,
        approvalDate: r.approvalDate,

        repairStartDate: r.repairStartDate,
        repairCompletedDate: r.repairCompletedDate,
        repairCost: r.repairCost,
        repairDetails: r.repairDetails,
      }));

      setReports(list);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách báo cáo của bạn");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyReports();
  }, []);

  /* =======================================================
        START REPAIR
     ======================================================= */
  const confirmStartRepair = (report) => {
    setStartReport(report);
    setStartModalOpen(true);
  };

  const startRepair = async () => {
    try {
      await api.post(`/EquipmentRepairReport/${startReport.id}/start-repair`);
      message.success("Đã bắt đầu sửa chữa");

      setStartModalOpen(false);
      setStartReport(null);

      fetchMyReports();
    } catch (err) {
      console.error(err);
      message.error("Không thể bắt đầu sửa chữa");
    }
  };

  /* =======================================================
        COMPLETE REPAIR
     ======================================================= */
  const openCompleteModal = (report) => {
    setCompleteReport(report);
    setRepairCost(null);
    setRepairDetails("");
    setCompleteModalOpen(true);
  };

  const completeRepair = async () => {
    if (!repairCost || !repairDetails.trim()) {
      return message.warning("Vui lòng nhập chi phí và mô tả sửa chữa");
    }

    try {
      await api.post(`/EquipmentRepairReport/${completeReport.id}/complete-repair`, {
        repairCost: Number(repairCost),
        repairDetails: repairDetails.trim(),
      });

      message.success("Hoàn tất sửa chữa thành công");

      setCompleteModalOpen(false);
      setCompleteReport(null);
      setRepairCost(null);
      setRepairDetails("");

      fetchMyReports();
    } catch (err) {
      console.error(err);
      message.error("Không thể hoàn tất sửa chữa");
    }
  };

  /* =======================================================
        STATUS TAG
     ======================================================= */
  const statusColor = (s) => {
    switch (s) {
      case "Đang Chờ Xử Lý":
        return "blue";
      case "Đã Phê Duyệt":
        return "green";
      case "Đã Từ Chối":
        return "red";
      case "Đang Sửa Chữa":
        return "orange";
      case "Đã Hoàn Thành":
        return "cyan";
      default:
        return "default";
    }
  };

  /* =======================================================
        TABLE COLUMNS
     ======================================================= */
  const columns = [
    {
      title: "Thiết bị",
      dataIndex: "equipmentName",
      width: 200,
    },
    {
      title: "Mức độ",
      dataIndex: "severity",
      width: 100,
      render: (v) => (
        <Tag color={v === "High" ? "red" : v === "Medium" ? "gold" : "green"}>{v}</Tag>
      ),
    },
    {
      title: "Ngày báo cáo",
      dataIndex: "reportDate",
      width: 180,
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 130,
      render: (v) => <Tag color={statusColor(v)}>{v}</Tag>,
    },
    {
      title: "Thao tác",
      width: 260,
      render: (_, r) => {
    return (
        <Space>

            {/* === BẮT ĐẦU SỬA === */}
            {(r.status === "Đang Chờ Xử Lý" || r.status === "Đã Phê Duyệt") && (
                <Button
                    size="small"
                    type="primary"
                    disabled={r.status === "Đang Chờ Xử Lý"} 
                    onClick={() => confirmStartRepair(r)}
                >
                    Bắt đầu sửa
                </Button>
            )}

            {/* === HOÀN TẤT SỬA === */}
            {r.status === "Đang Sửa Chữa" && (
                <Button
                    size="small"
                    danger
                    onClick={() => openCompleteModal(r)}
                >
                    Hoàn tất sửa
                </Button>
            )}

        </Space>
    );
},

    },
  ];

  /* =======================================================
        RENDER
     ======================================================= */
  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        
        {/* SIDEBAR */}
        <div className="col-lg-3">
          <StaffSidebar />
        </div>

        {/* MAIN */}
        <div className="col-lg-9">
          <h2 className="text-center mb-4">Báo Cáo Của Tôi</h2>

          <div className="card shadow-sm">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <Spin />
                </div>
              ) : (
                <Table
                  rowKey="id"
                  dataSource={reports}
                  columns={columns}
                  pagination={{ pageSize: 5 }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* START REPAIR MODAL */}
      <Modal
        open={startModalOpen}
        onCancel={() => setStartModalOpen(false)}
        onOk={startRepair}
        okText="Bắt đầu sửa chữa"
        cancelText="Hủy"
      >
        {startReport && (
          <>
            <p>
              Bắt đầu sửa chữa thiết bị: <strong>{startReport.equipmentName}</strong>
            </p>
            <p>Mức độ: {startReport.severity}</p>
          </>
        )}
      </Modal>

      {/* COMPLETE REPAIR MODAL */}
      <Modal
        open={completeModalOpen}
        onCancel={() => setCompleteModalOpen(false)}
        onOk={completeRepair}
        okText="Hoàn tất sửa chữa"
        cancelText="Hủy"
        width={500}
      >
        <h5>Hoàn tất sửa chữa</h5>
        <p><strong>Thiết bị:</strong> {completeReport?.equipmentName}</p>

        <div className="mb-3">
          <label>Chi phí sửa chữa</label>
          <InputNumber
            style={{ width: "100%" }}
            min={0}
            value={repairCost}
            onChange={(v) => setRepairCost(v)}
            placeholder="Nhập chi phí"
          />
        </div>

        <div>
          <label>Mô tả chi tiết</label>
          <Input.TextArea
            rows={3}
            placeholder="Nhập mô tả chi tiết sửa chữa..."
            value={repairDetails}
            onChange={(e) => setRepairDetails(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
