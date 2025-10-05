import { BrowserRouter, Routes, Route, Outlet } from "react-router-dom";
// import ScrollToTop from "./ScrollToTop.jsx";

// Layout chung
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

// Pages
import Home from "../pages/Home.jsx";
import About from "../pages/About.jsx";
import Classes from "../pages/Classes.jsx";
import Contact from "../pages/Contact.jsx";
import NotFound from "../pages/NotFound.jsx";
import Login from "../pages/Login.jsx";

// (Tuỳ chọn) Nếu bạn có các trang này, import vào; chưa có thì để tạm về Home hoặc tạo stub sau
// import Course from "../pages/Course.jsx";
// import Blog from "../pages/Blog.jsx";
// import Team from "../pages/Team.jsx";
// import Feature from "../pages/Feature.jsx";
// import Testimonial from "../pages/Testimonial.jsx";

function Layout() {
  return (
    <>
      <Navbar />
      {/* giữ min-vh-100 cho nội dung không “dính” footer */}
      <main className="min-vh-100">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      {/* <ScrollToTop /> */}
      <Routes>
        <Route element={<Layout />}>
          {/* Trang chủ */}
          <Route index element={<Home />} />
          <Route path="/login" element={<Login />} />

          {/* Các trang chính */}
          <Route path="about" element={<About />} />
          <Route path="classes" element={<Classes />} />
          <Route path="contact" element={<Contact />} />

          {/* Các link còn lại trong navbar
              -> Khi bạn có trang thật, mở comment và thay <Home /> bằng component tương ứng */}
          <Route path="course" element={<Home />} />
          <Route path="blog" element={<Home />} />
          <Route path="team" element={<Home />} />
          <Route path="feature" element={<Home />} />
          <Route path="testimonial" element={<Home />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
