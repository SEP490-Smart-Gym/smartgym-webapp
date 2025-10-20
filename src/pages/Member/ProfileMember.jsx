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

const ProfileMember = () => {
  const [user, setUser] = useState(null);
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Dữ liệu người dùng mẫu
  const mockUserData = {
    fullName: "Nguyễn Văn A",
    birthday: "20/08/1995", // dd/MM/yyyy
    email: "nguyenvana@example.com",
    phone: "0912345678",
    canNang: 68,
    chieuCao: 172,
    gioiTinh: "Nam",
    mucTieu: "Giảm cân",
    sucKhoe: "Tốt",
  };

  const [userInfo, setUserInfo] = useState({
    ...mockUserData,
    bmi: "",
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

  // 👉 (optional) Chuẩn hoá chuỗi người dùng gõ tay dd/MM/yyyy
  const normalizeDDMMYYYY = (s) => {
    if (!s) return "";
    const cleaned = s.replace(/[-.]/g, "/").replace(/\s+/g, "");
    const parts = cleaned.split("/");
    if (parts.length !== 3) return cleaned;
    let [d, m, y] = parts;
    if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return cleaned;
    d = Math.min(Math.max(parseInt(d, 10), 1), 31);
    m = Math.min(Math.max(parseInt(m, 10), 1), 12);
    return `${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}/${y}`;
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

  // 👉 Phân loại BMI theo tuổi & giới tính (chuẩn châu Á cho người lớn)
  const getBmiCategory = (bmi, age, gender) => {
    const value = parseFloat(bmi);
    if (isNaN(value)) return "";
    if (age !== "" && age < 20) return "Cần đánh giá theo biểu đồ tăng trưởng (BMI-for-age)";

    if (gender === "Nữ") {
      if (value < 18.5) return "Cân nặng thấp (Gầy)";
      if (value < 23) return "Bình thường";
      if (value < 25) return "Thừa cân";
      if (value < 30) return "Béo phì độ I";
      return "Béo phì độ II";
    } else {
      if (value < 18.5) return "Cân nặng thấp (Gầy)";
      if (value < 23) return "Bình thường";
      if (value < 25) return "Thừa cân";
      if (value < 30) return "Béo phì độ I";
      return "Béo phì độ II";
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreview(imageUrl);
    }
  };

  const age = calculateAge(userInfo.birthday);

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
                  Upload Image
                </Button>

                {/* Input ẩn */}
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: "none" }}
                />

                <div
                  className="text-center"
                  style={{ whiteSpace: "nowrap", marginTop: "10px" }}
                >
                  <h3
                    style={{
                      position: "relative",
                      fontSize: "2rem",
                      fontWeight: 800,
                      color: "#0c1844",
                      textTransform: "uppercase",
                      letterSpacing: "2px",
                      fontFamily: "'Rubik Glitch', cursive",
                    }}
                  >
                    Jessica Jones
                  </h3>

                </div>
              </Col>
            </Row>
          </Col>

          <Col xl="8">
            <Card className="bg-secondary shadow" style={{ marginRight: "5%", marginLeft: "5%" }}>
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
                style={{ backgroundColor: "#0c1844", color: "white", fontWeight: "bold" }}
              >
                <Form>
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
                    User Information
                  </h6>

                  <div className="pl-lg-4">
                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-fullname">
                            Full Name
                          </label>
                          <Input
                            className="form-control-alternative"
                            id="input-fullname"
                            value={userInfo.fullName}
                            type="text"
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, fullName: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-birthday-visible">
                            Birthday
                          </label>

                          <div style={{ position: "relative", width: "100%" }}>
                            <DatePicker
                              id="birthday-picker"
                              selected={toDateFromDDMMYYYY(userInfo.birthday)}
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
                              wrapperClassName="w-100" // đảm bảo full width
                            />
                          </div>

                          {/* Hiển thị tuổi dưới Birthday */}
                          <div className="mt-1" style={{ color: "#ffd700", fontStyle: "italic" }}>
                            Tuổi: {age !== "" ? age : "--"}
                          </div>
                        </FormGroup>
                      </Col>
                    </Row>

                    <Row>
                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-email">
                            Email Address
                          </label>
                          <Input
                            className="form-control-alternative"
                            id="input-email"
                            value={userInfo.email}
                            type="email"
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, email: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col lg="6">
                        <FormGroup>
                          <label className="form-control-label" htmlFor="input-phone">
                            Phone Number
                          </label>
                          <Input
                            className="form-control-alternative"
                            id="input-phone"
                            type="tel"
                            value={userInfo.phone}
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, phone: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>

                  <hr className="my-4" style={{ borderColor: "#ffffff", opacity: 1 }} />

                  {/* Thông tin thể chất và sức khỏe */}
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
                    Physical & Health Information
                  </h6>

                  <div className="pl-lg-4">
                    <Row>
                      <Col lg="4">
                        <FormGroup>
                          <Label className="form-control-label" htmlFor="input-weight">
                            Cân nặng (kg)
                          </Label>
                          <Input
                            className="form-control-alternative"
                            id="input-weight"
                            type="number"
                            value={userInfo.canNang}
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, canNang: Number(e.target.value) })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col lg="4">
                        <FormGroup>
                          <Label className="form-control-label" htmlFor="input-height">
                            Chiều cao (cm)
                          </Label>
                          <Input
                            className="form-control-alternative"
                            id="input-height"
                            type="number"
                            value={userInfo.chieuCao}
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, chieuCao: Number(e.target.value) })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col lg="4">
                        <FormGroup>
                          <Label className="form-control-label" htmlFor="input-gender">
                            Giới tính
                          </Label>
                          <Input
                            type="select"
                            id="input-gender"
                            className="form-control-alternative"
                            value={userInfo.gioiTinh}
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, gioiTinh: e.target.value })
                            }
                          >
                            <option value="">-- Chọn giới tính --</option>
                            <option value="Nam">Nam</option>
                            <option value="Nữ">Nữ</option>
                          </Input>
                        </FormGroup>
                      </Col>
                    </Row>

                    {/* Hàng 2 */}
                    <Row>
                      <Col lg="4">
                        <FormGroup>
                          <Label className="form-control-label" htmlFor="input-bmi">
                            BMI
                          </Label>
                          <Input
                            className="form-control-alternative"
                            id="input-bmi"
                            type="text"
                            readOnly
                            value={userInfo.bmi}
                          />

                          {/* Diễn giải BMI theo tuổi & giới tính */}
                          <div
                            className="mt-1"
                            style={{
                              color:
                                parseFloat(userInfo.bmi) < 18.5
                                  ? "#00bfff"
                                  : parseFloat(userInfo.bmi) < 23
                                  ? "#00ff7f"
                                  : parseFloat(userInfo.bmi) < 25
                                  ? "#ffd700"
                                  : "#ff6347",
                              fontWeight: 600,
                            }}
                          >
                            {getBmiCategory(userInfo.bmi, age, userInfo.gioiTinh)}
                          </div>
                        </FormGroup>
                      </Col>

                      <Col lg="4">
                        <FormGroup>
                          <Label className="form-control-label" htmlFor="input-goal">
                            Mục tiêu
                          </Label>
                          <Input
                            className="form-control-alternative"
                            id="input-goal"
                            type="text"
                            value={userInfo.mucTieu}
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, mucTieu: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>

                      <Col lg="4">
                        <FormGroup>
                          <Label className="form-control-label" htmlFor="input-health">
                            Tình trạng sức khỏe
                          </Label>
                          <Input
                            className="form-control-alternative"
                            id="input-health"
                            type="text"
                            value={userInfo.sucKhoe}
                            onChange={(e) =>
                              setUserInfo({ ...userInfo, sucKhoe: e.target.value })
                            }
                          />
                        </FormGroup>
                      </Col>
                    </Row>
                  </div>

                  <hr className="my-4" style={{ borderColor: "#ffffff", opacity: 1 }} />

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
                      <label>About Me</label>
                      <Input
                        className="form-control-alternative"
                        placeholder="A few words about you ..."
                        rows="4"
                        defaultValue="A beautiful Dashboard for Bootstrap 4. It is Free and Open Source."
                        type="textarea"
                      />
                    </FormGroup>
                  </div>

                  <Col className="d-flex justify-content-center align-items-center">
                    <Button
                      color="primary"
                      style={{
                        transform: "none",
                      }}
                      onClick={(e) => e.preventDefault()}
                    >
                      Settings
                    </Button>
                  </Col>
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