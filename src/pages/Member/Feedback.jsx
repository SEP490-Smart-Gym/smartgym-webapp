// src/components/GymFeedbackSection.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../config/axios";

// Map code -> label tiếng Việt
const FEEDBACK_TYPE_LABELS = {
  GymRoom: "Phòng tập",
  Equipment: "Thiết bị",
  Facilities: "Cơ sở vật chất",
  Service: "Dịch vụ",
  Staff: "Nhân viên",
  Cleanliness: "Vệ sinh",
  Other: "Khác",
};

export default function GymFeedbackSection() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);

  const [form, setForm] = useState({
    rating: 5,
    feedbackType: "",          // code: GymRoom, Equipment, ...
    customFeedbackType: "",    // text khi chọn Khác
    comments: "",
  });

  // state mở/đóng custom dropdown
  const [openTypeMenu, setOpenTypeMenu] = useState(false);

  // Lấy user từ localStorage (để biết có phải Member không)
  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  // ===== GET /guest/feedback/gym =====
  const fetchFeedbacks = async () => {
    try {
      setLoadingList(true);
      setError("");
      const res = await api.get("/guest/feedback/gym");
      const data = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      setFeedbacks(data);
    } catch (err) {
      console.error("Error fetching feedback:", err);
      setError("Không tải được danh sách phản hồi.");
      setFeedbacks([]);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ===== POST /member/feedback/gym =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user || user.roleName !== "Member") {
      alert("Bạn cần đăng nhập bằng tài khoản hội viên để gửi phản hồi.");
      return;
    }

    if (!form.rating || !form.comments.trim()) {
      alert("Vui lòng nhập nội dung và chọn số sao.");
      return;
    }

    // Xử lý loại phản hồi gửi lên API
    const finalType =
      form.feedbackType === "Other"
        ? form.customFeedbackType.trim() || "Other"
        : form.feedbackType || "General";

    try {
      setSubmitLoading(true);
      await api.post("/member/feedback/gym", {
        rating: Number(form.rating),
        feedbackType: finalType,
        comments: form.comments.trim(),
      });

      alert("Cảm ơn bạn đã gửi phản hồi!");

      setForm({
        rating: 5,
        feedbackType: "",
        customFeedbackType: "",
        comments: "",
      });
      setOpenTypeMenu(false);

      // reload list để thấy feedback mới
      fetchFeedbacks();
    } catch (err) {
      console.error("Error submitting feedback:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Gửi phản hồi thất bại.";
      alert(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  // ===== TÍNH ĐIỂM TRUNG BÌNH =====
  const { avgRating, total } = useMemo(() => {
    if (!feedbacks.length) return { avgRating: 0, total: 0 };
    const sum = feedbacks.reduce(
      (acc, fb) => acc + Number(fb.rating || 0),
      0
    );
    return {
      avgRating: sum / feedbacks.length,
      total: feedbacks.length,
    };
  }, [feedbacks]);

  // Render sao cho trung bình (có thể có .5)
  const renderAvgStars = (rating) => {
    if (!rating) return null;
    const full = Math.floor(rating);
    const hasHalf = rating - full >= 0.5;
    const empty = 5 - full - (hasHalf ? 1 : 0);

    const stars = [];
    for (let i = 0; i < full; i += 1) {
      stars.push(
        <i
          key={`full-${i}`}
          className="fas fa-star text-warning me-1"
        ></i>
      );
    }
    if (hasHalf) {
      stars.push(
        <i
          key="half"
          className="fas fa-star-half-alt text-warning me-1"
        ></i>
      );
    }
    for (let i = 0; i < empty; i += 1) {
      stars.push(
        <i
          key={`empty-${i}`}
          className="far fa-star text-warning me-1"
        ></i>
      );
    }
    return stars;
  };

  // Render sao đầy / rỗng cho từng feedback (nguyên số)
  const renderSolidStars = (rating = 0) => {
    const r = Number(rating) || 0;
    return (
      <>
        {"★".repeat(r)}
        {"☆".repeat(5 - r)}
      </>
    );
  };

  const ratingLabel = {
    5: "Rất hài lòng",
    4: "Hài lòng",
    3: "Bình thường",
    2: "Chưa hài lòng",
    1: "Rất tệ",
  };

  // Lấy nhãn hiển thị cho feedbackType trong list
  const getTypeLabel = (typeRaw) => {
    if (!typeRaw) return "Khác";
    // Nếu là 1 trong các code chuẩn
    if (FEEDBACK_TYPE_LABELS[typeRaw]) {
      // Nếu là "Other" nhưng có custom => vẫn trả "Khác" ở list, comments đã chi tiết bên dưới
      return FEEDBACK_TYPE_LABELS[typeRaw];
    }
    // Nếu là custom text (khi gửi Other + input)
    return typeRaw;
  };

  // Hiển thị text trên nút "select"
  const getSelectedTypeText = () => {
    if (form.feedbackType === "Other") {
      if (form.customFeedbackType.trim()) {
        return form.customFeedbackType;
      }
      return "Khác";
    }
    if (!form.feedbackType) return "-- Chọn loại --";
    return FEEDBACK_TYPE_LABELS[form.feedbackType] || form.feedbackType;
  };

  return (
    <section id="feedback-section" className="py-5 bg-light">
      <div className="container py-4">
        {/* Title + average rating lớn phía trên */}
        <div className="text-center mb-4">
          <h4 className="text-primary">Phản hồi khách hàng</h4>
          <h1 className="display-6 mb-2">Trải nghiệm tại phòng gym</h1>
          <p className="text-muted mb-3">
            Lắng nghe chia sẻ từ hội viên và cùng chúng tôi cải thiện dịch vụ tốt hơn.
          </p>
        </div>

        <div className="row g-4">
          {/* Cột trái: danh sách feedback */}
          <div className="col-12 col-lg-7">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                {/* Header trái: tiêu đề + rating summary ngang hàng */}
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h5 className="mb-0">Phản hồi gần đây</h5>

                  <div className="d-flex align-items-center">
                    <span
                      className="text-warning me-1"
                      style={{ fontSize: "1.2rem" }}
                    >
                      {"★".repeat(Math.round(avgRating || 0))}
                      {"☆".repeat(5 - Math.round(avgRating || 0))}
                    </span>

                    <span className="ms-2 fw-semibold">
                      {total ? avgRating.toFixed(1) : "—"}/5
                    </span>

                    <span className="text-muted small ms-2">
                      ({total} đánh giá)
                    </span>
                  </div>
                </div>

                {loadingList && (
                  <div className="alert alert-info mb-0">
                    Đang tải phản hồi...
                  </div>
                )}

                {error && !loadingList && (
                  <div className="alert alert-danger mb-0">{error}</div>
                )}

                {!loadingList && !error && feedbacks.length === 0 && (
                  <div className="alert alert-light border mb-0">
                    Chưa có phản hồi nào. Hãy là người đầu tiên chia sẻ cảm nhận của bạn!
                  </div>
                )}

                {!loadingList &&
                  !error &&
                  feedbacks.map((fb) => (
                    <div
                      key={fb.id || fb.feedbackId || Math.random()}
                      className="border-bottom pb-3 mb-3"
                    >
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong>
                          {fb.memberName || "Hội viên ẩn danh"}
                        </strong>
                        <span className="text-warning small">
                          {renderSolidStars(fb.rating)}
                        </span>
                      </div>
                      <div className="text-muted small mb-1">
                        {getTypeLabel(fb.feedbackType)}
                      </div>
                      <div className="small">
                        {fb.comments || "Không có nội dung"}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

          {/* Cột phải: form gửi feedback */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="mb-3">Gửi phản hồi của bạn</h5>

                {!user || user.roleName !== "Member" ? (
                  <div className="alert alert-warning mb-0">
                    Vui lòng{" "}
                    <a href="/login" className="alert-link">
                      đăng nhập
                    </a>{" "}
                    bằng tài khoản hội viên để gửi phản hồi.
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    {/* Rating - chọn sao */}
                    <div className="mb-3">
                      <label className="form-label">Đánh giá</label>
                      <div className="d-flex align-items-center">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <span
                            key={star}
                            onClick={() => handleChange("rating", star)}
                            style={{
                              cursor: "pointer",
                              fontSize: "1.8rem",
                              color:
                                star <= form.rating ? "#ffc107" : "#e4e5e9",
                              marginRight: 4,
                            }}
                          >
                            ★
                          </span>
                        ))}
                        <span className="ms-2 small text-muted">
                          {ratingLabel[form.rating]}
                        </span>
                      </div>
                    </div>

                    {/* Loại phản hồi - custom dropdown + input "Khác" bên trong */}
                    <div className="mb-3">
                      <label className="form-label">Loại phản hồi</label>

                      <div className="position-relative">
                        {/* "Select" button */}
                        <button
                          type="button"
                          className="form-select text-start"
                          onClick={() => setOpenTypeMenu((prev) => !prev)}
                        >
                          {getSelectedTypeText()}
                        </button>

                        {/* Dropdown menu */}
                        {openTypeMenu && (
                        <div
                            className="border rounded bg-white shadow position-absolute w-100 mt-1"
                            style={{ zIndex: 999 }}
                        >
                            {/* Các loại chuẩn */}
                            {Object.entries(FEEDBACK_TYPE_LABELS).map(
                            ([key, label]) =>
                                key !== "Other" && (
                                <div
                                    key={key}
                                    className="dropdown-item py-2 px-3"
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                    handleChange("feedbackType", key);
                                    handleChange("customFeedbackType", "");
                                    setOpenTypeMenu(false);
                                    }}
                                >
                                    {label}
                                </div>
                                )
                            )}

                            {/* Khác - cùng định dạng với item trên + input bên trong */}
                            <div className="dropdown-item py-2 px-3">
                            <div
                                style={{ cursor: "pointer" }}
                                onClick={() => handleChange("feedbackType", "Other")}
                            >
                                Khác
                            </div>

                            {form.feedbackType === "Other" && (
                                <input
                                type="text"
                                className="form-control mt-2"
                                placeholder="Nhập loại phản hồi..."
                                value={form.customFeedbackType || ""}
                                onChange={(e) =>
                                    handleChange("customFeedbackType", e.target.value)
                                }
                                autoFocus
                                />
                            )}
                            </div>
                        </div>
                        )}
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="mb-3">
                      <label className="form-label">Nội dung chi tiết</label>
                      <textarea
                        className="form-control"
                        rows={4}
                        value={form.comments}
                        onChange={(e) =>
                          handleChange("comments", e.target.value)
                        }
                        placeholder="Chia sẻ trải nghiệm của bạn tại phòng gym..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary w-100"
                      disabled={submitLoading}
                    >
                      {submitLoading ? "Đang gửi..." : "Gửi phản hồi"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
