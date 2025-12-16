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
import Sidebar from "../../components/Sidebar";

export default function EquipmentRepairPending() {
    const [loading, setLoading] = useState(false);
    const [reports, setReports] = useState([]);

    const [detail, setDetail] = useState(null);
    const [detailOpen, setDetailOpen] = useState(false);

    /* ===============================
        FETCH PENDING REPORTS
    =============================== */
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

    /* ===============================
        APPROVE / REJECT
    =============================== */
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

    /* ===============================
        OPEN DETAIL
    =============================== */
    const openDetail = (r) => {
        setDetail(r);
        setDetailOpen(true);
    };

    const closeDetail = () => {
        setDetail(null);
        setDetailOpen(false);
    };

    /* ===============================
        TABLE COLUMNS
    =============================== */
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
            width: 160,
            render: (v) => dayjs(v).format("DD/MM/YYYY HH:mm"),
        },
        {
            title: "Mức độ",
            dataIndex: "severity",
            width: 120,
            render: (v) => {
                const mapVietnam = {
                    Low: "Thấp",
                    Medium: "Trung bình",
                    High: "Cao",
                    Critical: "Nghiêm trọng",
                };

                const colorMap = {
                    Low: "green",
                    Medium: "gold",
                    High: "red",
                    Critical: "volcano",
                };

                return (
                    <Tag color={colorMap[v] || "default"}>
                        {mapVietnam[v] || v}
                    </Tag>
                );
            },
        },
        {
            title: "Trạng thái",
            dataIndex: "status",
            width: 120,
            render: () => <Tag color="blue">Đang chờ duyệt</Tag>,
        },
        {
            title: "Thao tác",
            width: 220,
            fixed: "right",
            render: (_, r) => (
                <Space>
                    <Button size="small" onClick={() => openDetail(r)}>
                        Xem báo cáo
                    </Button>
                    {/* <Button size="small" type="primary" onClick={() => approveReport(r.id)}>
                        Duyệt
                    </Button>
                    <Button size="small" danger onClick={() => rejectReport(r.id)}>
                        Từ chối
                    </Button> */}
                </Space>
            ),
        },
    ];

    /* ===============================
        RENDER
    =============================== */
    return (
        <div className="container-fluid py-5">
            <div className="row g-4">

                {/* SIDEBAR */}
                <div className="col-lg-3">
                    <Sidebar role="Manager" />
                </div>

                {/* MAIN CONTENT */}
                <div className="col-lg-9">
                    <h2 className="mb-4 text-center">Duyệt Báo Cáo Thiết Bị</h2>

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
                title="Chi tiết báo cáo"
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
                        <p><strong>Mô tả sự cố:</strong></p>
                        <p>{detail.issueDescription}</p>

                        <div className="d-flex justify-content-end gap-2 mt-3">
                            <Button type="primary" onClick={() => approveReport(detail.id)}>Duyệt</Button>
                            <Button danger onClick={() => rejectReport(detail.id)}>Từ chối</Button>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );

}
