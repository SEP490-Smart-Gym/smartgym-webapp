import React, { useEffect, useState } from "react";
import AdminSidebar from "../../components/AdminSidebar";
import { Card, Row, Col, Statistic, Spin, message } from "antd";
import {
    UserOutlined,
    ShoppingCartOutlined,
    DollarOutlined,
} from "@ant-design/icons";
import api from "../../config/axios";

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
} from "chart.js";
import { Bar, Line } from "react-chartjs-2";
import ManagerSidebar from "../../components/ManagerSidebar";
import Sidebar from "../../components/Sidebar";

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Tooltip,
    Legend
);

export default function AdminDashboard() {
    const [loading, setLoading] = useState(false);
    const user = JSON.parse(localStorage.getItem("user"));

    const [stats, setStats] = useState({
        totalMembers: 0,
        totalPaidPackages: 0,
        totalRevenue: 0,
    });

    /* ==========================
          FETCH DASHBOARD DATA
       ========================== */
    const fetchDashboardStats = async () => {
        setLoading(true);
        try {
            // 👉 Sau này bạn map API thật
            // const res = await api.get("/Admin/dashboard");
            // setStats(res.data);

            // ===== MOCK DATA =====
            setStats({
                totalMembers: 342,
                totalPaidPackages: 198,
                totalRevenue: 125000000,
            });
        } catch (err) {
            console.error(err);
            message.error("Không thể tải dữ liệu dashboard");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    /* ==========================
          CHART DATA
       ========================== */

    // Bar chart - Doanh thu theo tháng
    const revenueChartData = {
        labels: [
            "Th1",
            "Th2",
            "Th3",
            "Th4",
            "Th5",
            "Th6",
            "Th7",
            "Th8",
            "Th9",
            "Th10",
            "Th11",
            "Th12",
        ],
        datasets: [
            {
                label: "Doanh thu (VNĐ)",
                data: [
                    8000000, 12000000, 15000000, 10000000,
                    18000000, 20000000, 17000000, 22000000,
                    19000000, 24000000, 26000000, 30000000,
                ],
                backgroundColor: "#1677ff",
                borderRadius: 8,
            },
        ],
    };

    // Line chart - Tăng trưởng hội viên
    const memberGrowthData = {
        labels: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6"],
        datasets: [
            {
                label: "Hội viên mới",
                data: [20, 35, 50, 40, 65, 80],
                borderColor: "#52c41a",
                backgroundColor: "rgba(82,196,26,0.2)",
                tension: 0.4,
                fill: true,
            },
        ],
    };

    return (
        <div className="container-fluid py-5">
            <div className="row g-4">
                {/* ===== SIDEBAR ===== */}
                <div className="col-lg-3">
                    <Sidebar role="Admin"/>
                </div>

                {/* ===== MAIN CONTENT ===== */}
                <div className="col-lg-9">
                    <h2 className="mb-4 text-center">Dashboard</h2>

                    {loading ? (
                        <div className="text-center py-5">
                            <Spin size="large" />
                        </div>
                    ) : (
                        <>
                            {/* ===== STATISTICS ===== */}
                            <Row gutter={[24, 24]}>
                                <Col xs={24} md={8}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            borderRadius: 12,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        <Statistic
                                            title="Tổng số hội viên"
                                            value={stats.totalMembers}
                                            prefix={<UserOutlined style={{ color: "#1677ff" }} />}
                                        />
                                    </Card>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            borderRadius: 12,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        <Statistic
                                            title="Gói đã được thanh toán"
                                            value={stats.totalPaidPackages}
                                            prefix={
                                                <ShoppingCartOutlined style={{ color: "#52c41a" }} />
                                            }
                                        />
                                    </Card>
                                </Col>

                                <Col xs={24} md={8}>
                                    <Card
                                        bordered={false}
                                        style={{
                                            borderRadius: 12,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        <Statistic
                                            title="Tổng doanh thu"
                                            value={stats.totalRevenue}
                                            prefix={<DollarOutlined style={{ color: "#faad14" }} />}
                                            valueStyle={{ color: "#faad14", fontWeight: 600 }}
                                            formatter={(v) =>
                                                `${Number(v).toLocaleString("vi-VN")} ₫`
                                            }
                                        />
                                    </Card>
                                </Col>
                            </Row>

                            {/* ===== CHARTS ===== */}
                            <Row gutter={[24, 24]} className="mt-4">
                                <Col xs={24} lg={12}>
                                    <Card
                                        title="Doanh thu theo tháng"
                                        bordered={false}
                                        style={{
                                            borderRadius: 12,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        <Bar
                                            data={revenueChartData}
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { display: false },
                                                },
                                            }}
                                        />
                                    </Card>
                                </Col>

                                <Col xs={24} lg={12}>
                                    <Card
                                        title="Tăng trưởng hội viên"
                                        bordered={false}
                                        style={{
                                            borderRadius: 12,
                                            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        <Line
                                            data={memberGrowthData}
                                            options={{
                                                responsive: true,
                                                plugins: {
                                                    legend: { position: "bottom" },
                                                },
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
