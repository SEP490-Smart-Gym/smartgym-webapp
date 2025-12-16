import {
  Button,
  Card,
  CardHeader,
  CardBody,
  FormGroup,
  Form,
  Input,
  Container,
  Row,
  Col,
  Label,
} from "reactstrap";
// core components
import React, { useEffect, useState, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { HiArrowUpTray } from "react-icons/hi2";
import { FcPhone } from "react-icons/fc";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";
import { message } from "antd";

const ProfileMember = () => {
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  // 👉 Tab đang chọn: "user" | "health" | "password"
  const [activeSection, setActiveSection] = useState("user");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // State chung cho cả User + Health
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    birthday: "", // dd/MM/yyyy
    email: "",
    phone: "",
    address: "",
    canNang: "",
    chieuCao: "",
    gioiTinh: "",
    mucTieu: "",
    sucKhoe: "",
    bmi: "",
  });

  // 👉 State cho Reset Password
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  /** ================== VALIDATORS ================== */
  const isValidEmail = (email) => {
    if (!email) return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  };

  // chấp nhận 0xxxxxxxxx hoặc +84xxxxxxxxx
  const isValidVNPhone = (phone) => {
    if (!phone) return false;
    const p = String(phone).trim();
    return /^(0\d{9}|\+84\d{9})$/.test(p);
  };

  // 👉 Chuyển string dd/MM/yyyy -> Date (cho react-datepicker)
  const toDateFromDDMMYYYY = (s) => {
    if (!s) return null;
    const [dd, mm, yyyy] = String(s).split("/");
    if (!dd || !mm || !yyyy) return null;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d) ? null : d;
  };

  // 👉 Chuyển Date -> string dd/MM/yyyy (lưu state)
  const toDDMMYYYY = (d) => {
    if (!(d instanceof Date) || isNaN(d)) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // 👉 dd/MM/yyyy -> yyyy-MM-dd (string thuần cho API, tránh timezone)
  const toApiDate = (s) => {
    if (!s) return null;
    const [dd, mm, yyyy] = String(s).split("/");
    if (!dd || !mm || !yyyy) return null;
    return `${yyyy}-${mm}-${dd}`;
  };

  // 👉 Tính tuổi từ birthday (dd/MM/yyyy)
  const calculateAge = (birthdayString) => {
    if (!birthdayString) return "";
    const [day, month, year] = String(birthdayString).split("/").map(Number);
    if (!day || !month || !year) return "";
    const today = new Date();
    let age = today.getFullYear() - year;
    const hasHadBirthday =
      today.getMonth() + 1 > month ||
      (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!hasHadBirthday) age--;
    return age >= 0 ? age : "";
  };

  /** ================== BMI AUTO ================== */
  useEffect(() => {
    const { canNang, chieuCao } = userInfo;
    if (canNang !== "" && chieuCao !== "") {
      const weight = Number(canNang);
      const height = Number(chieuCao);
      if (!isNaN(weight) && !isNaN(height) && height > 0) {
        const heightInMeters = height / 100;
        const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
        setUserInfo((prev) => ({ ...prev, bmi }));
      } else {
        setUserInfo((prev) => ({ ...prev, bmi: "" }));
      }
    } else {
      setUserInfo((prev) => ({ ...prev, bmi: "" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo.canNang, userInfo.chieuCao]);

  /** ================== AVATAR UPLOAD ================== */
  const handleButtonClick = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingKey = "upload-avatar";

    // Preview tạm
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    message.loading({
      content: "Đang tải ảnh lên...",
      key: loadingKey,
      duration: 0,
    });

    try {
      const formData = new FormData();

      // ✅ Swagger: File string($binary) => field name thường là "File"
      formData.append("File", file);

      const res = await api.post("/UserAccount/avatar/upload", formData, {
        // ✅ để axios tự set Content-Type + boundary
        // headers: { "Content-Type": "multipart/form-data" },
      });

      const newAvatarUrl =
        res.data?.profileImageUrl ||
        res.data?.url ||
        res.data?.data?.profileImageUrl ||
        localUrl;

      setUser((prev) => ({ ...(prev || {}), photo: newAvatarUrl }));

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.photo = newAvatarUrl;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      window.dispatchEvent(new Event("app-auth-changed"));

      message.success({
        content: "Cập nhật ảnh đại diện thành công!",
        key: loadingKey,
        duration: 2,
      });
    } catch (err) {
      console.error("Upload avatar failed:", err.response?.data || err);

      // fallback preview nếu fail
      setPreview(null);

      message.error({
        content: "Không thể tải ảnh lên, vui lòng thử lại!",
        key: loadingKey,
        duration: 3,
      });
    } finally {
      // ✅ cho phép chọn lại cùng 1 file (nếu user chọn y hệt)
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };


  const age = calculateAge(userInfo.birthday);

  /** ================== FETCH USER (TAB USER) ================== */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const fetchUserInfoFromApi = async () => {
      try {
        const res = await api.get("/UserAccount/me");
        const data = res.data;

        const fullNameFromApi = `${data.lastName || ""} ${data.firstName || ""}`.trim();

        let birthday = "";
        if (data.dateOfBirth) {
          const datePart = String(data.dateOfBirth).split("T")[0];
          const [yyyy, mm, dd] = datePart.split("-");
          if (dd && mm && yyyy) birthday = `${dd}/${mm}/${yyyy}`;
        }

        setUserInfo((prev) => ({
          ...prev,
          fullName: fullNameFromApi,
          email: data.email || "",
          phone: data.phoneNumber || "",
          address: data.address || "",
          birthday,
          // giới tính nằm ở tab sức khỏe -> fill ở fetch profile
        }));
      } catch (err) {
        if (err.response?.status === 401) {
          message.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
          navigate("/login");
          return;
        }
        console.error("Error fetching /UserAccount/me:", err);
        message.error("Không thể tải thông tin cá nhân. Vui lòng thử lại!");
      }
    };

    fetchUserInfoFromApi();
  }, [navigate]);

  /** ================== FETCH MEMBER PROFILE (TAB HEALTH) ================== */
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const fetchMemberProfile = async () => {
      try {
        const res = await api.get("/Profile/my-profile");
        const data = res.data;

        let gioiTinh = "";
        if (data.gender) {
          const g = String(data.gender).toLowerCase();
          if (g === "male") gioiTinh = "Nam";
          else if (g === "female") gioiTinh = "Nữ";
          else gioiTinh = "Khác";
        }

        setUserInfo((prev) => ({
          ...prev,
          canNang:
            data.weight !== null && data.weight !== undefined ? String(data.weight) : prev.canNang,
          chieuCao:
            data.height !== null && data.height !== undefined ? String(data.height) : prev.chieuCao,
          mucTieu: data.target ?? prev.mucTieu,
          sucKhoe: data.healthStatus ?? prev.sucKhoe,
          gioiTinh: gioiTinh || prev.gioiTinh,
        }));
      } catch (err) {
        if (err.response?.status === 401) {
          message.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
          return;
        }
        console.error("Error fetching /Profile/my-profile:", err);
        message.error("Không thể tải thông tin sức khỏe. Vui lòng thử lại!");
      }
    };

    fetchMemberProfile();
  }, []);

  /** ================== VALIDATE BEFORE UPDATE ================== */
  const validateUserUpdate = () => {
    const fullName = String(userInfo.fullName || "").trim();
    const birthdayStr = String(userInfo.birthday || "").trim();
    const email = String(userInfo.email || "").trim();
    const phone = String(userInfo.phone || "").trim();
    const address = String(userInfo.address || "").trim();

    if (!fullName) {
      message.error("Vui lòng nhập Họ tên.");
      return false;
    }

    if (!birthdayStr) {
      message.error("Vui lòng chọn Ngày sinh.");
      return false;
    }

    const dob = toDateFromDDMMYYYY(birthdayStr);
    if (!dob) {
      message.error("Ngày sinh không hợp lệ (dd/MM/yyyy).");
      return false;
    }

    if (dob > new Date()) {
      message.error("Ngày sinh không được lớn hơn ngày hiện tại.");
      return false;
    }

    if (!email) {
      message.error("Vui lòng nhập Email.");
      return false;
    }

    if (!isValidEmail(email)) {
      message.error("Email không đúng định dạng. Ví dụ: ten@gmail.com");
      return false;
    }

    if (!phone) {
      message.error("Vui lòng nhập Số điện thoại.");
      return false;
    }

    if (!isValidVNPhone(phone)) {
      message.error("Số điện thoại không đúng định dạng (vd: 0901234567 hoặc +84901234567).");
      return false;
    }

    if (!address) {
      message.error("Vui lòng nhập Địa chỉ.");
      return false;
    }

    return true;
  };

  const validateHealthUpdate = () => {
    // vì tab sức khỏe có gọi /UserAccount/update => yêu cầu đủ info user luôn
    if (!validateUserUpdate()) return false;

    const weight = userInfo.canNang;
    const height = userInfo.chieuCao;
    const gender = String(userInfo.gioiTinh || "").trim();
    const goal = String(userInfo.mucTieu || "").trim();
    const health = String(userInfo.sucKhoe || "").trim();

    if (weight === "" || weight === null || weight === undefined) {
      message.error("Vui lòng nhập Cân nặng.");
      return false;
    }
    if (Number.isNaN(Number(weight)) || Number(weight) <= 0) {
      message.error("Cân nặng không hợp lệ.");
      return false;
    }
    if (Number(weight) < 20 || Number(weight) > 300) {
      message.error("Cân nặng nên nằm trong khoảng 20–300 kg.");
      return false;
    }

    if (height === "" || height === null || height === undefined) {
      message.error("Vui lòng nhập Chiều cao.");
      return false;
    }
    if (Number.isNaN(Number(height)) || Number(height) <= 0) {
      message.error("Chiều cao không hợp lệ.");
      return false;
    }
    if (Number(height) < 80 || Number(height) > 250) {
      message.error("Chiều cao nên nằm trong khoảng 80–250 cm.");
      return false;
    }

    if (!gender) {
      message.error("Vui lòng chọn Giới tính.");
      return false;
    }

    if (!goal) {
      message.error("Vui lòng nhập Mục tiêu.");
      return false;
    }

    if (!health) {
      message.error("Vui lòng nhập Tình trạng sức khỏe.");
      return false;
    }

    return true;
  };

  /** ================== UPDATE USER INFO ================== */
  const handleUpdateUserInfo = async (e) => {
    e && e.preventDefault();
    if (!validateUserUpdate()) return;

    const loadingKey = "update-user";
    message.loading({ content: "Đang cập nhật thông tin cá nhân...", key: loadingKey, duration: 0 });

    try {
      const nameParts = String(userInfo.fullName || "")
        .trim()
        .split(" ")
        .filter(Boolean);
      const lastName = nameParts.length > 0 ? nameParts[0] : "";
      const firstName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const dateOfBirthApi = toApiDate(userInfo.birthday);

      const payload = {
        firstName,
        lastName,
        email: String(userInfo.email || "").trim(),
        phoneNumber: String(userInfo.phone || "").trim(),
        address: String(userInfo.address || "").trim(),
        dateOfBirth: dateOfBirthApi,
      };

      await api.put("/UserAccount/update", payload);

      // sync localStorage + state user
      const storedUser = localStorage.getItem("user");
      let newUser = user || {};
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.firstName = firstName;
        parsed.lastName = lastName;
        parsed.email = payload.email;
        parsed.phoneNumber = payload.phoneNumber;
        parsed.address = payload.address;
        newUser = parsed;
        localStorage.setItem("user", JSON.stringify(parsed));
      }
      setUser(newUser);
      window.dispatchEvent(new Event("app-auth-changed"));

      message.success({ content: "Cập nhật thông tin cá nhân thành công!", key: loadingKey, duration: 2 });
    } catch (err) {
      console.error("Error updating user info:", err.response?.data || err);
      const serverData = err.response?.data;
      const msg =
        serverData?.title ||
        serverData?.message ||
        (serverData ? JSON.stringify(serverData) : "") ||
        "Cập nhật thông tin cá nhân thất bại, vui lòng thử lại!";
      message.error({ content: msg, key: loadingKey, duration: 3 });
    }
  };

  /** ================== UPDATE HEALTH INFO ================== */
  const handleUpdateHealthInfo = async (e) => {
    e && e.preventDefault();
    if (!validateHealthUpdate()) return;

    const loadingKey = "update-health";
    message.loading({ content: "Đang cập nhật thông tin sức khỏe...", key: loadingKey, duration: 0 });

    try {
      // 1) Update user (bao gồm gender)
      const nameParts = String(userInfo.fullName || "")
        .trim()
        .split(" ")
        .filter(Boolean);
      const lastName = nameParts.length > 0 ? nameParts[0] : "";
      const firstName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const dateOfBirthApi = toApiDate(userInfo.birthday);

      const genderMapApi = { Nam: "Male", Nữ: "Female", Khác: "Other" };

      const userPayload = {
        firstName,
        lastName,
        email: String(userInfo.email || "").trim(),
        phoneNumber: String(userInfo.phone || "").trim(),
        address: String(userInfo.address || "").trim(),
        dateOfBirth: dateOfBirthApi,
        gender: genderMapApi[userInfo.gioiTinh] || null,
      };

      await api.put("/UserAccount/update", userPayload);

      // sync user localStorage
      const storedUser = localStorage.getItem("user");
      let newUser = user || {};
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.firstName = firstName;
        parsed.lastName = lastName;
        parsed.email = userPayload.email;
        parsed.phoneNumber = userPayload.phoneNumber;
        parsed.address = userPayload.address;
        parsed.gender = userPayload.gender;
        newUser = parsed;
        localStorage.setItem("user", JSON.stringify(parsed));
      }
      setUser(newUser);
      window.dispatchEvent(new Event("app-auth-changed"));

      // 2) Update member profile
      const memberPayload = {
        weight: Number(userInfo.canNang),
        height: Number(userInfo.chieuCao),
        target: String(userInfo.mucTieu || "").trim(),
        healthStatus: String(userInfo.sucKhoe || "").trim(),
      };

      await api.put("/Profile/member", memberPayload);

      message.success({ content: "Cập nhật thông tin sức khỏe thành công!", key: loadingKey, duration: 2 });
    } catch (err) {
      console.error("Error updating health info:", err.response?.data || err);
      const serverData = err.response?.data;
      const msg =
        serverData?.title ||
        serverData?.message ||
        (serverData ? JSON.stringify(serverData) : "") ||
        "Cập nhật thông tin sức khỏe thất bại, vui lòng thử lại!";
      message.error({ content: msg, key: loadingKey, duration: 3 });
    }
  };

  /** ================== CHANGE PASSWORD ================== */
  const handleChangePassword = async (e) => {
    e && e.preventDefault();

    const { currentPassword, newPassword, confirmNewPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      message.warning("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      message.error("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }
    if (newPassword.length < 6) {
      message.warning("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    const loadingKey = "change-password";
    message.loading({ content: "Đang đổi mật khẩu...", key: loadingKey, duration: 0 });

    try {
      const payload = { currentPassword, newPassword, confirmNewPassword };
      await api.put("/UserAccount/change-password", payload);

      message.success({ content: "Đổi mật khẩu thành công!", key: loadingKey, duration: 2 });

      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      console.error("Error changing password:", err);
      if (err.response?.status === 400) {
        message.error({
          content:
            err.response.data?.message ||
            "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!",
          key: loadingKey,
          duration: 3,
        });
      } else if (err.response?.status === 401) {
        message.warning({
          content: "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!",
          key: loadingKey,
          duration: 3,
        });
        navigate("/login");
      } else {
        message.error({ content: "Có lỗi xảy ra khi đổi mật khẩu, vui lòng thử lại!", key: loadingKey, duration: 3 });
      }
    }
  };

  return (
    <>
      {/* Page content */}
      <Container className="mt-5 mb-5" fluid>
        <Row>
          <Col className="mb-5 mb-xl-0" xl="4">
            <Row className="justify-content-center mt-2 mb-2">
              <Col
                lg="3"
                className="d-flex flex-column justify-content-center align-items-center text-center"
              >
                {/* Ảnh đại diện */}
                <div className="card-profile-image mb-3">
                  <a href="#pablo" onClick={(e) => e.preventDefault()}>
                    <img
                      src={user?.photo || preview || "/img/useravt.jpg"}
                      alt="avatar"
                      className="rounded-circle shadow"
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      onError={(e) => {
                        e.currentTarget.src = "/img/useravt.jpg";
                      }}
                      style={{
                        width: "300px",
                        height: "300px",
                        objectFit: "cover",
                        border: "1px solid #ddd",
                        background: "#f8f9fa",
                      }}
                    />
                  </a>
                </div>

                {/* Nút Upload */}
                <Button
                  size="sm"
                  className="mt-2"
                  style={{
                    backgroundColor: "#0c1844",
                    border: "none",
                    width: "fit-content",
                    whiteSpace: "nowrap",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#9fd1ffff";
                    e.currentTarget.style.color = "#0c1844";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#0c1844";
                    e.currentTarget.style.color = "#fff";
                  }}
                  onClick={handleButtonClick}
                >
                  Thay đổi ảnh đại diện <HiArrowUpTray />
                </Button>

                {/* Input ẩn */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />
              </Col>
            </Row>
          </Col>

          <Col xl="8">
            <Card className="bg-secondary shadow" style={{ marginRight: "5%", marginLeft: "5%" }}>
              <CardHeader className="bg-white border-0">
                <Row className="align-items-center">
                  <Col>
                    <h3 className="mb-0" style={{ fontWeight: "bold" }}>
                      Tài khoản của tôi
                    </h3>
                  </Col>
                </Row>
              </CardHeader>

              <CardBody
                className="text-primary mb-0 rounded-bottom"
                style={{
                  backgroundColor: "#0c1844",
                  color: "white",
                  fontWeight: "bold",
                }}
              >
                <Form>
                  {/* Tabs chọn section */}
                  <div className="d-flex mb-4 justify-content-center" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
                    <Button
                      size="sm"
                      type="button"
                      style={{
                        backgroundColor: activeSection === "user" ? "#ffffff" : "transparent",
                        color: activeSection === "user" ? "#0c1844" : "#ffffff",
                        border: "1px solid #ffffff",
                        fontWeight: activeSection === "user" ? 700 : 500,
                      }}
                      onClick={() => setActiveSection("user")}
                    >
                      Thông tin cá nhân
                    </Button>

                    <Button
                      size="sm"
                      type="button"
                      style={{
                        backgroundColor: activeSection === "health" ? "#ffffff" : "transparent",
                        color: activeSection === "health" ? "#0c1844" : "#ffffff",
                        border: "1px solid #ffffff",
                        fontWeight: activeSection === "health" ? 700 : 500,
                      }}
                      onClick={() => setActiveSection("health")}
                    >
                      Thông tin sức khỏe
                    </Button>

                    <Button
                      size="sm"
                      type="button"
                      style={{
                        backgroundColor: activeSection === "password" ? "#ffffff" : "transparent",
                        color: activeSection === "password" ? "#0c1844" : "#ffffff",
                        border: "1px solid #ffffff",
                        fontWeight: activeSection === "password" ? 700 : 500,
                      }}
                      onClick={() => setActiveSection("password")}
                    >
                      Đổi mật khẩu
                    </Button>
                  </div>

                  {/* ====== TAB 1: USER INFORMATION ====== */}
                  {activeSection === "user" && (
                    <>
                      <div className="pl-lg-4">
                        <Row>
                          <Col lg="6">
                            <FormGroup>
                              <label className="form-control-label" htmlFor="input-fullname">
                                👤 Họ tên
                              </label>
                              <Input
                                className="form-control-alternative"
                                id="input-fullname"
                                value={userInfo.fullName}
                                type="text"
                                onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="6">
                            <FormGroup>
                              <label className="form-control-label" htmlFor="input-birthday-visible">
                                🎂 Ngày sinh
                              </label>

                              <div style={{ position: "relative", width: "100%" }}>
                                <DatePicker
                                  id="birthday-picker"
                                  selected={toDateFromDDMMYYYY(userInfo.birthday)}
                                  onChange={(date) =>
                                    setUserInfo({ ...userInfo, birthday: date ? toDDMMYYYY(date) : "" })
                                  }
                                  dateFormat="dd/MM/yyyy"
                                  placeholderText="dd/mm/yyyy"
                                  showMonthDropdown
                                  showYearDropdown
                                  dropdownMode="select"
                                  isClearable
                                  maxDate={new Date()}
                                  className="form-control"
                                  wrapperClassName="w-100"
                                />
                              </div>

                              <div className="mt-1" style={{ color: "#ffd700", fontStyle: "italic" }}>
                                Tuổi: {age !== "" ? age : "--"}
                              </div>
                            </FormGroup>
                          </Col>
                        </Row>

                        {/* ✅ Email + SĐT cùng 1 hàng */}
                        <Row>
                          <Col lg="6">
                            <FormGroup>
                              <label className="form-control-label" htmlFor="input-email">
                                ✉️ Email
                              </label>
                              <Input
                                className="form-control-alternative"
                                id="input-email"
                                value={userInfo.email}
                                type="email"
                                placeholder="vd: ten@gmail.com"
                                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                                onBlur={() => {
                                  if (userInfo.email && !isValidEmail(userInfo.email)) {
                                    message.warning("Email chưa đúng định dạng.");
                                  }
                                }}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="6">
                            <FormGroup>
                              <label className="form-control-label" htmlFor="input-phone">
                                <FcPhone /> Số điện thoại
                              </label>
                              <Input
                                className="form-control-alternative"
                                id="input-phone"
                                type="tel"
                                value={userInfo.phone}
                                placeholder="vd: 0901234567"
                                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col lg="12">
                            <FormGroup>
                              <label className="form-control-label" htmlFor="input-address">
                                🏠 Địa chỉ
                              </label>
                              <Input
                                className="form-control-alternative"
                                id="input-address"
                                type="text"
                                value={userInfo.address}
                                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>

                      <Col className="d-flex justify-content-center align-items-center mt-4">
                        <Button color="primary" style={{ transform: "none" }} type="button" onClick={handleUpdateUserInfo}>
                          Cập nhật thông tin cá nhân
                        </Button>
                      </Col>
                    </>
                  )}

                  {/* ====== TAB 2: HEALTH INFORMATION ====== */}
                  {activeSection === "health" && (
                    <>
                      <div className="pl-lg-4">
                        <Row>
                          <Col lg="4">
                            <FormGroup>
                              <Label className="form-control-label" htmlFor="input-weight">
                                ⚖️ Cân nặng (kg)
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-weight"
                                type="number"
                                value={userInfo.canNang}
                                onChange={(e) => setUserInfo({ ...userInfo, canNang: e.target.value })}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <Label className="form-control-label" htmlFor="input-height">
                                📏 Chiều cao (cm)
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-height"
                                type="number"
                                value={userInfo.chieuCao}
                                onChange={(e) => setUserInfo({ ...userInfo, chieuCao: e.target.value })}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <Label className="form-control-label" htmlFor="input-gender">
                                🚻 Giới tính
                              </Label>
                              <Input
                                type="select"
                                id="input-gender"
                                className="form-control-alternative"
                                value={userInfo.gioiTinh}
                                onChange={(e) => setUserInfo({ ...userInfo, gioiTinh: e.target.value })}
                              >
                                <option value="">-- Chọn giới tính --</option>
                                <option value="Nam">♂️ Nam</option>
                                <option value="Nữ">♀️ Nữ</option>
                                <option value="Khác">⚧️ Khác</option>
                              </Input>
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col lg="4">
                            <FormGroup>
                              <Label className="form-control-label" htmlFor="input-bmi">
                                🧍 BMI
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-bmi"
                                type="text"
                                readOnly
                                value={userInfo.bmi}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <Label className="form-control-label" htmlFor="input-goal">
                                💪 Mục tiêu
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-goal"
                                type="text"
                                value={userInfo.mucTieu}
                                onChange={(e) => setUserInfo({ ...userInfo, mucTieu: e.target.value })}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <Label className="form-control-label" htmlFor="input-health">
                                ❤️ Tình trạng sức khỏe
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-health"
                                type="text"
                                value={userInfo.sucKhoe}
                                onChange={(e) => setUserInfo({ ...userInfo, sucKhoe: e.target.value })}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>

                      <Col className="d-flex justify-content-center align-items-center mt-4">
                        <Button color="primary" style={{ transform: "none" }} type="button" onClick={handleUpdateHealthInfo}>
                          Cập nhật thông tin sức khỏe
                        </Button>
                      </Col>
                    </>
                  )}

                  {/* ====== TAB 3: RESET PASSWORD ====== */}
                  {activeSection === "password" && (
                    <>
                      <div className="pl-lg-4">
                        <FormGroup style={{ position: "relative" }}>
                          <Label className="form-control-label">🔐 Mật khẩu hiện tại</Label>
                          <Input
                            className="form-control-alternative"
                            type={showPassword.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            style={{ paddingRight: "40px" }}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          />
                          <span
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                            style={{
                              position: "absolute",
                              right: "12px",
                              top: "50%",
                              transform: "translateY(-50%)",
                              cursor: "pointer",
                              color: "#fff",
                            }}
                          >
                            {showPassword.current ? "👁️" : "🙈"}
                          </span>
                        </FormGroup>

                        <Row>
                          <Col lg="6">
                            <FormGroup style={{ position: "relative" }}>
                              <Label className="form-control-label">🔑 Mật khẩu mới</Label>
                              <Input
                                className="form-control-alternative"
                                type={showPassword.new ? "text" : "password"}
                                value={passwordData.newPassword}
                                style={{ paddingRight: "40px" }}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                              />
                              <span
                                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                                style={{
                                  position: "absolute",
                                  right: "12px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  cursor: "pointer",
                                  color: "#fff",
                                }}
                              >
                                {showPassword.new ? "👁️" : "🙈"}
                              </span>
                            </FormGroup>
                          </Col>

                          <Col lg="6">
                            <FormGroup style={{ position: "relative" }}>
                              <Label className="form-control-label">🔁 Xác nhận mật khẩu</Label>
                              <Input
                                className="form-control-alternative"
                                type={showPassword.confirm ? "text" : "password"}
                                value={passwordData.confirmNewPassword}
                                style={{ paddingRight: "40px" }}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                              />
                              <span
                                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                                style={{
                                  position: "absolute",
                                  right: "12px",
                                  top: "50%",
                                  transform: "translateY(-50%)",
                                  cursor: "pointer",
                                  color: "#fff",
                                }}
                              >
                                {showPassword.confirm ? "👁️" : "🙈"}
                              </span>
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>

                      <Col className="d-flex justify-content-center align-items-center mt-4">
                        <Button color="primary" style={{ transform: "none" }} type="button" onClick={handleChangePassword}>
                          Thay đổi mật khẩu
                        </Button>
                      </Col>
                    </>
                  )}
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
};

export default ProfileMember;
