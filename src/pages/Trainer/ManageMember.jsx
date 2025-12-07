// reactstrap components
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Table,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
} from "reactstrap";
// core components
import React, { useEffect, useState, useMemo } from "react";
import { HiUserGroup } from "react-icons/hi2";
import { FiSearch } from "react-icons/fi";
import { message } from "antd";

// ============== MOCK DATA ==============
const MOCK_MEMBERS = [
  {
    id: 1,
    fullName: "Nguyễn Văn A",
    email: "a.nguyen@example.com",
    phoneNumber: "0901 234 567",
    avatar: "/img/useravt.jpg",
    status: "Active", // hiện không dùng, nhưng vẫn giữ trong mock nếu sau này cần
    currentPackageName: "Gói PT 3 tháng",
    startedDate: "2025-11-01",

    // Thông tin profile
    dateOfBirth: "1998-05-20",
    gender: "Nam",
    weight: 70,
    height: 173,

    // Plan
    mealPlan:
      "Sáng: Yến mạch + sữa chua\nTrưa: Cơm + ức gà + rau\nTối: Salad + trứng\nUống đủ 2L nước/ngày.",
    workoutPlan:
      "Thứ 2: Ngực - Tay sau\nThứ 4: Lưng - Tay trước\nThứ 6: Chân - Vai\nCardio 20 phút sau buổi tập.",
  },
  {
    id: 2,
    fullName: "Trần Thị B",
    email: "b.tran@example.com",
    phoneNumber: "0912 345 678",
    avatar: "/img/useravt.jpg",
    status: "Active",
    currentPackageName: "Gói Gym thường 6 tháng",
    startedDate: "2025-10-15",

    dateOfBirth: "2000-03-10",
    gender: "Nữ",
    weight: 55,
    height: 160,

    mealPlan:
      "Ăn đủ 3 bữa chính + 1 bữa phụ.\nƯu tiên rau xanh, hạn chế đồ ngọt.",
    workoutPlan:
      "Thứ 3: Full body nhẹ\nThứ 5: Yoga / giãn cơ\nCuối tuần: Cardio nhẹ 30 phút.",
  },
  {
    id: 3,
    fullName: "Lê Văn C",
    email: "c.le@example.com",
    phoneNumber: "0987 654 321",
    avatar: "/img/useravt.jpg",
    status: "Paused",
    currentPackageName: "Gói PT 1 kèm 1",
    startedDate: "2025-09-20",

    dateOfBirth: "1995-12-01",
    gender: "Nam",
    weight: 80,
    height: 180,

    mealPlan: "",
    workoutPlan: "",
  },
];

const TrainerMemberList = () => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");

  // Modal chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Tab trong modal: "info" | "plan"
  const [activeModalTab, setActiveModalTab] = useState("info");

  // Plan state
  const [mealPlan, setMealPlan] = useState("");
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [planSaving, setPlanSaving] = useState(false);

  // Profile detail của member (mock lấy từ member luôn)
  const [memberProfile, setMemberProfile] = useState(null);

  // ====== Lấy danh sách member trainer đang training (MOCK) ======
  const fetchMembers = () => {
    setLoading(true);
    setLoadError("");
    setTimeout(() => {
      setMembers(MOCK_MEMBERS);
      setLoading(false);
    }, 300);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  // Filter theo search (tên/email)
  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(keyword) ||
        m.email?.toLowerCase().includes(keyword)
    );
  }, [members, search]);

  // ====== Mở modal chi tiết (dùng mock) ======
  const handleOpenDetail = (member) => {
    setSelectedMember(member);
    setDetailOpen(true);
    setActiveModalTab("info");

    // Profile & plan lấy trực tiếp từ member (mock)
    setMemberProfile({
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      weight: member.weight,
      height: member.height,
    });

    setMealPlan(member.mealPlan || "");
    setWorkoutPlan(member.workoutPlan || "");
  };

  const handleCloseDetail = () => {
    if (planSaving) return; // tránh đóng khi đang save
    setDetailOpen(false);
    setSelectedMember(null);
    setMemberProfile(null);
    setMealPlan("");
    setWorkoutPlan("");
  };

  // ====== Lưu Meal & Workout Plan (update vào state mock) ======
  const handleSavePlan = () => {
    if (!selectedMember?.id) return;

    try {
      setPlanSaving(true);

      // Cập nhật vào list members mock
      setMembers((prev) =>
        prev.map((m) =>
          m.id === selectedMember.id
            ? {
                ...m,
                mealPlan,
                workoutPlan,
              }
            : m
        )
      );

      // Cập nhật selectedMember local luôn
      setSelectedMember((prev) =>
        prev
          ? {
              ...prev,
              mealPlan,
              workoutPlan,
            }
          : prev
      );

      message.success("Đã lưu Meal & Workout plan.");
    } catch (err) {
      console.error("Error updating plans:", err);
      message.error("Cập nhật Meal/Workout plan thất bại.");
    } finally {
      setPlanSaving(false);
    }
  };

  // Helper format date yyyy-MM-dd -> dd/MM/yyyy
  const formatDDMMYYYY = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  return (
    <Container className="mt-5 mb-5" fluid>
      <Row className="justify-content-center">
        <Col xl="10">
          <Card className="shadow-lg border-0">
            <CardHeader
              className="d-flex flex-column flex-md-row justify-content-between align-items-md-center align-items-start"
              style={{
                background:
                  "linear-gradient(135deg, #0c1844 0%, #1f3b8f 50%, #2f7dd1 100%)",
                color: "#fff",
                borderRadius: "0.5rem 0.5rem 0 0",
                borderBottom: "none",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-3 mb-md-0">
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <HiUserGroup size={22} />
                </div>
                <div>
                  <h3 className="mb-0" style={{ fontWeight: 700 }}>
                    Hội viên đang được bạn huấn luyện
                  </h3>
                  <small style={{ opacity: 0.85 }}>
                    Xem nhanh thông tin hội viên và cập nhật Meal/Workout plan.
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                <div className="position-relative">
                  <FiSearch
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.7,
                      color: "#6b7280",
                    }}
                  />
                  <Input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    style={{
                      paddingLeft: 32,
                      minWidth: 260,
                      background: "rgba(255,255,255,0.95)",
                      border: "none",
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  color="light"
                  style={{ color: "#0c1844", fontWeight: 600 }}
                  onClick={fetchMembers}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardBody
              style={{
                background: "#f3f4f6",
                borderRadius: "0 0 0.5rem 0.5rem",
              }}
            >
              {loading && (
                <div className="text-center my-4">
                  <div
                    className="spinner-border"
                    style={{ color: "#0c1844" }}
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                  <div className="mt-2 text-muted">
                    Đang tải danh sách hội viên...
                  </div>
                </div>
              )}

              {!loading && loadError && (
                <div className="alert alert-danger mb-0">{loadError}</div>
              )}

              {!loading && !loadError && filteredMembers.length === 0 && (
                <div className="alert alert-light border text-center mb-0">
                  Hiện chưa có hội viên nào đang được bạn huấn luyện.
                </div>
              )}

              {!loading && !loadError && filteredMembers.length > 0 && (
                <div
                  className="table-responsive"
                  style={{
                    background: "#ffffff",
                    borderRadius: "0.5rem",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
                  }}
                >
                  <Table
                    hover
                    className="align-items-center mb-0"
                    style={{ borderCollapse: "separate", borderSpacing: 0 }}
                  >
                    <thead className="thead-light">
                      <tr>
                        <th style={{ width: 60 }}>#</th>
                        <th>Hội viên</th>
                        <th>Gói hiện tại</th>
                        <th>Bắt đầu</th>
                        <th className="text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td className="align-middle text-muted">
                            {idx + 1}
                          </td>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <img
                                src={m.avatar || "/img/useravt.jpg"}
                                alt="avatar"
                                className="rounded-circle"
                                style={{
                                  width: 46,
                                  height: 46,
                                  objectFit: "cover",
                                  marginRight: 12,
                                  border: "2px solid #e5e7eb",
                                  background: "#f9fafb",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = "/img/useravt.jpg";
                                }}
                              />
                              <div>
                                <div
                                  style={{
                                    fontWeight: 600,
                                    color: "#111827",
                                  }}
                                >
                                  {m.fullName || "Không rõ tên"}
                                </div>
                                {/* Email hiển thị dưới tên */}
                                <div
                                  className="text-muted"
                                  style={{ fontSize: 12 }}
                                >
                                  {m.email || "—"}
                                </div>
                                {m.phoneNumber && (
                                  <div
                                    className="text-muted"
                                    style={{
                                      fontSize: 11,
                                      opacity: 0.9,
                                      marginTop: 2,
                                    }}
                                  >
                                    📞 {m.phoneNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="align-middle">
                            <span style={{ fontSize: 13, fontWeight: 500 }}>
                              {m.currentPackageName || "—"}
                            </span>
                          </td>
                          <td className="align-middle text-muted">
                            {formatDDMMYYYY(m.startedDate)}
                          </td>
                          <td className="align-middle text-right">
                            <Button
                              size="sm"
                              color="primary"
                              style={{
                                borderRadius: 999,
                                paddingInline: 16,
                                fontSize: 13,
                              }}
                              onClick={() => handleOpenDetail(m)}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ========= MODAL CHI TIẾT MEMBER ========= */}
      <Modal
        isOpen={detailOpen}
        toggle={handleCloseDetail}
        size="lg"
        centered
      >
        <ModalHeader
          toggle={handleCloseDetail}
          style={{ borderBottom: "none", paddingBottom: 0 }}
        >
          {/* bỏ title mặc định, phần đẹp nằm trong hero dưới */}
        </ModalHeader>
        <ModalBody style={{ backgroundColor: "#f9fafb" }}>
          {selectedMember && (
            <>
              {/* HERO HEADER TRONG MODAL */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #0c1844 0%, #1f3b8f 50%, #2f7dd1 100%)",
                  borderRadius: "0.75rem",
                  padding: "16px 18px",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 16,
                  boxShadow: "0 10px 25px rgba(15,23,42,0.25)",
                }}
              >
                <img
                  src={selectedMember.avatar || "/img/useravt.jpg"}
                  alt="avatar"
                  className="rounded-circle"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.6)",
                    background: "#0f172a",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/img/useravt.jpg";
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      marginBottom: 2,
                    }}
                  >
                    {selectedMember.fullName}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>
                    {selectedMember.email || "—"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 8,
                      fontSize: 12,
                    }}
                  >
                    {selectedMember.phoneNumber && (
                      <span
                        style={{
                          backgroundColor: "rgba(15,23,42,0.3)",
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        📞 {selectedMember.phoneNumber}
                      </span>
                    )}
                    {selectedMember.currentPackageName && (
                      <span
                        style={{
                          backgroundColor: "#22c55e",
                          padding: "4px 10px",
                          borderRadius: 999,
                          color: "#052e16",
                          fontWeight: 600,
                        }}
                      >
                        {selectedMember.currentPackageName}
                      </span>
                    )}
                    {selectedMember.startedDate && (
                      <span
                        style={{
                          backgroundColor: "rgba(15,23,42,0.3)",
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        Bắt đầu: {formatDDMMYYYY(selectedMember.startedDate)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="d-none d-md-block">
                  <span
                    style={{
                      backgroundColor: "rgba(15,23,42,0.5)",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Hội viên của bạn
                  </span>
                </div>
              </div>

              {/* Tabs trong modal */}
              <div
                className="d-flex justify-content-center mb-3"
                style={{ gap: 8 }}
              >
                <Button
                  size="sm"
                  type="button"
                  style={{
                    borderRadius: 999,
                    paddingInline: 16,
                    fontWeight: activeModalTab === "info" ? 700 : 500,
                    backgroundColor:
                      activeModalTab === "info" ? "#0c1844" : "transparent",
                    color:
                      activeModalTab === "info" ? "#fff" : "#4b5563",
                    borderColor:
                      activeModalTab === "info" ? "#0c1844" : "#e5e7eb",
                  }}
                  onClick={() => setActiveModalTab("info")}
                >
                  Thông tin hội viên
                </Button>
                <Button
                  size="sm"
                  type="button"
                  style={{
                    borderRadius: 999,
                    paddingInline: 16,
                    fontWeight: activeModalTab === "plan" ? 700 : 500,
                    backgroundColor:
                      activeModalTab === "plan" ? "#0c1844" : "transparent",
                    color:
                      activeModalTab === "plan" ? "#fff" : "#4b5563",
                    borderColor:
                      activeModalTab === "plan" ? "#0c1844" : "#e5e7eb",
                  }}
                  onClick={() => setActiveModalTab("plan")}
                >
                  Meal / Workout Plan
                </Button>
              </div>

              {/* CONTENT CARD */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "0.75rem",
                  padding: "16px 18px",
                  boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
                }}
              >
                {/* Tab 1: Info */}
                {activeModalTab === "info" && (
                  <>
                    <Row>
                      {/* Cột trái: Thông tin liên hệ & gói */}
                      <Col md="6" className="mb-3">
                        <h6
                          style={{
                            fontSize: 13,
                            textTransform: "uppercase",
                            letterSpacing: 0.06,
                            color: "#6b7280",
                            fontWeight: 700,
                            marginBottom: 8,
                          }}
                        >
                          Thông tin cơ bản
                        </h6>
                        <div
                          style={{
                            backgroundColor: "#f9fafb",
                            borderRadius: 12,
                            padding: "10px 12px",
                            fontSize: 13,
                          }}
                        >
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Họ tên</span>
                            <span style={{ fontWeight: 600 }}>
                              {selectedMember.fullName}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Email</span>
                            <span>{selectedMember.email || "—"}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Số điện thoại</span>
                            <span>{selectedMember.phoneNumber || "—"}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Gói hiện tại</span>
                            <span style={{ fontWeight: 500 }}>
                              {selectedMember.currentPackageName || "—"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mt-1">
                            <span className="text-muted">Ngày bắt đầu</span>
                            <span>
                              {formatDDMMYYYY(selectedMember.startedDate)}
                            </span>
                          </div>
                        </div>
                      </Col>

                      {/* Cột phải: Thông tin thể chất */}
                      <Col md="6" className="mb-3">
                        <h6
                          style={{
                            fontSize: 13,
                            textTransform: "uppercase",
                            letterSpacing: 0.06,
                            color: "#6b7280",
                            fontWeight: 700,
                            marginBottom: 8,
                          }}
                        >
                          Thông tin thể chất
                        </h6>
                        <div
                          style={{
                            backgroundColor: "#f9fafb",
                            borderRadius: 12,
                            padding: "10px 12px",
                            fontSize: 13,
                          }}
                        >
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Ngày sinh</span>
                            <span>
                              {memberProfile?.dateOfBirth
                                ? formatDDMMYYYY(memberProfile.dateOfBirth)
                                : "—"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Giới tính</span>
                            <span>{memberProfile?.gender || "—"}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Cân nặng</span>
                            <span>
                              {memberProfile?.weight != null
                                ? `${memberProfile.weight} kg`
                                : "—"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Chiều cao</span>
                            <span>
                              {memberProfile?.height != null
                                ? `${memberProfile.height} cm`
                                : "—"}
                            </span>
                          </div>
                        </div>
                      </Col>
                    </Row>

                    <div className="d-flex justify-content-end mt-2">
                      <Button
                        color="info"
                        size="sm"
                        onClick={() => setActiveModalTab("plan")}
                      >
                        Đi tới Meal/Workout plan
                      </Button>
                    </div>
                  </>
                )}

                {/* Tab 2: Meal / Workout Plan */}
                {activeModalTab === "plan" && (
                  <>
                    <Row>
                      <Col md="6" className="mb-3">
                        <FormGroup>
                          <Label style={{ fontWeight: 600, fontSize: 13 }}>
                            🍽️ Meal Plan
                          </Label>
                          <Input
                            type="textarea"
                            rows={6}
                            value={mealPlan}
                            onChange={(e) => setMealPlan(e.target.value)}
                            placeholder="Ví dụ: thực đơn theo ngày, lượng calories, lưu ý dị ứng..."
                            style={{ fontSize: 13 }}
                          />
                        </FormGroup>
                      </Col>
                      <Col md="6" className="mb-3">
                        <FormGroup>
                          <Label style={{ fontWeight: 600, fontSize: 13 }}>
                            🏋️ Workout Plan
                          </Label>
                          <Input
                            type="textarea"
                            rows={6}
                            value={workoutPlan}
                            onChange={(e) => setWorkoutPlan(e.target.value)}
                            placeholder="Ví dụ: lịch tập, nhóm cơ, số set/reps, lưu ý về kỹ thuật..."
                            style={{ fontSize: 13 }}
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <div
                      className="d-flex justify-content-between align-items-center mt-1"
                      style={{ fontSize: 12, color: "#6b7280" }}
                    >
                      <span>
                        💡 Gợi ý: dùng bullet hoặc dòng ngắn theo từng buổi
                        tập/ngày cho dễ theo dõi.
                      </span>
                      <Button
                        color="primary"
                        size="sm"
                        onClick={handleSavePlan}
                        disabled={planSaving}
                        style={{ borderRadius: 999, paddingInline: 16 }}
                      >
                        {planSaving ? "Đang lưu..." : "Lưu plan"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </ModalBody>
        <ModalFooter style={{ borderTop: "none" }}>
          <Button color="secondary" outline onClick={handleCloseDetail}>
            Đóng
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default TrainerMemberList;
