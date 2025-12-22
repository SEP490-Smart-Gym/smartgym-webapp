import { useEffect, useState } from "react";
import { Table, Tag, Button, Modal, Spin, message } from "antd";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import api from "../../config/axios";
import Sidebar from "../../components/Sidebar";

dayjs.extend(utc);
dayjs.extend(timezone);

// ✅ backend trả datetime không có Z/offset => ép coi là UTC để hiển thị đúng giờ VN
function toISODateSafe(s) {
  if (!s) return null;
  let str = String(s).trim();

  // cắt nano -> milli (Date/dayjs parse ổn nhất với <= 3 chữ số ms)
  str = str.replace(/(\.\d{3})\d+/, "$1");

  // nếu không có timezone (Z hoặc ±HH:MM) => thêm 'Z' để coi là UTC
  const hasTZ = /([zZ]|[+\-]\d{2}:?\d{2})$/.test(str);
  if (!hasTZ) str += "Z";

  return str;
}

// ✅ format giờ VN ổn định
function formatVNDateTime(isoLike) {
  const safe = toISODateSafe(isoLike);
  if (!safe) return "—";
  const d = dayjs(safe);
  if (!d.isValid()) return "—";
  return d.utc().tz("Asia/Ho_Chi_Minh").format("DD/MM/YYYY HH:mm");
}

export default function ManagerAllRepairReports() {
  const [loading, setLoading] = useState(false);
  const [reports, setReports] = useState([]);

  const [detail, setDetail] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);

  /* ===========================
        FETCH ALL REPORTS
    ============================ */
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get("/EquipmentRepairReport");
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

        approvedBy: r.approvedBy,
        approverName: r.approverName,
        approvalDate: r.approvalDate,
        approvalNotes: r.approvalNotes,

        repairStartDate: r.repairStartDate,
        repairCompletedDate: r.repairCompletedDate,
        repairCost: r.repairCost,
        repairDetails: r.repairDetails,
      }));

      setReports(list);
    } catch (err) {
      console.error(err);
      message.error("Không thể tải danh sách báo cáo");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  /* ===========================
        OPEN DETAIL
    ============================ */
  const openDetail = (r) => {
    setDetail(r);
    setDetailOpen(true);
  };

  const closeDetail = () => {
    setDetailOpen(false);
    setDetail(null);
  };

  /* ===========================
        STATUS TAG
    ============================ */
  const statusColor = (status) => {
    switch (status) {
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

  /* ===========================
        TABLE COLUMNS
    ============================ */
  const columns = [
    {
      title: "Thiết bị",
      dataIndex: "equipmentName",
      width: 200,
      fixed: "left",
    },
    {
      title: "Người báo cáo",
      dataIndex: "reporterName",
      width: 180,
    },
    {
      title: "Ngày báo cáo",
      dataIndex: "reportDate",
      width: 180,
      render: (v) => formatVNDateTime(v),
    },
    {
      title: "Mức độ",
      dataIndex: "severity",
      width: 100,
      render: (v) => (
        <Tag
          color={v === "High" ? "red" : v === "Medium" ? "gold" : "green"}
        >
          {v}
        </Tag>
      ),
    },
    {
      title: "Trạng thái",
      dataIndex: "status",
      width: 160,
      render: (v) => <Tag color={statusColor(v)}>{v}</Tag>,
    },
    {
      title: "Thao tác",
      width: 140,
      fixed: "right",
      render: (_, r) => (
        <Button size="small" onClick={() => openDetail(r)}>
          Xem
        </Button>
      ),
    },
  ];

  /* ===========================
        RENDER PAGE
    ============================ */
  return (
    <div className="container-fluid py-5">
      <div className="row g-4">
        {/* SIDEBAR */}
        <div className="col-lg-3">
          <Sidebar role="Manager" />
        </div>

        {/* MAIN CONTENT */}
        <div className="col-lg-9">
          <h2 className="mb-4 text-center">Tất Cả Báo Cáo Thiết Bị</h2>

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
                  pagination={{ pageSize: 5 }}
                  scroll={{ x: "max-content" }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL MODAL */}
      <Modal
        open={detailOpen}
        onCancel={closeDetail}
        footer={null}
        width={650}
        title="Chi tiết báo cáo"
      >
        {detail && (
          <>
            <p>
              <strong>Thiết bị:</strong> {detail.equipmentName}
            </p>
            <p>
              <strong>Người báo cáo:</strong> {detail.reporterName}
            </p>
            <p>
              <strong>Ngày báo cáo:</strong> {formatVNDateTime(detail.reportDate)}
            </p>
            <p>
              <strong>Mức độ:</strong> {detail.severity}
            </p>

            <p>
              <strong>Mô tả sự cố:</strong>
            </p>
            <p>{detail.issueDescription}</p>

            <hr />

            <p>
              <strong>Trạng thái:</strong> {detail.status}
            </p>

            {/* ✅ giữ logic cũ, chỉ thay format giờ */}
            {detail.status !== "Pending" && (
              <>
                <p>
                  <strong>Người duyệt:</strong> {detail.approverName || "—"}
                </p>
                <p>
                  <strong>Ngày duyệt:</strong> {formatVNDateTime(detail.approvalDate)}
                </p>
                <p>
                  <strong>Ghi chú duyệt:</strong> {detail.approvalNotes || "—"}
                </p>
              </>
            )}

            <hr />

            <p>
              <strong>Thời gian sửa chữa</strong>
            </p>
            <p>
              Bắt đầu: {formatVNDateTime(detail.repairStartDate)}
            </p>
            <p>
              Hoàn thành: {formatVNDateTime(detail.repairCompletedDate)}
            </p>

            <p>
              <strong>Chi phí sửa chữa:</strong>{" "}
              {detail.repairCost ? `${Number(detail.repairCost).toLocaleString("vi-VN")} đ` : "—"}
            </p>
            <p>
              <strong>Chi tiết sửa chữa:</strong>
            </p>
            <p>{detail.repairDetails || "—"}</p>
          </>
        )}
      </Modal>
    </div>
  );
}
