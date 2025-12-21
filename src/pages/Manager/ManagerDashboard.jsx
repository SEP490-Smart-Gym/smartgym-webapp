import React, { useEffect, useState } from "react";
import {
    Card,
    Row,
    Col,
    Statistic,
    Spin,
    message,
    DatePicker,
    Space,
    Button,
} from "antd";
import {
    UserOutlined,
    ShoppingCartOutlined,
    DollarOutlined,
    TeamOutlined,
    ToolOutlined,
    CommentOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";
import Sidebar from "../../components/Sidebar";

/* ===== CHART.JS ===== */
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Filler,
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";

const { RangePicker } = DatePicker;

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend,
    Filler
);

/* ===== UI STYLES ===== */
const kpiCardStyle = {
    borderRadius: 16,
    boxShadow: "0 8px 24px rgba(0,0,0,0.06)",
};

const iconStyle = (color, bg) => ({
    color,
    background: bg,
    padding: 8,
    borderRadius: "50%",
    fontSize: 18,
});

export default function AdminDashboard() {
    const [loading, setLoading] = useState(false);
    const [dateRange, setDateRange] = useState([]);

    const [stats, setStats] = useState({
        totalMembers: 0,
        totalMemberPackages: 0,
        totalRevenue: 0,
        totalPayments: 0,
        totalEquipment: 0,
        totalTrainers: 0,
        totalTrainingSessions: 0,
        totalGymFeedbacks: 0,
        totalTrainerFeedbacks: 0,
        totalPackages: 0,
        totalStaff: 0,
    });

    const [monthlyRevenue, setMonthlyRevenue] = useState([]);
    const [monthlyNewMembers, setMonthlyNewMembers] = useState([]);

    const getLastDayOfMonth = (year, month) =>
        new Date(year, month, 0).getDate();

    /* ===== FETCH DASHBOARD ===== */
    const fetchDashboardStats = async (filters = {}) => {
        setLoading(true);
        try {
            const res = await api.get("/Statistics/dashboard", {
                params: {
                    startDate: filters.startDate,
                    endDate: filters.endDate,
                },
            });
            setStats(res.data);
        } catch (err) {
            console.error(err);
            message.error("Không thể tải dữ liệu dashboard");
        } finally {
            setLoading(false);
        }
    };

    const fetchMonthlyRevenue = async (year) => {
        try {
            const data = [];
            for (let m = 1; m <= 12; m++) {
                const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
                const endDate = `${year}-${String(m).padStart(2, "0")}-${getLastDayOfMonth(
                    year,
                    m
                )}`;
                const res = await api.get("/Statistics/dashboard", {
                    params: { startDate, endDate },
                });
                data.push(res.data.totalRevenue || 0);
            }
            setMonthlyRevenue(data);
        } catch {
            message.error("Không thể tải doanh thu theo tháng");
        }
    };

    const fetchMonthlyNewMembers = async (year) => {
        try {
            const data = [];
            for (let m = 1; m <= 12; m++) {
                const startDate = `${year}-${String(m).padStart(2, "0")}-01`;
                const endDate = `${year}-${String(m).padStart(2, "0")}-${getLastDayOfMonth(
                    year,
                    m
                )}`;
                const res = await api.get("/Statistics/dashboard", {
                    params: { startDate, endDate },
                });
                data.push(res.data.totalMembers || 0);
            }
            setMonthlyNewMembers(data);
        } catch {
            message.error("Không thể tải hội viên theo tháng");
        }
    };

    useEffect(() => {
        const year = new Date().getFullYear();
        fetchDashboardStats();
        fetchMonthlyRevenue(year);
        fetchMonthlyNewMembers(year);
    }, []);

    /* ===== CHART DATA ===== */
    const revenueChartData = {
        labels: Array.from({ length: 12 }, (_, i) => `Th${i + 1}`),
        datasets: [
            {
                label: "Doanh thu",
                data: monthlyRevenue,
                backgroundColor: "#1677ff",
                borderRadius: 8,
            },
        ],
    };

    const memberGrowthData = {
        labels: Array.from({ length: 12 }, (_, i) => `Th${i + 1}`),
        datasets: [
            {
                label: "Hội viên mới",
                data: monthlyNewMembers,
                borderColor: "#52c41a",
                backgroundColor: "rgba(82,196,26,0.25)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    return (
        <div className="container-fluid py-4">
            <div className="row g-4">
                {/* SIDEBAR */}
                <div className="col-lg-3">
                    <Sidebar role="Manager" />
                </div>

                {/* MAIN */}
                <div className="col-lg-9">
                    <h2 className="mb-4 fw-semibold">Dashboard</h2>

                    {/* FILTER */}
                    <Card style={{ ...kpiCardStyle, marginBottom: 24 }}>
                        <Space>
                            <RangePicker
                                format="YYYY-MM-DD"
                                onChange={(dates) => setDateRange(dates)}
                            />
                            <Button
                                type="primary"
                                onClick={() =>
                                    fetchDashboardStats({
                                        startDate: dateRange?.[0]?.format("YYYY-MM-DD"),
                                        endDate: dateRange?.[1]?.format("YYYY-MM-DD"),
                                    })
                                }
                            >
                                Lọc
                            </Button>
                            <Button onClick={() => fetchDashboardStats()}>Reset</Button>
                        </Space>
                    </Card>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <>
                            {/* KPI MAIN */}
                            <Row gutter={[24, 24]}>
                                <Col md={8}>
                                    <Card style={kpiCardStyle}>
                                        <Statistic
                                            title="Tổng hội viên"
                                            value={stats.totalMembers}
                                            prefix={<UserOutlined style={iconStyle("#1677ff", "#e6f4ff")} />}
                                        />
                                    </Card>
                                </Col>
                                <Col md={8}>
                                    <Card style={kpiCardStyle}>
                                        <Statistic
                                            title="Gói đã thanh toán"
                                            value={stats.totalMemberPackages}
                                            prefix={
                                                <ShoppingCartOutlined
                                                    style={iconStyle("#52c41a", "#f6ffed")}
                                                />
                                            }
                                        />
                                    </Card>
                                </Col>
                                <Col md={8}>
                                    <Card style={kpiCardStyle}>
                                        <Statistic
                                            title="Tổng doanh thu"
                                            value={stats.totalRevenue}
                                            formatter={(v) =>
                                                `${Number(v).toLocaleString("vi-VN")} ₫`
                                            }
                                            prefix={
                                                <DollarOutlined
                                                    style={iconStyle("#faad14", "#fffbe6")}
                                                />
                                            }
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            {/* KPI EXTRA */}
                            <Row gutter={[24, 24]} className="mt-3">
                                <Col md={6}>
                                    <Card style={kpiCardStyle}>
                                        <Statistic
                                            title="Huấn luyện viên"
                                            value={stats.totalTrainers}
                                            prefix={<TeamOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card style={kpiCardStyle}>
                                        <Statistic
                                            title="Nhân viên"
                                            value={stats.totalStaff}
                                            prefix={<TeamOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card style={kpiCardStyle}>
                                        <Statistic
                                            title="Thiết bị"
                                            value={stats.totalEquipment}
                                            prefix={<ToolOutlined />}
                                        />
                                    </Card>
                                </Col>
                                <Col md={6}>
                                    <Card style={kpiCardStyle}>
                                        <Statistic
                                            title="Feedback"
                                            value={
                                                stats.totalGymFeedbacks +
                                                stats.totalTrainerFeedbacks
                                            }
                                            prefix={<CommentOutlined />}
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            {/* CHARTS */}
                            <Row gutter={[24, 24]} className="mt-4">
                                <Col lg={12}>
                                    <Card title="Doanh thu theo tháng" style={kpiCardStyle}>
                                        <Bar
                                            data={revenueChartData}
                                            options={{
                                                plugins: { legend: { display: false } },
                                            }}
                                        />
                                    </Card>
                                </Col>
                                <Col lg={12}>
                                    <Card title="Tăng trưởng hội viên" style={kpiCardStyle}>
                                        <Line
                                            data={memberGrowthData}
                                            options={{
                                                plugins: { legend: { position: "bottom" } },
                                                scales: { y: { beginAtZero: true } },
                                            }}
                                        />
                                    </Card>
                                </Col>
                            </Row>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
