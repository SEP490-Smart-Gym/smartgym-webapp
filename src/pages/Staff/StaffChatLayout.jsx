import { Outlet } from "react-router-dom";
import StaffChatList from "./StaffChatList";

export default function StaffChatLayout() {
  return (
    <div className="container-fluid p-0" style={{ height: "100vh" }}>
      <div className="row h-100 g-0">
        {/* LEFT - CHAT LIST */}
        <div
          className="col-12 col-md-4 col-lg-3 border-end"
          style={{ height: "100vh", overflow: "hidden" }}
        >
          <StaffChatList />
        </div>

        {/* RIGHT - CHAT CONTENT */}
        <div className="col-12 col-md-8 col-lg-9 h-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
