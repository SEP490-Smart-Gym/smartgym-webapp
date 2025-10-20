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

// Profiles
import ProfileMember from "../pages/Member/ProfileMember.jsx";
import ProfileManager from "../pages/Manager/ProfileManager.jsx";
import ProfileStaff from "../pages/Staff/Profile.jsx";
import ProfileTrainer from "../pages/Trainer/Profile.jsx";
import ProfileAdmin from "../pages/Admin/ProfileAdmin.jsx";

import TrainerDetail from "../pages/Member/TrainerDetail.jsx";
import TrainerList from "../pages/Member/TrainerList.jsx";

import PackageList from "../pages/Member/PackageList.jsx";
import PackageDetail from "../pages/Member/PackageDetail.jsx";

// Route bảo vệ
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminPackages from "../pages/admin/AdminPackages.jsx";
import AdminTrainerList from "../pages/admin/AdminTrainerList.jsx";
import EquipmentList from "../pages/admin/EquipmentList.jsx";

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
        
        <Route path="contact" element={<Contact />} />
        <Route path="403" element={<Forbidden />} />

          {/* Các trang chính */}
          <Route path="/about" element={<About />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/contact" element={<Contact />} />

          {/* Profile */}
          <Route path="profile/member" element={<ProfileMember />} />
          <Route path="profile/manager" element={<ProfileManager />} />
          <Route path="profile/staff" element={<ProfileStaff />} />
          <Route path="profile/trainer" element={<ProfileTrainer />} />
          <Route path="profile/admin" element={<ProfileAdmin />} />


          {/* Trainer */}
          <Route path="/trainers" element={<TrainerList />} />
          <Route path="trainer/:id" element={<TrainerDetail />} />


          {/* Packages */}
          <Route path="/packages" element={<PackageList />} />
          <Route path="/packages/:id" element={<PackageDetail />} />

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
          <Route path="/admin/equipments" element={<EquipmentList />} />
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
