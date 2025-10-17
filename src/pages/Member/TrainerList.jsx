import React, { useEffect } from "react";
import { Container, Row, Col } from "react-bootstrap";
import { trainers } from "./TrainerDetail";
import { Link } from "react-router-dom";

export default function TrainerList() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <Container fluid className="my-5">
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
                  <h4 className="fw-bold mb-1" style={{ color: "#fff" }}>{t.name}</h4>
                  <p className="mb-0" style={{ color: "#f89b9bff" }}>{t.experience} Experience</p>
                </div>
              </Link>
            </div>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
