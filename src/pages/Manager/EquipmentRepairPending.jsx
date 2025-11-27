import { useEffect, useState } from "react";
import {
  Table,
  Tag,
  Space,
  Button,
  Modal,
  message,
  Spin,
} from "antd";
import dayjs from "dayjs";
import api from "../../config/axios";
import AdminSidebar from "../../components/AdminSidebar";

export default function EquipmentRepairPending() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);

  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // ==========================
  // Fetch Pending Reports
  // ==========================
  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await api.get("/EquipmentRepairReport/pending-approvals");
      const raw = Array.isArray(res.data) ? res.data : res.data.items || [];

      const list = raw.map((r) => ({
        id: r.id,
        equipmentId: r.equipmentId,
        equipmentName: r.equipmentName,
        reportedBy: r.reportedBy,
        reporterName: r.reporterName,
        reportDate: r.reportDate,
        issueDescription: r.issueDescription,
        severity: r.severity,
        status: r.status,
      }));

      setReports(list);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách pending reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  // ==========================
  // Approve / Reject
  // ==========================
  const approveReport = async (id) => {
    try {
      await api.post(`/EquipmentRepairReport/${id}/approve`);
      message.success("Duyệt báo cáo thành công");
      fetchPending();
    } catch (err) {
      console.error(err);
      message.error("Duyệt thất bại");
    }
  };

  const rejectReport = async (id) => {
    Modal.confirm({
      title: "Từ chối báo cáo?",
      content: "Bạn có chắc muốn từ chối báo cáo này?",
      okText: "Từ chối",
      okType: "danger",
      cancelText: "Hủy",
      onOk: async () => {
        try {
          await api.post(`/EquipmentRepairReport/${id}/reject`);
          message.success("Đã từ chối báo cáo");
          fetchPending();
        } catch (err) {
          console.error(err);
          message.error("Từ chối thất bại");
        }
      },
    });
  };

  // ==========================
  // Table columns
  // ==========================
  const columns = [
    {
      title: "Thiết bị",
      dataIndex: "equipmentName",
      width: 200,
    },
    {
      title: "Người báo cáo",
      dataIndex: "reporterName",
      width: 180,
    },
    {
      title: "Ngày báo cáo",
      dataIndex: "reportDate",
      width: 150,
      render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
    },
    {
      title: "Mức độ",
      dataIndex: "severity",
      width: 100,
      render: (v) => (
        <Tag
          color={
            v === "High" ? "red" : v === "Medium" ? "gold" : "green"
          }
        >
          {v}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 120,
      render: () => <Tag color="blue">Pending</Tag>,
    },
    {
      title: "Thao tác",
      fixed: "right",
      width: 220,
      render: (_, r) => (
        <Space>
          <Button size="small" onClick={() => openDetail(r)}>
            Xem
          </Button>
          <Button size="small" type="primary" onClick={() => approveReport(r.id)}>
            Duyệt
          </Button>
          <Button size="small" danger onClick={() => rejectReport(r.id)}>
            Từ chối
          </Button>
        </Space>
      ),
    },
  ];

  const openDetail = (r) => {
    setDetail(r);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetail(null);
    setDetailOpen(false);
  };

  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        <div className="col-lg-3">
          <AdminSidebar />
        </div>

        <div className="col-lg-9">
          <h2 className="text-center mb-4">Duyệt Báo Cáo Thiết Bị</h2>

          <div className="card shadow-sm">
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <Spin />
                </div>
              ) : (
                <Table
                  dataSource={reports}
                  columns={columns}
                  rowKey="id"
                  pagination={{ pageSize: 10 }}
                  scroll={{ x: "max-content" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Modal
        title="Chi tiết báo cáo"
        open={detailOpen}
        onCancel={closeDetail}
        footer={null}
        width={600}
      >
        {detail && (
          <>
            <p><strong>Thiết bị:</strong> {detail.equipmentName}</p>
            <p><strong>Người báo cáo:</strong> {detail.reporterName}</p>
            <p><strong>Ngày báo cáo:</strong> {dayjs(detail.reportDate).format("DD/MM/YYYY HH:mm")}</p>
            <p><strong>Mức độ:</strong> {detail.severity}</p>
            <p><strong>Mô tả:</strong></p>
            <p>{detail.issueDescription}</p>

            <div className="d-flex justify-content-end gap-2 mt-3">
              <Button type="primary" onClick={() => approveReport(detail.id)}>
                Duyệt
              </Button>
              <Button danger onClick={() => rejectReport(detail.id)}>
                Từ chối
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
