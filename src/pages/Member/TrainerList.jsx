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
        // 👉 Gọi API: /api/member/trainers
        const res = await api.get("/guest/trainers?onlyAvailable=false");
        const data = res.data || [];

        // data mỗi phần tử kiểu:
        // {
        //   trainerId,
        //   firstName,
        //   lastName,
        //   phoneNumber,
        //   email,
        //   profile: {
        //     specialization,
        //     trainerBio,
        //     ...
        //   }
        // }

        const mapped = data.map((t, index) => {
          const fullName = `${t.firstName || ""} ${t.lastName || ""}`.trim() || "Trainer";
          // xoay vòng avatar cho đẹp, sau này BE trả avatar thì sửa lại
          const avatarIndex = (index % 4) + 1;

          return {
            id: t.trainerId,
            name: fullName,
            avatar: `/img/team-${avatarIndex}.jpg`,
            // dùng specialization làm "experience" để hiện chữ cho đẹp
            experience: t.profile?.specialization || "Personal Trainer",
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
          <Col
            key={t.id}
            md={6}
            lg={4}
            data-aos="fade-up"
            data-aos-delay={i * 200}
          >
            <div
              className="team-item text-center trainer"
              style={{
                color: "#000",
                transition: "all 0.3s ease",
                backgroundColor: "#0c1844",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#000";
                e.currentTarget.style.backgroundColor = "#112466ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#000";
                e.currentTarget.style.backgroundColor = "#0c1844";
              }}
            >
              {/* Link to TrainerDetail */}
              <Link
                to={`/trainer/${t.id}`}
                style={{ textDecoration: "none", color: "inherit" }}
              >
                <div className="team-img">
                  <img
                    src={t.avatar}
                    className="img-fluid w-100"
                    alt={t.name}
                    style={{
                      borderRadius: "8px",
                      transition: "transform 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.transform = "scale(1.05)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.transform = "scale(1)")
                    }
                  />
                </div>
                <div className="team-content py-3">
                  <h4
                    className="fw-bold mb-1"
                    style={{ color: "#fff" }}
                  >
                    {t.name}
                  </h4>
                  <p
                    className="mb-0"
                    style={{ color: "#f89b9bff" }}
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
