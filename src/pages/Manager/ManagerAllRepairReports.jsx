import { useEffect, useState } from "react";
import {
    Table,
    Tag,
    Space,
    Button,
    Modal,
    Spin,
    message
} from "antd";
import dayjs from "dayjs";
import api from "../../config/axios";
import Sidebar from "../../components/Sidebar";

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
            case "Đang Chờ Xử Lý": return "blue";
            case "Đã Phê Duyệt": return "green";
            case "Đã Từ Chối": return "red";
            case "Đang Sửa Chữa": return "orange";
            case "Đã Hoàn Thành": return "cyan";
            default: return "default";
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
            fixed: "left"
        },
        {
            title: "Người báo cáo",
            dataIndex: "reporterName",
            width: 180
        },
        {
            title: "Ngày báo cáo",
            dataIndex: "reportDate",
            width: 180,
            render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm")
        },
        {
            title: "Mức độ",
            dataIndex: "severity",
            width: 100,
            render: (v) => (
                <Tag color={
                    v === "High" ? "red" :
                        v === "Medium" ? "gold" :
                            "green"
                }>
                    {v}
                </Tag>
            )
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 120,
            render: (v) => <Tag color={statusColor(v)}>{v}</Tag>
        },
        {
            title: "Thao tác",
            width: 140,
            fixed: "right",
            render: (_, r) => (
                <Button size="small" onClick={() => openDetail(r)}>
                    Xem
                </Button>
            )
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
                                    pagination={{ pageSize: 10 }}
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
                        <p><strong>Thiết bị:</strong> {detail.equipmentName}</p>
                        <p><strong>Người báo cáo:</strong> {detail.reporterName}</p>
                        <p><strong>Ngày báo cáo:</strong> {dayjs(detail.reportDate).format("DD/MM/YYYY HH:mm")}</p>
                        <p><strong>Mức độ:</strong> {detail.severity}</p>

                        <p><strong>Mô tả sự cố:</strong></p>
                        <p>{detail.issueDescription}</p>

                        <hr />

                        <p><strong>Trạng thái:</strong> {detail.status}</p>

                        {detail.status !== "Pending" && (
                            <>
                                <p><strong>Người duyệt:</strong> {detail.approverName || "—"}</p>
                                <p><strong>Ngày duyệt:</strong>
                                    {detail.approvalDate ? dayjs(detail.approvalDate).format("DD/MM/YYYY HH:mm") : "—"}
                                </p>
                                <p><strong>Ghi chú duyệt:</strong> {detail.approvalNotes || "—"}</p>
                            </>
                        )}

                        <hr />

                        <p><strong>Thời gian sửa chữa</strong></p>
                        <p>Bắt đầu: {detail.repairStartDate ? dayjs(detail.repairStartDate).format("DD/MM/YYYY HH:mm") : "—"}</p>
                        <p>Hoàn thành: {detail.repairCompletedDate ? dayjs(detail.repairCompletedDate).format("DD/MM/YYYY HH:mm") : "—"}</p>

                        <p><strong>Chi phí sửa chữa:</strong> {detail.repairCost ? `${detail.repairCost.toLocaleString()} đ` : "—"}</p>
                        <p><strong>Chi tiết sửa chữa:</strong></p>
                        <p>{detail.repairDetails || "—"}</p>
                    </>
                )}
            </Modal>
        </div>
    );
}
