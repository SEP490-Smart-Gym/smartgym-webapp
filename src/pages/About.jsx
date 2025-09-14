import { useEffect } from "react";
import AOS from "aos";

export default function About() {
  useEffect(() => { AOS.init({ once: true, duration: 600 }); }, []);

  return (
    <>
      {/* (Tuỳ chọn) Page header nhỏ, nếu bạn muốn có banner */}
      {/* <div className="container-fluid bg-dark py-5 mb-5">
        <div className="container text-white">
          <h1 className="display-4 mb-0">About Us</h1>
        </div>
      </div> */}

      {/* About Start */}
      <div className="container-fluid about pt-5">
        <div className="container pt-5">
          <div className="row g-5">
            {/* Content */}
            <div className="col-xl-6" data-aos="fade-right">
              <div className="about-content h-100">
                <h4 className="text-primary">About Fitness Center</h4>
                <h1 className="display-4 text-white mb-4">
                  We are the best at fulfilling your potential and achieving your goals.
                </h1>
                <p className="mb-4">
                  Lorem ipsum dolor, sit amet consectetur adipisicing elit. In impedit accusantium autem quaerat natus
                  nesciunt veritatis fugiat dolor eaque fuga.
                </p>

                {/* Tabs Bootstrap */}
                <div className="tab-class pb-4">
                  <ul className="nav d-flex mb-2">
                    <li className="nav-item mb-3">
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <a className="d-flex py-2 active" data-bs-toggle="pill" href="#about-tab-1">
                        <span style={{ width: 150 }}>Our Mission</span>
                      </a>
                    </li>
                    <li className="nav-item mb-3">
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <a className="d-flex py-2 mx-3" data-bs-toggle="pill" href="#about-tab-2">
                        <span style={{ width: 150 }}>Our Vision</span>
                      </a>
                    </li>
                    <li className="nav-item mb-3">
                      {/* eslint-disable-next-line jsx-a11y/anchor-is-valid */}
                      <a className="d-flex py-2" data-bs-toggle="pill" href="#about-tab-3">
                        <span style={{ width: 150 }}>Our Goal</span>
                      </a>
                    </li>
                  </ul>

                  <div className="tab-content">
                    <div id="about-tab-1" className="tab-pane fade show p-0 active">
                      <div className="row">
                        <div className="col-12">
                          <div className="d-flex align-items-center border-top border-bottom py-4">
                            <span className="fas fa-rocket text-white fa-4x me-4"></span>
                            <p className="mb-0">
                              Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has
                              been the industry's standard dummy text ever since the 1500s...
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div id="about-tab-2" className="tab-pane fade show p-0">
                      <div className="row">
                        <div className="col-12">
                          <div className="d-flex align-items-center border-top border-bottom py-4">
                            <span className="fas fa-rocket text-white fa-4x me-4"></span>
                            <p className="mb-0">
                              Lorem Ipsum is simply dummy text of the printing and typesetting industry...
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div id="about-tab-3" className="tab-pane fade show p-0">
                      <div className="row">
                        <div className="col-12">
                          <div className="d-flex align-items-center border-top border-bottom py-4">
                            <span className="fas fa-rocket text-white fa-4x me-4"></span>
                            <p className="mb-0">
                              Lorem Ipsum is simply dummy text of the printing and typesetting industry...
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Button + call box */}
                <div className="row g-4 align-items-center">
                  <div className="col-sm-6">
                    <a href="#" className="btn btn-primary py-3 px-5">
                      <span>Make Appointment</span>
                    </a>
                  </div>
                  <div className="col-sm-6">
                    <div className="d-flex flex-shrink-0 ps-4">
                      <a
                        href="#"
                        className="btn btn-light btn-lg-square position-relative"
                        data-aos="zoom-in"
                        data-aos-delay="300"
                      >
                        <i className="fa fa-phone-alt fa-2x"></i>
                        <div className="position-absolute" style={{ top: 5, right: 5 }}>
                          <span>
                            <i className="fa fa-comment-dots text-dark"></i>
                          </span>
                        </div>
                      </a>
                      <div className="d-flex flex-column ms-3">
                        <span>Call to Our Experts</span>
                        <a href="tel:+01234567890">
                          <span className="text-white">Free: + 0123 456 7890</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Image */}
            <div className="col-xl-6" data-aos="fade-up">
              <div className="about-img h-100">
                <div className="about-img-inner d-flex h-100">
                  <img
                    src="/img/about-2.png"
                    className="img-fluid w-100"
                    style={{ objectFit: "cover" }}
                    alt="About"
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
      {/* About End */}

      {/* (Tuỳ chọn) Bạn có thể chèn thêm Goal/Team/Testimonial nếu muốn page About đầy đặn */}
      {/* <GoalSection /> / <Team /> / <TestimonialCarousel /> */}
    </>
  );
}
