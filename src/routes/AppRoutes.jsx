import { Routes, Route, Outlet } from "react-router-dom";

// Layout
import Navbar from "../components/Navbar.jsx";
import Footer from "../components/Footer.jsx";

// Pages (public)
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
import ProfileAdmin from "../pages/admin/ProfileAdmin.jsx";

import ManageSchedule from "../pages/Manager/Schedule.jsx";
import StaffSchedule from "../pages/Staff/Schedule.jsx";

// Member pages
import TrainerDetail from "../pages/Member/TrainerDetail.jsx";
import TrainerList from "../pages/Member/TrainerList.jsx";
import CartComponent from "../pages/Member/Payment.jsx";
import MyPackage from "../pages/Member/MyPackage.jsx";
import PackageList from "../pages/Member/PackageList.jsx";
import PackageDetail from "../pages/Member/PackageDetail.jsx";
import TrainerSchedule from "../pages/Member/Schedule.jsx";
import Payment from "../pages/Member/Payment.jsx";
import ChatBot from "../pages/Member/ChatBox.jsx";

// Admin pages
import AdminPackages from "../pages/admin/AdminPackages.jsx";
import AdminTrainerList from "../pages/admin/AdminTrainerList.jsx";
import EquipmentList from "../pages/admin/EquipmentList.jsx";
import AdminMemberList from "../pages/admin/AdminMemberList.jsx";
import AdminStaffList from "../pages/admin/AdminStaffList.jsx";
import StaffEquipmentList from "../pages/Staff/StaffEquipmentList.jsx";
import TimeSlot from "../pages/admin/SettingTimeSlot.jsx";

// Guard
import ProtectedRoute from "./ProtectedRoute.jsx";
import AdminVoucher from "../pages/admin/AdminVoucher.jsx";
import AdminManagerList from "../pages/admin/AdminManagerList.jsx";
import EquipmentRepairPending from "../pages/Manager/EquipmentRepairPending.jsx";
import ManagerAllRepairReports from "../pages/Manager/ManagerAllRepairReports.jsx";
import StaffMyRepairReports from "../pages/Staff/StaffMyRepairReports.jsx";
import ManagerCreateMaintenanceSchedule from "../pages/Manager/ManagerCreateMaintenanceSchedule.jsx";
import StaffUpcomingMaintenance from "../pages/Staff/StaffUpcomingMaintenance.jsx";

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
        {/* ===== Public ===== */}
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
        {/* Các trang chính */}
        <Route path="/about" element={<About />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/contact" element={<Contact />} />
        {/* Profile */}
        <Route path="profile/manager" element={<ProfileManager />} />
        <Route path="profile/staff" element={<ProfileStaff />} />
        <Route path="profile/trainer" element={<ProfileTrainer />} />
        <Route path="profile/admin" element={<ProfileAdmin />} />
        <Route path="/403" element={<Forbidden />} />

        <Route path="/about" element={<About />} />
        <Route path="/classes" element={<Classes />} /> {/* Public listing (nếu cần) */}
        <Route path="/contact" element={<Contact />} />

        {/* Trainers (public danh sách & chi tiết nếu bạn muốn) */}
        <Route path="/trainers" element={<TrainerList />} />
        <Route path="/trainer/:id" element={<TrainerDetail />} />

        {/* Packages (public) */}
        <Route path="/packages" element={<PackageList />} />
        <Route path="/packages/:id" element={<PackageDetail />} />

        {/* Cart: đổi sang /cart/:id để tránh đè các route có :id khác */}
        <Route path="/cart/:id" element={<CartComponent />} />

        {/* Member schedule (public-accessible path nếu muốn, hoặc chuyển vào group member) */}
        <Route path="/member/:id/schedule" element={<TrainerSchedule />} />

        {/* ===== Member protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Member"]} />}>
          {/* Dùng đường dẫn tuyệt đối với prefix /member/... */}
          <Route path="/member/profile" element={<ProfileMember />} />
          <Route path="/member/mypackages" element={<MyPackage />} />
          <Route path="/:id/cart/:id" element={<Payment />} />
          <Route path="/chatbot/:id" element={<ChatBot />} />
          {/* Nếu muốn lớp học riêng cho member: */}
          {/* <Route path="/member/classes" element={<Classes />} /> */}
        </Route>

        {/* ===== Trainer protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Trainer"]} />}>
          {/* Trang profile trainer riêng */}
          <Route path="/trainer/profile" element={<ProfileTrainer />} />
          {/* Nếu muốn schedule riêng cho trainer: */}
          <Route path="/trainer/:id/schedule" element={<TrainerSchedule />} />
        </Route>

        {/* ===== Staff protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Staff"]} />}>
          <Route path="staff/dashboard" element={<Home />} />
          <Route path="staff/equipmentlist" element={<StaffEquipmentList />} />
          <Route path="/staff/dashboard" element={<Home />} />
          <Route path="/profile/staff" element={<ProfileStaff />} />
          <Route path="/staff/schedule" element={<StaffSchedule />} />
          <Route path="/staff/myreports" element={<StaffMyRepairReports />} />
          <Route path="/staff/upcomingschedule" element={<StaffUpcomingMaintenance />} />

        </Route>

        {/* ===== Admin protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin/dashboard" element={<Home />} />
          <Route path="/admin/profile" element={<ProfileAdmin />} />
          <Route path="/admin/packages" element={<AdminPackages />} />
          <Route path="/admin/trainers" element={<AdminTrainerList />} />
          <Route path="/admin/equipments" element={<EquipmentList />} />
          <Route path="/admin/members" element={<AdminMemberList />} />
          <Route path="/admin/staffs" element={<AdminStaffList />} />
          <Route path="/admin/managers" element={<AdminManagerList />} />
          <Route path="/admin/vouchers" element={<AdminVoucher />} />
          <Route path="/admin/timeslot" element={<TimeSlot />} />
        </Route>

        {/* ===== Manager protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
          <Route path="/manager/overview" element={<Home />} />
          <Route path="/manager/equipment-report-pending" element={<EquipmentRepairPending />} />
          <Route path="/manager/equipment-report-all" element={<ManagerAllRepairReports />} />
          <Route path="/manager/equipment-create-maintain" element={<ManagerCreateMaintenanceSchedule />} />
          <Route path="/profile/manager" element={<ProfileManager />} />
          <Route path="/manager/schedule" element={<ManageSchedule />} />
        </Route>

        {/* 404 cuối cùng trong layout */}
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}