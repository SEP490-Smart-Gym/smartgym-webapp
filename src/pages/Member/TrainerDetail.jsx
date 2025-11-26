import React, { useEffect, useState } from "react";
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

// 💬 Mock data: Feedbacks (tạm thời vẫn dùng local)
const feedbacks = [
  { id: 1, trainerId: 12, name: "Alice Johnson", rating: 5, comment: "Trainer is amazing! He helped me reach my goals faster than I expected." },
  { id: 2, trainerId: 12, name: "Mark Taylor", rating: 4, comment: "Very professional and motivating. Highly recommended!" },
  { id: 3, trainerId: 12, name: "Sophia Nguyen", rating: 5, comment: "Every session feels personalized and effective. Great trainer!" },
];

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

const TrainerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useMediaQuery("(max-width:600px)");

  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);

  // scroll to top khi vào trang
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  // 🔥 Lấy data từ API /member/trainers/:id
  useEffect(() => {
    const fetchTrainer = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/guest/trainers/${id}`);
        const data = res.data;

        // data sample:
        // {
        //   "trainerId": 12,
        //   "firstName": "quang",
        //   "lastName": "nguyen",
        //   "phoneNumber": "081231203",
        //   "email": "trainer23@example.com",
        //   "profile": {
        //     "userId": 12,
        //     "specialization": "string",
        //     "trainerBio": "string",
        //     "salary": 100000,
        //     "isAvailableForNewClients": true,
        //     "trainerRating": null,
        //     "totalReviews": 0,
        //     "certificates": [
        //       {
        //         "certificateName": "string",
        //         "certificateDetail": "string"
        //       }
        //     ]
        //   }
        // }

        const fullName = `${data.firstName || ""} ${data.lastName || ""}`.trim() || "Trainer";

        // gender: API trả "female" / "male" (nếu có)
        let genderText = "";
        if (data.gender) {
          const g = String(data.gender).toLowerCase();
          if (g === "male") genderText = "Male";
          else if (g === "female") genderText = "Female";
          else genderText = data.gender;
        }

        // specialization: string -> array
        const specializationArray = data.profile?.specialization
          ? data.profile.specialization
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [];

        const mappedTrainer = {
          id: data.trainerId,
          avatar: "/img/team-1.jpg", // 👉 TODO: sau này backend trả avatar thì map lại
          name: fullName,
          age: null, // API hiện chưa có
          gender: genderText || "Updating",
          experience: "", // API hiện chưa có trường experience
          specialization: specializationArray,
          about: data.profile?.trainerBio || "Thông tin giới thiệu đang được cập nhật.",
          skills: specializationArray.map((name) => ({ name })), // dùng specialization làm skills
          contact: {
            phone: data.phoneNumber || "",
            email: data.email || "",
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

    if (id) {
      fetchTrainer();
    }
  }, [id]);

  const trainerFeedbacks = feedbacks.filter((fb) => fb.trainerId === Number(id));

  const fallbackRatingFromFeedbacks =
    trainerFeedbacks.length > 0
      ? trainerFeedbacks.reduce((acc, fb) => acc + fb.rating, 0) / trainerFeedbacks.length
      : 0;

  const averageRating =
    trainer?.rating != null && !Number.isNaN(trainer.rating)
      ? Number(trainer.rating)
      : fallbackRatingFromFeedbacks;

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h6">Loading trainer...</Typography>
      </Container>
    );
  }

  if (!trainer) {
    return (
      <Container maxWidth="md" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="h5" color="error">
          Trainer not found.
        </Typography>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mt: 3 }}
        >
          Back
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
        {/* Left Column */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 30%" }, minWidth: 300 }}>
          <ProfileContainer>
            <Box sx={{ textAlign: "center" }}>
              <ProfileAvatar src={trainer.avatar} alt={trainer.name} />
              <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold" }}>
                {trainer.name}
              </Typography>

              <Typography variant="subtitle1" color="text.secondary">
                {trainer.age ? `${trainer.age} years old` : "Age: updating"}
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
                    trainer.experience
                      ? `${trainer.experience} Experience`
                      : "Experience: updating"
                  }
                  color="primary"
                  variant="outlined"
                />
                <Chip
                  label={trainer.gender || "Gender: updating"}
                  color="primary"
                  variant="outlined"
                />
                {trainer.isAvailable && (
                  <Chip
                    label="Available for new clients"
                    color="success"
                    variant="filled"
                  />
                )}
              </Box>
            </Box>
          </ProfileContainer>
        </Box>

        {/* Right Column */}
        <Box sx={{ flex: { xs: "1 1 100%", md: "1 1 65%" }, width: "100%" }}>
          <Grid container spacing={2} sx={{ width: "100%", margin: 0 }}>
            {/* ===== Hàng 1: About Trainer ===== */}
            <Grid item xs={12}>
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
                  About Trainer
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": {
                      display: "none",
                    },
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
                    sx={{
                      whiteSpace: "normal",
                      wordBreak: "break-word",
                    }}
                  >
                    {trainer.about}
                  </Typography>
                </Box>
              </InfoCard>
            </Grid>

            {/* ===== Hàng 2: Skills & Contact ===== */}
            <Grid item xs={12}>
              <Grid
                container
                spacing={2}
                sx={{
                  display: "flex",
                  flexWrap: "nowrap",
                  width: "100%",
                }}
              >
                {/* Skills */}
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
                      Skills
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
                      {trainer.skills && trainer.skills.length > 0 ? (
                        trainer.skills.map((s, idx) => (
                          <Typography
                            key={idx}
                            variant="body2"
                            sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                          >
                            • {s.name}
                          </Typography>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          Skills are updating...
                        </Typography>
                      )}
                    </Box>
                  </InfoCard>
                </Grid>

                {/* Contact */}
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
                      Contact
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
                      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                        Email: {trainer.contact.email || "Updating..."}
                      </Typography>
                      <Typography variant="body2">
                        Phone: {trainer.contact.phone || "Updating..."}
                      </Typography>
                    </Box>
                  </InfoCard>
                </Grid>
              </Grid>
            </Grid>

            {/* ===== Hàng 3: Certified ===== */}
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
                  Certified
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
                      Certificates are updating...
                    </Typography>
                  )}
                </Box>
              </InfoCard>
            </Grid>

            {/* ===== Hàng 4: Feedback ===== */}
            <Grid item xs={12} sx={{ width: "100%" }}>
              <InfoCard
                sx={{
                  height: 400,
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  overflow: "hidden",
                }}
              >
                {/* Phần cố định: Tiêu đề + Rating */}
                <Box sx={{ flexShrink: 0 }}>
                  <Typography
                    variant="h6"
                    gutterBottom
                    color="primary"
                    sx={{ fontWeight: "bold" }}
                  >
                    Feedback
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Rating
                      value={averageRating || 0}
                      precision={0.5}
                      readOnly
                    />
                    <Typography sx={{ ml: 1, fontWeight: "bold" }}>
                      {averageRating.toFixed(1)} / 5.0
                    </Typography>
                    <Typography sx={{ ml: 2, color: "text.secondary", fontSize: 14 }}>
                      ({trainer.totalReviews || trainerFeedbacks.length} reviews)
                    </Typography>
                  </Box>
                  <Divider sx={{ mb: 1 }} />
                </Box>

                {/* Phần có thể cuộn: Feedback list */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    scrollbarWidth: "none",
                    "&::-webkit-scrollbar": { width: 6 },
                    "&::-webkit-scrollbar-thumb": {
                      background: "transparent",
                      borderRadius: 3,
                    },
                    "&:hover::-webkit-scrollbar-thumb": {
                      background: "rgba(0,0,0,0.15)",
                    },
                  }}
                >
                  {trainerFeedbacks.length > 0 ? (
                    trainerFeedbacks.map((fb) => (
                      <Box key={fb.id} sx={{ mb: 2 }}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography sx={{ fontWeight: "bold" }}>
                            {fb.name}
                          </Typography>
                          <Rating
                            value={fb.rating}
                            readOnly
                            size="small"
                          />
                        </Box>
                        <Typography
                          sx={{
                            color: "text.secondary",
                            whiteSpace: "normal",
                            wordBreak: "break-word",
                          }}
                        >
                          {fb.comment}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                      </Box>
                    ))
                  ) : (
                    <Typography
                      color="text.secondary"
                      sx={{ fontStyle: "italic" }}
                    >
                      No feedbacks yet.
                    </Typography>
                  )}
                </Box>

                {/* Phần nhập feedback */}
                <Divider sx={{ mt: "auto", mb: 1 }} />
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    flexShrink: 0,
                  }}
                >
                  <input
                    type="text"
                    placeholder="Write your feedback..."
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
                      "&:hover": { backgroundColor: "#1f3bb6ff" },
                    }}
                  >
                    Send
                  </Button>
                </Box>
              </InfoCard>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default TrainerDetail;
