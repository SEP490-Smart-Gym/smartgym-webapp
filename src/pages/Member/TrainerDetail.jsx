import React, { useEffect } from "react";
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
// import FolderOpenIcon from "@mui/icons-material/FolderOpen";

// 🧩 Mock data: Trainers
export const trainers = [
  {
    id: 101,
    avatar: "/img/team-1.jpg",
    name: "John Anna",
    age: 32,
    gender: "Female",
    experience: "8 years",
    specialization: ["Strength Training", "Weight Loss", "Bodybuilding"],
    about: `
      John Doe là huấn luyện viên thể hình chuyên nghiệp với hơn 8 năm kinh nghiệm trong ngành fitness.
      Anh từng huấn luyện cho hơn 500 học viên đạt được mục tiêu sức khỏe và hình thể.
      John luôn chú trọng vào việc kết hợp giữa chế độ ăn uống và tập luyện khoa học để mang lại hiệu quả bền vững.
    `,
    skills: [
      { name: "Strength Training", level: 95 },
      { name: "Nutrition Planning", level: 90 },
      { name: "Body Composition Analysis", level: 85 },
      { name: "Motivational Coaching", level: 88 },
    ],
    contact: {
      phone: "+84 912 345 678",
      email: "john.doe@example.com",
      facebook: "https://facebook.com/johndoe",
      instagram: "https://instagram.com/johnfitlife",
      address: "123 Đường Nguyễn Huệ, Quận 1, TP.HCM",
    },
    certificates: [
      { title: "ACE Certified Personal Trainer (CPT)", organization: "American Council on Exercise", year: 2018 },
      { title: "Nutrition & Wellness Consultant", organization: "Fitness Academy Vietnam", year: 2020 },
      { title: "Functional Movement Specialist", organization: "Functional Movement Systems", year: 2022 },
    ],
  },
  {
    id: 102,
    avatar: "/img/team-2.jpg",
    name: "Emily Smith",
    age: 29,
    gender: "Male",
    experience: "6 years",
    specialization: ["Yoga", "Pilates", "Flexibility"],
    about: `
      Emily là huấn luyện viên Yoga và Pilates với chứng chỉ quốc tế, nổi tiếng với phong cách hướng dẫn nhẹ nhàng
      và khả năng điều chỉnh tư thế chính xác. Cô giúp học viên cải thiện sự dẻo dai, giảm stress và nâng cao sức khỏe tinh thần.
    `,
    skills: [
      { name: "Yoga & Meditation", level: 95 },
      { name: "Pilates Core Training", level: 90 },
      { name: "Mindfulness Coaching", level: 85 },
    ],
    contact: {
      phone: "+84 987 654 321",
      email: "emily.smith@example.com",
      facebook: "https://facebook.com/emilysmith",
      instagram: "https://instagram.com/emilyyoga",
      address: "45 Pasteur, Quận 3, TP.HCM",
    },
    certificates: [
      { title: "RYT 500 Yoga Alliance Certification", organization: "Yoga Alliance USA", year: 2019 },
      { title: "Mat Pilates Instructor", organization: "Balanced Body University", year: 2021 },
    ],
  },
  {
    id: 103,
    avatar: "/img/team-3.jpg",
    name: "Michael Lee",
    age: 35,
    gender: "Male",
    experience: "10 years",
    specialization: ["Boxing", "Cardio", "Endurance"],
    about: `
      Michael là huấn luyện viên boxing chuyên nghiệp với hơn 10 năm kinh nghiệm.
      Anh nổi tiếng với các buổi tập cường độ cao giúp học viên cải thiện thể lực và phản xạ nhanh nhạy.
    `,
    skills: [
      { name: "Boxing Techniques", level: 95 },
      { name: "Endurance Training", level: 92 },
      { name: "Agility & Reflex Coaching", level: 88 },
    ],
    contact: {
      phone: "+84 998 123 456",
      email: "michael.lee@example.com",
      facebook: "https://facebook.com/michaelleeboxing",
      instagram: "https://instagram.com/michaelfit",
      address: "78 Hai Bà Trưng, Quận 1, TP.HCM",
    },
    certificates: [
      { title: "Professional Boxing Coach License", organization: "World Boxing Council", year: 2017 },
      { title: "Advanced Cardio Conditioning", organization: "Fitness Pro Academy", year: 2021 },
    ],
  },
  {
    id: 104,
    avatar: "/img/team-4.jpg",
    name: "Sophia Brown",
    age: 30,
    gender: "Male",
    experience: "7 years",
    specialization: ["Cardio", "Aerobic", "HIIT"],
    about: `
      Sophia là huấn luyện viên cardio đầy năng lượng, chuyên huấn luyện các bài tập HIIT giúp đốt mỡ nhanh và tăng sức bền.
      Cô luôn lan tỏa tinh thần tích cực và truyền động lực cho học viên.
    `,
    skills: [
      { name: "HIIT Workouts", level: 93 },
      { name: "Cardio Endurance", level: 90 },
      { name: "Motivational Training", level: 87 },
    ],
    contact: {
      phone: "+84 923 888 999",
      email: "sophia.brown@example.com",
      facebook: "https://facebook.com/sophiabrownfit",
      instagram: "https://instagram.com/sophiacardio",
      address: "99 Nguyễn Thị Minh Khai, Quận 3, TP.HCM",
    },
    certificates: [
      { title: "Certified Group Fitness Instructor", organization: "ACE", year: 2019 },
      { title: "HIIT Specialist Certification", organization: "Fitness Coach Institute", year: 2022 },
    ],
  },
];



// 💬 Mock data: Feedbacks
const feedbacks = [
  { id: 1, trainerId: 101, name: "Alice Johnson", rating: 5, comment: "John is amazing! He helped me reach my goals faster than I expected." },
  { id: 2, trainerId: 101, name: "Mark Taylor", rating: 4, comment: "Very professional and motivating. Highly recommended!" },
  { id: 3, trainerId: 101, name: "Sophia Nguyen", rating: 5, comment: "Every session feels personalized and effective. Great trainer!" },
  { id: 6, trainerId: 101, name: "Sophia Nguyen", rating: 5, comment: "Every session feels personalized and effective. Great trainer!" },
  { id: 4, trainerId: 102, name: "Linda Park", rating: 5, comment: "Emily’s yoga sessions are so calming. I feel more flexible and relaxed." },
  { id: 5, trainerId: 102, name: "David Tran", rating: 4, comment: "Good pace and clear instructions. Highly recommended for beginners." },
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

   useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const trainer = trainers.find((t) => t.id === Number(id));
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
                {trainer.age} years old
              </Typography>

              <Box sx={{ mt: 3, display: "flex", flexWrap: "wrap", gap: 1, justifyContent: "center" }}>
                <Chip label={`${trainer.experience} Experience`} color="primary" variant="outlined" />
                <Chip label={`${trainer.gender}`} color="primary" variant="outlined" />
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
                {/* Tiêu đề cố định */}
                <Typography
                  variant="h6"
                  gutterBottom
                  color="primary"
                  sx={{ flexShrink: 0, fontWeight: "bold" }}
                >
                  About Trainer
                </Typography>

                {/* Nội dung có thể cuộn */}
                <Box
                  sx={{
                    flex: 1,
                    overflowY: "auto",
                    pr: 1,
                    scrollbarWidth: "none", // Firefox
                    "&::-webkit-scrollbar": {
                      display: "none", // Ẩn mặc định
                    },
                    "&:hover::-webkit-scrollbar": {
                      display: "block", // Hiện khi hover (và nếu có overflow)
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
                    <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: "bold"}}>
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
                      {trainer.skills.map((s, idx) => (
                        <Typography
                          key={idx}
                          variant="body2"
                          sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                        >
                          • {s.name}
                        </Typography>
                      ))}
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
                    <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: "bold"}}>
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
                        Email: {trainer.contact.email}
                      </Typography>
                      <Typography variant="body2">
                        Phone: {trainer.contact.phone}
                      </Typography>
                      <Typography variant="body2" sx={{ wordBreak: "break-word" }}>
                        Address: {trainer.contact.address}
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
                <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: "bold"}}>
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
                  {trainer.certificates.map((c, i) => (
                    <Typography
                      key={i}
                      sx={{ whiteSpace: "normal", wordBreak: "break-word" }}
                    >
                      🏅 {c.title} ({c.year})
                    </Typography>
                  ))}
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
                  <Typography variant="h6" gutterBottom color="primary" sx={{ fontWeight: "bold"}}>
                    Feedback
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <Rating value={averageRating} precision={0.5} readOnly />
                    <Typography sx={{ ml: 1, fontWeight: "bold" }}>
                      {averageRating.toFixed(1)} / 5.0
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
                    scrollbarWidth: "none", // Ẩn scrollbar Firefox
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
                        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                          <Typography sx={{ fontWeight: "bold" }}>{fb.name}</Typography>
                          <Rating value={fb.rating} readOnly size="small" />
                        </Box>
                        <Typography sx={{ color: "text.secondary", whiteSpace: "normal", wordBreak: "break-word" }}>
                          {fb.comment}
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                      </Box>
                    ))
                  ) : (
                    <Typography color="text.secondary" sx={{ fontStyle: "italic" }}>
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
                      backgroundColor: "#fff", // ✅ nền trắng
                      color: "#000", 
                    }}
                  />
                  <Button variant="contained"
                    size="small"
                    sx={{
                      backgroundColor: "#0c1844",
                      "&:hover": {backgroundColor: "#1f3bb6ff"},
                    }}> Send
                  </Button >
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