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

const ProfileMember = () => {
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const navigate = useNavigate();

  // 👉 Tab đang chọn: "user" | "health" | "password"
  const [activeSection, setActiveSection] = useState("user");

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // State chung cho cả User + Health
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    birthday: "", // dd/MM/yyyy
    email: "",
    phone: "",
    address: "",
    canNang: 68,
    chieuCao: 172,
    gioiTinh: "",
    mucTieu: "Giảm cân",
    sucKhoe: "Tốt",
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

  // 🧮 Tự động tính BMI khi cân nặng/chiều cao thay đổi
  useEffect(() => {
    const { canNang, chieuCao } = userInfo;
    if (canNang && chieuCao) {
      const heightInMeters = chieuCao / 100;
      const bmi = (canNang / (heightInMeters * heightInMeters)).toFixed(1);
      setUserInfo((prev) => ({ ...prev, bmi }));
    }
  }, [userInfo.canNang, userInfo.chieuCao]);

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

  const getBmiSuggestions = (bmiValue) => {
    const bmi = parseFloat(bmiValue);
    if (isNaN(bmi)) return { category: "", workout: "", meal: "" };

    if (bmi < 16)
      return {
        category: "🚨 Gầy độ III",
        workout:
          "Tập rất nhẹ nhàng, ưu tiên phục hồi thể lực. 3 buổi/tuần, mỗi buổi 30–40 phút. \
        Bắt đầu với bài bodyweight như plank, squat, push-up nhẹ. Tăng dần tạ nhỏ khi cơ thể quen.",
        meal:
          "Tăng 500–700 kcal/ngày. Ăn nhiều bữa nhỏ 5–6 lần/ngày. Ưu tiên: sữa nguyên kem, trứng, cá hồi, gạo, khoai lang, bơ, phô mai. \
        Hạn chế đồ uống có gas và cà phê quá mức.",
      };

    if (bmi < 17)
      return {
        category: "⚠️ Gầy độ II",
        workout:
          "4 buổi/tuần tập full-body. 3 ngày tập tạ nhẹ – trung bình (compound: squat, bench, deadlift), 1 ngày cardio nhẹ (đi bộ nhanh 20 phút). \
        Nghỉ đủ giấc, tăng trọng lượng tạ dần theo tuần.",
        meal:
          "Tăng 400–600 kcal/ngày. Bổ sung protein ≥1.6g/kg cơ thể. Ăn trước khi ngủ bữa nhẹ có sữa hoặc trứng. \
        Uống sữa tăng cân hoặc whey protein sau tập để hỗ trợ phục hồi.",
      };

    if (bmi < 18.5)
      return {
        category: "⚠️ Gầy độ I",
        workout:
          "Tập tăng cơ 4–5 buổi/tuần: 3 ngày tập tạ, 2 ngày cardio nhẹ (đạp xe, bơi). \
        Ưu tiên bài compound và progressive overload. Chú trọng ăn sau tập trong 30 phút đầu.",
        meal:
          "Ăn 3 bữa chính + 2 bữa phụ. Ưu tiên carb tốt (gạo lứt, yến mạch), protein (thịt gà, cá, trứng), healthy fat (bơ, hạt). \
        Uống đủ 2–2.5L nước/ngày.",
      };

    if (bmi < 25)
      return {
        category: "✅ Bình thường",
        workout:
          "Duy trì thể trạng: 5 buổi/tuần (3 buổi strength training, 2 buổi cardio HIIT hoặc chạy bộ). \
        Kết hợp stretching, yoga cuối tuần để tăng linh hoạt. Mục tiêu: duy trì sức khỏe và cơ bắp.",
        meal:
          "Ăn cân đối theo tỷ lệ 40% carb – 30% protein – 30% fat. Ưu tiên rau xanh, trái cây tươi, chất xơ hòa tan. \
        Hạn chế đường, rượu bia, nước ngọt. Ăn chậm, đúng giờ.",
      };

    if (bmi < 30)
      return {
        category: "⚠️ Thừa cân",
        workout:
          "Tập 5–6 buổi/tuần: 3 buổi cardio (HIIT, chạy nhanh – chậm xen kẽ 30 phút), 2–3 buổi tập tạ full-body. \
        Tăng NEAT (đi bộ, leo cầu thang). Chú trọng đốt mỡ vùng bụng bằng plank, mountain climber.",
        meal:
          "Giảm 10–20% calo so với mức duy trì. Giảm tinh bột trắng (cơm, bánh mì), tránh ăn khuya. \
        Ưu tiên thịt nạc, cá, trứng, rau xanh, trái cây ít đường (táo, bưởi). Uống 2.5–3L nước/ngày.",
      };

    if (bmi < 35)
      return {
        category: "⚠️ Béo phì độ I",
        workout:
          "Tập 6 buổi/tuần: 4 ngày cardio (đi bộ nhanh, đạp xe, bơi), 2 ngày tạ nhẹ – trung bình. \
        Chú trọng bài giảm áp lực khớp gối: elliptical, plank, resistance band. Nghỉ chủ động 1 ngày.",
        meal:
          "Ăn kiểu low-carb hoặc Mediterranean. Cắt đường, nước ngọt, thức ăn nhanh. \
        Ưu tiên rau, đạm nạc, dầu olive. Chia nhỏ bữa ăn, không bỏ bữa sáng. Uống trà xanh hoặc detox tự nhiên.",
      };

    if (bmi < 40)
      return {
        category: "⚠️ Béo phì độ II",
        workout:
          "Tập đều đặn hằng ngày 30–45 phút: đi bộ nhanh, bơi, yoga giảm áp lực. \
        Bắt đầu với nhịp tim mục tiêu 60–70% tối đa. Tránh chạy hoặc nhảy mạnh để bảo vệ khớp.",
        meal:
          "Giảm khẩu phần nghiêm ngặt: ăn chậm, tránh ăn ngoài. Ưu tiên rau củ hấp, súp, cá hấp. \
        Loại bỏ đường, tinh bột tinh chế, nước ngọt. Giữ mức calo giảm 25–30%.",
      };

    return {
      category: "🚨 Béo phì độ III",
      workout:
        "Tham khảo bác sĩ hoặc HLV cá nhân. Bắt đầu nhẹ với đi bộ 15 phút/ngày, yoga hít thở, giãn cơ. \
      Khi thể lực cải thiện, tăng dần cường độ. Tránh quá sức để giảm nguy cơ tim mạch.",
      meal:
        "Theo dõi bởi chuyên gia dinh dưỡng. Áp dụng chế độ Very Low Calorie Diet (VLCD) nếu cần. \
      Ưu tiên rau củ, protein nạc, giảm hoàn toàn đường, chất béo bão hòa. Uống đủ nước, chia nhỏ bữa.",
    };
  };

  const suggestions = getBmiSuggestions(userInfo.bmi);

  // (tuỳ chọn) màu viền theo mức BMI
  const bmiColor =
    !userInfo.bmi
      ? "#6c757d"
      : userInfo.bmi < 16
      ? "#0059ffff"
      : userInfo.bmi < 17
      ? "#0080ffff"
      : userInfo.bmi < 18.5
      ? "#00bfff"
      : userInfo.bmi < 25
      ? "#00c853"
      : userInfo.bmi < 30
      ? "#ffd54f"
      : userInfo.bmi < 35
      ? "#ff9800"
      : userInfo.bmi < 40
      ? "#ff6200ff"
      : "#e53935";

  const handleButtonClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
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

        const fullNameFromApi = `${data.firstName || ""} ${
          data.lastName || ""
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

  // ⚙️ HANDLE UPDATE TAB USER INFORMATION
  const handleUpdateUserInfo = async (e) => {
    e && e.preventDefault();
    try {
      // tách fullName -> firstName, lastName (đơn giản: từ đầu, từ cuối)
      const nameParts = (userInfo.fullName || "")
        .trim()
        .split(" ")
        .filter(Boolean);
      const firstName = nameParts.length > 0 ? nameParts[0] : "";
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

      const dobDate = toDateFromDDMMYYYY(userInfo.birthday);
      const dateOfBirthIso = dobDate ? dobDate.toISOString() : null;

      const genderMap = {
        Nam: "male",
        Nữ: "female",
        Khác: "other",
      };

      const payload = {
        firstName,
        lastName,
        phoneNumber: userInfo.phone || "",
        gender: genderMap[userInfo.gioiTinh] || userInfo.gioiTinh || "",
        address: userInfo.address || "",
        dateOfBirth: dateOfBirthIso,
        profileImageUrl: user?.photo || "", // nếu backend dùng trường này
      };

      await api.put("/UserAccount/update", payload);
      alert("Cập nhật thông tin cá nhân thành công!");
    } catch (err) {
      console.error("Error updating user info:", err);
      alert("Cập nhật thông tin cá nhân thất bại, vui lòng thử lại!");
    }
  };

  // ⚙️ HANDLE UPDATE TAB HEALTH (CHƯA GẮN API, ĐỂ SAU)
  const handleUpdateHealthInfo = (e) => {
    e && e.preventDefault();
    // TODO: gắn API riêng cho health nếu có
    console.log("Health info:", {
      canNang: userInfo.canNang,
      chieuCao: userInfo.chieuCao,
      gioiTinh: userInfo.gioiTinh,
      bmi: userInfo.bmi,
      mucTieu: userInfo.mucTieu,
      sucKhoe: userInfo.sucKhoe,
    });
    alert("Cập nhật thông tin sức khỏe (demo) – chưa gắn API backend.");
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

      // reset form
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
                  <div className="d-flex mb-4 justify-content-center" style={{ gap: "0.5rem", flexWrap: "wrap" }}>
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
                          activeSection === "health"
                            ? "#ffffff"
                            : "transparent",
                        color:
                          activeSection === "health" ? "#0c1844" : "#ffffff",
                        border: "1px solid #ffffff",
                        fontWeight: activeSection === "health" ? 700 : 500,
                      }}
                      onClick={() => setActiveSection("health")}
                    >
                      Physical & Health Information
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

                      <hr
                        className="my-4"
                        style={{ borderColor: "#ffffff", opacity: 1 }}
                      />
                    </>
                  )}

                  {/* ====== TAB 2: PHYSICAL & HEALTH INFORMATION + ABOUT ME ====== */}
                  {activeSection === "health" && (
                    <>

                      <div className="pl-lg-4">
                        <Row>
                          <Col lg="4">
                            <FormGroup>
                              <Label
                                className="form-control-label"
                                htmlFor="input-weight"
                              >
                                ⚖️ Cân nặng (kg)
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-weight"
                                type="number"
                                value={userInfo.canNang}
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    canNang: Number(e.target.value),
                                  })
                                }
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <Label
                                className="form-control-label"
                                htmlFor="input-height"
                              >
                                📏 Chiều cao (cm)
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-height"
                                type="number"
                                value={userInfo.chieuCao}
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    chieuCao: Number(e.target.value),
                                  })
                                }
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <Label
                                className="form-control-label"
                                htmlFor="input-gender"
                              >
                                🚻 Giới tính
                              </Label>
                              <Input
                                type="select"
                                id="input-gender"
                                className="form-control-alternative"
                                value={userInfo.gioiTinh}
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    gioiTinh: e.target.value,
                                  })
                                }
                              >
                                <option value="">-- Chọn giới tính --</option>
                                <option value="Nam">♂️ Nam</option>
                                <option value="Nữ">♀️ Nữ</option>
                                <option value="Khác">⚧️ Khác</option>
                              </Input>
                            </FormGroup>
                          </Col>
                        </Row>

                        {/* Hàng 2 */}
                        <Row>
                          <Col lg="4">
                            <FormGroup>
                              <Label
                                className="form-control-label"
                                htmlFor="input-bmi"
                              >
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
                              <Label
                                className="form-control-label"
                                htmlFor="input-goal"
                              >
                                💪 Mục tiêu
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-goal"
                                type="text"
                                value={userInfo.mucTieu}
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    mucTieu: e.target.value,
                                  })
                                }
                              />
                            </FormGroup>
                          </Col>

                          <Col lg="4">
                            <FormGroup>
                              <Label
                                className="form-control-label"
                                htmlFor="input-health"
                              >
                                ❤️ Tình trạng sức khỏe
                              </Label>
                              <Input
                                className="form-control-alternative"
                                id="input-health"
                                type="text"
                                value={userInfo.sucKhoe}
                                onChange={(e) =>
                                  setUserInfo({
                                    ...userInfo,
                                    sucKhoe: e.target.value,
                                  })
                                }
                              />
                            </FormGroup>
                          </Col>
                        </Row>
                      </div>

                      <hr
                        className="my-4"
                        style={{ borderColor: "#ffffff", opacity: 1 }}
                      />

                      {/* Description */}
                      <h6
                        className="heading-small mb-4"
                        style={{
                          color: "#ffffff",
                          fontSize: "1.25rem",
                          fontWeight: "700",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                        }}
                      >
                        About me
                      </h6>

                      <div className="pl-lg-4">
                        <FormGroup>
                          <label>Kế hoạch gợi ý theo BMI</label>
                          <div
                            className="p-3 rounded"
                            style={{
                              background: "#fff",
                              color: "#333",
                              borderLeft: `6px solid ${bmiColor}`,
                              boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                            }}
                          >
                            <div style={{ fontWeight: 700, marginBottom: 6 }}>
                              Trạng thái:{" "}
                              <span>{suggestions.category || "—"}</span>
                            </div>
                            <div className="mt-1">
                              🏋️ <strong>Workout:</strong>{" "}
                              {suggestions.workout || "—"}
                            </div>
                            <div className="mt-2">
                              🍽️ <strong>Meal:</strong>{" "}
                              {suggestions.meal || "—"}
                            </div>
                          </div>
                        </FormGroup>
                      </div>

                      <Col className="d-flex justify-content-center align-items-center mt-4">
                        <Button
                          color="primary"
                          style={{
                            transform: "none",
                          }}
                          type="button"
                          onClick={handleUpdateHealthInfo}
                        >
                          Update Health Information
                        </Button>
                      </Col>
                    </>
                  )}

                  {/* ====== TAB 3: RESET PASSWORD ====== */}
                  {activeSection === "password" && (
                    <>
                      <div className="pl-lg-4">
                        {/* CURRENT PASSWORD */}
                        <FormGroup style={{ position: "relative" }}>
                          <Label className="form-control-label">🔐 Current Password</Label>
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
                              <Label className="form-control-label">🔑 New Password</Label>
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
                                  setShowPassword({ ...showPassword, new: !showPassword.new })
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
                              <Label className="form-control-label">🔁 Confirm New Password</Label>
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

                      <hr className="my-4" style={{ borderColor: "#ffffff", opacity: 1 }} />
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