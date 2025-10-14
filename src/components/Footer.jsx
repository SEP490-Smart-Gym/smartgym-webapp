import { AiOutlineToTop } from "react-icons/ai";
export default function Footer() {
  return (
    <>
      {/* Footer */}
      <div className="container-fluid footer py-5">
        <div className="container py-5">
          <div className="row g-5 mb-5 align-items-center">
            <div className="col-lg-7">
              <div className="position-relative d-flex" style={{ transform: "skew(18deg)" }}>
                <input className="form-control border-0 w-100 py-3 pe-5" type="text" placeholder="Email address to Subscribe" />
                <button type="button" className="btn-primary py-2 px-4 ms-3">
                  <span>Subscribe</span>
                </button>
              </div>
            </div>
            <div className="col-lg-5">
              <div className="d-flex align-items-center justify-content-center justify-content-lg-end">
                <a className="btn btn-primary btn-md-square me-3" href=""><i className="fab fa-facebook-f"></i></a>
                <a className="btn btn-primary btn-md-square me-3" href=""><i className="fab fa-twitter"></i></a>
                <a className="btn btn-primary btn-md-square me-3" href=""><i className="fab fa-instagram"></i></a>
                <a className="btn btn-primary btn-md-square me-0" href=""><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
          </div>

          <div className="row g-5">
            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-white mb-4">
                  <i className="fas fa-hand-rock text-primary me-2"></i> Fitness
                </h4>
                <p className="mb-0">
                  Dolor amet sit justo amet elitr clita ipsum elitr est. Lorem ipsum dolor sit amet, consectetur adipiscing elit consectetur adipiscing elit.
                </p>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-white mb-4">Quick Links</h4>
                <a href="#"> Home</a>
                <a href="#"> About us</a>
                <a href="#"> Our Courses</a>
                <a href="#"> Our Features</a>
                <a href="#"> Our Blog & news</a>
                <a href="#"> Testimonial</a>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-white mb-4"> Contact Info</h4>
                <div className="row g-2">
                  <div className="col-12">
                    <div className="d-flex">
                      <i className="fas fa-map-marker-alt text-primary me-2"></i>
                      <div>
                        <h5 className="text-white mb-2">Address</h5>
                        <p className="mb-0">123 street New York</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex">
                      <i className="fas fa-envelope text-primary me-2"></i>
                      <div>
                        <h5 className="text-white mb-2">Mail Us</h5>
                        <p className="mb-0">info@example.com</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="d-flex">
                      <i className="fa fa-phone-alt text-primary me-2"></i>
                      <div>
                        <h5 className="text-white mb-2">Telephone</h5>
                        <p className="mb-0">(+012) 3456 7890 123</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-md-6 col-lg-6 col-xl-3">
              <div className="footer-item">
                <h4 className="text-white mb-4">Recent Work</h4>
                <div className="row g-2">
                  {["work-9.jpg","work-10.jpg","work-11.jpg","work-12.jpg","work-1.jpg","work-2.jpg","work-3.jpg","work-4.jpg","work-5.jpg","work-6.jpg","work-7.jpg","work-8.jpg"].map((w,i)=>(
                    <div className="col-3" key={i}>
                      <div className="footer-item-img">
                        <a href="#"><img src={`/img/${w}`} className="img-fluid" alt="" /></a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="container-fluid copyright py-4">
        <div className="container">
          <div className="row g-4 align-items-center">
            <div className="col-md-6 text-center text-md-start mb-md-0">
              <span className="text-body">
                <a href="#" className="border-bottom text-white">
                  <i className="fas fa-copyright text-light me-2"></i>Your Site Name
                </a>
                , All right reserved.
              </span>
            </div>
            <div className="col-md-6 text-center text-md-end text-body">
              Designed By{" "}
              <a className="border-bottom text-white" href="https://htmlcodex.com" target="_blank" rel="noreferrer">
                HTML Codex
              </a>{" "}
              Distributed By{" "}
              <a href="https://themewagon.com/" target="_blank" rel="noreferrer">
                ThemeWagon
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Back to Top */}
      <div className="back-to-top">
        <button
          className="btn"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Back to top"
        >
          <AiOutlineToTop />
        </button>
      </div>
    </>
  );
}
