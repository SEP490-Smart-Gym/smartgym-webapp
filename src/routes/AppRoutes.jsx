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
import TrainerDetail from "../pages/TrainerDetail.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Forbidden from "../pages/Forbidden.jsx";

// Route bảo vệ
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminPackages from "../pages/admin/AdminPackages.jsx";

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
