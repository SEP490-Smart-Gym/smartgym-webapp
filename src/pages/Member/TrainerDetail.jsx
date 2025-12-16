import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Container,
  Grid,
  Typography,
  Avatar,
  Card,
  Button,
  Chip,
  useMediaQuery,
  Rating,
  Divider,
} from "@mui/material";
import { styled } from "@mui/system";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import api from "../../config/axios";
import { message } from "antd"; // ✅ dùng Ant Design message

// 🎨 Styled Components
const ProfileContainer = styled(Card)({
  padding: "2rem",
  boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
  borderRadius: "16px",
  background: "#ffffff",
});

const ProfileAvatar = styled(Avatar)({
  width: "150px",
  height: "150px",
  border: "4px solid #fff",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  margin: "20px auto",
});

const InfoCard = styled(Card)({
  height: "100%",
  padding: "1.5rem",
  boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
  borderRadius: "12px",
});

const ActionButton = styled(Button)({
  margin: "8px",
  padding: "8px 24px",
  borderRadius: "8px",
  textTransform: "none",
});

// ===== Helper: tính tuổi từ ngày sinh =====
function calculateAge(dobIso) {
  if (!dobIso) return null;
  const d = new Date(dobIso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

// ===== Helper: tính số năm từ ngày bắt đầu =====
function calculateYearsFrom(startIso) {
  if (!startIso) return null;
  const d = new Date(startIso);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let years = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) {
    years--;
  }
  return years >= 0 ? years : null;
}

// ===== Helper: format dd/MM/yyyy =====
function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

const TrainerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 thông tin user & gói để được quyền feedback
  const [user, setUser] = useState(null);
  const [memberPackageId, setMemberPackageId] = useState(null);
  const [loadingPackage, setLoadingPackage] = useState(false);

  // ✍️ state cho feedback form (member)
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // 🔁 list feedbacks
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // 🗣️ trainer reply state
  const [replyingFeedbackId, setReplyingFeedbackId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // scroll to top khi vào trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Lấy user từ localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  // 🔥 Lấy data trainer từ API /guest/trainers/:id
  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/guest/trainers/${id}`);
        const data = res.data;

        const fullName =
          `${data.firstName || ""} ${data.lastName || ""}`.trim() ||
          "Huấn luyện viên";

        let genderText = "";
        if (data.gender || data.profile?.gender) {
          const g = String(data.gender || data.profile?.gender).toLowerCase();
          if (g === "male") genderText = "Nam";
          else if (g === "female") genderText = "Nữ";
          else genderText = data.gender || data.profile?.gender;
        }

        const specializationArray = data.profile?.specialization
          ? data.profile.specialization
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        // 👉 Tuổi từ dateOfBirth
        const age = calculateAge(data.profile?.dateOfBirth);

        // 👉 Năm kinh nghiệm: ưu tiên yearsOfExperience, fallback từ startWorkingDate
        let experienceYears = null;
        if (
          typeof data.profile?.yearsOfExperience === "number" &&
          !Number.isNaN(data.profile.yearsOfExperience) &&
          data.profile.yearsOfExperience > 0
        ) {
          experienceYears = data.profile.yearsOfExperience;
        } else if (data.profile?.startWorkingDate) {
          experienceYears = calculateYearsFrom(data.profile.startWorkingDate);
        }

        const mappedTrainer = {
          id: data.trainerId,
          avatar: "/img/team-1.jpg", // TODO: backend trả avatar thì map lại
          name: fullName,
          age: age,
          gender: genderText || "Đang cập nhật",
          experienceYears,
          specialization: specializationArray,
          about:
            data.profile?.trainerBio ||
            "Thông tin giới thiệu đang được cập nhật.",
          skills: specializationArray.map((name) => ({ name })),
          contact: {
            phone: data.phoneNumber || data.profile?.phoneNumber || "",
            email: data.email || data.profile?.email || "",
          },
          certificates: (data.profile?.certificates || []).map((c) => ({
            title: c.certificateName,
            detail: c.certificateDetail,
          })),
          rating: data.profile?.trainerRating ?? null,
          totalReviews: data.profile?.totalReviews ?? 0,
          isAvailable: data.profile?.isAvailableForNewClients ?? false,
        };

        setTrainer(mappedTrainer);
      } catch (err) {
        console.error("Error fetching trainer:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchTrainer();
  }, [id]);

  // 🔗 Lấy memberPackageId: GET /MemberPackage/my-packages
  useEffect(() => {
    const fetchMyPackages = async () => {
      try {
        setLoadingPackage(true);
        const res = await api.get("/MemberPackage/my-packages");
        const raw = res.data;

        let list = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw?.items && Array.isArray(raw.items)) list = raw.items;
        else if (raw && typeof raw === "object") list = [raw];

        const trainerIdNum = Number(id);

        const forThisTrainer = list.filter(
          (pkg) => Number(pkg.trainerId) === trainerIdNum
        );

        if (!forThisTrainer.length) {
          setMemberPackageId(null);
          return;
        }

        forThisTrainer.sort((a, b) => {
          const da = new Date(a.purchaseDate || a.startDate || 0).getTime();
          const db = new Date(b.purchaseDate || b.startDate || 0).getTime();
          return db - da;
        });

        setMemberPackageId(forThisTrainer[0].id);
      } catch (err) {
        console.error("Error fetching my-packages:", err);
        setMemberPackageId(null);
      } finally {
        setLoadingPackage(false);
      }
    };

    if (id) fetchMyPackages();
  }, [id]);

  // ✅ fetch feedbacks (tái sử dụng cho reload)
  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoadingFeedbacks(true);
      const res = await api.get(`/guest/trainers/${id}/feedbacks`);
      const raw = res.data;

      const list = Array.isArray(raw)
        ? raw
        : raw?.items && Array.isArray(raw.items)
        ? raw.items
        : raw
        ? [raw]
        : [];

      const mapped = list.map((f) => ({
        id: f.feedbackId,
        rating: f.rating,
        comments: f.comments,
        status: f.status,
        feedbackDate: f.feedbackDate,
        responseText: f.responseText,
        respondedBy: f.respondedBy,
        respondedDate: f.respondedDate,
        responderName: f.responderName,
        memberName: f.memberName,
        trainerName: f.trainerName,
      }));

      setFeedbacks(mapped);
    } catch (err) {
      console.error("Error fetching trainer feedbacks:", err);
    } finally {
      setLoadingFeedbacks(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchFeedbacks();
  }, [id, fetchFeedbacks]);

  // ⭐ Rating trung bình
  const averageRating = (() => {
    if (trainer?.rating != null && !Number.isNaN(trainer.rating)) {
      return Number(trainer.rating);
    }
    if (feedbacks.length) {
      const sum = feedbacks.reduce(
        (acc, f) => acc + (Number(f.rating) || 0),
        0
      );
      return sum / feedbacks.length;
    }
    return 0;
  })();

  const totalReviews =
    trainer?.totalReviews != null && trainer.totalReviews > 0
      ? trainer.totalReviews
      : feedbacks.length;

  // member có đủ điều kiện để gửi feedback?
  const canSendFeedback =
    !!user &&
    user.roleName === "Member" &&
    !!memberPackageId &&
    !loadingPackage;

  // trainer có đủ điều kiện để reply? (Trainer + đúng profile của mình)
  const isTrainerRole = !!user && user.roleName === "Trainer";
  const myTrainerId =
    Number(user?.trainerId || user?.id || user?.userId || 0) || null;
  const isViewingOwnTrainerProfile =
    isTrainerRole && !!trainer?.id && myTrainerId === Number(trainer.id);

  // 📨 Gửi feedback (Member): POST /member/feedback/trainer
  const handleSubmitFeedback = async () => {
    if (!canSendFeedback) return;

    if (!feedbackComment.trim()) {
      message.warning("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    const key = "submit-feedback";
    message.loading({ content: "Đang gửi đánh giá...", key, duration: 0 });

    try {
      setSubmittingFeedback(true);
      await api.post("/member/feedback/trainer", {
        memberPackageId,
        rating: Number(feedbackRating) || 0,
        comments: feedbackComment.trim(),
      });

      message.success({ content: "Cảm ơn bạn đã gửi đánh giá!", key, duration: 2 });

      setFeedbackRating(5);
      setFeedbackComment("");

      await fetchFeedbacks();
    } catch (err) {
      console.error("Error submitting trainer feedback:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Gửi đánh giá thất bại.";
      message.error({ content: msg, key, duration: 3 });
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // 🗣️ Trainer reply feedback: POST/PUT /trainer/feedback/{feedbackId}/reply
  const handleStartReply = (fb) => {
    setReplyingFeedbackId(fb.id);
    setReplyText(fb.responseText || "");
  };

  const handleCancelReply = () => {
    setReplyingFeedbackId(null);
    setReplyText("");
  };

  const handleSubmitReply = async (fb) => {
    if (!isViewingOwnTrainerProfile) return;

    const text = (replyText || "").trim();
    if (!text) {
      message.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    const key = "reply-feedback";
    message.loading({ content: "Đang gửi phản hồi...", key, duration: 0 });

    try {
      setSubmittingReply(true);

      const endpoint = `/trainer/feedback/${fb.id}/reply`; // nếu backend yêu cầu /api thì đổi thành `/api/trainer/feedback/${fb.id}/reply`
      const payload = { responseText: text };

      // ✅ nếu đã có responseText => PUT (edit), chưa có => POST (reply mới)
      if (fb.responseText && String(fb.responseText).trim()) {
        await api.put(endpoint, payload);
        message.success({ content: "Cập nhật phản hồi thành công!", key, duration: 2 });
      } else {
        await api.post(endpoint, payload);
        message.success({ content: "Gửi phản hồi thành công!", key, duration: 2 });
      }

      handleCancelReply();
      await fetchFeedbacks();
    } catch (err) {
      console.error("Reply feedback error:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Phản hồi thất bại.";
      message.error({ content: msg, key, duration: 3 });
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h6">Đang tải thông tin huấn luyện viên...</Typography>
      </Container>
    );
  }

  if (!trainer) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Không tìm thấy huấn luyện viên.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 3 }}
        >
          Quay lại
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {/* Cột trái */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 30%" }, minWidth: 300 }}>
          <ProfileContainer>
            <Box sx={{ textAlign: "center" }}>
              <ProfileAvatar src={trainer.avatar} alt={trainer.name} />
              <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold" }}>
                {trainer.name}
              </Typography>

              <Typography variant="subtitle1" color="text.secondary">
                {trainer.age != null ? `${trainer.age} tuổi` : "Tuổi: đang cập nhật"}
              </Typography>

              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <Chip
                  label={
                    trainer.experienceYears != null
                      ? `${trainer.experienceYears} năm kinh nghiệm`
                      : "Kinh nghiệm: đang cập nhật"
                  }
                  color="primary"
                  variant="outlined"
                />
                <Chip label={trainer.gender || "Giới tính: đang cập nhật"} color="primary" variant="outlined" />
                {trainer.isAvailable && (
                  <Chip label="Đang nhận hội viên mới" color="success" variant="filled" />
                )}
              </Box>
            </Box>
          </ProfileContainer>
        </Box>

        {/* Cột phải */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 65%" }, width: "100%" }}>
          <Grid container spacing={2} sx={{ width: "100%", margin: 0 }}>
            {/* Giới thiệu */}
            <Grid item xs={12} sx={{ width: "100%" }}>
              <InfoCard
                sx={{
                  height: 180,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <Typography variant="h6" gutterBottom color="primary" sx={{ flexShrink: 0, fontWeight: "bold" }}>
                  Giới thiệu huấn luyện viên
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                    "&:hover::-webkit-scrollbar": { display: "block", width: 6 },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 3 },
                  }}
                >
                  <Typography sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                    {trainer.about}
                  </Typography>
                </Box>
              </InfoCard>
            </Grid>

            {/* Kỹ năng & Liên hệ */}
            <Grid item xs={12} sx={{ width: "100%" }}>
              <Grid container spacing={2} sx={{ display: "flex", flexWrap: "nowrap", width: "100%" }}>
                <Grid item xs={12} md={6} sx={{ flex: 1, display: "flex" }}>
                  <InfoCard sx={{ flex: 1, height: 170, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: "bold" }}>
                      Kỹ năng
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        pr: 1,
                        "&::-webkit-scrollbar": { width: 6 },
                        "&::-webkit-scrollbar-thumb": { background: "transparent" },
                        "&:hover::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 3 },
                      }}
                    >
                      {trainer.skills && trainer.skills.length > 0 ? (
                        trainer.skills.map((s, idx) => (
                          <Typography key={idx} variant="body2" sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                            • {s.name}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Kỹ năng đang được cập nhật...
                        </Typography>
                      )}
                    </Box>
                  </InfoCard>
                </Grid>

                <Grid item xs={12} md={6} sx={{ flex: 1, display: "flex" }}>
                  <InfoCard sx={{ flex: 1, height: 170, display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: "bold" }}>
                      Thông tin liên hệ
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        pr: 1,
                        "&::-webkit-scrollbar": { width: 6 },
                        "&::-webkit-scrollbar-thumb": { background: "transparent" },
                        "&:hover::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 3 },
                      }}
                    >
                      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                        Email: {trainer.contact.email || "Đang cập nhật..."}
                      </Typography>
                      <Typography variant="body2">
                        Số điện thoại: {trainer.contact.phone || "Đang cập nhật..."}
                      </Typography>
                    </Box>
                  </InfoCard>
                </Grid>
              </Grid>
            </Grid>

            {/* Chứng chỉ */}
            <Grid item xs={12} sx={{ width: "100%" }}>
              <InfoCard sx={{ height: 160, width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: "bold" }}>
                  Chứng chỉ
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    "&::-webkit-scrollbar": { width: 6 },
                    "&::-webkit-scrollbar-thumb": { background: "transparent" },
                    "&:hover::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)", borderRadius: 3 },
                  }}
                >
                  {trainer.certificates && trainer.certificates.length > 0 ? (
                    trainer.certificates.map((c, i) => (
                      <Typography key={i} sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                        🏅 {c.title} – {c.detail}
                      </Typography>
                    ))
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Chứng chỉ đang được cập nhật...
                    </Typography>
                  )}
                </Box>
              </InfoCard>
            </Grid>

            {/* Feedbacks */}
            <Grid item xs={12} sx={{ width: "100%" }}>
              <InfoCard sx={{ height: 420, width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                <Box sx={{ flexShrink: 0 }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: "bold" }}>
                    Đánh giá & nhận xét
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Rating value={averageRating || 0} precision={0.5} readOnly />
                    <Typography sx={{ ml: 1, fontWeight: "bold" }}>
                      {Number.isFinite(averageRating) ? averageRating.toFixed(1) : "0.0"} / 5.0
                    </Typography>
                    <Typography sx={{ ml: 2, color: "text.secondary", fontSize: 14 }}>
                      ({totalReviews} lượt đánh giá)
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 1 }} />
                </Box>

                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    "&::-webkit-scrollbar": { width: 6 },
                    "&::-webkit-scrollbar-thumb": { background: "transparent", borderRadius: 3 },
                    "&:hover::-webkit-scrollbar-thumb": { background: "rgba(0,0,0,0.15)" },
                  }}
                >
                  {loadingFeedbacks ? (
                    <Typography color="text.secondary">Đang tải danh sách đánh giá...</Typography>
                  ) : feedbacks.length === 0 ? (
                    <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                      Hiện chưa có đánh giá nào cho huấn luyện viên này.
                    </Typography>
                  ) : (
                    feedbacks.map((fb) => {
                      const isEditingThisReply = replyingFeedbackId === fb.id;

                      return (
                        <Box
                          key={fb.id}
                          sx={{ mb: 2, pb: 2, borderBottom: "1px dashed #e0e0e0" }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mb: 0.5,
                              gap: 1,
                            }}
                          >
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {fb.memberName || "Hội viên"}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                              <Rating value={Number(fb.rating) || 0} size="small" readOnly />
                              <Typography variant="caption" color="text.secondary">
                                {formatDate(fb.feedbackDate)}
                              </Typography>
                            </Box>
                          </Box>

                          <Typography variant="body2" sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                            {fb.comments}
                          </Typography>

                          {/* Response section */}
                          {fb.responseText && !isEditingThisReply && (
                            <Box sx={{ mt: 1, ml: 1, pl: 1, borderLeft: "3px solid #e0e7ff" }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Phản hồi từ huấn luyện viên
                                  {fb.responderName ? ` (${fb.responderName})` : ""}:
                                </Typography>

                                {/* ✅ Trainer: Edit reply */}
                                {isViewingOwnTrainerProfile && (
                                  <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => handleStartReply(fb)}
                                    sx={{ textTransform: "none" }}
                                  >
                                    Chỉnh sửa
                                  </Button>
                                )}
                              </Box>

                              <Typography variant="body2" sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                                {fb.responseText}
                              </Typography>

                              {fb.respondedDate && (
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(fb.respondedDate)}
                                </Typography>
                              )}
                            </Box>
                          )}

                          {/* ✅ Trainer: Reply / Edit UI */}
                          {isViewingOwnTrainerProfile && (
                            <Box sx={{ mt: 1 }}>
                              {!fb.responseText && !isEditingThisReply && (
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={() => handleStartReply(fb)}
                                  sx={{ textTransform: "none" }}
                                >
                                  Trả lời đánh giá
                                </Button>
                              )}

                              {isEditingThisReply && (
                                <Box
                                  sx={{
                                    mt: 1,
                                    p: 1,
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 2,
                                    background: "#fafafa",
                                  }}
                                >
                                  <Typography variant="body2" sx={{ mb: 1, fontWeight: 600 }}>
                                    {fb.responseText ? "Chỉnh sửa phản hồi" : "Phản hồi đánh giá"}
                                  </Typography>

                                  <textarea
                                    value={replyText}
                                    onChange={(e) => setReplyText(e.target.value)}
                                    rows={3}
                                    style={{
                                      width: "100%",
                                      border: "1px solid #ccc",
                                      borderRadius: 8,
                                      padding: "8px 10px",
                                      outline: "none",
                                      resize: "vertical",
                                      backgroundColor: "#fff",
                                      color: "#000",
                                    }}
                                    placeholder="Nhập phản hồi của bạn..."
                                  />

                                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
                                    <Button
                                      variant="outlined"
                                      size="small"
                                      onClick={handleCancelReply}
                                      sx={{ textTransform: "none" }}
                                      disabled={submittingReply}
                                    >
                                      Hủy
                                    </Button>
                                    <Button
                                      variant="contained"
                                      size="small"
                                      onClick={() => handleSubmitReply(fb)}
                                      sx={{
                                        backgroundColor: "#0c1844",
                                        textTransform: "none",
                                        "&:hover": { backgroundColor: "#1f3bb6ff" },
                                      }}
                                      disabled={submittingReply}
                                    >
                                      {submittingReply ? "Đang lưu..." : "Lưu"}
                                    </Button>
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          )}
                        </Box>
                      );
                    })
                  )}
                </Box>

                {/* Form gửi feedback (Member) */}
                {canSendFeedback && (
                  <>
                    <Divider sx={{ mt: "auto", mb: 1 }} />
                    <Box sx={{ flexShrink: 0, display: "flex", flexDirection: "column", gap: 1 }}>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          mb: 0.5,
                        }}
                      >
                        <Typography variant="body2" sx={{ mr: 1 }}>
                          Đánh giá của bạn:
                        </Typography>
                        <Rating value={feedbackRating} onChange={(_, value) => setFeedbackRating(value || 0)} />
                      </Box>

                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <input
                          type="text"
                          placeholder="Nhập nhận xét của bạn..."
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          style={{
                            flex: 1,
                            border: "1px solid #ccc",
                            borderRadius: 6,
                            padding: "8px 10px",
                            outline: "none",
                            backgroundColor: "#fff",
                            color: "#000",
                          }}
                        />
                        <Button
                          variant="contained"
                          size="small"
                          sx={{
                            backgroundColor: "#0c1844",
                            whiteSpace: "nowrap",
                            "&:hover": { backgroundColor: "#1f3bb6ff" },
                          }}
                          disabled={submittingFeedback}
                          onClick={handleSubmitFeedback}
                        >
                          {submittingFeedback ? "Đang gửi..." : "Gửi"}
                        </Button>
                      </Box>
                    </Box>
                  </>
                )}
              </InfoCard>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default TrainerDetail;
