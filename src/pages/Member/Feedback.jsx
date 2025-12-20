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

const STYLES = `
.gfs-wrap{position:relative;}
.gfs-header{
  border-radius: 18px;
  padding: 22px 22px;
  background: linear-gradient(135deg, rgba(12,24,68,.95), rgba(31,59,182,.75));
  color:#fff;
  box-shadow: 0 12px 28px rgba(0,0,0,.18);
}
.gfs-header h3{margin:0; font-weight:800; letter-spacing:.2px;}
.gfs-sub{opacity:.9; margin-top:6px;}
.gfs-card{
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 18px;
  box-shadow: 0 10px 26px rgba(0,0,0,.08);
  overflow:hidden;
  background:#fff;
}
.gfs-card .card-body{padding: 18px 18px;}
.gfs-muted{color:#6b7280;}
.gfs-chip{
  display:inline-flex; align-items:center; gap:8px;
  padding: 8px 12px; border-radius: 999px;
  border: 1px solid rgba(255,255,255,.18);
  background: rgba(255,255,255,.14);
  color:#fff;
  font-weight:600;
}
.gfs-chip-dark{
  display:inline-flex; align-items:center; gap:8px;
  padding: 6px 10px; border-radius: 999px;
  border: 1px solid rgba(0,0,0,.08);
  background: rgba(15,23,42,.04);
  color:#0f172a;
  font-weight:600;
  font-size:.85rem;
}
.gfs-star{color:#fbbf24;}
.gfs-kpi{display:flex; align-items:end; gap:10px; flex-wrap:wrap;}
.gfs-kpi .score{font-size: 40px; font-weight: 900; line-height: 1;}
.gfs-kpi .outof{opacity:.9; font-weight:700;}
.gfs-progress{
  height: 10px; border-radius: 999px; background: rgba(15,23,42,.08);
  overflow:hidden;
}
.gfs-progress > div{
  height:100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}
.gfs-filter{display:flex; gap:8px; flex-wrap:wrap;}
.gfs-filter button{
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,.08);
  padding: 7px 12px;
  background: #fff;
  font-weight:700;
  font-size:.9rem;
}
.gfs-filter button.active{
  background:#0c1844;
  color:#fff;
  border-color:#0c1844;
}
.gfs-list{
  max-height: 520px;
  overflow:auto;
  padding-right: 6px;
}
.gfs-list::-webkit-scrollbar{width:8px;}
.gfs-list::-webkit-scrollbar-thumb{background: rgba(0,0,0,.12); border-radius:999px;}
.gfs-item{
  border: 1px solid rgba(0,0,0,.06);
  border-radius: 16px;
  padding: 14px 14px;
  transition: transform .12s ease, box-shadow .12s ease;
  background:#fff;
}
.gfs-item:hover{transform: translateY(-1px); box-shadow: 0 12px 26px rgba(0,0,0,.08);}
.gfs-item.mine{
  border-color: rgba(31,59,182,.22);
  background: linear-gradient(180deg, rgba(31,59,182,.06), rgba(255,255,255,1));
}
.gfs-top{display:flex; align-items:flex-start; justify-content:space-between; gap:12px;}
.gfs-name{display:flex; align-items:center; gap:10px; flex-wrap:wrap;}
.gfs-avatar{
  width: 34px; height:34px; border-radius: 999px;
  display:flex; align-items:center; justify-content:center;
  font-weight:900; color:#fff;
  background: linear-gradient(135deg, #0c1844, #1f3bb6);
  box-shadow: 0 8px 18px rgba(12,24,68,.18);
  flex: 0 0 auto;
}
.gfs-meta{display:flex; gap:8px; flex-wrap:wrap; align-items:center;}
.gfs-type{font-size:.9rem; color:#475569; font-weight:700;}
.gfs-comment{margin-top:6px; color:#0f172a; white-space:normal; word-break:break-word;}
.gfs-actions{display:flex; gap:8px; justify-content:flex-end; margin-top:10px;}
.gfs-actions .btn{border-radius: 10px;}
.gfs-reply{
  margin-top: 10px;
  border-left: 4px solid rgba(31,59,182,.25);
  padding-left: 12px;
  background: rgba(31,59,182,.05);
  border-radius: 12px;
  padding: 10px 12px;
}
.gfs-reply .title{font-weight:800; color:#0c1844;}
.gfs-textarea{
  width:100%;
  border: 1px solid rgba(0,0,0,.14);
  border-radius: 12px;
  padding: 10px 12px;
  outline:none;
  resize: vertical;
}
.gfs-hint{font-size:.85rem; color:#64748b;}
.gfs-control{
  border: 1px solid rgba(0,0,0,.12);
  border-radius: 12px;
  padding: 8px 10px;
  width: 100%;
  outline: none;
}
`;

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

function initials(name) {
  const s = (name || "").trim();
  if (!s) return "U";
  const parts = s.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] || "U";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function renderSolidStars(rating = 0) {
  const r = clamp(Number(rating) || 0, 0, 5);
  return (
    <span style={{ letterSpacing: 1 }}>
      {"★".repeat(r)}
      {"☆".repeat(5 - r)}
    </span>
  );
}

function getFeedbackDateObj(fb) {
  const raw =
    fb?.feedbackDate ||
    fb?.createdAt ||
    fb?.createdDate ||
    fb?.date ||
    fb?.submittedAt ||
    null;

  if (!raw) return null;
  if (raw instanceof Date) return Number.isNaN(raw.getTime()) ? null : raw;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatDDMMYYYY(d) {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function getFbMemberPackageId(fb) {
  const raw =
    fb?.memberPackageId ??
    fb?.memberPackageID ??
    fb?.member_package_id ??
    fb?.member_packageId ??
    null;

  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export default function GymFeedbackSection() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [error, setError] = useState("");

  const [user, setUser] = useState(null);

  const [availability, setAvailability] = useState(null);
  const [myPackageIds, setMyPackageIds] = useState([]);

  // ✅ filter thời gian: all | 7d | 30d | mine
  const [filter, setFilter] = useState("all");

  // ✅ NEW: lọc theo số sao (0 = tất cả)
  const [starFilter, setStarFilter] = useState(0);

  // ✅ NEW: sort theo thời gian
  // newest | oldest
  const [sortOrder, setSortOrder] = useState("newest");

  // STAFF REPLY
  const [editingFeedbackId, setEditingFeedbackId] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [savingReplyId, setSavingReplyId] = useState(null);

  // MEMBER EDIT
  const [editingMyFeedbackId, setEditingMyFeedbackId] = useState(null);
  const [myEdit, setMyEdit] = useState({ rating: 5, comments: "" });
  const [savingMyFeedbackId, setSavingMyFeedbackId] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    setUser(stored ? JSON.parse(stored) : null);
  }, []);

  const isMember = user?.roleName === "Member";
  const isStaffRole = ["Staff", "Manager", "Admin"].includes(user?.roleName);

  /** ================= API ================= */

  const fetchFeedbacks = async () => {
    try {
      setLoadingList(true);
      setError("");
      const res = await api.get("/guest/feedback/gym");
      const list = Array.isArray(res.data) ? res.data : res.data?.items ?? [];
      setFeedbacks(list);
    } catch (err) {
      console.error(err);
      setError("Không tải được danh sách phản hồi.");
      setFeedbacks([]);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchAvailability = async () => {
    if (!isMember) return setAvailability(null);
    try {
      const res = await api.get("/member/feedback/gym/availability");
      setAvailability(res?.data ?? null);
    } catch (err) {
      console.error(err);
      setAvailability(null);
    }
  };

  const fetchMyPackages = async () => {
    if (!isMember) return setMyPackageIds([]);
    try {
      // ưu tiên list
      const res = await api.get("/MemberPackage/my-packages");
      const data = res?.data;
      const list = Array.isArray(data) ? data : data?.items && Array.isArray(data.items) ? data.items : [];

      const ids = list
        .map((p) => Number(p?.id ?? p?.memberPackageId ?? p?.memberPackageID ?? 0))
        .filter((x) => Number.isFinite(x) && x > 0);

      if (ids.length > 0) {
        setMyPackageIds(Array.from(new Set(ids)));
        return;
      }

      // fallback 1 gói
      const res2 = await api.get("/MemberPackage/my-package");
      const data2 = res2?.data;
      const arr2 = Array.isArray(data2) ? data2 : data2 ? [data2] : [];
      const ids2 = arr2
        .map((p) => Number(p?.id ?? p?.memberPackageId ?? p?.memberPackageID ?? 0))
        .filter((x) => Number.isFinite(x) && x > 0);

      setMyPackageIds(Array.from(new Set(ids2)));
    } catch (err) {
      console.error(err);
      setMyPackageIds([]);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  useEffect(() => {
    fetchAvailability();
    fetchMyPackages();
    // eslint-disable-next-line
  }, [isMember]);

  /** ================= DERIVED ================= */

  const latest = availability?.latest ?? null;
  const latestFeedbackId = latest?.feedbackId ?? null;
  const latestStatus = latest?.status ?? null;

  const canEditLatest =
    isMember &&
    latestFeedbackId &&
    String(latestStatus || "").toLowerCase() !== "responded";

  const isMyLatestFeedback = (fb) =>
    Number(fb?.id ?? fb?.feedbackId ?? 0) === Number(latestFeedbackId);

  const isMyFeedback = (fb) => {
    if (!isMember) return false;

    const fid = Number(fb?.id ?? fb?.feedbackId ?? 0);
    if (latestFeedbackId && fid === Number(latestFeedbackId)) return true;

    const mpId = getFbMemberPackageId(fb);
    if (!mpId) return false;

    return myPackageIds.includes(mpId);
  };

  const getDisplayName = (fb) => (isMyFeedback(fb) ? "Tôi" : fb.memberName || "Hội viên ẩn danh");
  const getTypeLabel = (type) => FEEDBACK_TYPE_LABELS[type] || type || "Khác";
  const getReplyText = (fb) => fb.staffResponse || fb.responseText || fb.replyText || "";

  const canShowEditButton = (fb) => canEditLatest && isMyLatestFeedback(fb) && isMyFeedback(fb);

  // ✅ sort theo newest/oldest ngay từ đầu
  const sortedFeedbacks = useMemo(() => {
    const list = [...feedbacks];
    list.sort((a, b) => {
      const da = getFeedbackDateObj(a)?.getTime() ?? 0;
      const db = getFeedbackDateObj(b)?.getTime() ?? 0;
      return sortOrder === "oldest" ? da - db : db - da;
    });
    return list;
  }, [feedbacks, sortOrder]);

  const avgData = useMemo(() => {
    if (!sortedFeedbacks.length) return { avg: 0, total: 0, buckets: [0, 0, 0, 0, 0] };
    const buckets = [0, 0, 0, 0, 0];
    let sum = 0;
    sortedFeedbacks.forEach((fb) => {
      const r = clamp(Number(fb.rating || 0), 0, 5);
      sum += r;
      if (r >= 1 && r <= 5) buckets[r - 1] += 1;
    });
    return { avg: sum / sortedFeedbacks.length, total: sortedFeedbacks.length, buckets };
  }, [sortedFeedbacks]);

  const filteredFeedbacks = useMemo(() => {
    const now = Date.now();
    let list = [...sortedFeedbacks];

    // ✅ lọc thời gian/mine
    if (filter === "mine") {
      list = list.filter((fb) => isMyFeedback(fb));
    } else if (filter === "7d" || filter === "30d") {
      const days = filter === "7d" ? 7 : 30;
      const minTime = now - days * 24 * 60 * 60 * 1000;
      list = list.filter((fb) => {
        const t = getFeedbackDateObj(fb)?.getTime();
        if (!t) return false;
        return t >= minTime;
      });
    }

    // ✅ NEW: lọc theo số sao
    if (Number(starFilter) >= 1 && Number(starFilter) <= 5) {
      list = list.filter((fb) => clamp(Number(fb.rating || 0), 0, 5) === Number(starFilter));
    }

    return list;
    // eslint-disable-next-line
  }, [sortedFeedbacks, filter, latestFeedbackId, myPackageIds, isMember, starFilter]);

  /** ================= STAFF REPLY ================= */

  const handleStartEditReply = (fb) => {
    const id = fb.id || fb.feedbackId;
    setEditingFeedbackId(id);
    setReplyDraft(getReplyText(fb));
  };

  const handleSaveReply = async (fb) => {
    const id = fb.id || fb.feedbackId;
    if (!replyDraft.trim()) {
      message.warning("Vui lòng nhập nội dung phản hồi.");
      return;
    }

    try {
      setSavingReplyId(id);
      const hasReply = Boolean(getReplyText(fb));
      await api[hasReply ? "put" : "post"](`/staff/feedback/gym/${id}/reply`, {
        responseText: replyDraft.trim(),
      });
      message.success("Lưu phản hồi thành công.");
      setEditingFeedbackId(null);
      setReplyDraft("");
      fetchFeedbacks();
      fetchAvailability();
    } catch (err) {
      console.error(err);
      message.error("Lưu phản hồi thất bại.");
    } finally {
      setSavingReplyId(null);
    }
  };

  /** ================= MEMBER EDIT ================= */

  const handleStartEditMyFeedback = (fb) => {
    if (!canShowEditButton(fb)) return;
    const id = fb.id || fb.feedbackId;
    setEditingMyFeedbackId(id);
    setMyEdit({ rating: Number(fb.rating) || 5, comments: fb.comments || "" });
  };

  const handleSaveMyFeedback = async (fb) => {
    const id = fb.id || fb.feedbackId;
    if (!canShowEditButton(fb)) return;

    if (!myEdit.comments.trim()) {
      message.warning("Vui lòng nhập nội dung.");
      return;
    }

    const memberPackageId = getFbMemberPackageId(fb);
    if (!memberPackageId) {
      message.error("Feedback này không có memberPackageId nên không thể cập nhật.");
      return;
    }

    try {
      setSavingMyFeedbackId(id);
      await api.put(`/member/feedback/gym/${id}`, {
        memberPackageId: Number(memberPackageId),
        rating: Number(myEdit.rating),
        feedbackType: fb.feedbackType || "General",
        comments: myEdit.comments.trim(),
      });

      message.success("Cập nhật đánh giá thành công.");

      setEditingMyFeedbackId(null);
      setMyEdit({ rating: 5, comments: "" });

      fetchFeedbacks();
      fetchAvailability();
      fetchMyPackages();
    } catch (err) {
      console.error(err);
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.title ||
        err?.message ||
        "Cập nhật thất bại.";
      message.error(msg);
    } finally {
      setSavingMyFeedbackId(null);
    }
  };

  /** ================= UI HELPERS ================= */

  const StarRow = ({ value, editable, onChange }) => {
    const v = clamp(Number(value || 0), 0, 5);
    return (
      <div className="d-flex align-items-center">
        {[1, 2, 3, 4, 5].map((s) => (
          <span
            key={s}
            onClick={() => editable && onChange?.(s)}
            title={`${s} sao`}
            style={{
              cursor: editable ? "pointer" : "default",
              fontSize: "1.25rem",
              lineHeight: 1,
              marginRight: 3,
              color: s <= v ? "#fbbf24" : "#e5e7eb",
              userSelect: "none",
            }}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  const bucketPct = (i) => {
    const count = avgData.buckets[i] || 0;
    if (!avgData.total) return 0;
    return (count / avgData.total) * 100;
  };

  return (
    <section className="py-5 bg-light gfs-wrap">
      <style>{STYLES}</style>

      <div className="container">
        {/* Header */}
        <div className="gfs-header mb-4">
          <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div>
              <h3>Phản hồi khách hàng</h3>
              <div className="gfs-sub">Tổng hợp đánh giá từ hội viên để cải thiện trải nghiệm phòng gym.</div>
            </div>

            <div className="d-flex flex-wrap gap-2 align-items-center">
              <span className="gfs-chip">
                <span className="gfs-star">★</span>
                <span>{avgData.total ? avgData.avg.toFixed(1) : "—"}/5</span>
              </span>
              <span className="gfs-chip">
                <span>📝</span>
                <span>{avgData.total} đánh giá</span>
              </span>
              {isMember && (
                <span className="gfs-chip" title={`My packages: ${myPackageIds.length}`}>
                  <span>👤</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="row g-4">
          {/* LEFT */}
          <div className="col-12 col-lg-4">
            <div className="gfs-card mb-3">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                  <div>
                    <div className="text-uppercase gfs-muted" style={{ fontSize: ".8rem", fontWeight: 800 }}>
                      Điểm trung bình
                    </div>
                    <div className="gfs-kpi mt-1">
                      <div className="score">{avgData.total ? avgData.avg.toFixed(1) : "0.0"}</div>
                      <div className="outof">/ 5.0</div>
                    </div>
                    <div className="mt-2 text-warning">{renderSolidStars(Math.round(avgData.avg || 0))}</div>
                    <div className="gfs-hint mt-1">Dựa trên {avgData.total} đánh giá gần đây</div>
                  </div>

                  {isMember && (
                    <span className="gfs-chip-dark" title="Bạn">
                      <span style={{ fontWeight: 900 }}>Bạn</span>
                    </span>
                  )}
                </div>

                <hr className="my-3" />

                <div className="d-flex flex-column gap-2">
                  {[5, 4, 3, 2, 1].map((star) => {
                    const idx = star - 1;
                    const pct = bucketPct(idx);
                    return (
                      <div key={star} className="d-flex align-items-center gap-2">
                        <div style={{ width: 52, fontWeight: 800, color: "#0f172a" }}>{star}★</div>
                        <div className="gfs-progress flex-grow-1">
                          <div style={{ width: `${pct}%` }} />
                        </div>
                        <div style={{ width: 52, textAlign: "right" }} className="gfs-muted">
                          {Math.round(pct)}%
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* FILTER CARD */}
            <div className="gfs-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>Bộ lọc</div>
                  <div className="gfs-hint">{filteredFeedbacks.length} kết quả</div>
                </div>

                {/* ✅ SORT (newest/oldest) */}
                <div className="mb-3">
                  <div className="gfs-hint mb-1" style={{ fontWeight: 800 }}>
                    Sắp xếp theo thời gian
                  </div>
                  <select
                    className="gfs-control"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    style={{ background: "#ffffffff" }}
                  >
                    <option value="newest">Gần nhất</option>
                    <option value="oldest">Cũ nhất</option>
                  </select>
                </div>

                {/* ✅ FILTER THEO THỜI GIAN */}
                <div className="mb-3">
                  <div className="gfs-hint mb-1" style={{ fontWeight: 800 }}>
                    Thời gian
                  </div>
                  <div className="gfs-filter">
                    <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
                      Tất cả
                    </button>
                    <button type="button" className={filter === "7d" ? "active" : ""} onClick={() => setFilter("7d")}>
                      7 ngày
                    </button>
                    <button type="button" className={filter === "30d" ? "active" : ""} onClick={() => setFilter("30d")}>
                      30 ngày
                    </button>
                  </div>
                </div>

                {/* ✅ NEW: FILTER THEO SỐ SAO */}
                <div className="mb-2">
                  <div className="gfs-hint mb-1" style={{ fontWeight: 800 }}>
                    Số sao
                  </div>
                  <div className="gfs-filter">
                    <button
                      type="button"
                      className={starFilter === 0 ? "active" : ""}
                      onClick={() => setStarFilter(0)}
                      title="Tất cả số sao"
                    >
                      Tất cả
                    </button>
                    {[5, 4, 3, 2, 1].map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={starFilter === s ? "active" : ""}
                        onClick={() => setStarFilter(s)}
                        title={`${s} sao`}
                      >
                        {s}★
                      </button>
                    ))}
                  </div>
                </div>

                {isMember && latestFeedbackId && (
                  <div className="gfs-hint mt-2">
                    {canEditLatest ? "Bạn có thể chỉnh sửa đánh giá gần nhất." : "Đánh giá gần nhất không thể chỉnh sửa."}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT */}
          <div className="col-12 col-lg-8">
            <div className="gfs-card">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div style={{ fontWeight: 900, color: "#0f172a", fontSize: "1.05rem" }}>Phản hồi gần đây</div>

                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      fetchFeedbacks();
                      fetchAvailability();
                      fetchMyPackages();
                    }}
                    disabled={loadingList}
                    style={{ borderRadius: 10 }}
                  >
                    {loadingList ? "Đang tải..." : "Tải lại"}
                  </button>
                </div>

                {loadingList && <div className="alert alert-info mb-0">Đang tải phản hồi...</div>}
                {error && !loadingList && <div className="alert alert-danger mb-0">{error}</div>}

                {!loadingList && !error && filteredFeedbacks.length === 0 && (
                  <div className="alert alert-light border mb-0">Không có phản hồi phù hợp với bộ lọc hiện tại.</div>
                )}

                {!loadingList && !error && filteredFeedbacks.length > 0 && (
                  <div className="gfs-list">
                    {filteredFeedbacks.map((fb) => {
                      const id = fb.id || fb.feedbackId;
                      const replyText = getReplyText(fb);

                      const mineAny = isMyFeedback(fb);
                      const canShowEdit = canShowEditButton(fb);
                      const isEditingMine = editingMyFeedbackId === id;

                      const d = getFeedbackDateObj(fb);

                      return (
                        <div key={id} className={`gfs-item mb-3 ${mineAny ? "mine" : ""}`}>
                          <div className="gfs-top">
                            <div className="gfs-name">
                              <div className="gfs-avatar">{initials(getDisplayName(fb))}</div>
                              <div>
                                <div className="d-flex flex-wrap align-items-center gap-2">
                                  <div style={{ fontWeight: 900, color: "#0f172a" }}>{getDisplayName(fb)}</div>
                                </div>

                                <div className="gfs-meta mt-1">
                                  <span className="gfs-type">{getTypeLabel(fb.feedbackType)}</span>
                                  {d && <span className="gfs-hint">• {formatDDMMYYYY(d)}</span>}
                                </div>
                              </div>
                            </div>

                            {canShowEdit && isEditingMine ? (
                              <StarRow
                                value={myEdit.rating}
                                editable
                                onChange={(v) => setMyEdit((p) => ({ ...p, rating: v }))}
                              />
                            ) : (
                              <div className="text-warning small" style={{ fontWeight: 800 }}>
                                {renderSolidStars(Number(fb.rating) || 0)}
                              </div>
                            )}
                          </div>

                          {canShowEdit && isEditingMine ? (
                            <div className="mt-2">
                              <textarea
                                className="gfs-textarea"
                                rows={3}
                                value={myEdit.comments}
                                onChange={(e) => setMyEdit((p) => ({ ...p, comments: e.target.value }))}
                                placeholder="Cập nhật nội dung đánh giá..."
                                style={{ background: "#ffffffff" }}
                              />
                              <div className="gfs-actions">
                                <button
                                  type="button"
                                  className="btn btn-light btn-sm"
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
                                  disabled={savingMyFeedbackId === id}
                                  onClick={() => handleSaveMyFeedback(fb)}
                                >
                                  {savingMyFeedbackId === id ? "Đang lưu..." : "Lưu"}
                                </button>
                              </div>
                              <div className="gfs-hint">Chỉ có thể sửa khi phòng gym chưa phản hồi.</div>
                            </div>
                          ) : (
                            <div className="gfs-comment">{fb.comments || "Không có nội dung"}</div>
                          )}

                          {canShowEdit && !isEditingMine && (
                            <div className="mt-2">
                              <button
                                type="button"
                                className="btn btn-link btn-sm px-0"
                                onClick={() => handleStartEditMyFeedback(fb)}
                              >
                                Chỉnh sửa đánh giá
                              </button>
                            </div>
                          )}

                          {(replyText || isStaffRole) && (
                            <div className="gfs-reply">
                              {replyText && (
                                <div className="mb-1">
                                  <div className="title">Phản hồi từ phòng gym</div>
                                  <div style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{replyText}</div>
                                </div>
                              )}

                              {isStaffRole && editingFeedbackId !== id && (
                                <button
                                  type="button"
                                  className="btn btn-link btn-sm px-0"
                                  onClick={() => handleStartEditReply(fb)}
                                >
                                  {replyText ? "Chỉnh sửa phản hồi" : "Phản hồi"}
                                </button>
                              )}

                              {isStaffRole && editingFeedbackId === id && (
                                <div className="mt-2">
                                  <textarea
                                    className="gfs-textarea"
                                    rows={3}
                                    value={replyDraft}
                                    onChange={(e) => setReplyDraft(e.target.value)}
                                    placeholder="Nhập phản hồi gửi đến hội viên..."
                                    style={{ background: "#ffffffff" }}
                                  />
                                  <div className="gfs-actions">
                                    <button
                                      type="button"
                                      className="btn btn-light btn-sm"
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
                                      disabled={savingReplyId === id}
                                      onClick={() => handleSaveReply(fb)}
                                    >
                                      {savingReplyId === id ? "Đang lưu..." : "Gửi"}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center gfs-muted mt-3" style={{ fontSize: ".9rem" }}>
              * Màn này chỉ hiển thị danh sách phản hồi. Không có form viết đánh giá.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
