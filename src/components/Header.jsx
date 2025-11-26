export default function Header() {
  return (
    <div id="heroCarousel" className="carousel slide" data-bs-ride="carousel">
      <div className="carousel-inner">
        {/* Slide 1 */}
        <div className="carousel-item active">
          <div className="position-relative" style={{ height: 700 }}>
            <img
              src="/img/header-2.jpg"
              className="d-block w-100 h-100"
              style={{ objectFit: "cover" }}
              alt="hero-1"
            />
            <div
              className="d-flex align-items-center"
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }}
            >
              <div className="container">
                <div className="row g-4 align-items-center">
                  <div className="col-lg-7">
                    <h4 className="text-primary text-uppercase fw-bold mb-4">Welcome to our fitness Center</h4>
                    <h1 className="display-1 text-white mb-4">The best gym center is now in your city</h1>
                    <p className="mb-5 fs-5 text-white-50">Lorem Ipsum is simply dummy text...</p>
                    <div className="d-flex flex-wrap">
                      <a className="btn btn-dark py-3 px-4 px-md-5 me-2 mb-2" href="#"><i className="fas fa-play-circle me-2"></i><span>Watch Video</span></a>
                      <a className="btn btn-primary py-3 px-4 px-md-5 ms-2 mb-2" href="#"><span>Learn More</span></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Slide 2 */}
        <div className="carousel-item">
          <div className="position-relative" style={{ height: 700 }}>
            <img
              src="/img/header-1.jpg"
              className="d-block w-100 h-100"
              style={{ objectFit: "cover" }}
              alt="hero-2"
            />
            <div
              className="d-flex align-items-center"
              style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.4)" }}
            >
              <div className="container">
                <div className="row g-4 align-items-center">
                  <div className="col-lg-7">
                    <h4 className="text-primary text-uppercase fw-bold mb-4">Welcome to our fitness Center</h4>
                    <h1 className="display-2 text-white mb-4">Stay healthy by exercising at the best gym center</h1>
                    <p className="mb-5 fs-5 text-white-50">Lorem Ipsum is simply dummy text...</p>
                    <div className="d-flex flex-wrap">
                      <a className="btn btn-dark py-3 px-4 px-md-5 me-2 mb-2" href="#"><i className="fas fa-play-circle me-2"></i><span>Watch Video</span></a>
                      <a className="btn btn-primary py-3 px-4 px-md-5 ms-2 mb-2" href="#"><span>Learn More</span></a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prev/Next */}
      <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Previous</span>
      </button>
      <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Next</span>
      </button>

      {/* Auto-slide */}
      <div className="d-none" data-bs-interval="4000"></div>
    </div>
  );
}
