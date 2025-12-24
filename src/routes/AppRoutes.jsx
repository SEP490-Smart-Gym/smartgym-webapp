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
import ResetPassword from "../pages/reset-password.jsx";

// Profiles
import ProfileMember from "../pages/Member/ProfileMember.jsx";
import ProfileManager from "../pages/Manager/ProfileManager.jsx";
import ProfileStaff from "../pages/Staff/Profile.jsx";
import ProfileTrainer from "../pages/Trainer/Profile.jsx";
import ProfileAdmin from "../pages/admin/ProfileAdmin.jsx";


// Member pages
import TrainerDetail from "../pages/Member/TrainerDetail.jsx";
import TrainerList from "../pages/Member/TrainerList.jsx";
import CartComponent from "../pages/Member/Payment.jsx";
import MyPackage from "../pages/Member/MyPackage.jsx";
import PackageList from "../pages/Member/PackageList.jsx";
import PackageDetail from "../pages/Member/PackageDetail.jsx";
import TrainerSchedule from "../pages/Member/Schedule.jsx";
import Payment from "../pages/Member/Payment.jsx";
import MemberVoucherList from "../pages/Member/Voucher.jsx";
import PaymentHistory from "../pages/Member/MyPayment.jsx";
import PaymentPage from "../pages/Member/PaymentCont.jsx";
import ExtraPoint from "../pages/Member/ExtraPoint.jsx";
import WorkoutMealPlan from "../pages/Member/WorkoutMealPlan.jsx";
import RewardGifts from "../pages/Member/RewardGifts.jsx";

// Admin pages
import AdminPackages from "../pages/admin/AdminPackages.jsx";
import AdminTrainerList from "../pages/admin/AdminTrainerList.jsx";
import EquipmentList from "../pages/admin/EquipmentList.jsx";
import AdminMemberList from "../pages/admin/AdminMemberList.jsx";
import AdminStaffList from "../pages/admin/AdminStaffList.jsx";
import StaffEquipmentList from "../pages/Staff/StaffEquipmentList.jsx";
import TimeSlot from "../pages/admin/SettingTimeSlot.jsx";
import AdminVoucher from "../pages/admin/AdminVoucher.jsx";
import AdminManagerList from "../pages/admin/AdminManagerList.jsx";
import AdminPromotionGifts from "../pages/admin/ManagePromotion.jsx";

// Staff
import ProtectedRoute from "./ProtectedRoute.jsx";
import StaffMyRepairReports from "../pages/Staff/StaffMyRepairReports.jsx";
import StaffMaintenance from "../pages/Staff/StaffMaintenance.jsx";
import StaffSchedule from "../pages/Staff/Schedule.jsx";
import StaffRewardRedemptions from "../pages/Staff/RewardRedemptions.jsx";


//Manager pages
import RefundManagement from "../pages/Manager/ManageRefund.jsx";
import ManagerCreateMaintenanceSchedule from "../pages/Manager/ManagerCreateMaintenanceSchedule.jsx";
import EquipmentRepairPending from "../pages/Manager/EquipmentRepairPending.jsx";
import ManagerAllRepairReports from "../pages/Manager/ManagerAllRepairReports.jsx";
import ManageSchedule from "../pages/Manager/Schedule.jsx";

//Trainer
import ScheduleTrainer from "../pages/Trainer/Schedule.jsx";
import ManageMember from "../pages/Trainer/ManageMember.jsx";
import TrainerChatList from "../pages/Trainer/TrainerChatList.jsx";
import AdminDashboard from "../pages/admin/AdminDashboard.jsx";
import ManagerDashboard from "../pages/Manager/ManagerDashboard.jsx";


//Chat
import ChatBox from "../pages/chat/ChatBox.jsx";
import ChatList from "../pages/chat/ChatList.jsx";
import EmptyChat from "../pages/chat/EmptyChat.jsx";
import ChatLayout from "../pages/chat/ChatLayout.jsx";
import ConfirmEmail from "../pages/ConfirmEmail.jsx";


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
function AuthLayout() {
  return (
    <main className="min-vh-100">
      <Outlet />
    </main>
  );
}
function AdminLayout() {
  return (
    <>
      <Navbar />
      <main className="min-vh-100">
        <Outlet />
      </main>
    </>
  );
}


export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== AUTH (NO NAVBAR / FOOTER) ===== */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
      </Route>
      {/* ===== MAIN LAYOUT ===== */}
      <Route element={<Layout />}>
        {/* ===== Public ===== */}
        <Route index element={<Home />} />



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
          <Route path="/member/profile" element={<ProfileMember />} />
          <Route path="/member/mypackages" element={<MyPackage />} />
          <Route path="/:id/cart/:id" element={<Payment />} />
          <Route path="/member/voucher" element={<MemberVoucherList />} />
          <Route path="/member/my-payments" element={<PaymentHistory />} />
          <Route path="/member/payment/:id" element={<PaymentPage />} />
          <Route path="/member/points-history" element={<ExtraPoint />} />
          <Route path="/member/workout-meal-plan" element={<WorkoutMealPlan />} />
          <Route path="/member/reward-gifts" element={<RewardGifts />} />
          <Route path="/member/chat" element={<ChatLayout />}>
            <Route index element={<EmptyChat />} />
            <Route path=":conversationId" element={<ChatBox />} />
          </Route>
        </Route>


        {/* 404 cuối cùng trong layout */}
        <Route path="*" element={<NotFound />} />
      </Route>
      <Route element={<AdminLayout />}>
        {/* ===== Admin protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
          <Route path="/admin/profile" element={<ProfileAdmin />} />
          <Route path="/admin/packages" element={<AdminPackages />} />
          <Route path="/admin/trainers" element={<AdminTrainerList />} />
          <Route path="/admin/equipments" element={<EquipmentList />} />
          <Route path="/admin/members" element={<AdminMemberList />} />
          <Route path="/admin/staffs" element={<AdminStaffList />} />
          <Route path="/admin/managers" element={<AdminManagerList />} />
          <Route path="/admin/vouchers" element={<AdminVoucher />} />
          <Route path="/admin/timeslot" element={<TimeSlot />} />
          <Route path="/admin/promotion-gifts" element={<AdminPromotionGifts />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
        {/* ===== Trainer protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Trainer"]} />}>
          <Route path="/trainer/profile" element={<ProfileTrainer />} />
          <Route path="/trainer/:id/schedule" element={<ScheduleTrainer />} />
          <Route path="/trainer/member-list" element={<ManageMember />} />
          <Route path="/trainer/chat" element={<ChatLayout />}>
            <Route index element={<EmptyChat />} />
            <Route path=":conversationId" element={<ChatBox />} />
          </Route>
        </Route>

        {/* ===== Staff protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Staff"]} />}>
          <Route path="/staff/dashboard" element={<Home />} />
          <Route path="/staff/equipmentlist" element={<StaffEquipmentList />} />
          <Route path="/staff/schedule" element={<StaffSchedule />} />
          <Route path="/staff/myreports" element={<StaffMyRepairReports />} />
          <Route path="/staff/equipmentschedule" element={<StaffMaintenance />} />
          <Route path="/staff/reward-redemption" element={<StaffRewardRedemptions />} />

          <Route path="/staff/chat" element={<ChatLayout />}>
            <Route index element={<EmptyChat />} />
            <Route path=":conversationId" element={<ChatBox />} />
          </Route>
        </Route>
        {/* ===== Manager protected ===== */}
        <Route element={<ProtectedRoute allowedRoles={["Manager"]} />}>
          <Route path="/manager/overview" element={<Home />} />
          <Route path="/manager/equipment-report-pending" element={<EquipmentRepairPending />} />
          <Route path="/manager/equipment-report-all" element={<ManagerAllRepairReports />} />
          <Route path="/manager/equipment-create-maintain" element={<ManagerCreateMaintenanceSchedule />} />
          <Route path="/profile/manager" element={<ProfileManager />} />
          <Route path="/manager/schedule" element={<ManageSchedule />} />
          <Route path="/manager/manager-refund" element={<RefundManagement />} />
          <Route path="/manager/dashboard" element={<ManagerDashboard />} />
        </Route>
      </Route>
    </Routes>
  );
}