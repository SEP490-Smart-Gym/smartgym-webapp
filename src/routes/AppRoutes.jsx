import { Routes, Route, Outlet } from "react-router-dom";

// Layout
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

// Pages
import Home from "../pages/Home.jsx";
import About from "../pages/About.jsx";
import Classes from "../pages/Classes.jsx";
import Contact from "../pages/Contact.jsx";
import NotFound from "../pages/NotFound.jsx";

import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Forbidden from "../pages/Forbidden.jsx";

import ProfileMember from "../pages/Member/ProfileMember.jsx";
import TrainerDetail from "../pages/Member/TrainerDetail.jsx";

// Route bảo vệ
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminPackages from "../pages/admin/AdminPackages.jsx";
import AdminTrainerList from "../pages/admin/AdminTrainerList.jsx";

function Layout() {
  return (
    <>
      <Navbar />
      <main className="min-vh-100">
        <Outlet />
      </main>
      <Footer />
    </>
  );
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Trang public */}
        <Route index element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="403" element={<Forbidden />} />

          {/* Các trang chính */}
          <Route path="/about" element={<About />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/contact" element={<Contact />} />

          {/* Các link còn lại trong navbar
              -> Khi bạn có trang thật, mở comment và thay <Home /> bằng component tương ứng */}
          <Route path="course" element={<Home />} />
          <Route path="blog" element={<Home />} />
          <Route path="team" element={<Home />} />
          <Route path="feature" element={<Home />} />
          <Route path="testimonial" element={<Home />} />

          {/* Profile member */}
          <Route path="profile/member" element={<ProfileMember />} />

          {/* Trainer detail */}
          <Route path="trainer/:id" element={<TrainerDetail />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />

        {/* Route dành cho member (hội viên) */}
        <Route element={<ProtectedRoute allowedRoles={["member"]} />}>
          <Route path="classes" element={<Classes />} />

        </Route>

        {/* Route dành cho trainer */}
        <Route element={<ProtectedRoute allowedRoles={["trainer"]} />}>
          <Route path="trainer/:id" element={<TrainerDetail />} />
        </Route>

        {/* Route dành cho staff */}
        <Route element={<ProtectedRoute allowedRoles={["staff"]} />}>
          <Route path="staff/dashboard" element={<Home />} />
        </Route>

        {/* Route dành cho admin */}
        <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
          <Route path="admin/dashboard" element={<Home />} />
          <Route path="admin/packages" element={<AdminPackages />} />
          <Route path="/admin/trainers" element={<AdminTrainerList />} />
        </Route>

        {/* Route dành cho manager */}
        <Route element={<ProtectedRoute allowedRoles={["manager"]} />}>
          <Route path="manager/overview" element={<Home />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
