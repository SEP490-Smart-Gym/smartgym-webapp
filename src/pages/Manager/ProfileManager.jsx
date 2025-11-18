// reactstrap components
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


import { storage } from "../../config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const ProfileManager = () => {
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  // 👉 Tab đang chọn: "user" | "password"
  const [activeSection, setActiveSection] = useState("user");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // State cho thông tin cá nhân
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    birthday: "", // dd/MM/yyyy
    email: "",
    phone: "",
    address: "",
    gioiTinh: "",
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

  // 👉 Chuyển string dd/MM/yyyy -> Date (cho react-datepicker)
  const toDateFromDDMMYYYY = (s) => {
    if (!s) return null;
    const [dd, mm, yyyy] = s.split("/");
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

  // 👉 Tính tuổi từ birthday (dd/MM/yyyy)
  const calculateAge = (birthdayString) => {
    if (!birthdayString) return "";
    const [day, month, year] = birthdayString.split("/").map(Number);
    if (!day || !month || !year) return "";
    const today = new Date();
    let age = today.getFullYear() - year;
    const hasHadBirthday =
      today.getMonth() + 1 > month ||
      (today.getMonth() + 1 === month && today.getDate() >= day);
    if (!hasHadBirthday) age--;
    return age >= 0 ? age : "";
  };

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // ===== Upload avatar lên Firebase + lưu link vào DB + sync navbar =====
  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview tạm tại client
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    try {
      // Tạo đường dẫn lưu file trong Storage
      const uid = user?.id || user?.userId || "anonymous";
      const imageRef = ref(
        storage,
        `avatars/${uid}_${Date.now()}_${file.name}`
      );

      // Upload file lên Firebase Storage
      await uploadBytes(imageRef, file);

      // Lấy URL public
      const downloadUrl = await getDownloadURL(imageRef);

      // Gửi JSON lên API backend để lưu link vào database
      const payload = {
        profileImageUrl: downloadUrl,
      };

      const res = await api.put("/UserAccount/avatar", payload);
      const newUrl = res.data?.profileImageUrl || downloadUrl;

      // Cập nhật state user + localStorage
      setUser((prev) => ({
        ...(prev || {}),
        photo: newUrl,
      }));

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.photo = newUrl;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      // 👉 Bắn event cho Navbar biết user đã đổi avatar
      window.dispatchEvent(new Event("app-auth-changed"));

      setPreview(newUrl);
      alert("Cập nhật ảnh đại diện thành công!");
    } catch (err) {
      console.error("Error uploading avatar:", err);
      alert(
        `Upload ảnh thất bại (HTTP ${err?.response?.status || "?"}). Vui lòng thử lại!`
      );
    }
  };

  const age = calculateAge(userInfo.birthday);

  // 🚀 LẤY THÔNG TIN /UserAccount/me FILL VÀO TAB USER
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const fetchUserInfoFromApi = async () => {
      try {
        const res = await api.get("/UserAccount/me");
        const data = res.data;

        const fullNameFromApi = `${data.lastName || ""} ${
          data.firstName || ""
        }`.trim();

        let birthday = "";
        if (data.dateOfBirth) {
          const d = new Date(data.dateOfBirth);
          if (!isNaN(d)) {
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const yyyy = d.getFullYear();
            birthday = `${dd}/${mm}/${yyyy}`;
          }
        }

        let gioiTinh = "";
        if (data.gender) {
          const g = String(data.gender).toLowerCase();
          if (g === "male") gioiTinh = "Nam";
          else if (g === "female") gioiTinh = "Nữ";
          else gioiTinh = "Khác";
        }

        setUserInfo((prev) => ({
          ...prev,
          fullName: fullNameFromApi,
          email: data.email || "",
          phone: data.phoneNumber || "",
          address: data.address || "",
          birthday,
          gioiTinh,
        }));
      } catch (err) {
        if (err.response?.status === 401) {
          console.log("Không có quyền / chưa đăng nhập -> /me trả 401");
          navigate("/login");
          return;
        }
        console.error("Error fetching /UserAccount/me:", err);
      }
    };

    fetchUserInfoFromApi();
  }, [navigate]);

  // ⚙️ HANDLE UPDATE TAB USER INFORMATION + sync navbar
  const handleUpdateUserInfo = async (e) => {
    e && e.preventDefault();
    try {
      const nameParts = (userInfo.fullName || "")
        .trim()
        .split(" ")
        .filter(Boolean);
      const lastName = nameParts.length > 0 ? nameParts[0] : "";
      const firstName =
        nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      // dd/MM/yyyy -> ISO
      const dobDate = toDateFromDDMMYYYY(userInfo.birthday);
      const dateOfBirthIso = dobDate ? dobDate.toISOString() : null;

      // map giới tính đúng enum backend: Male / Female / Other
      const genderMapApi = {
        Nam: "Male",
        Nữ: "Female",
        Khác: "Other",
      };

      const payload = {
        firstName,
        lastName,
        email: userInfo.email || "",
        phoneNumber: userInfo.phone || "",
        gender: genderMapApi[userInfo.gioiTinh] || null,
        address: userInfo.address || "",
        dateOfBirth: dateOfBirthIso,
      };

      console.log("UPDATE /UserAccount/update payload:", payload);

      await api.put("/UserAccount/update", payload);

      // 👉 Cập nhật lại user trong localStorage và state để Navbar refresh
      const storedUser = localStorage.getItem("user");
      let newUser = user || {};
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.firstName = firstName;
        parsed.lastName = lastName;
        parsed.email = userInfo.email || parsed.email;
        parsed.phoneNumber = userInfo.phone || parsed.phoneNumber;
        parsed.address = userInfo.address || parsed.address;
        newUser = parsed;
        localStorage.setItem("user", JSON.stringify(parsed));
      }
      setUser(newUser);

      // 👉 Bắn event cho Navbar
      window.dispatchEvent(new Event("app-auth-changed"));

      alert("Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      console.error("Error updating user info:", err.response?.data || err);

      const serverData = err.response?.data;
      let msg =
        serverData?.title ||
        serverData?.message ||
        JSON.stringify(serverData) ||
        "Cập nhật thông tin cá nhân thất bại, vui lòng thử lại!";

      alert(msg);
    }
  };

  // ⚙️ HANDLE CHANGE PASSWORD
  const handleChangePassword = async (e) => {
    e && e.preventDefault();

    const { currentPassword, newPassword, confirmNewPassword } = passwordData;

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      alert("Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới!");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      alert("Mật khẩu mới và xác nhận mật khẩu không khớp!");
      return;
    }

    if (newPassword.length < 6) {
      alert("Mật khẩu mới phải có ít nhất 6 ký tự!");
      return;
    }

    try {
      const payload = {
        currentPassword,
        newPassword,
        confirmNewPassword,
      };

      await api.put("/UserAccount/change-password", payload);
      alert("Đổi mật khẩu thành công!");

      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (err) {
      console.error("Error changing password:", err);
      if (err.response?.status === 400) {
        alert(
          err.response.data?.message ||
            "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!"
        );
      } else if (err.response?.status === 401) {
        alert("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
        navigate("/login");
      } else {
        alert("Có lỗi xảy ra khi đổi mật khẩu, vui lòng thử lại!");
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
                  Upload Image <HiArrowUpTray />
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
            <Card
              className="bg-secondary shadow"
              style={{ marginRight: "5%", marginLeft: "5%" }}
            >
              <CardHeader className="bg-white border-0">
                <Row className="align-items-center">
                  <Col>
                    <h3 className="mb-0" style={{ fontWeight: "bold" }}>
                      My account
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
                  <div
                    className="d-flex mb-4 justify-content-center"
                    style={{ gap: "0.5rem", flexWrap: "wrap" }}
                  >
                    <Button
                      size="sm"
                      type="button"
                      style={{
                        backgroundColor:
                          activeSection === "user" ? "#ffffff" : "transparent",
                        color:
                          activeSection === "user" ? "#0c1844" : "#ffffff",
                        border: "1px solid #ffffff",
                        fontWeight: activeSection === "user" ? 700 : 500,
                      }}
                      onClick={() => setActiveSection("user")}
                    >
                      User Information
                    </Button>
                    <Button
                      size="sm"
                      type="button"
                      style={{
                        backgroundColor:
                          activeSection === "password"
                            ? "#ffffff"
                            : "transparent",
                        color:
                          activeSection === "password" ? "#0c1844" : "#ffffff",
                        border: "1px solid #ffffff",
                        fontWeight: activeSection === "password" ? 700 : 500,
                      }}
                      onClick={() => setActiveSection("password")}
                    >
                      Reset Password
                    </Button>
                  </div>

                  {/* ====== TAB 1: USER INFORMATION ====== */}
                  {activeSection === "user" && (
                    <>
                      <div className="pl-lg-4">
                        <Row>
                          <Col lg="6">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-fullname"
                              >
                                👤 Full Name
                              </label>
                              <Input
                                className="form-control-alternative"
                                id="input-fullname"
                                value={userInfo.fullName}
                                type="text"
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    fullName: e.target.value,
                                  })
                                }
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="6">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-birthday-visible"
                              >
                                🎂 Birthday
                              </label>

                              <div
                                style={{ position: "relative", width: "100%" }}
                              >
                                <DatePicker
                                  id="birthday-picker"
                                  selected={toDateFromDDMMYYYY(
                                    userInfo.birthday
                                  )}
                                  onChange={(date) =>
                                    setUserInfo({
                                      ...userInfo,
                                      birthday: date ? toDDMMYYYY(date) : "",
                                    })
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

                              {/* Hiển thị tuổi dưới Birthday */}
                              <div
                                className="mt-1"
                                style={{
                                  color: "#ffd700",
                                  fontStyle: "italic",
                                }}
                              >
                                Tuổi: {age !== "" ? age : "--"}
                              </div>
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col lg="6">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-email"
                              >
                                ✉️ Email Address
                              </label>
                              <Input
                                className="form-control-alternative"
                                id="input-email"
                                value={userInfo.email}
                                type="email"
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    email: e.target.value,
                                  })
                                }
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="6">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-phone"
                              >
                                <FcPhone /> Phone Number
                              </label>
                              <Input
                                className="form-control-alternative"
                                id="input-phone"
                                type="tel"
                                value={userInfo.phone}
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    phone: e.target.value,
                                  })
                                }
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col lg="12">
                            <FormGroup>
                              <label
                                className="form-control-label"
                                htmlFor="input-address"
                              >
                                🏠 Address
                              </label>
                              <Input
                                className="form-control-alternative"
                                id="input-address"
                                type="text"
                                value={userInfo.address}
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    address: e.target.value,
                                  })
                                }
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>

                      <Col className="d-flex justify-content-center align-items-center mt-4">
                        <Button
                          color="primary"
                          style={{
                            transform: "none",
                          }}
                          type="button"
                          onClick={handleUpdateUserInfo}
                        >
                          Update User Information
                        </Button>
                      </Col>
                    </>
                  )}

                  {/* ====== TAB 2: RESET PASSWORD ====== */}
                  {activeSection === "password" && (
                    <>
                      <div className="pl-lg-4">
                        {/* CURRENT PASSWORD */}
                        <FormGroup style={{ position: "relative" }}>
                          <Label className="form-control-label">
                            🔐 Current Password
                          </Label>
                          <Input
                            className="form-control-alternative"
                            type={showPassword.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            style={{ paddingRight: "40px" }}
                            onChange={(e) =>
                              setPasswordData({
                                ...passwordData,
                                currentPassword: e.target.value,
                              })
                            }
                          />
                          <span
                            onClick={() =>
                              setShowPassword({
                                ...showPassword,
                                current: !showPassword.current,
                              })
                            }
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

                        {/* NEW PASSWORD + CONFIRM */}
                        <Row>
                          {/* NEW PASSWORD */}
                          <Col lg="6">
                            <FormGroup style={{ position: "relative" }}>
                              <Label className="form-control-label">
                                🔑 New Password
                              </Label>
                              <Input
                                className="form-control-alternative"
                                type={showPassword.new ? "text" : "password"}
                                value={passwordData.newPassword}
                                style={{ paddingRight: "40px" }}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    newPassword: e.target.value,
                                  })
                                }
                              />
                              <span
                                onClick={() =>
                                  setShowPassword({
                                    ...showPassword,
                                    new: !showPassword.new,
                                  })
                                }
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

                          {/* CONFIRM PASSWORD */}
                          <Col lg="6">
                            <FormGroup style={{ position: "relative" }}>
                              <Label className="form-control-label">
                                🔁 Confirm New Password
                              </Label>
                              <Input
                                className="form-control-alternative"
                                type={showPassword.confirm ? "text" : "password"}
                                value={passwordData.confirmNewPassword}
                                style={{ paddingRight: "40px" }}
                                onChange={(e) =>
                                  setPasswordData({
                                    ...passwordData,
                                    confirmNewPassword: e.target.value,
                                  })
                                }
                              />
                              <span
                                onClick={() =>
                                  setShowPassword({
                                    ...showPassword,
                                    confirm: !showPassword.confirm,
                                  })
                                }
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
                        <Button
                          color="primary"
                          style={{
                            transform: "none",
                          }}
                          type="button"
                          onClick={handleChangePassword}
                        >
                          Change Password
                        </Button>
                      </Col>

                      <hr
                        className="my-4"
                        style={{ borderColor: "#ffffff", opacity: 1 }}
                      />
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

export default ProfileManager;
