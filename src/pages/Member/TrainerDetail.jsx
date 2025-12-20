import React, { useEffect, useState, useCallback, useMemo } from "react";
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
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
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
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) years--;
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

// ✅ Rule mới: cho update feedback với mọi status TRỪ Responded
function canMemberEditStatus(status) {
  return String(status || "").toLowerCase() !== "responded";
}

const TrainerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔐 thông tin user
  const [user, setUser] = useState(null);

  // ✅ lưu TẤT CẢ packageId của member với trainer này (để đổi tên "Tôi" đúng cho mọi feedback)
  const [myPackageIds, setMyPackageIds] = useState(new Set());
  const [loadingPackage, setLoadingPackage] = useState(false);

  // 🔁 list feedbacks
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingFeedbacks, setLoadingFeedbacks] = useState(false);

  // 🗣️ trainer reply state
  const [replyingFeedbackId, setReplyingFeedbackId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  // ✏️ Member edit feedback
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [savingEditId, setSavingEditId] = useState(null);

  // scroll to top khi vào trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // Lấy user từ localStorage
  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const isMember = !!user && user.roleName === "Member";

  // 🔥 Lấy data trainer từ API /guest/trainers/:id
  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/guest/trainers/${id}`);
        const data = res.data;

        const fullName =
          `${data.lastName || ""} ${data.firstName || ""}`.trim() ||
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

        const age = calculateAge(data.profile?.dateOfBirth);

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
          avatar: data.imageUrl ?? "/img/team-1.jpg",
          name: fullName,
          age,
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

  // 🔗 Lấy tất cả packageId của member với trainer này: GET /MemberPackage/my-packages
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

        const ids = new Set(
          forThisTrainer.map((p) => Number(p.id)).filter(Boolean)
        );
        setMyPackageIds(ids);
      } catch (err) {
        console.error("Error fetching my-packages:", err);
        setMyPackageIds(new Set());
      } finally {
        setLoadingPackage(false);
      }
    };

    if (id && isMember) fetchMyPackages();
    if (!isMember) setMyPackageIds(new Set());
  }, [id, isMember]);

  // ✅ fetch feedbacks
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
        memberPackageId: f.memberPackageId,
        trainerId: f.trainerId,
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
  const averageRating = useMemo(() => {
    if (trainer?.rating != null && !Number.isNaN(trainer.rating)) {
      return Number(trainer.rating);
    }
    if (feedbacks.length) {
      const sum = feedbacks.reduce((acc, f) => acc + (Number(f.rating) || 0), 0);
      return sum / feedbacks.length;
    }
    return 0;
  }, [trainer?.rating, feedbacks]);

  const totalReviews =
    trainer?.totalReviews != null && trainer.totalReviews > 0
      ? trainer.totalReviews
      : feedbacks.length;

  // trainer có đủ điều kiện để reply? (Trainer + đúng profile của mình)
  const isTrainerRole = !!user && user.roleName === "Trainer";
  const myTrainerId =
    Number(user?.trainerId || user?.id || user?.userId || 0) || null;
  const isViewingOwnTrainerProfile =
    isTrainerRole && !!trainer?.id && myTrainerId === Number(trainer.id);

  // 🗣️ Trainer reply feedback
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

      const endpoint = `/trainer/feedback/${fb.id}/reply`;
      const payload = { responseText: text };

      if (fb.responseText && String(fb.responseText).trim()) {
        await api.put(endpoint, payload);
        message.success({
          content: "Cập nhật phản hồi thành công!",
          key,
          duration: 2,
        });
      } else {
        await api.post(endpoint, payload);
        message.success({
          content: "Gửi phản hồi thành công!",
          key,
          duration: 2,
        });
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

  // ✏️ Member edit feedback: chỉ khi feedback thuộc packageIds của mình AND status != Responded
  const handleStartEditMyFeedback = (fb) => {
    if (!isMember) return;

    const isMyFb = myPackageIds.has(Number(fb.memberPackageId));
    if (!isMyFb) return;

    if (!canMemberEditStatus(fb.status)) {
      message.warning("Đánh giá này đã được phản hồi nên không thể chỉnh sửa.");
      return;
    }

    setEditingFeedbackId(fb.id);
    setEditRating(Number(fb.rating) || 5);
    setEditComment(fb.comments || "");
  };

  const handleCancelEditMyFeedback = () => {
    setEditingFeedbackId(null);
    setEditRating(5);
    setEditComment("");
  };

  const handleSaveEditMyFeedback = async (fb) => {
    if (!isMember) return;

    const isMyFb = myPackageIds.has(Number(fb.memberPackageId));
    if (!isMyFb) return;

    if (!canMemberEditStatus(fb.status)) {
      message.warning("Đánh giá này đã được phản hồi nên không thể chỉnh sửa.");
      return;
    }

    const text = (editComment || "").trim();
    if (!text) {
      message.warning("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    const key = "edit-feedback";
    message.loading({ content: "Đang lưu chỉnh sửa...", key, duration: 0 });

    try {
      setSavingEditId(fb.id);
      await api.put(`/member/feedback/trainer/${fb.id}`, {
        rating: Number(editRating) || 0,
        comments: text,
      });

      message.success({
        content: "Cập nhật đánh giá thành công!",
        key,
        duration: 2,
      });

      handleCancelEditMyFeedback();
      await fetchFeedbacks();
    } catch (err) {
      console.error("Edit trainer feedback error:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Cập nhật thất bại.";
      message.error({ content: msg, key, duration: 3 });
    } finally {
      setSavingEditId(null);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h6">
          Đang tải thông tin huấn luyện viên...
        </Typography>
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
                {trainer.age != null
                  ? `${trainer.age} tuổi`
                  : "Tuổi: đang cập nhật"}
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
                <Chip
                  label={trainer.gender || "Giới tính: đang cập nhật"}
                  color="primary"
                  variant="outlined"
                />
                {trainer.isAvailable && (
                  <Chip
                    label="Đang nhận hội viên mới"
                    color="success"
                    variant="filled"
                  />
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
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ flexShrink: 0, fontWeight: "bold" }}
                >
                  Giới thiệu huấn luyện viên
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { display: "none" },
                    "&:hover::-webkit-scrollbar": {
                      display: "block",
                      width: 6,
                    },
                    "&::-webkit-scrollbar-thumb": {
                      backgroundColor: "rgba(0,0,0,0.15)",
                      borderRadius: 3,
                    },
                  }}
                >
                  <Typography
                    sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                  >
                    {trainer.about}
                  </Typography>
                </Box>
              </InfoCard>
            </Grid>

            {/* Kỹ năng & Liên hệ */}
            <Grid item xs={12} sx={{ width: "100%" }}>
              <Grid
                container
                spacing={2}
                sx={{ display: "flex", flexWrap: "nowrap", width: "100%" }}
              >
                <Grid item xs={12} md={6} sx={{ flex: 1, display: "flex" }}>
                  <InfoCard
                    sx={{
                      flex: 1,
                      height: 170,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    >
                      Kỹ năng
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        pr: 1,
                        "&::-webkit-scrollbar": { width: 6 },
                        "&::-webkit-scrollbar-thumb": {
                          background: "transparent",
                        },
                        "&:hover::-webkit-scrollbar-thumb": {
                          background: "rgba(0,0,0,0.15)",
                          borderRadius: 3,
                        },
                      }}
                    >
                      {trainer.skills && trainer.skills.length > 0 ? (
                        trainer.skills.map((s, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            sx={{
                              whiteSpace: "normal",
                              wordBreak: "break-word",
                            }}
                          >
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
                  <InfoCard
                    sx={{
                      flex: 1,
                      height: 170,
                      display: "flex",
                      flexDirection: "column",
                      overflow: "hidden",
                    }}
                  >
                    <Typography
                      variant="h6"
                      gutterBottom
                      color="primary"
                      sx={{ fontWeight: "bold" }}
                    >
                      Thông tin liên hệ
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        overflowY: "auto",
                        pr: 1,
                        "&::-webkit-scrollbar": { width: 6 },
                        "&::-webkit-scrollbar-thumb": {
                          background: "transparent",
                        },
                        "&:hover::-webkit-scrollbar-thumb": {
                          background: "rgba(0,0,0,0.15)",
                          borderRadius: 3,
                        },
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
              <InfoCard
                sx={{
                  height: 160,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ fontWeight: "bold" }}
                >
                  Chứng chỉ
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    "&::-webkit-scrollbar": { width: 6 },
                    "&::-webkit-scrollbar-thumb": { background: "transparent" },
                    "&:hover::-webkit-scrollbar-thumb": {
                      background: "rgba(0,0,0,0.15)",
                      borderRadius: 3,
                    },
                  }}
                >
                  {trainer.certificates && trainer.certificates.length > 0 ? (
                    trainer.certificates.map((c, i) => (
                      <Typography
                        key={i}
                        sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                      >
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
              <InfoCard
                sx={{
                  height: 420,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
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

                      const isMyFb = isMember && myPackageIds.has(Number(fb.memberPackageId));
                      const displayName = isMyFb ? "Tôi" : fb.memberName || "Hội viên";

                      // ✅ đổi rule: chỉ cấm khi Responded
                      const canEditMyFb =
                        isMyFb && canMemberEditStatus(fb.status) && !loadingPackage;

                      const isEditingMyFeedback = editingFeedbackId === fb.id;

                      return (
                        <Box key={fb.id} sx={{ mb: 2, pb: 2, borderBottom: "1px dashed #e0e0e0" }}>
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
                              {displayName}
                            </Typography>

                            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
                              {isEditingMyFeedback ? (
                                <Rating value={editRating} onChange={(_, v) => setEditRating(v || 0)} size="small" />
                              ) : (
                                <Rating value={Number(fb.rating) || 0} size="small" readOnly />
                              )}

                              <Typography variant="caption" color="text.secondary">
                                {formatDate(fb.feedbackDate)}
                              </Typography>
                            </Box>
                          </Box>

                          {isEditingMyFeedback ? (
                            <Box sx={{ mt: 0.5 }}>
                              <textarea
                                value={editComment}
                                onChange={(e) => setEditComment(e.target.value)}
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
                                placeholder="Nhập nội dung đánh giá..."
                              />

                              <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 1 }}>
                                <Button
                                  variant="outlined"
                                  size="small"
                                  onClick={handleCancelEditMyFeedback}
                                  sx={{ textTransform: "none" }}
                                  disabled={savingEditId === fb.id}
                                >
                                  Hủy
                                </Button>
                                <Button
                                  variant="contained"
                                  size="small"
                                  onClick={() => handleSaveEditMyFeedback(fb)}
                                  sx={{
                                    backgroundColor: "#0c1844",
                                    textTransform: "none",
                                    "&:hover": { backgroundColor: "#1f3bb6ff" },
                                  }}
                                  disabled={savingEditId === fb.id}
                                >
                                  {savingEditId === fb.id ? "Đang lưu..." : "Lưu"}
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                              {fb.comments}
                            </Typography>
                          )}

                          {canEditMyFb && !isEditingMyFeedback && (
                            <Box sx={{ mt: 0.5 }}>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => handleStartEditMyFeedback(fb)}
                                sx={{ textTransform: "none", paddingLeft: 0 }}
                              >
                                Chỉnh sửa đánh giá
                              </Button>
                            </Box>
                          )}

                          {/* Response section */}
                          {fb.responseText && !isEditingThisReply && (
                            <Box sx={{ mt: 1, ml: 1, pl: 1, borderLeft: "3px solid #e0e7ff" }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                  Phản hồi từ huấn luyện viên{fb.responderName ? ` (${fb.responderName})` : ""}:
                                </Typography>

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

                          {/* Trainer: Reply / Edit UI */}
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

                {/* ✅ ĐÃ XÓA phần viết đánh giá */}
              </InfoCard>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default TrainerDetail;
