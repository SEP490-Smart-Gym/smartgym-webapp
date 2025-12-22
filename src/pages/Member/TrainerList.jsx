import React, { useEffect, useState } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import api from "../../config/axios"; // 🔁 chỉnh path nếu cần

export default function TrainerList() {
  const [trainers, setTrainers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });

    const fetchTrainers = async () => {
      try {
        setLoading(true);
        const res = await api.get("/guest/trainers?onlyAvailable=false");
        const data = res.data || [];

        const mapped = data.map((t, index) => {
          const fullName =
            `${t.lastName || ""} ${t.firstName || ""}`.trim() || "Trainer";

          const gender = (t.gender || "").toLowerCase();
          const defaultAvatar =
            gender === "female" ? "/img/hinh-anh-avatar-trang-co-gai-30-10-48-10.jpg" : "/img/anh-dai-dien-an-danh_085759839.jpg";

          const apiAvatar =
            (t.avatar && t.avatar.trim() !== "" && t.avatar) ||
            (t.imageUrl && t.imageUrl.trim() !== "" && t.imageUrl) ||
            "";

          return {
            id: t.trainerId,
            name: fullName,
            avatar: apiAvatar || defaultAvatar,
            experience: t.profile?.specialization || "Personal Trainer",
            _fallbackAvatar: defaultAvatar, // dùng cho onError để vẫn đúng gender
          };
        });

        setTrainers(mapped);
      } catch (err) {
        console.error("Error fetching trainers:", err);
        setTrainers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTrainers();
  }, []);

  // ✅ chiều cao ảnh cố định (đồng đều mọi card)
  const IMAGE_HEIGHT = 280;

  return (
    <Container fluid className="my-5">
      {loading && (
        <Row className="justify-content-center mb-4">
          <Col xs="auto">
            <div className="text-center text-white">Loading trainers...</div>
          </Col>
        </Row>
      )}

      {!loading && trainers.length === 0 && (
        <Row className="justify-content-center mb-4">
          <Col xs="auto">
            <div className="text-center text-white">No trainers found.</div>
          </Col>
        </Row>
      )}

      <Row className="g-4 justify-content-center">
        {trainers.map((t, i) => (
          <Col key={t.id} md={6} lg={4} data-aos="fade-up" data-aos-delay={i * 200}>
            <div
              className="team-item text-center trainer"
              style={{
                color: "#000",
                transition: "all 0.3s ease",
                backgroundColor: "#0c1844",
                borderRadius: 12,
                overflow: "hidden",
                height: "100%", // để các card stretch đều
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#112466ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#0c1844";
              }}
            >
              <Link to={`/trainer/${t.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                {/* ✅ Khung ảnh cố định cả ngang + cao */}
                <div
                  className="team-img"
                  style={{
                    width: "100%",
                    aspectRatio: "4 / 5",   // ✅ khóa tỉ lệ (ngang = nhau)
                    backgroundColor: "#0b1636",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  <img
                    src={t.avatar}
                    alt={t.name}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain", // 🔁 đổi thành "cover" nếu muốn full khung
                      objectPosition: "center",
                      transition: "transform 0.3s ease",
                      padding: 10, // giữ khoảng thở cho ảnh nhỏ
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.03)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                    onError={(e) => {
                      e.currentTarget.src = t._fallbackAvatar || "/img/Trainer_Nam.jpg";
                    }}
                  />
                </div>

                {/* ✅ Content luôn đều chiều cao (tên không làm lệch card) */}
                <div
                  className="team-content py-3"
                  style={{
                    minHeight: 90,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    paddingInline: 12,
                  }}
                >
                  <h4
                    className="fw-bold mb-1"
                    style={{
                      color: "#fff",
                      fontSize: 18,
                      lineHeight: "22px",
                      minHeight: 44, // ✅ giữ chỗ cho 2 dòng tên
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    title={t.name}
                  >
                    {t.name}
                  </h4>
                  <p
                    className="mb-0"
                    style={{
                      color: "#f89b9bff",
                      fontSize: 13,
                      lineHeight: "18px",
                      minHeight: 18,
                      display: "-webkit-box",
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                    title={t.experience}
                  >
                    {t.experience}
                  </p>
                </div>
              </Link>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
