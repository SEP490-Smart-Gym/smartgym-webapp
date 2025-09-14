// src/pages/Home.jsx
import { useEffect, useState } from "react";
import AOS from "aos";
import "aos/dist/aos.css";                // đảm bảo có CSS AOS (có thể để ở main.jsx cũng được)

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Navigation, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import Header from "../components/Header.jsx";  // chú ý đuôi .jsx cho chắc

export default function Home() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AOS.init({ once: true, duration: 600 });
    const t = setTimeout(() => setLoading(false), 400);
    return () => clearTimeout(t);
  }, []);

  const featureSlides = [
    { img: "/img/feature-1.jpg", title: "Work Your Butt Off" },
    { img: "/img/feature-2.jpg", title: "Get In The groove" },
    { img: "/img/feature-3.jpg", title: "It's more Than A Game" },
    { img: "/img/feature-4.jpg", title: "Get Fit Don't Quit" },
  ];

  const blogSlides = [
    { img: "/img/feature-4.jpg", title: "Full Body Home Workout" },
    { img: "/img/feature-3.jpg", title: "31-Day Fitness Calendar" },
    { img: "/img/feature-2.jpg", title: "At Home Ab Workout" },
    { img: "/img/feature-1.jpg", title: "Full Body Home Workout" },
  ];

  const testimonials = [
    { img: "/img/testimonial-1.jpg" },
    { img: "/img/testimonial-2.jpg" },
    { img: "/img/testimonial-3.jpg" },
  ];

  return (
    <>
      <div className="container-fluid px-0">
        {/* Spinner */}
        {loading && (
          <div
            id="spinner"
            className="show bg-white position-fixed translate-middle w-100 vh-100 top-50 start-50 d-flex align-items-center justify-content-center"
          >
            <div className="spinner-border text-primary" style={{ width: "3rem", height: "3rem" }} role="status">
              <span className="sr-only">Loading...</span>
            </div>
          </div>
        )}

        {/* ✅ Header tách riêng */}
        <Header />

        {/* About */}
        <div className="container-fluid about pt-5">
          <div className="container pt-5">
            <div className="row g-5">
              <div className="col-xl-6" data-aos="fade-right">
                <div className="about-content h-100">
                  <h4 className="text-primary">About Fitness Center</h4>
                  <h1 className="display-4 text-white mb-4">We are the best at fulfilling your potential and achieving your goals.</h1>
                  <p className="mb-4">
                    Lorem ipsum dolor, sit amet consectetur adipisicing elit. In impedit accusantium autem quaerat natus nesciunt veritatis fugiat dolor eaque fuga.
                  </p>

                  {/* Tabs Bootstrap */}
                  <div className="tab-class pb-4">
                    <ul className="nav d-flex mb-2">
                      <li className="nav-item mb-3">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a className="d-flex py-2 active" data-bs-toggle="pill" href="#home-tab-1">
                          <span style={{ width: 150 }}>Our Mission</span>
                        </a>
                      </li>
                      <li className="nav-item mb-3">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a className="d-flex py-2 mx-3" data-bs-toggle="pill" href="#home-tab-2">
                          <span style={{ width: 150 }}>Our Vision</span>
                        </a>
                      </li>
                      <li className="nav-item mb-3">
                        {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                        <a className="d-flex py-2" data-bs-toggle="pill" href="#home-tab-3">
                          <span style={{ width: 150 }}>Our Goal</span>
                        </a>
                      </li>
                    </ul>

                    <div className="tab-content">
                      <div id="home-tab-1" className="tab-pane fade show p-0 active">
                        <div className="d-flex align-items-center border-top border-bottom py-4">
                          <span className="fas fa-rocket text-white fa-4x me-4"></span>
                          <p className="mb-0">Lorem Ipsum is simply dummy text of the printing and typesetting industry...</p>
                        </div>
                      </div>
                      <div id="home-tab-2" className="tab-pane fade show p-0">
                        <div className="d-flex align-items-center border-top border-bottom py-4">
                          <span className="fas fa-rocket text-white fa-4x me-4"></span>
                          <p className="mb-0">Lorem Ipsum is simply dummy text of the printing and typesetting industry...</p>
                        </div>
                      </div>
                      <div id="home-tab-3" className="tab-pane fade show p-0">
                        <div className="d-flex align-items-center border-top border-bottom py-4">
                          <span className="fas fa-rocket text-white fa-4x me-4"></span>
                          <p className="mb-0">Lorem Ipsum is simply dummy text of the printing and typesetting industry...</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row g-4 align-items-center">
                    <div className="col-sm-6">
                      <a href="#" className="btn btn-primary py-3 px-5">
                        <span>Make Appointment</span>
                      </a>
                    </div>
                    <div className="col-sm-6">
                      <div className="d-flex flex-shrink-0 ps-4">
                        <a href="#" className="btn btn-light btn-lg-square position-relative" data-aos="zoom-in" data-aos-delay="300">
                          <i className="fa fa-phone-alt fa-2x"></i>
                          <div className="position-absolute" style={{ top: 5, right: 5 }}>
                            <span><i className="fa fa-comment-dots text-dark"></i></span>
                          </div>
                        </a>
                        <div className="d-flex flex-column ms-3">
                          <span>Call to Our Experts</span>
                          <a href="tel:+ 0123 456 7890"><span className="text-white">Free: + 0123 456 7890</span></a>
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
                    <img src="/img/about-2.png" className="img-fluid w-100" style={{ objectFit: "cover" }} alt="About" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fitness Goal */}
        <div className="container-fluid goal pt-5">
          <div className="container pt-5">
            <div className="row g-5">
              <div className="col-lg-6" data-aos="fade-right">
                <div className="goal-content">
                  <h4 className="text-primary">Fitness Goal</h4>
                  <h1 className="display-4 mb-4">Complete your possibilities, Achieve Your Fitness Goals.</h1>

                  <div className="goal-item d-flex p-4">
                    <div className="d-flex me-4">
                      <div className="bg-primary d-inline p-3" style={{ width: 80, height: 80 }}>
                        <img src="/img/icon-1.png" className="img-fluid" alt="" />
                      </div>
                    </div>
                    <div>
                      <h4>Free Fitness Training</h4>
                      <p className="text-white mb-0">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tempore est harum</p>
                    </div>
                  </div>

                  <div className="goal-item d-flex p-4 mb-4">
                    <div className="d-flex me-4">
                      <div className="bg-primary d-inline p-3" style={{ width: 80, height: 80 }}>
                        <img src="/img/icon-6.png" className="img-fluid" alt="" />
                      </div>
                    </div>
                    <div>
                      <h4>Cardio and Strength</h4>
                      <p className="text-white mb-0">Lorem ipsum dolor sit amet consectetur, adipisicing elit. Tempore est harum</p>
                    </div>
                  </div>

                  <div className="ms-1">
                    <a href="#" className="btn btn-primary py-3 px-5 ms-2"><span>Read Details</span></a>
                  </div>
                </div>
              </div>

              <div className="col-lg-6" data-aos="fade-left">
                <div className="h-100">
                  <img src="/img/fitness-goal-banner.png" className="img-fluid h-100" style={{ objectFit: "cover" }} alt="Goal" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features (Swiper) */}
        <div className="container-fluid feature bg-light py-5">
          <div className="container py-5">
            <div className="text-center mx-auto pb-5" data-aos="fade-up" style={{ maxWidth: 800 }}>
              <h4 className="text-primary"> Why choose us?</h4>
              <h1 className="display-4 mb-4">Out Our Highlights Below</h1>
              <p className="mb-0">Lorem ipsum dolor sit amet consectetur adipisicing elit...</p>
            </div>

            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              loop
              navigation
              pagination={{ clickable: true }}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{ 768: { slidesPerView: 2 }, 1200: { slidesPerView: 3 } }}
            >
              {[
                { img: "/img/feature-1.jpg", title: "Work Your Butt Off" },
                { img: "/img/feature-2.jpg", title: "Get In The groove" },
                { img: "/img/feature-3.jpg", title: "It's more Than A Game" },
                { img: "/img/feature-4.jpg", title: "Get Fit Don't Quit" },
              ].map((f, i) => (
                <SwiperSlide key={i}>
                  <div className="feature-item" data-aos="fade-up">
                    <div className="feature-img">
                      <img src={f.img} className="img-fluid w-100" alt="" />
                    </div>
                    <div className="feature-content p-4">
                      <h4 className="mb-3">{f.title}</h4>
                      <p className="mb-4">Lorem ipsum dolor sit amet consectetur adipisicing elit. Aspernatur obcaecati voluptatum,</p>
                      <a href="#" className="btn btn-primary py-2 px-4"><span>Read More</span></a>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="feature-shaps"></div>
          </div>
        </div>

        {/* Courses */}
        <div className="container-fluid courses overflow-hidden py-5">
          <div className="container py-5">
            <div className="text-center mx-auto pb-5" data-aos="fade-up" style={{ maxWidth: 800 }}>
              <h4 className="text-primary"> Our Courses</h4>
              <h1 className="display-4 text-white mb-4">Out Our Highlights Below</h1>
              <p className="text-white mb-0">Lorem ipsum dolor, sit amet consectetur adipisicing elit...</p>
            </div>

            <div className="row gy-4 gx-0 justify-content-center">
              {[1, 2, 3, 4, 5, 6].map((_, idx) => (
                <div className="col-md-6 col-lg-4" data-aos="fade-up" data-aos-delay={(idx % 3) * 200} key={idx}>
                  <div className="courses-item">
                    <div className="courses-item-inner p-4">
                      <div className="d-flex justify-content-between mb-4">
                        <div className="courses-icon-img p-3">
                          <img src={`/img/icon-${((idx % 6) + 1).toString()}.png`} className="img-fluid" alt="" />
                        </div>
                        <div className="data-info d-flex flex-column">
                          <div className="courses-trainer d-flex align-items-center mb-1">
                            <div className="me-2" style={{ width: 25, height: 25 }}>
                              <img src="/img/testimonial-3.jpg" className="img-fluid" alt="" />
                            </div>
                            <p className="mb-0">Paul Flavius</p>
                          </div>
                          <div className="courses-date">
                            <p className="mb-1">Date: Saturday</p>
                            <p className="mb-0">Time: 06.00 - 07.00</p>
                          </div>
                        </div>
                      </div>
                      <a href="#" className="d-inline-block h4 mb-3">
                        {["Gym Fitness Class", "Power Lifting Class", "Body Building Class", "Aerobics & Skipping Class", "Boxing Class", "Cardio Class"][idx]}
                      </a>
                      <p className="mb-4">Lorem ipsum dolor sit amet consectetur adipisicing elit. Atque tempora illo placeat.</p>
                      <a href="#" className="btn btn-primary py-2 px-4"><span>Read More</span></a>
                    </div>
                  </div>
                </div>
              ))}

              <div className="col-12 text-center" data-aos="fade-up">
                <a href="#" className="btn btn-primary py-3 px-5"><span>More Courses</span></a>
              </div>
            </div>
          </div>
        </div>

        {/* Blog */}
        <div className="container-fluid blog py-5">
          <div className="container py-5">
            <div className="text-center mx-auto pb-5" data-aos="fade-up" style={{ maxWidth: 800 }}>
              <h4 className="text-primary">  Our Blogs</h4>
              <h1 className="display-4 mb-4">Check out our latest stories</h1>
              <p className="mb-0">Lorem ipsum dolor, sit amet consectetur adipisicing elit...</p>
            </div>

            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              autoplay={{ delay: 3500, disableOnInteraction: false }}
              loop
              navigation
              pagination={{ clickable: true }}
              spaceBetween={16}
              slidesPerView={1}
              breakpoints={{ 992: { slidesPerView: 2 }, 1400: { slidesPerView: 3 } }}
            >
              {blogSlides.map((b, i) => (
                <SwiperSlide key={i}>
                  <div className="blog-item" data-aos="fade-up">
                    <div className="blog-img p-4 pb-0">
                      <a href="#"><img src={b.img} className="img-fluid w-100" alt="" /></a>
                    </div>
                    <div className="blog-content p-4">
                      <div className="blog-comment d-flex justify-content-between py-2 px-3 mb-4">
                        <div className="small"><span className="fa fa-user text-primary me-2"></span> Martin.C</div>
                        <div className="small"><span className="fa fa-calendar text-primary me-2"></span> 30 Dec 2025</div>
                      </div>
                      <a href="#" className="h4 d-inline-block mb-3">{b.title}</a>
                      <p className="mb-3">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Eius libero soluta impedit eligendi?</p>
                      <a href="#" className="btn btn-dark py-2 px-4 ms-2"><span className="me-2">Read More</span>  <i className="fa fa-arrow-right"></i></a>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* Team */}
        <div className="container-fluid team py-5">
          <div className="container py-5">
            <div className="text-center mx-auto pb-5" data-aos="fade-up" style={{ maxWidth: 800 }}>
              <h4 className="text-primary">Our Trainer</h4>
              <h1 className="display-4 mb-4">Meet Our Amazing Team</h1>
              <p className="mb-0">Lorem ipsum dolor, sit amet consectetur adipisicing elit...</p>
            </div>

            <div className="row gy-5 gy-lg-4 gx-4">
              {[1, 2, 3, 4].map((n, i) => (
                <div className="col-md-6 col-lg-3" data-aos="fade-up" data-aos-delay={i * 200} key={i}>
                  <div className="team-item">
                    <div className="team-img">
                      <img src={`/img/team-${n}.jpg`} className="img-fluid w-100" alt="Team" />
                      <div className="team-icon">
                        <a href="#" className="btn btn-primary btn-sm-square"><i className="fab fa-facebook-f"></i></a>
                        <a href="#" className="btn btn-primary btn-sm-square"><i className="fab fa-twitter"></i></a>
                        <a href="#" className="btn btn-primary btn-sm-square"><i className="fab fa-instagram"></i></a>
                        <a href="#" className="btn btn-primary btn-sm-square"><i className="fab fa-linkedin-in"></i></a>
                      </div>
                    </div>
                    <div className="team-content">
                      <h4>Trainer Name</h4>
                      <p className="mb-0">Profession</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonial */}
        <div className="container-fluid testimonial bg-dark py-5" style={{ marginBottom: 90 }}>
          <div className="container py-5">
            <div className="text-center mx-auto pb-5" data-aos="fade-up" style={{ maxWidth: 800 }}>
              <h4 className="text-primary">Testimonial</h4>
              <h1 className="display-4 text-white">What Our Customers Are Saying</h1>
            </div>

            <Swiper
              modules={[Autoplay, Pagination, Navigation]}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              loop
              pagination={{ clickable: true }}
              spaceBetween={24}
              slidesPerView={1}
            >
              {testimonials.map((t, i) => (
                <SwiperSlide key={i}>
                  <div className="testimonial-item mx-auto" style={{ maxWidth: 900 }}>
                    <span className="fa fa-quote-left fa-3x quote-icon"></span>
                    <div className="testimonial-img mb-4">
                      <img src={t.img} className="img-fluid" alt="Testimonial" />
                    </div>
                    <p className="fs-4 text-white mb-4">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Vero quasi deleniti ratione similique eaque blanditiis fugit voluptas ex officiis expedita...
                    </p>
                    <div className="d-block">
                      <h4 className="text-white">Client Name</h4>
                      <p className="m-0 pb-3">Profession</p>
                      <div className="d-flex">
                        <i className="fas fa-star text-primary"></i>
                        <i className="fas fa-star text-primary"></i>
                        <i className="fas fa-star text-primary"></i>
                        <i className="fas fa-star text-primary"></i>
                        <i className="fas fa-star text-white"></i>
                      </div>
                    </div>
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </div>
    </>
  );
}
