// src/components/GymFeedbackSection.jsx
import { useEffect, useMemo, useState } from "react";
import api from "../../config/axios";
import { message } from "antd";

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

  // availability (member) => biết latest feedbackId + status + canSubmit + nextReminderAt
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // ==== ACTIVE PACKAGE (member) ====
  const [activePackage, setActivePackage] = useState(null);
  const [loadingActivePackage, setLoadingActivePackage] = useState(false);

  const [form, setForm] = useState({
    rating: 5,
    feedbackType: "", // code: GymRoom, Equipment, ...
    customFeedbackType: "", // text khi chọn Khác
    comments: "",
  });

  // dropdown loại feedback
  const [openTypeMenu, setOpenTypeMenu] = useState(false);

  // ==== STATE CHO STAFF REPLY ====
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [savingReplyId, setSavingReplyId] = useState(null);

  // ==== STATE CHO MEMBER EDIT FEEDBACK CỦA CHÍNH MÌNH ====
  const [editingMyFeedbackId, setEditingMyFeedbackId] = useState(null);
  const [myEdit, setMyEdit] = useState({ rating: 5, comments: "" });
  const [savingMyFeedbackId, setSavingMyFeedbackId] = useState(null);

  // Lấy user từ localStorage (để biết role + tên hiển thị)
  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const isMember = user && user.roleName === "Member";
  const isStaffRole = user && ["Staff", "Manager", "Admin"].includes(user.roleName);

  /** ================== API ================== */

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

  // ===== GET /member/feedback/gym/availability (chỉ khi là member) =====
  const fetchAvailability = async () => {
    if (!isMember) {
      setAvailability(null);
      return;
    }
    try {
      setLoadingAvailability(true);
      const res = await api.get("/member/feedback/gym/availability");
      setAvailability(res?.data ?? null);
    } catch (err) {
      console.error("Error fetching availability:", err);
      setAvailability(null);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // ===== GET /MemberPackage/my-active-package (chỉ khi là member) =====
  const fetchMyActivePackage = async () => {
    if (!isMember) {
      setActivePackage(null);
      return;
    }

    try {
      setLoadingActivePackage(true);
      const res = await api.get("/MemberPackage/my-active-package");
      // Backend có thể trả object hoặc null/404
      const pkg = res?.data ?? null;
      setActivePackage(pkg);
    } catch (err) {
      // nếu 404 hoặc lỗi => coi như chưa có gói active
      console.error("Error fetching my active package:", err);
      setActivePackage(null);
    } finally {
      setLoadingActivePackage(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    // mỗi khi user đổi / đăng nhập -> tải availability + active package
    fetchAvailability();
    fetchMyActivePackage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMember]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ====== RULE: phải có gói active mới được đánh giá ======
  const activeMemberPackageId = activePackage?.id ?? null;
  const canMemberSendFeedback = Boolean(isMember && activeMemberPackageId);

  // ===== POST /member/feedback/gym =====
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isMember) {
      message.warning("Bạn cần đăng nhập bằng tài khoản hội viên để gửi phản hồi.");
      return;
    }

    // ✅ chặn nếu chưa có gói active
    if (!activeMemberPackageId) {
      message.warning("Vui lòng đăng ký và sử dụng gói trước khi đánh giá.");
      return;
    }

    if (!form.rating || !form.comments.trim()) {
      message.warning("Vui lòng nhập nội dung và chọn số sao.");
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
        memberPackageId: Number(activeMemberPackageId),
        rating: Number(form.rating),
        feedbackType: finalType,
        comments: form.comments.trim(),
      });

      message.success("Cảm ơn bạn đã gửi phản hồi!");

      setForm({
        rating: 5,
        feedbackType: "",
        customFeedbackType: "",
        comments: "",
      });
      setOpenTypeMenu(false);

      // reload list + availability
      await Promise.all([fetchFeedbacks(), fetchAvailability(), fetchMyActivePackage()]);
    } catch (err) {
      console.error("Error submitting feedback:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Gửi phản hồi thất bại.";
      message.error(msg);
    } finally {
      setSubmitLoading(false);
    }
  };

  /** ================== DERIVED ================== */

  // ===== TÍNH ĐIỂM TRUNG BÌNH =====
  const { avgRating, total } = useMemo(() => {
    if (!feedbacks.length) return { avgRating: 0, total: 0 };
    const sum = feedbacks.reduce((acc, fb) => acc + Number(fb.rating || 0), 0);
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
      stars.push(<i key={`full-${i}`} className="fas fa-star text-warning me-1"></i>);
    }
    if (hasHalf) {
      stars.push(<i key="half" className="fas fa-star-half-alt text-warning me-1"></i>);
    }
    for (let i = 0; i < empty; i += 1) {
      stars.push(<i key={`empty-${i}`} className="far fa-star text-warning me-1"></i>);
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
    if (FEEDBACK_TYPE_LABELS[typeRaw]) return FEEDBACK_TYPE_LABELS[typeRaw];
    // custom text (khi gửi Other + input)
    return typeRaw;
  };

  // Hiển thị text trên nút "select"
  const getSelectedTypeText = () => {
    if (form.feedbackType === "Other") {
      if (form.customFeedbackType.trim()) return form.customFeedbackType;
      return "Khác";
    }
    if (!form.feedbackType) return "-- Chọn loại --";
    return FEEDBACK_TYPE_LABELS[form.feedbackType] || form.feedbackType;
  };

  // ==== LẤY REPLY TỪ FEEDBACK (tùy backend đặt tên field) ====
  const getReplyText = (fb) => {
    return fb?.staffResponse || fb?.responseText || fb?.replyText || fb?.reply || "";
  };

  // ======= MY LATEST + EDITABILITY (theo availability) =======
  const latestFeedbackId = availability?.latest?.feedbackId ?? null;
  const latestStatus = availability?.latest?.status ?? null;

  // Cho phép sửa chỉ khi: là member, có latestFeedbackId, status != Responded
  // + và ✅ phải có active package (rule mới)
  const canEditLatest = Boolean(
    isMember && latestFeedbackId && latestStatus !== "Responded" && activeMemberPackageId
  );

  const isMyLatestFeedback = (fb) => {
    const id = fb.id || fb.feedbackId;
    if (!id || !latestFeedbackId) return false;
    return Number(id) === Number(latestFeedbackId);
  };

  // Tên hiển thị:
  // - Nếu feedbackId == latestFeedbackId => hiển thị "Tôi"
  // - else nếu fb.memberName có => dùng memberName
  // - else "Hội viên ẩn danh"
  const getDisplayName = (fb) => {
    if (isMember && isMyLatestFeedback(fb)) return "Tôi";
    return fb.memberName || "Hội viên ẩn danh";
  };

  /** ================== STAFF REPLY ================== */

  const handleStartEditReply = (fb) => {
    const id = fb.id || fb.feedbackId;
    if (!id) {
      message.error("Không xác định được ID phản hồi.");
      return;
    }
    setEditingFeedbackId(id);
    setReplyDraft(getReplyText(fb) || "");
  };

  // Lưu reply (POST hoặc PUT) /staff/feedback/gym/{feedbackId}/reply
  const handleSaveReply = async (fb) => {
    const feedbackId = fb.id || fb.feedbackId;
    if (!feedbackId) {
      message.error("Không xác định được ID phản hồi.");
      return;
    }

    const text = replyDraft.trim();
    if (!text) {
      message.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    const existingReply = getReplyText(fb);
    const method = existingReply ? "put" : "post";
    const url = `/staff/feedback/gym/${feedbackId}/reply`;

    try {
      setSavingReplyId(feedbackId);
      await api[method](url, { responseText: text });
      message.success(existingReply ? "Cập nhật phản hồi thành công." : "Đã gửi phản hồi đến hội viên.");
      setEditingFeedbackId(null);
      setReplyDraft("");
      await fetchFeedbacks();
    } catch (err) {
      console.error("Error saving reply:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Lưu phản hồi thất bại.";
      message.error(msg);
    } finally {
      setSavingReplyId(null);
    }
  };

  /** ================== MEMBER EDIT MY FEEDBACK (LATEST ONLY) ================== */

  const handleStartEditMyFeedback = (fb) => {
    const id = fb.id || fb.feedbackId;
    if (!id) {
      message.error("Không xác định được ID phản hồi.");
      return;
    }

    // CHỈ cho sửa nếu đúng latest và canEditLatest
    if (!isMyLatestFeedback(fb) || !canEditLatest) return;

    setEditingMyFeedbackId(id);
    setMyEdit({
      rating: Number(fb.rating) || 5,
      comments: fb.comments || "",
    });
  };

  // PUT /member/feedback/gym/{feedbackId}
  const handleSaveMyFeedback = async (fb) => {
    const feedbackId = fb.id || fb.feedbackId;
    if (!feedbackId) {
      message.error("Không xác định được ID phản hồi.");
      return;
    }

    // ✅ chặn nếu chưa có gói active
    if (!activeMemberPackageId) {
      message.warning("Vui lòng đăng ký và sử dụng gói trước khi đánh giá.");
      return;
    }

    // CHỈ cho sửa nếu đúng latest và canEditLatest
    if (!isMyLatestFeedback(fb) || !canEditLatest) return;

    const text = myEdit.comments.trim();
    if (!myEdit.rating || !text) {
      message.warning("Vui lòng nhập nội dung và chọn số sao.");
      return;
    }

    const url = `/member/feedback/gym/${feedbackId}`;

    try {
      setSavingMyFeedbackId(feedbackId);

      await api.put(url, {
        memberPackageId: Number(activeMemberPackageId), // ✅ lấy từ my-active-package
        rating: Number(myEdit.rating),
        feedbackType: fb.feedbackType || "General", // giữ nguyên loại cũ
        comments: text,
      });

      message.success("Cập nhật đánh giá của bạn thành công.");

      setEditingMyFeedbackId(null);
      setMyEdit({ rating: 5, comments: "" });

      await Promise.all([fetchFeedbacks(), fetchAvailability(), fetchMyActivePackage()]);
    } catch (err) {
      console.error("Error updating my feedback:", err);

      const apiMsg = err?.response?.data?.message || err?.response?.data?.title || err?.message;

      // Nếu backend báo không cho sửa nữa => đóng edit + ẩn nút (vì availability sẽ cập nhật)
      if (String(apiMsg || "").toLowerCase().includes("no longer be edited")) {
        setEditingMyFeedbackId(null);
        setMyEdit({ rating: 5, comments: "" });
        await fetchAvailability();
      }

      message.error(apiMsg || "Cập nhật phản hồi thất bại.");
    } finally {
      setSavingMyFeedbackId(null);
    }
  };

  /** ================== UI ================== */

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

          {total > 0 && (
            <div className="d-flex justify-content-center align-items-center">
              <div>{renderAvgStars(avgRating)}</div>
              <span className="ms-2 fw-semibold">{avgRating.toFixed(1)}/5</span>
              <span className="text-muted small ms-2">({total} đánh giá)</span>
            </div>
          )}
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
                    <span className="text-warning me-1" style={{ fontSize: "1.2rem" }}>
                      {"★".repeat(Math.round(avgRating || 0))}
                      {"☆".repeat(5 - Math.round(avgRating || 0))}
                    </span>

                    <span className="ms-2 fw-semibold">{total ? avgRating.toFixed(1) : "—"}/5</span>
                    <span className="text-muted small ms-2">({total} đánh giá)</span>
                  </div>
                </div>

                {loadingList && <div className="alert alert-info mb-0">Đang tải phản hồi...</div>}
                {error && !loadingList && <div className="alert alert-danger mb-0">{error}</div>}

                {!loadingList && !error && feedbacks.length === 0 && (
                  <div className="alert alert-light border mb-0">
                    Chưa có phản hồi nào. Hãy là người đầu tiên chia sẻ cảm nhận của bạn!
                  </div>
                )}

                {!loadingList &&
                  !error &&
                  feedbacks.map((fb) => {
                    const id = fb.id || fb.feedbackId || Math.random();
                    const replyText = getReplyText(fb);

                    const isLatestMine = isMyLatestFeedback(fb);
                    const canShowEdit = isLatestMine && canEditLatest; // ✅ nếu không thể update => ẩn
                    const isEditingMine = editingMyFeedbackId === (fb.id || fb.feedbackId);

                    return (
                      <div key={id} className="border-bottom pb-3 mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <strong>{getDisplayName(fb)}</strong>

                          {/* Nếu là latest của mình và đang edit → hiển thị sao editable */}
                          {canShowEdit && isEditingMine ? (
                            <div className="d-flex align-items-center">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <span
                                  key={star}
                                  onClick={() => setMyEdit((prev) => ({ ...prev, rating: star }))}
                                  style={{
                                    cursor: "pointer",
                                    fontSize: "1.3rem",
                                    color: star <= myEdit.rating ? "#ffc107" : "#e4e5e9",
                                    marginRight: 2,
                                  }}
                                >
                                  ★
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-warning small">{renderSolidStars(fb.rating)}</span>
                          )}
                        </div>

                        <div className="text-muted small mb-1">{getTypeLabel(fb.feedbackType)}</div>

                        {/* Nội dung feedback: nếu là latest của mình và đang edit → textarea, else text */}
                        {canShowEdit && isEditingMine ? (
                          <div className="small">
                            <textarea
                              className="form-control form-control-sm"
                              rows={3}
                              value={myEdit.comments}
                              onChange={(e) =>
                                setMyEdit((prev) => ({ ...prev, comments: e.target.value }))
                              }
                            />
                            <div className="mt-2 d-flex justify-content-end">
                              <button
                                type="button"
                                className="btn btn-light btn-sm me-2"
                                onClick={() => {
                                  setEditingMyFeedbackId(null);
                                  setMyEdit({ rating: 5, comments: "" });
                                }}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                disabled={savingMyFeedbackId === (fb.id || fb.feedbackId)}
                                onClick={() => handleSaveMyFeedback(fb)}
                              >
                                {savingMyFeedbackId === (fb.id || fb.feedbackId) ? "Đang lưu..." : "Lưu"}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="small">{fb.comments || "Không có nội dung"}</div>
                        )}

                        {/* ✅ NÚT CHỈNH SỬA: CHỈ HIỆN KHI THỰC SỰ CÓ THỂ UPDATE */}
                        {canShowEdit && !isEditingMine && (
                          <div className="mt-1">
                            <button
                              type="button"
                              className="btn btn-link btn-sm px-0"
                              onClick={() => handleStartEditMyFeedback(fb)}
                            >
                              Chỉnh sửa đánh giá
                            </button>
                          </div>
                        )}

                        {/* ==== STAFF REPLY SECTION ==== */}
                        {(replyText || isStaffRole) && (
                          <div className="mt-2 ps-3 border-start small">
                            {/* Hiển thị reply (nếu có) */}
                            {replyText && (
                              <div className="mb-1">
                                <span className="fw-semibold">Phản hồi từ phòng gym:</span>
                                <div>{replyText}</div>
                              </div>
                            )}

                            {/* Nếu là staff role: cho phép thêm / sửa reply */}
                            {isStaffRole && (
                              <>
                                {editingFeedbackId !== (fb.id || fb.feedbackId) && (
                                  <button
                                    type="button"
                                    className="btn btn-link btn-sm px-0"
                                    onClick={() => handleStartEditReply(fb)}
                                  >
                                    {replyText ? "Chỉnh sửa phản hồi" : "Phản hồi"}
                                  </button>
                                )}

                                {editingFeedbackId === (fb.id || fb.feedbackId) && (
                                  <div className="mt-2">
                                    <textarea
                                      className="form-control"
                                      rows={3}
                                      value={replyDraft}
                                      onChange={(e) => setReplyDraft(e.target.value)}
                                      placeholder="Nhập phản hồi gửi đến hội viên..."
                                    />
                                    <div className="mt-2 d-flex justify-content-end">
                                      <button
                                        type="button"
                                        className="btn btn-light btn-sm me-2"
                                        onClick={() => {
                                          setEditingFeedbackId(null);
                                          setReplyDraft("");
                                        }}
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-primary btn-sm"
                                        disabled={savingReplyId === (fb.id || fb.feedbackId)}
                                        onClick={() => handleSaveReply(fb)}
                                      >
                                        {savingReplyId === (fb.id || fb.feedbackId) ? "Đang lưu..." : "Gửi"}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Cột phải: form gửi feedback */}
          <div className="col-12 col-lg-5">
            <div className="card shadow-sm h-100">
              <div className="card-body">
                <h5 className="mb-3">Gửi phản hồi của bạn</h5>

                {!isMember ? (
                  <div className="alert alert-warning mb-0">
                    Vui lòng{" "}
                    <a href="/login" className="alert-link">
                      đăng nhập
                    </a>{" "}
                    bằng tài khoản hội viên để gửi phản hồi.
                  </div>
                ) : (
                  <>
                    {/* Loading state */}
                    {(loadingAvailability || loadingActivePackage) && (
                      <div className="alert alert-info py-2 small">
                        Đang kiểm tra điều kiện gửi phản hồi...
                      </div>
                    )}

                    {/* ✅ Nếu chưa có gói active => show alert và CHẶN form */}
                    {!loadingActivePackage && !activeMemberPackageId && (
                      <div className="alert alert-warning">
                        Vui lòng đăng ký và sử dụng gói trước khi đánh giá.
                      </div>
                    )}

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
                                color: star <= form.rating ? "#ffc107" : "#e4e5e9",
                                marginRight: 4,
                              }}
                            >
                              ★
                            </span>
                          ))}
                          <span className="ms-2 small text-muted">{ratingLabel[form.rating]}</span>
                        </div>
                      </div>

                      {/* Loại phản hồi - custom dropdown + input "Khác" */}
                      <div className="mb-3">
                        <label className="form-label">Loại phản hồi</label>

                        <div className="position-relative">
                          <button
                            type="button"
                            className="form-select text-start"
                            onClick={() => setOpenTypeMenu((prev) => !prev)}
                          >
                            {getSelectedTypeText()}
                          </button>

                          {openTypeMenu && (
                            <div
                              className="border rounded bg-white shadow position-absolute w-100 mt-1"
                              style={{ zIndex: 999 }}
                            >
                              {/* Các loại chuẩn */}
                              {Object.entries(FEEDBACK_TYPE_LABELS).map(([key, label]) =>
                                key !== "Other" ? (
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
                                ) : null
                              )}

                              {/* Khác */}
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
                                    onChange={(e) => handleChange("customFeedbackType", e.target.value)}
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
                          onChange={(e) => handleChange("comments", e.target.value)}
                          placeholder="Chia sẻ trải nghiệm của bạn tại phòng gym..."
                        />
                      </div>

                      <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={submitLoading || !canMemberSendFeedback}
                        title={!canMemberSendFeedback ? "Cần có gói đang sử dụng để đánh giá" : ""}
                      >
                        {submitLoading ? "Đang gửi..." : "Gửi phản hồi"}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
