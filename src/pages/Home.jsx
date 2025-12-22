// src/pages/Home.jsx
import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import AOS from "aos";
import "aos/dist/aos.css";
import GymFeedbackSection from "../pages/Member/Feedback.jsx";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import { message } from "antd";

import { AiOutlineCheck, AiOutlineClose } from "react-icons/ai";

import Header from "../components/Header.jsx";
import api from "../config/axios";

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [packages, setPackages] = useState([]);
  const [trainers, setTrainers] = useState([]);

  useEffect(() => {
    AOS.init({ once: true, duration: 600 });
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  // Lấy packages
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const res = await api.get("/Package/active");
        const apiPackages = res.data || [];
        if (Array.isArray(apiPackages)) setPackages(apiPackages);
        else setPackages([]);
      } catch (err) {
        console.error("Fetch packages error:", err);
        setPackages([]);
        if (err.response?.status === 401) {
          message.error("Bạn cần đăng nhập để xem danh sách gói tập.");
        } else {
          message.error("Không thể tải danh sách gói tập!");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchPackages();
  }, []);

  // ✅ Lấy trainers từ API
  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get("/guest/trainers?onlyAvailable=false", {
          params: { onlyAvailable: true },
        });

        const list = res.data || [];

        const normalized = list.map((t) => {
          const gender = (t.gender || "").toLowerCase();

          const defaultAvatar =
            gender === "female"
              ? "/img/hinh-anh-avatar-trang-co-gai-30-10-48-10.jpg"
              : "/img/anh-dai-dien-an-danh_085759839.jpg";

          return {
            id: t.trainerId,
            name: `${t.lastName ?? ""} ${t.firstName ?? ""}`.trim(),
            profession: t.specialization || "Huấn luyện viên cá nhân 1:1",
            rating: t.trainerRating ?? 0,
            reviews: t.totalReviews ?? 0,
            isAvailable: t.isAvailableForNewClients ?? true,

            // ✅ ưu tiên avatar từ API, nếu không có thì theo gender
            img: t.imageUrl && t.imageUrl.trim() !== ""
              ? t.imageUrl
              : defaultAvatar,
          };
        });

        setTrainers(normalized);
      } catch (err) {
        console.error("Fetch trainers error:", err);
        setTrainers([]);
      }
    };

    fetchTrainers();
  }, []);

  const featureSlides = [
    {
      img: "/img/feature-1.jpg",
      title: "Không gian tập luyện hiện đại, tập trung",
      desc: "Thiết kế theo phong cách private – hạn chế ồn ào, phù hợp cho người muốn tập nghiêm túc, có hoặc không có PT.",
    },
    {
      img: "/img/feature-2.jpg",
      title: "PT 1:1 cá nhân hoá lộ trình",
      desc: "Huấn luyện viên theo sát từng buổi tập, chỉnh form, theo dõi tiến độ và tối ưu chương trình theo mục tiêu của bạn.",
    },
    {
      img: "/img/feature-3.jpg",
      title: "Tự tập linh hoạt, không bị làm phiền",
      desc: "Tự do lựa chọn khung giờ, thiết bị đa dạng, đội ngũ hỗ trợ kỹ thuật luôn sẵn sàng khi bạn cần.",
    },
    {
      img: "/img/feature-4.jpg",
      title: "Quản lý kết quả tập luyện rõ ràng",
      desc: "Theo dõi quá trình thay đổi hình thể, mức tạ, số buổi tập và hiệu quả thực tế theo từng giai đoạn.",
    },
  ];

  const blogSlides = [
    {
      img: "/img/feature-4.jpg",
      title: "Tập với PT 1:1 – phù hợp với ai?",
      desc: "Lợi ích của huấn luyện viên cá nhân cho người mới bắt đầu, người bận rộn và người muốn thay đổi hình thể rõ rệt.",
    },
    {
      img: "/img/feature-3.jpg",
      title: "Tự tập vẫn hiệu quả nếu biết cách",
      desc: "3 nguyên tắc vàng để tự tập an toàn, tránh chấn thương và vẫn đạt kết quả tốt trong thời gian ngắn.",
    },
    {
      img: "/img/feature-2.jpg",
      title: "Lịch tập mẫu cho người mới 4 buổi/tuần",
      desc: "Gợi ý lịch tập khoa học, phù hợp người mới đi làm – bận rộn nhưng vẫn muốn cải thiện sức khoẻ & vóc dáng.",
    },
    {
      img: "/img/feature-1.jpg",
      title: "Dinh dưỡng cơ bản cho người tập gym",
      desc: "Không cần ăn kiêng cực đoan – chỉ cần hiểu đúng về đạm, tinh bột và chất béo là đã khác biệt rất nhiều.",
    },
  ];

  const testimonials = [
    { img: "/img/testimonial-1.jpg" },
    { img: "/img/testimonial-2.jpg" },
    { img: "/img/testimonial-3.jpg" },
  ];

  const formatPrice = (n) =>
    Number(n || 0).toLocaleString("vi-VN", { maximumFractionDigits: 0 });

  /** ================== UI CONSTANTS (INLINE ONLY) ================== */
  const UI = useMemo(
    () => ({
      // chiều cao ảnh đồng nhất
      featureImgH: 220,
      blogImgH: 210,
      trainerImgH: 280,
      packageTitleMinH: 76,
      blogTitleMinH: 64,

      // style wrapper ảnh: nếu ảnh ngắn -> căn giữa + để dư khoảng trống
      imgWrap: (h) => ({
        height: h,
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255,255,255,0.25)", // nền nhẹ (tùy bạn)
        borderRadius: 10,
      }),

      imgContain: {
        width: "100%",
        height: "100%",
        objectFit: "contain", // ✅ ảnh ngắn: giữ nguyên, không cắt, căn giữa
        objectPosition: "center",
      },

      // title đồng nhất
      fixedTitle: (minH, color = "inherit") => ({
        minHeight: minH,
        display: "flex",
        alignItems: "center",
        color,
      }),
    }),
    []
  );

  return (
    <>
      <div className="container-fluid px-0">
        {/* Spinner */}
        {loading && (
          <div
            id="spinner"
            className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center"
          >
            <div
              className="spinner-border text-primary"
              style={{ width: "3rem", height: "3rem" }}
              role="status"
            >
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}

        {/* ✅ Header */}
        {/* <Header /> */}

        {/* ABOUT – GIỚI THIỆU */}
        <div id="about-section" className="container-fluid about pt-5">
          <div className="container pt-5">
            <div className="row g-5">
              <div className="col-xl-6" data-aos="fade-right">
                <div className="about-content h-100">
                  <h4 className="text-primary">Về SmartGym</h4>
                  <h1 className="display-4 text-white mb-4">
                    Gym chuyên PT 1:1 & tự tập – tập trung vào kết quả của bạn.
                  </h1>
                  <p className="mb-4" style={{ color: "#9d9c9cff" }}>
                    SmartGym được thiết kế dành cho những người muốn tập luyện
                    một cách nghiêm túc, khoa học và có định hướng rõ ràng:
                    <br />
                    • Bạn có thể tự tập với hệ thống máy móc hiện đại. <br />
                    • Hoặc chọn đồng hành cùng huấn luyện viên cá nhân 1:1 để
                    được thiết kế lộ trình riêng.
                    <br />
                    Không lớp đông người, không ồn ào – chỉ bạn, mục tiêu và sự
                    tiến bộ mỗi ngày.
                  </p>

                  {/* Tabs Bootstrap */}
                  <div className="tab-class pb-4">
                    <ul className="nav d-flex mb-2">
                      <li className="nav-item mb-3">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a
                          className="d-flex py-2 active"
                          data-bs-toggle="pill"
                          href="#home-tab-1"
                        >
                          <span style={{ width: 150 }}>Sứ mệnh</span>
                        </a>
                      </li>
                      <li className="nav-item mb-3">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a
                          className="d-flex py-2 mx-3"
                          data-bs-toggle="pill"
                          href="#home-tab-2"
                        >
                          <span style={{ width: 150 }}>Tầm nhìn</span>
                        </a>
                      </li>
                      <li className="nav-item mb-3">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a
                          className="d-flex py-2"
                          data-bs-toggle="pill"
                          href="#home-tab-3"
                        >
                          <span style={{ width: 150 }}>Giá trị cốt lõi</span>
                        </a>
                      </li>
                    </ul>

                    <div className="tab-content">
                      <div
                        id="home-tab-1"
                        className="tab-pane fade show p-0 active"
                      >
                        <div className="d-flex align-items-center border-top border-bottom py-4">
                          <span className="fas fa-rocket text-white fa-4x me-4"></span>
                          <p className="mb-0" style={{ color: "#9d9c9cff" }}>
                            Mang đến môi trường tập luyện chuyên nghiệp, nơi mỗi
                            buổi tập đều có mục tiêu rõ ràng, phù hợp thể trạng
                            và lịch sinh hoạt của từng hội viên – dù là tự tập
                            hay tập cùng PT 1:1.
                          </p>
                        </div>
                      </div>
                      <div id="home-tab-2" className="tab-pane fade show p-0">
                        <div className="d-flex align-items-center border-top border-bottom py-4">
                          <span className="fas fa-bullseye text-white fa-4x me-4"></span>
                          <p className="mb-0">
                            Trở thành lựa chọn hàng đầu cho mô hình gym tập
                            trung – chuyên về PT 1:1, với dịch vụ minh bạch, môi
                            trường văn minh, kết quả tập luyện đo lường được và
                            trải nghiệm hội viên được đặt ở trung tâm.
                          </p>
                        </div>
                      </div>
                      <div id="home-tab-3" className="tab-pane fade show p-0">
                        <div className="d-flex align-items-center border-top border-bottom py-4">
                          <span className="fas fa-heart text-white fa-4x me-4"></span>
                          <p className="mb-0">
                            Cá nhân hoá – An toàn – Hiệu quả. SmartGym không
                            chạy theo phong trào, mà tập trung xây dựng lộ trình
                            bền vững, hạn chế chấn thương và tối ưu kết quả thực
                            tế của từng người tập.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4 align-items-center">
                    <div className="col-sm-6">
                      <a
                        href="#package-section"
                        className="btn btn-primary py-3 px-5"
                      >
                        <span>Đăng ký gói tập</span>
                      </a>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex flex-shrink-0 ps-4">
                        <a
                          href="tel:+01234567890"
                          className="btn btn-light btn-lg-square position-relative"
                          data-aos="zoom-in"
                          data-aos-delay="300"
                        >
                          <i className="fa fa-phone-alt fa-2x"></i>
                          <div
                            className="position-absolute"
                            style={{ top: 5, right: 5 }}
                          >
                            <span>
                              <i className="fa fa-comment-dots text-dark"></i>
                            </span>
                          </div>
                        </a>
                        <div className="d-flex flex-column ms-3">
                          <span>Tư vấn miễn phí</span>
                          <a href="tel:+01234567890">
                            <span className="text-white">
                              Hotline: + 0123 456 7890
                            </span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* About image */}
              <div className="col-xl-6" data-aos="fade-up">
                <div className="about-img h-100">
                  <div className="about-img-inner d-flex h-100">
                    <img
                      src="/img/about-2.png"
                      className="img-fluid w-100"
                      style={{ objectFit: "cover" }}
                      alt="SmartGym"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FITNESS GOAL */}
        <div className="container-fluid goal pt-5">
          <div className="container pt-5">
            <div className="row g-5">
              <div className="col-lg-6" data-aos="fade-right">
                <div className="goal-content">
                  <h4 className="text-primary">Mục tiêu luyện tập</h4>
                  <h1 className="display-4 mb-4">
                    Lộ trình tập luyện cá nhân hoá – tập đúng, hiệu quả nhanh.
                  </h1>

                  <div className="goal-item d-flex p-4">
                    <div className="d-flex me-4">
                      <div
                        className="bg-primary d-inline p-3"
                        style={{ width: 80, height: 80 }}
                      >
                        <img
                          src="/img/icon-1.png"
                          className="img-fluid"
                          alt=""
                        />
                      </div>
                    </div>
                    <div>
                      <h4>Huấn luyện viên kèm 1:1</h4>
                      <p className="text-white mb-0">
                        Dành cho những ai muốn thay đổi hình thể rõ ràng: giảm
                        mỡ, tăng cơ, siết dáng hoặc phục hồi sau thời gian dài ít
                        vận động. PT theo sát từng buổi, chỉnh form, nhịp thở và
                        mức tạ phù hợp.
                      </p>
                    </div>
                  </div>

                  <div className="goal-item d-flex p-4 mb-4">
                    <div className="d-flex me-4">
                      <div
                        className="bg-primary d-inline p-3"
                        style={{ width: 80, height: 80 }}
                      >
                        <img
                          src="/img/icon-6.png"
                          className="img-fluid"
                          alt=""
                        />
                      </div>
                    </div>
                    <div>
                      <h4>Tự tập khoa học – vẫn đạt kết quả</h4>
                      <p className="text-white mb-0">
                        Với hệ thống máy móc đa dạng, không gian rộng rãi, bạn
                        hoàn toàn có thể tự tập theo lịch cá nhân. Đội ngũ tại
                        SmartGym luôn sẵn sàng hỗ trợ khi cần giải đáp về kỹ
                        thuật hoặc cách sử dụng máy.
                      </p>
                    </div>
                  </div>

                  <div className="ms-1">
                    <a
                      href="#package-section"
                      className="btn btn-primary py-3 px-5 ms-2"
                    >
                      <span>Xem gói tập phù hợp</span>
                    </a>
                  </div>
                </div>
              </div>

              <div className="col-lg-6" data-aos="fade-left">
                <div className="h-100">
                  <img
                    src="/img/fitness-goal-banner.png"
                    className="img-fluid h-100"
                    style={{ objectFit: "cover" }}
                    alt="Fitness Goal"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURES – LÝ DO CHỌN SMARTGYM */}
        <div
          id="features-section"
          className="container-fluid feature bg-light py-5"
        >
          <div className="container py-5">
            <div
              className="text-center mx-auto pb-5"
              data-aos="fade-up"
              style={{ maxWidth: 800 }}
            >
              <h4 className="text-primary">Vì sao nên chọn SmartGym?</h4>
              <h1 className="display-4 mb-4">
                Không gian tập luyện nghiêm túc – dịch vụ chuyên nghiệp.
              </h1>
              <p className="mb-0">
                SmartGym được xây dựng dành cho những người bận rộn, muốn tối ưu
                thời gian tập luyện và tập trung vào kết quả thật – không phô
                trương, không phong trào.
              </p>
            </div>

            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              loop
              navigation
              pagination={{ clickable: true }}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                768: { slidesPerView: 2 },
                1200: { slidesPerView: 3 },
              }}
            >
              {featureSlides.map((f, i) => (
                <SwiperSlide key={i}>
                  <div
                    className="feature-item"
                    data-aos="fade-up"
                    style={{
                      color: "#000",
                      transition: "color 0.3s ease",
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.color = "#fff")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.color = "#000")
                    }
                  >
                    {/* ✅ FIX: Ảnh cùng chiều cao + ảnh ngắn căn giữa */}
                    <div className="feature-img" style={UI.imgWrap(UI.featureImgH)}>
                      <img src={f.img} alt="" style={UI.imgContain} />
                    </div>

                    <div className="feature-content p-4">
                      {/* ✅ FIX: Title cao đều */}
                      <h4 className="mb-3" style={UI.fixedTitle(60)}>
                        {f.title}
                      </h4>
                      <p className="mb-4">{f.desc}</p>
                      <a
                        href="#package-section"
                        className="btn btn-primary py-2 px-4"
                      >
                        <span>Tìm hiểu thêm</span>
                      </a>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* PACKAGES – GÓI TẬP */}
        <div
          id="package-section"
          className="container-fluid courses overflow-hidden py-5"
        >
          <div className="container py-5">
            <div
              className="text-center mx-auto pb-5"
              data-aos="fade-up"
              style={{ maxWidth: 800 }}
            >
              <h4 className="text-primary">Gói tập tại SmartGym</h4>
              <h1 className="display-4 text-white mb-4">
                Linh hoạt cho người tự tập & tập với PT 1:1.
              </h1>
              <p className="text-white mb-0">
                Chúng tôi không áp đặt một kiểu luyện tập cho tất cả mọi người.
                Bạn có thể bắt đầu từ gói tự tập cơ bản, sau đó nâng cấp lên gói
                PT 1:1 khi cần tối ưu kết quả trong thời gian ngắn hơn.
              </p>
            </div>

            <div className="row gy-4 gx-0 justify-content-center">
              {/* 👉 Chỉ hiển thị tối đa 6 gói */}
              {packages.slice(0, 6).map((item, idx) => {
                const duration = item.durationInDays ?? item.duration ?? 0;
                const sessions = item.sessionCount ?? item.sessions ?? 0;
                const hasPT = item.includesPersonalTrainer ?? item.hasPT ?? false;
                const title = item.packageName ?? item.title ?? "Gói tập";

                return (
                  <div
                    className="col-md-6 col-lg-4"
                    data-aos="fade-up"
                    data-aos-delay={(idx % 3) * 200}
                    key={item.id}
                  >
                    <div
                      className="courses-item"
                      style={{
                        color: "#000",
                        transition: "color 0.3s ease",
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.color = "#fff")
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.color = "#000")
                      }
                    >
                      <div className="courses-item-inner p-4">
                        <div className="d-flex justify-content-between mb-4">
                          <div className="courses-icon-img p-3">
                            <img
                              src={`/img/icon-${item.iconIndex || 1}.png`}
                              className="img-fluid"
                              alt=""
                              style={{
                                width: 64,
                                height: 64,
                                objectFit: "contain",
                                objectPosition: "center",
                              }}
                            />
                          </div>
                          <div className="data-info d-flex flex-column">
                            <div
                              className="courses-date"
                              style={{ fontSize: "1rem" }}
                            >
                              <p className="mb-1">Thời hạn: {duration} ngày</p>
                              <p className="mb-0">Số buổi: {sessions} buổi</p>
                              <p className="mb-0 d-flex align-items-center">
                                PT:&nbsp;
                                {hasPT ? (
                                  <>
                                    Có PT 1:1{" "}
                                    <AiOutlineCheck
                                      className="icon-check"
                                      style={{ marginLeft: 4 }}
                                    />
                                  </>
                                ) : (
                                  <>
                                    Không kèm PT{" "}
                                    <AiOutlineClose
                                      className="icon-close"
                                      style={{ marginLeft: 4 }}
                                    />
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* ✅ FIX: Title package cao đều */}
                        <a
                          href="#"
                          className="d-inline-block h4 mb-3"
                          style={{
                            letterSpacing: "0.2px",
                            fontSize: "2rem",
                            fontWeight: "bold",
                            ...UI.fixedTitle(UI.packageTitleMinH),
                          }}
                        >
                          {title}
                        </a>

                        <p
                          className="mb-4"
                          style={{
                            letterSpacing: "0.2px",
                            fontSize: "1.3rem",
                          }}
                        >
                          {formatPrice(item.price)} ₫
                        </p>

                        <Link
                          to={`/packages/${item.id}`}
                          className="btn btn-primary py-2 px-4"
                        >
                          <span>Chi tiết gói</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              <div className="col-12 text-center" data-aos="fade-up">
                <Link to="/packages" className="btn btn-primary py-3 px-5">
                  <span>Xem tất cả gói tập</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* BLOG – NỘI DUNG KIẾN THỨC */}
        <div id="blogs-section" className="container-fluid blog py-5">
          <div className="container py-5">
            <div
              className="text-center mx-auto pb-5"
              data-aos="fade-up"
              style={{ maxWidth: 800 }}
            >
              <h4 className="text-primary">Blog & Kiến thức</h4>
              <h1 className="display-4 mb-4">
                Chia sẻ từ trải nghiệm thực tế & chuyên môn.
              </h1>
              <p className="mb-0">
                Nội dung được xây dựng cho người mới bắt đầu, người bận rộn và
                những ai muốn hiểu đúng về tập luyện & dinh dưỡng – không phức
                tạp, không lý thuyết suông.
              </p>
            </div>

            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              loop
              navigation
              pagination={{ clickable: true }}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{
                992: { slidesPerView: 2 },
                1400: { slidesPerView: 3 },
              }}
            >
              {blogSlides.map((b, i) => (
                <SwiperSlide key={i}>
                  <div className="blog-item" data-aos="fade-up">
                    <div className="blog-img p-4 pb-0">
                      <a href="#">
                        {/* ✅ FIX: Ảnh blog cùng chiều cao + ảnh ngắn căn giữa */}
                        <div style={UI.imgWrap(UI.blogImgH)}>
                          <img src={b.img} alt="" style={UI.imgContain} />
                        </div>
                      </a>
                    </div>

                    <div className="blog-content p-4">
                      <div className="blog-comment d-flex justify-content-between py-2 px-3 mb-4">
                        <div className="small">
                          <span className="fa fa-user text-primary me-2"></span>{" "}
                          SmartGym Team
                        </div>
                        <div className="small">
                          <span className="fa fa-calendar text-primary me-2"></span>{" "}
                          30 Dec 2025
                        </div>
                      </div>

                      {/* ✅ FIX: Blog title cao đều */}
                      <a
                        href="#"
                        className="h4 d-inline-block mb-3"
                        style={UI.fixedTitle(UI.blogTitleMinH)}
                      >
                        {b.title}
                      </a>

                      <p className="mb-3">{b.desc}</p>
                      <a href="#" className="btn btn-dark py-2 px-4 ms-2">
                        <span className="me-2">Xem chi tiết</span>{" "}
                        <i className="fa fa-arrow-right"></i>
                      </a>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* TRAINER – PT 1:1 */}
        <div
          className="container-fluid courses overflow-hidden py-5 trainer-bg"
          style={{
            backgroundImage: "url('/img/image.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundColor: "#141d3dff",
            backgroundBlendMode: "multiply",
            weight: "90%",
            zIndex: 1,
          }}
        >
          <div className="container py-5 position-relative" style={{ zIndex: 2 }}>
            <div
              className="text-center mx-auto pb-5"
              data-aos="fade-up"
              style={{ maxWidth: 800 }}
            >
              <h4 className="text-primary">Đội ngũ Huấn luyện viên</h4>
              <h1 className="display-4 text-white mb-4">
                PT 1:1 – đồng hành đến khi bạn đạt mục tiêu.
              </h1>
              <p className="mb-0 text-white-50">
                Mỗi huấn luyện viên tại SmartGym đều được đào tạo bài bản về kỹ
                thuật, chương trình tập và an toàn trong luyện tập. Chúng tôi
                không tập cho mệt – chúng tôi tập đúng, đủ và hiệu quả.
              </p>
            </div>

            <div className="row gy-5 gy-lg-4 gx-4" id="trainers-section">
              {trainers.slice(0, 4).map((t) => (
                <div className="col-md-6 col-lg-3" key={t.id}>
                  <div className="team-item">
                    <Link to={`/trainer/${t.id}`}>
                      {/* ✅ FIX: ảnh trainer cao đều + ảnh ngắn căn giữa */}
                      <div className="team-img" style={UI.imgWrap(UI.trainerImgH)}>
                        <img src={t.img} alt={t.name} style={UI.imgContain} />
                      </div>
                    </Link>

                    {/* ✅ FIX: phần tên/desc đều nhau */}
                    <div
                      className="team-content"
                      style={{
                        minHeight: 92,
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "center",
                        paddingInline: 10,
                      }}
                    >
                      <h4 style={{ color: "#ffffff", textAlign: "center", marginBottom: 6 }}>
                        {t.name}
                      </h4>
                      <p
                        className="mb-0"
                        style={{ color: "#a0a0a0ff", textAlign: "center" }}
                      >
                        {t.profession}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="col-12 text-center" data-aos="fade-up" style={{ marginTop: 40 }}>
              <Link to="/trainers" className="btn btn-primary py-3 px-5">
                <span>Xem thêm huấn luyện viên</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Feedback */}
        <div id="#feedback-section">
          <GymFeedbackSection />
        </div>
      </div>
    </>
  );
}
