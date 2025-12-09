import { useEffect, useState } from "react";
import AOS from "aos";

export default function Contact() {
  useEffect(() => {
    AOS.init({ once: true, duration: 600 });
  }, []);

  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState({ type: "", msg: "" });

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: "", msg: "" });

    // validate đơn giản
    if (!form.name || !form.email || !form.message) {
      setStatus({ type: "danger", msg: "Vui lòng điền đủ Tên, Email và Nội dung." });
      return;
    }

    try {
      setSending(true);

      // TODO: gọi API thật của .NET backend (ví dụ /api/contact)
      // const res = await fetch("/api/contact", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(form),
      // });
      // if (!res.ok) throw new Error("Gửi thất bại");
      // const data = await res.json();

      // Demo giả lập
      await new Promise((r) => setTimeout(r, 900));

      setStatus({ type: "success", msg: "Đã gửi liên hệ thành công. Cảm ơn bạn!" });
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch (err) {
      setStatus({ type: "danger", msg: "Có lỗi khi gửi. Vui lòng thử lại." });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      {/* (Tuỳ chọn) Page header */}
      {/* <div className="container-fluid bg-dark py-5 mb-5">
        <div className="container text-white">
          <h1 className="display-4 mb-0">Contact</h1>
        </div>
      </div> */}

      <div className="container py-5">
        <div className="row g-4 mb-5">
          {/* Info boxes */}
          <div className="col-md-4" data-aos="fade-up">
            <div className="h-100 p-4 border rounded-3 bg-light">
              <div className="d-flex">
                <i className="fas fa-map-marker-alt text-primary me-3 fa-2x"></i>
                <div>
                  <h5 className="mb-1">Địa chỉ</h5>
                  <p className="mb-0">123 Street, New York</p>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4" data-aos="fade-up" data-aos-delay="150">
            <div className="h-100 p-4 border rounded-3 bg-light">
              <div className="d-flex">
                <i className="fas fa-envelope text-primary me-3 fa-2x"></i>
                <div>
                  <h5 className="mb-1">Email</h5>
                  <a href="mailto:info@example.com" className="text-decoration-none">info@example.com</a>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4" data-aos="fade-up" data-aos-delay="300">
            <div className="h-100 p-4 border rounded-3 bg-light">
              <div className="d-flex">
                <i className="fa fa-phone-alt text-primary me-3 fa-2x"></i>
                <div>
                  <h5 className="mb-1">Điện thoại</h5>
                  <a href="tel:+01234567890" className="text-decoration-none">(+012) 3456 7890 123</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Map (tuỳ chọn) */}
        <div className="mb-5" data-aos="zoom-in">
          <div className="ratio ratio-21x9 rounded-3 overflow-hidden">
            <iframe
              title="Map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3918.609941530484!2d106.80730807451786!3d10.841132857997911!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752731176b07b1%3A0xb752b24b379bae5e!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBGUFQgVFAuIEhDTQ!5e0!3m2!1svi!2s!4v1765275318647!5m2!1svi!2s" width="600" height="450" style="border:0;" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              style={{ border: 0 }}
              allowFullScreen
            />
          </div>
        </div>

        {/* Contact form */}
        <div className="row g-5">
          <div className="col-lg-7" data-aos="fade-right">
            <h2 className="mb-4">Gửi thông tin liên hệ</h2>

            {status.msg && (
              <div className={`alert alert-${status.type}`} role="alert">
                {status.msg}
              </div>
            )}

            <form onSubmit={onSubmit} className="row g-3">
              <div className="col-md-6">
                <label htmlFor="name" className="form-label">Tên *</label>
                <input
                  id="name"
                  name="name"
                  className="form-control"
                  placeholder="Nguyễn Văn A"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="col-md-6">
                <label htmlFor="email" className="form-label">Email *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="col-12">
                <label htmlFor="subject" className="form-label">Chủ đề</label>
                <input
                  id="subject"
                  name="subject"
                  className="form-control"
                  placeholder="Nội dung chính"
                  value={form.subject}
                  onChange={onChange}
                />
              </div>
              <div className="col-12">
                <label htmlFor="message" className="form-label">Nội dung *</label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  className="form-control"
                  placeholder="Mô tả yêu cầu của bạn..."
                  value={form.message}
                  onChange={onChange}
                  required
                />
              </div>
              <div className="col-12">
                <button className="btn btn-primary px-4" disabled={sending}>
                  {sending ? "Đang gửi..." : "Gửi liên hệ"}
                </button>
              </div>
            </form>
          </div>

          {/* Side info / giờ mở cửa */}
          <div className="col-lg-5" data-aos="fade-left">
            <div className="p-4 bg-light rounded-3 h-100">
              <h4 className="mb-3">Giờ mở cửa</h4>
              <ul className="list-unstyled mb-4">
                <li className="d-flex justify-content-between border-bottom py-2">
                  <span>Mon - Fri</span><strong>08:00 - 20:00</strong>
                </li>
                <li className="d-flex justify-content-between border-bottom py-2">
                  <span>Saturday</span><strong>08:00 - 18:00</strong>
                </li>
                <li className="d-flex justify-content-between py-2">
                  <span>Sunday</span><strong>Closed</strong>
                </li>
              </ul>

              <h4 className="mb-3">Theo dõi chúng tôi</h4>
              <div className="d-flex">
                <a className="btn btn-primary btn-sm-square me-2" href="#"><i className="fab fa-facebook-f"></i></a>
                <a className="btn btn-primary btn-sm-square me-2" href="#"><i className="fab fa-twitter"></i></a>
                <a className="btn btn-primary btn-sm-square me-2" href="#"><i className="fab fa-instagram"></i></a>
                <a className="btn btn-primary btn-sm-square" href="#"><i className="fab fa-linkedin-in"></i></a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
