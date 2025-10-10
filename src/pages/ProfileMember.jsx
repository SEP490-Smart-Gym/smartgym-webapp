import React, { useState } from "react";
import {
  Bell,
  CreditCard,
  Lock,
  Shapes,
  Upload,
  Users,
  Trash2,
} from "lucide-react"; // Dùng icon từ lucide-react

function ProfileMember() {
  const [selected, setSelected] = useState("Account");

  const menuItems = [
    {
      title: "Personal",
      items: [
        { label: "Account", icon: null },
        { label: "API Keys", icon: <Lock size={18} /> },
        { label: "Notifications", icon: <Bell size={18} /> },
      ],
    },
    {
      title: "Workspace",
      items: [
        { label: "Billing", icon: <CreditCard size={18} /> },
        { label: "Integrations", icon: <Shapes size={18} /> },
        { label: "Team Members", icon: <Users size={18} /> },
      ],
    },
  ];

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 px-4">
      <div className="w-full max-w-3xl bg-white rounded-xl shadow-lg p-10 flex flex-col gap-12 mx-auto">
        {/* PROFILE SECTION */}
        <section className="flex flex-col gap-6">
          <h3 className="text-xl font-semibold text-center">Profile</h3>

          {/* Avatar */}
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <div className="flex flex-col items-center justify-center gap-3 text-center">
                <img
                    src="https://res.cloudinary.com/subframe/image/upload/v1711417513/shared/kwut7rhuyivweg8tmyzl.jpg"
                    alt="avatar"
                    className="w-24 h-24 rounded-full object-cover border shadow-sm"
                />
            </div>
            
            {/* Nút upload nằm ngay dưới avatar */}
            <button className="flex items-center justify-center gap-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md">
                <Upload size={16} /> Upload
            </button>
          </div>


          {/* Name + Email */}
          <div className="flex flex-col items-center justify-center gap-4 text-center bg-white p-6 rounded-xl shadow-md w-full max-w-md text-black">
            {/* First Name */}
            <div className="w-full text-left">
                <label className="block text-sm font-medium text-black mb-1">
                First name
                </label>
                <input
                type="text"
                placeholder="Josef"
                className="w-full border border-gray-300 rounded-lg bg-white p-2.5 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
            </div>

            {/* Last Name */}
            <div className="w-full text-left">
                <label className="block text-sm font-medium text-black mb-1">
                Last name
                </label>
                <input
                type="text"
                placeholder="Albers"
                className="w-full border border-gray-300 rounded-lg bg-white p-2.5 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
            </div>

            {/* Email */}
            <div className="w-full text-left">
                <label className="block text-sm font-medium text-black mb-1">
                Email
                </label>
                <input
                type="email"
                placeholder="josef@subframe.com"
                className="w-full border border-gray-300 rounded-lg bg-white p-2.5 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                />
            </div>
         </div>
        </section>

        <hr className="border-gray-200" />

        {/* PASSWORD SECTION */}
        <section className="flex flex-col gap-6">
          <h3 className="text-xl font-semibold text-center">Password</h3>

          <div>
            <label className="text-sm font-medium">Current password</label>
            <input
              type="password"
              placeholder="Enter current password"
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium">New password</label>
            <input
              type="password"
              placeholder="Enter new password"
              className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <p className="text-xs text-gray-500 mt-1">
              Your password must have at least 8 characters, include one
              uppercase letter, and one number.
            </p>
          </div>

          <div>
            <input
              type="password"
              placeholder="Re-type new password"
              className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 mx-auto w-full sm:w-1/2">
            Change password
          </button>
        </section>

        <hr className="border-gray-200" />

        {/* DANGER ZONE */}
        <section className="flex flex-col gap-4">
          <h3 className="text-xl font-semibold text-center text-red-600">
            Danger Zone
          </h3>

          <div className="flex flex-col sm:flex-row justify-between items-center border border-red-300 bg-red-50 rounded-md p-4 gap-4">
            <div className="text-center sm:text-left">
              <h4 className="font-medium text-red-700">Delete account</h4>
              <p className="text-sm text-red-500">
                Permanently remove your account. This action cannot be reversed.
              </p>
            </div>
            <button className="flex items-center gap-1 px-4 py-2 border border-red-500 text-red-600 rounded-md hover:bg-red-100">
              <Trash2 size={16} /> Delete
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ProfileMember;