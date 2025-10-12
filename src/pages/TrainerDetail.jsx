import React from "react";
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
import FolderOpenIcon from "@mui/icons-material/FolderOpen";

// ✅ Mock data: Trainers
const trainers = [
  { id: 101, name: "John Doe", profession: "Strength Coach", img: "/img/team-1.jpg" },
  { id: 102, name: "Emily Smith", profession: "Yoga Instructor", img: "/img/team-2.jpg" },
  { id: 103, name: "Michael Lee", profession: "Boxing Trainer", img: "/img/team-3.jpg" },
  { id: 104, name: "Sophia Brown", profession: "Cardio Specialist", img: "/img/team-4.jpg" },
];

// ✅ Mock data: Feedbacks
const feedbacks = [
  {
    id: 1,
    trainerId: 101,
    name: "Alice Johnson",
    rating: 5,
    comment: "John is amazing! He helped me reach my goals faster than I expected.",
  },
  {
    id: 2,
    trainerId: 101,
    name: "Mark Taylor",
    rating: 4,
    comment: "Very professional and motivating. Highly recommended!",
  },
  {
    id: 3,
    trainerId: 101,
    name: "Sophia Nguyen",
    rating: 5,
    comment: "Every session feels personalized and effective. Great trainer!",
  },
  {
    id: 4,
    trainerId: 101,
    name: "Sophia Nguyen",
    rating: 5,
    comment: "Every session feels personalized and effective. Great trainer!",
  },
  {
    id: 5,
    trainerId: 101,
    name: "Sophia Nguyen",
    rating: 5,
    comment: "Every session feels personalized and effective. Great trainer!",
  },
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

  // 🔍 Tìm trainer theo id
  const trainer = trainers.find((t) => t.id === Number(id));

  // 🧮 Lấy feedbacks của trainer
  const trainerFeedbacks = feedbacks.filter((fb) => fb.trainerId === trainer?.id);
  const averageRating =
    trainerFeedbacks.length > 0
      ? trainerFeedbacks.reduce((acc, fb) => acc + fb.rating, 0) / trainerFeedbacks.length
      : 0;

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
      {/* Main layout */}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 3, }}>
        {/* Left Column */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", md: "1 1 30%" },
            minWidth: 300,
          }}
        >
          <ProfileContainer sx={{ height: "100%", borderRadius: 3, boxShadow: 3 }}>
            <Box sx={{ textAlign: "center" }}>
              <ProfileAvatar src={trainer.img} alt={trainer.name} />
              <Typography variant="h5" sx={{ mt: 2, fontWeight: "bold" }}>
                {trainer.name}
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                {trainer.profession}
              </Typography>

              <ActionButton
                startIcon={<FolderOpenIcon />}
                variant="contained"
                color="primary"
                fullWidth
                sx={{ mt: 2 }}
              >
                View Profile
              </ActionButton>

              <Box
                sx={{
                  mt: 3,
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  justifyContent: "center",
                }}
              >
                <Chip label="5 Years Experience" color="primary" variant="outlined" />
                <Chip label="Certified Coach" color="primary" variant="outlined" />
              </Box>
            </Box>
          </ProfileContainer>
        </Box>

        {/* Right Column */}
        <Box
          sx={{
            flex: { xs: "1 1 100%", md: "1 1 65%" },
            width: "100%",
          }}
        >
          <Grid
            container
            spacing={2}
            sx={{
              mt: 2,
              width: "100%",
            }}
          >

            <Grid item xs={12}>
              <InfoCard sx={{ height: "100%", borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  About Trainer
                </Typography>
                <Typography>
                  {trainer.name} is a professional {trainer.profession.toLowerCase()} with years of experience helping clients achieve their fitness goals. Passionate, dedicated, and focused on personalized programs for each trainee.
                </Typography>
              </InfoCard>
            </Grid>

            <Grid
            container
            spacing={3}
            sx={{
              flex: "1 0 auto",
              height: "40vh", // chiều cao cố định theo tỷ lệ màn hình
              display: "flex",
              alignItems: "stretch", // để 3 ô cao bằng nhau
            }}
          >
            <Grid item xs={12} md={4}>
              <InfoCard sx={{ height: "100%", borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Skills
                </Typography>
                <Typography>🏋️ Strength Training</Typography>
                <Typography>💪 Body Transformation</Typography>
                <Typography>🥗 Nutrition Guidance</Typography>
              </InfoCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <InfoCard sx={{ height: "100%", borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Contact
                </Typography>
                <Typography>Email: trainer@fitness.com</Typography>
                <Typography>Phone: +1 (555) 987-6543</Typography>
              </InfoCard>
            </Grid>

            <Grid item xs={12} md={4}>
              <InfoCard sx={{ height: "100%", borderRadius: 3, boxShadow: 3 }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Certified
                </Typography>                
                <Typography>🏅 Certified Personal Trainer</Typography>
                <Typography>Phone: +1 (555) 987-6543</Typography>
              </InfoCard>
            </Grid>
          </Grid>
            {/* Feedback Section */}
            <Grid item xs={12} sx={{ width: "100%" }}>
              <InfoCard sx={{ height: "400px", borderRadius: 3, boxShadow: 3, display: "flex", flexDirection: "column" }}>
                <Typography variant="h6" gutterBottom color="primary">
                  Feedback
                </Typography>

                {/* Average Rating */}
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Rating value={averageRating} precision={0.5} readOnly />
                  <Typography sx={{ ml: 1, fontWeight: "bold" }}>
                    {averageRating.toFixed(1)} / 5.0
                  </Typography>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Feedback List */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    "&::-webkit-scrollbar": {
                      width: "6px",
                    },
                    "&::-webkit-scrollbar-track": {
                      background: "transparent",
                    },
                    "&::-webkit-scrollbar-thumb": {
                      background: "transparent",
                    },
                    "&:hover::-webkit-scrollbar-thumb": {
                      background: "rgba(0,0,0,0.1)", // chỉ hơi hiện khi hover
                      borderRadius: "3px",
                    },
                  }}
                >
                  {trainerFeedbacks.map((fb) => (
                    <Box key={fb.id} sx={{ mb: 2 }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <Typography sx={{ fontWeight: "bold" }}>{fb.name}</Typography>
                        <Rating value={fb.rating} readOnly size="small" />
                      </Box>
                      <Typography sx={{ color: "text.secondary" }}>{fb.comment}</Typography>
                      <Divider sx={{ my: 1 }} />
                    </Box>
                  ))}

                  {/* Nếu không có feedback */}
                  {trainerFeedbacks.length === 0 && (
                    <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
                      No feedbacks yet.
                    </Typography>
                  )}
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