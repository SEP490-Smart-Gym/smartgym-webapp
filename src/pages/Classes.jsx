import { useEffect } from "react";
import AOS from "aos";

const COURSES = [
  {
    id: 1,
    icon: "/img/icon-1.png",
    trainerAvatar: "/img/testimonial-3.jpg",
    trainerName: "Paul Flavius",
    date: "Saturday",
    time: "06.00 - 07.00",
    title: "Gym Fitness Class",
    desc: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Atque tempora illo placeat.",
  },
  {
    id: 2,
    icon: "/img/icon-2.png",
    trainerAvatar: "/img/testimonial-3.jpg",
    trainerName: "Paul Flavius",
    date: "Saturday",
    time: "06.00 - 07.00",
    title: "Power Lifting Class",
    desc: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Atque tempora illo placeat.",
  },
  {
    id: 3,
    icon: "/img/icon-3.png",
    trainerAvatar: "/img/testimonial-3.jpg",
    trainerName: "Paul Flavius",
    date: "Saturday",
    time: "06.00 - 07.00",
    title: "Body Building Class",
    desc: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Atque tempora illo placeat.",
  },
  {
    id: 4,
    icon: "/img/icon-4.png",
    trainerAvatar: "/img/testimonial-3.jpg",
    trainerName: "Paul Flavius",
    date: "Saturday",
    time: "06.00 - 07.00",
    title: "Aerobics & Skipping Class",
    desc: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Atque tempora illo placeat.",
  },
  {
    id: 5,
    icon: "/img/icon-5.png",
    trainerAvatar: "/img/testimonial-3.jpg",
    trainerName: "Paul Flavius",
    date: "Saturday",
    time: "06.00 - 07.00",
    title: "Boxing Class",
    desc: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Atque tempora illo placeat.",
  },
  {
    id: 6,
    icon: "/img/icon-6.png",
    trainerAvatar: "/img/testimonial-3.jpg",
    trainerName: "Paul Flavius",
    date: "Saturday",
    time: "06.00 - 07.00",
    title: "Cardio Class",
    desc: "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Atque tempora illo placeat.",
  },
];

export default function Classes() {
  useEffect(() => {
    AOS.init({ once: true, duration: 600 });
  }, []);

  return (
    <>
      {/* (Tuỳ chọn) Page header riêng cho trang Classes */}
      {/* <div className="container-fluid bg-dark py-5 mb-5">
        <div className="container text-white">
          <h1 className="display-4 mb-0">Our Classes</h1>
        </div>
      </div> */}

      {/* Courses Start */}
      <div className="container-fluid courses overflow-hidden py-5">
        <div className="container py-5">
          <div
            className="text-center mx-auto pb-5"
            data-aos="fade-up"
            style={{ maxWidth: 800 }}
          >
            <h4 className="text-primary">Our Courses</h4>
            <h1 className="display-4 text-white mb-4">Out Our Highlights Below</h1>
            <p className="text-white mb-0">
              Lorem ipsum dolor, sit amet consectetur adipisicing elit. Tenetur
              adipisci facilis cupiditate recusandae aperiam temporibus corporis
              itaque quis facere, numquam, ad culpa deserunt sint dolorem autem
              obcaecati, ipsam mollitia hic.
            </p>
          </div>

          <div className="row gy-4 gx-0 justify-content-center">
            {COURSES.map((c, idx) => (
              <div
                key={c.id}
                className="col-md-6 col-lg-4"
                data-aos="fade-up"
                data-aos-delay={(idx % 3) * 200}
              >
                <div className="courses-item">
                  <div className="courses-item-inner p-4">
                    <div className="d-flex justify-content-between mb-4">
                      <div className="courses-icon-img p-3">
                        <img src={c.icon} className="img-fluid" alt="" />
                      </div>

                      <div className="data-info d-flex flex-column">
                        <div className="courses-trainer d-flex align-items-center mb-1">
                          <div className="me-2" style={{ width: 25, height: 25 }}>
                            <img
                              src={c.trainerAvatar}
                              className="img-fluid rounded-circle"
                              alt={c.trainerName}
                            />
                          </div>
                          <p className="mb-0">{c.trainerName}</p>
                        </div>
                        <div className="courses-date">
                          <p className="mb-1">Date: {c.date}</p>
                          <p className="mb-0">Time: {c.time}</p>
                        </div>
                      </div>
                    </div>

                    <a href="#" className="d-inline-block h4 mb-3">
                      {c.title}
                    </a>
                    <p className="mb-4">{c.desc}</p>

                    <a href="#" className="btn btn-primary py-2 px-4">
                      <span>Read More</span>
                    </a>
                  </div>
                </div>
              </div>
            ))}

            <div className="col-12 text-center" data-aos="fade-up">
              <a href="#" className="btn btn-primary py-3 px-5">
                <span>More Courses</span>
              </a>
            </div>
          </div>
        </div>
      </div>
      {/* Courses End */}
    </>
  );
}
