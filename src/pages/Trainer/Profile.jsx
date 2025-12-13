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
import React, { useEffect, useState, useRef, useMemo } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { HiArrowUpTray } from "react-icons/hi2";
import { FcPhone } from "react-icons/fc";
import api from "../../config/axios";
import { useNavigate } from "react-router-dom";
import { message } from "antd"; // ✅ message

const ProfileTrainer = () => {
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  // 👉 Tab đang chọn: "user" | "trainer" | "password"
  const [activeSection, setActiveSection] = useState("user");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  // ====== Helpers ======
  const toDateFromDDMMYYYY = (s) => {
    if (!s) return null;
    const [dd, mm, yyyy] = String(s).split("/");
    if (!dd || !mm || !yyyy) return null;
    const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
    return isNaN(d) ? null : d;
  };

  const toDDMMYYYY = (d) => {
    if (!(d instanceof Date) || isNaN(d)) return "";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  const toApiDate = (s) => {
    if (!s) return null;
    const [dd, mm, yyyy] = String(s).split("/");
    if (!dd || !mm || !yyyy) return null;
    return `${yyyy}-${mm}-${dd}`;
  };

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

  const isValidEmail = (email) => {
    if (!email) return false;
    // đơn giản nhưng đủ dùng cho form
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim());
  };

  const normalizePhone = (s) => String(s || "").replace(/\s|\.|-/g, "").trim();

  const isValidVNPhone = (phone) => {
    const p = normalizePhone(phone);
    // VN: 0 + 9 số (10 digits) hoặc +84 + 9 số
    return /^(0\d{9}|\+84\d{9})$/.test(p);
  };

  const eighteenYearsAgo = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d;
  }, []);

  // ===== State cho thông tin cá nhân =====
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    birthday: "", // dd/MM/yyyy
    email: "",
    phone: "",
    address: "",
    gioiTinh: "",
  });

  // ===== State cho thông tin huấn luyện viên =====
  const [trainerInfo, setTrainerInfo] = useState({
    specialization: "",
    trainerBio: "",
    workingShift: "", // ✅ thêm field để "tất cả input khi cập nhật"
    isAvailableForNewClients: true,
    certificates: [
      {
        certificateName: "",
        certificateDetail: "",
      },
    ],
  });

  // ===== State cho Reset Password =====
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

  const age = calculateAge(userInfo.birthday);

  // ===== Upload Avatar (base64) + message =====
  const handleButtonClick = () => fileInputRef.current?.click();

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const loadingKey = "upload-avatar";
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    message.loading({
      content: "Đang tải ảnh lên...",
      key: loadingKey,
      duration: 0,
    });

    try {
      const toBase64 = (f) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(f);
        });

      const base64Image = await toBase64(file);

      const res = await api.put("/UserAccount/avatar", {
        profileImageUrl: base64Image,
      });

      const newUrl = res.data?.profileImageUrl || base64Image;

      setUser((prev) => ({ ...(prev || {}), photo: newUrl }));

      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.photo = newUrl;
        localStorage.setItem("user", JSON.stringify(parsed));
      }

      window.dispatchEvent(new Event("app-auth-changed"));
      setPreview(newUrl);

      message.success({
        content: "Cập nhật ảnh đại diện thành công!",
        key: loadingKey,
        duration: 2,
      });
    } catch (err) {
      console.error("Error uploading avatar:", err);
      message.error({
        content: `Tải ảnh thất bại (HTTP ${err?.response?.status || "?"}). Vui lòng thử lại!`,
        key: loadingKey,
        duration: 3,
      });
    } finally {
      // reset input để chọn lại cùng 1 file vẫn trigger change
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // ===== Fetch /UserAccount/me =====
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

  // ===== Fetch /Profile/my-profile =====
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) return;

    const fetchTrainerInfoFromApi = async () => {
      try {
        const res = await api.get("/Profile/my-profile");
        const data = res.data;

        setTrainerInfo({
          specialization: data.specialization || "",
          trainerBio: data.trainerBio || "",
          workingShift: data.workingShift || "",
          isAvailableForNewClients:
            data.isAvailableForNewClients !== undefined ? data.isAvailableForNewClients : true,
          certificates:
            Array.isArray(data.certificates) && data.certificates.length > 0
              ? data.certificates
              : [{ certificateName: "", certificateDetail: "" }],
        });
      } catch (err) {
        if (err.response?.status === 401) {
          message.warning("Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!");
          return;
        }
        console.error("Error fetching /Profile/my-profile:", err);
        message.error("Không thể tải thông tin huấn luyện viên. Vui lòng thử lại!");
      }
    };

    fetchTrainerInfoFromApi();
  }, []);

  // ===== Validate USER =====
  const validateUserUpdate = () => {
    const fullName = String(userInfo.fullName || "").trim();
    const email = String(userInfo.email || "").trim();
    const phone = String(userInfo.phone || "").trim();
    const address = String(userInfo.address || "").trim();
    const gioiTinh = String(userInfo.gioiTinh || "").trim();
    const birthdayStr = String(userInfo.birthday || "").trim();

    if (!fullName) return message.error("Vui lòng nhập Họ và tên."), false;
    if (!birthdayStr) return message.error("Vui lòng chọn Ngày sinh."), false;

    // trainer phải >= 18
    const dob = toDateFromDDMMYYYY(birthdayStr);
    if (!dob) return message.error("Ngày sinh không hợp lệ."), false;
    if (dob > eighteenYearsAgo) return message.error("Huấn luyện viên phải đủ 18 tuổi trở lên."), false;

    if (!email) return message.error("Vui lòng nhập Email."), false;
    if (!isValidEmail(email)) return message.error("Email không đúng định dạng."), false;

    if (!phone) return message.error("Vui lòng nhập Số điện thoại."), false;
    if (!isValidVNPhone(phone))
      return message.error("Số điện thoại không đúng định dạng (vd: 0901234567 hoặc +84901234567)."), false;

    if (!gioiTinh) return message.error("Vui lòng chọn Giới tính."), false;
    if (!address) return message.error("Vui lòng nhập Địa chỉ."), false;

    return true;
  };

  // ===== Validate TRAINER =====
  const validateTrainerUpdate = () => {
    const specialization = String(trainerInfo.specialization || "").trim();
    const bio = String(trainerInfo.trainerBio || "").trim();
    const workingShift = String(trainerInfo.workingShift || "").trim();

    if (!specialization) return message.error("Vui lòng nhập Chuyên môn."), false;
    if (!bio) return message.error("Vui lòng nhập Giới thiệu huấn luyện viên."), false;
    if (!workingShift) return message.error("Vui lòng nhập Ca làm việc."), false;

    const certs = Array.isArray(trainerInfo.certificates) ? trainerInfo.certificates : [];
    if (!certs.length) return message.error("Vui lòng thêm ít nhất 1 chứng chỉ."), false;

    for (let i = 0; i < certs.length; i++) {
      const c = certs[i] || {};
      const name = String(c.certificateName || "").trim();
      const detail = String(c.certificateDetail || "").trim();
      if (!name || !detail) {
        message.error(`Chứng chỉ #${i + 1}: vui lòng nhập đủ Tên chứng chỉ và Mô tả chi tiết.`);
        return false;
      }
    }

    return true;
  };

  // ===== Update USER =====
  const handleUpdateUserInfo = async (e) => {
    e && e.preventDefault();
    if (!validateUserUpdate()) return;

    const loadingKey = "update-user";
    message.loading({ content: "Đang cập nhật thông tin cá nhân...", key: loadingKey, duration: 0 });

    try {
      const nameParts = String(userInfo.fullName || "").trim().split(" ").filter(Boolean);
      const lastName = nameParts.length > 0 ? nameParts[0] : "";
      const firstName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const dateOfBirthApi = toApiDate(userInfo.birthday);

      const genderMapApi = { Nam: "Male", Nữ: "Female", Khác: "Other" };

      const payload = {
        firstName,
        lastName,
        email: String(userInfo.email || "").trim(),
        phoneNumber: normalizePhone(userInfo.phone),
        gender: genderMapApi[userInfo.gioiTinh] || null,
        address: String(userInfo.address || "").trim(),
        dateOfBirth: dateOfBirthApi,
      };

      await api.put("/UserAccount/update", payload);

      // sync localStorage + navbar
      const storedUser = localStorage.getItem("user");
      let newUser = user || {};
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        parsed.firstName = firstName;
        parsed.lastName = lastName;
        parsed.email = payload.email || parsed.email;
        parsed.phoneNumber = payload.phoneNumber || parsed.phoneNumber;
        parsed.address = payload.address || parsed.address;
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

  // ===== Update TRAINER =====
  const handleUpdateTrainerInfo = async (e) => {
    e && e.preventDefault();
    if (!validateTrainerUpdate()) return;

    const loadingKey = "update-trainer";
    message.loading({ content: "Đang cập nhật thông tin huấn luyện viên...", key: loadingKey, duration: 0 });

    try {
      const certs = (trainerInfo.certificates || []).map((c) => ({
        certificateName: String(c.certificateName || "").trim(),
        certificateDetail: String(c.certificateDetail || "").trim(),
      }));

      const payload = {
        specialization: String(trainerInfo.specialization || "").trim(),
        trainerBio: String(trainerInfo.trainerBio || "").trim(),
        workingShift: String(trainerInfo.workingShift || "").trim(),
        isAvailableForNewClients: !!trainerInfo.isAvailableForNewClients,
        certificates: certs,
      };

      await api.put("/Profile/trainer", payload);

      message.success({ content: "Cập nhật thông tin huấn luyện viên thành công!", key: loadingKey, duration: 2 });
    } catch (err) {
      console.error("Error updating trainer info:", err);
      const serverData = err.response?.data;
      const msg =
        serverData?.title ||
        serverData?.message ||
        (serverData ? JSON.stringify(serverData) : "") ||
        "Cập nhật thông tin huấn luyện viên thất bại, vui lòng thử lại!";
      message.error({ content: msg, key: loadingKey, duration: 3 });
    }
  };

  // ===== Trainer field handlers =====
  const handleTrainerFieldChange = (field, value) => {
    setTrainerInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleCertChange = (index, field, value) => {
    setTrainerInfo((prev) => {
      const newCerts = [...(prev.certificates || [])];
      newCerts[index] = { ...newCerts[index], [field]: value };
      return { ...prev, certificates: newCerts };
    });
  };

  const handleAddCertificate = () => {
    setTrainerInfo((prev) => ({
      ...prev,
      certificates: [...(prev.certificates || []), { certificateName: "", certificateDetail: "" }],
    }));
    message.success("Đã thêm 1 chứng chỉ mới.");
  };

  const handleRemoveCertificate = (index) => {
    setTrainerInfo((prev) => {
      const newCerts = [...(prev.certificates || [])];
      newCerts.splice(index, 1);
      return {
        ...prev,
        certificates: newCerts.length > 0 ? newCerts : [{ certificateName: "", certificateDetail: "" }],
      };
    });
    message.info("Đã xóa chứng chỉ khỏi giao diện (nhớ bấm Cập nhật để lưu).");
  };

  // ===== Change password =====
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
      await api.put("/UserAccount/change-password", {
        currentPassword,
        newPassword,
        confirmNewPassword,
      });

      message.success({ content: "Đổi mật khẩu thành công!", key: loadingKey, duration: 2 });

      setPasswordData({ currentPassword: "", newPassword: "", confirmNewPassword: "" });
    } catch (err) {
      console.error("Error changing password:", err);
      if (err.response?.status === 400) {
        message.error({
          content: err.response.data?.message || "Đổi mật khẩu thất bại. Vui lòng kiểm tra lại mật khẩu hiện tại!",
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
      <Container className="mt-5 mb-5" fluid>
        <Row>
          <Col className="mb-5 mb-xl-0" xl="4">
            <Row className="justify-content-center mt-2 mb-2">
              <Col lg="3" className="d-flex flex-column justify-content-center align-items-center text-center">
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
                  Tải ảnh lên <HiArrowUpTray />
                </Button>

                <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} style={{ display: "none" }} />
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
                style={{ backgroundColor: "#0c1844", color: "white", fontWeight: "bold" }}
              >
                <Form>
                  {/* Tabs */}
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
                        backgroundColor: activeSection === "trainer" ? "#ffffff" : "transparent",
                        color: activeSection === "trainer" ? "#0c1844" : "#ffffff",
                        border: "1px solid #ffffff",
                        fontWeight: activeSection === "trainer" ? 700 : 500,
                      }}
                      onClick={() => setActiveSection("trainer")}
                    >
                      Thông tin huấn luyện viên
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

                  {/* ===== TAB 1: USER ===== */}
                  {activeSection === "user" && (
                    <>
                      <div className="pl-lg-4">
                        {/* Row 1 */}
                        <Row>
                          <Col lg="6">
                            <FormGroup>
                              <label className="form-control-label">
                                👤 Họ và tên <span style={{ color: "#ffd700" }}>*</span>
                              </label>
                              <Input
                                className="form-control-alternative"
                                value={userInfo.fullName}
                                type="text"
                                placeholder="Nhập họ và tên"
                                onChange={(e) => setUserInfo({ ...userInfo, fullName: e.target.value })}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="6">
                            <FormGroup>
                              <label className="form-control-label">
                                🎂 Ngày sinh <span style={{ color: "#ffd700" }}>*</span>
                              </label>

                              <DatePicker
                                selected={toDateFromDDMMYYYY(userInfo.birthday)}
                                onChange={(date) => setUserInfo({ ...userInfo, birthday: date ? toDDMMYYYY(date) : "" })}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="dd/mm/yyyy"
                                showMonthDropdown
                                showYearDropdown
                                dropdownMode="select"
                                isClearable
                                maxDate={eighteenYearsAgo}
                                className="form-control"
                                wrapperClassName="w-100"
                              />

                              <div className="mt-1" style={{ color: "#ffd700", fontStyle: "italic" }}>
                                Tuổi: {age !== "" ? age : "--"}
                              </div>
                            </FormGroup>
                          </Col>
                        </Row>

                        {/* Row 2: Email + Phone + Gender (same row) */}
                        <Row>
                          <Col lg="4">
                            <FormGroup>
                              <label className="form-control-label">
                                ✉️ Email <span style={{ color: "#ffd700" }}>*</span>
                              </label>
                              <Input
                                className="form-control-alternative"
                                value={userInfo.email}
                                type="email"
                                placeholder="vd: ten@gmail.com"
                                onChange={(e) => setUserInfo({ ...userInfo, email: e.target.value })}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <label className="form-control-label">
                                <FcPhone /> Số điện thoại <span style={{ color: "#ffd700" }}>*</span>
                              </label>
                              <Input
                                className="form-control-alternative"
                                type="tel"
                                value={userInfo.phone}
                                placeholder="vd: 0901234567"
                                onChange={(e) => setUserInfo({ ...userInfo, phone: e.target.value })}
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <Label className="form-control-label">
                                🚻 Giới tính <span style={{ color: "#ffd700" }}>*</span>
                              </Label>
                              <Input
                                className="form-control-alternative"
                                type="select"
                                value={userInfo.gioiTinh}
                                onChange={(e) => setUserInfo({ ...userInfo, gioiTinh: e.target.value })}
                              >
                                <option value="">-- Chọn giới tính --</option>
                                <option value="Nam">Nam</option>
                                <option value="Nữ">Nữ</option>
                                <option value="Khác">Khác</option>
                              </Input>
                            </FormGroup>
                          </Col>
                        </Row>

                        {/* Row 3 */}
                        <Row>
                          <Col lg="12">
                            <FormGroup>
                              <label className="form-control-label">
                                🏠 Địa chỉ <span style={{ color: "#ffd700" }}>*</span>
                              </label>
                              <Input
                                className="form-control-alternative"
                                type="text"
                                value={userInfo.address}
                                placeholder="Nhập địa chỉ"
                                onChange={(e) => setUserInfo({ ...userInfo, address: e.target.value })}
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>

                      <Col className="d-flex justify-content-center align-items-center mt-4">
                        <Button color="primary" style={{ transform: "none" }} type="button" onClick={handleUpdateUserInfo}>
                          Cập nhật
                        </Button>
                      </Col>
                    </>
                  )}

                  {/* ===== TAB 2: TRAINER ===== */}
                  {activeSection === "trainer" && (
                    <>
                      <div className="pl-lg-4">
                        <Row>
                          <Col lg="12">
                            <FormGroup>
                              <Label className="form-control-label">
                                💪 Chuyên môn <span style={{ color: "#ffd700" }}>*</span>
                              </Label>
                              <Input
                                className="form-control-alternative"
                                type="text"
                                placeholder="Ví dụ: Strength Training, Fat Loss..."
                                value={trainerInfo.specialization}
                                onChange={(e) => handleTrainerFieldChange("specialization", e.target.value)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col lg="12">
                            <FormGroup>
                              <Label className="form-control-label">
                                📘 Giới thiệu huấn luyện viên <span style={{ color: "#ffd700" }}>*</span>
                              </Label>
                              <Input
                                className="form-control-alternative"
                                type="textarea"
                                rows="4"
                                placeholder="Giới thiệu về bản thân, kinh nghiệm, phong cách huấn luyện..."
                                value={trainerInfo.trainerBio}
                                onChange={(e) => handleTrainerFieldChange("trainerBio", e.target.value)}
                              />
                            </FormGroup>
                          </Col>
                        </Row>

                        <Row>
                          <Col lg="6" className="d-flex align-items-center">
                            <FormGroup check>
                              <Label check className="form-control-label">
                                <Input
                                  type="checkbox"
                                  checked={trainerInfo.isAvailableForNewClients}
                                  onChange={(e) => handleTrainerFieldChange("isAvailableForNewClients", e.target.checked)}
                                  style={{ marginRight: "8px" }}
                                />
                                Đang nhận hội viên mới <span style={{ color: "#ffd700" }}>*</span>
                              </Label>
                            </FormGroup>
                          </Col>
                        </Row>

                        {/* Certificates (required all fields) */}
                        <Row className="mt-3">
                          <Col lg="12">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                              <Label className="form-control-label mb-0">
                                📜 Chứng chỉ <span style={{ color: "#ffd700" }}>*</span>
                              </Label>
                              <Button size="sm" type="button" color="info" onClick={handleAddCertificate}>
                                + Thêm chứng chỉ
                              </Button>
                            </div>
                          </Col>

                          {trainerInfo.certificates?.map((cert, idx) => (
                            <Col lg="12" key={idx} className="mb-3">
                              <Card
                                className="border-0"
                                style={{
                                  backgroundColor: "rgba(255,255,255,0.05)",
                                  padding: "12px",
                                  borderRadius: "8px",
                                }}
                              >
                                <Row>
                                  <Col lg="11">
                                    <FormGroup>
                                      <Label className="form-control-label" style={{ fontWeight: "bold", color: "#a8a8a8ff" }}>
                                        Tên chứng chỉ <span style={{ color: "#ffd700" }}>*</span>
                                      </Label>
                                      <Input
                                        className="form-control-alternative"
                                        type="text"
                                        placeholder="Ví dụ: ACE Certified Personal Trainer"
                                        value={cert.certificateName || ""}
                                        onChange={(e) => handleCertChange(idx, "certificateName", e.target.value)}
                                      />
                                    </FormGroup>
                                    <FormGroup>
                                      <Label className="form-control-label" style={{ fontWeight: "bold", color: "#a8a8a8ff" }}>
                                        Mô tả chi tiết <span style={{ color: "#ffd700" }}>*</span>
                                      </Label>
                                      <Input
                                        className="form-control-alternative"
                                        type="textarea"
                                        rows="2"
                                        placeholder="Ví dụ: Chứng chỉ huấn luyện viên cá nhân từ..."
                                        value={cert.certificateDetail || ""}
                                        onChange={(e) => handleCertChange(idx, "certificateDetail", e.target.value)}
                                      />
                                    </FormGroup>
                                  </Col>
                                  <Col lg="1" className="d-flex justify-content-end">
                                    <Button
                                      close
                                      aria-label="Remove"
                                      type="button"
                                      style={{ filter: "invert(1)", marginTop: "4px" }}
                                      onClick={() => handleRemoveCertificate(idx)}
                                    />
                                  </Col>
                                </Row>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>

                      <Col className="d-flex justify-content-center align-items-center mt-4">
                        <Button color="primary" style={{ transform: "none" }} type="button" onClick={handleUpdateTrainerInfo}>
                          Cập nhật
                        </Button>
                      </Col>
                    </>
                  )}

                  {/* ===== TAB 3: PASSWORD ===== */}
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
                              <Label className="form-control-label">🔁 Xác nhận mật khẩu mới</Label>
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
                          Đổi mật khẩu
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

export default ProfileTrainer;
