import React, { useEffect, useMemo, useState } from "react";
import { Spin } from "antd";
import api from "../../config/axios";

/** ================== Helpers: safe render ================== */
const renderText = (v) => {
  if (v === null || v === undefined) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean")
    return String(v);

  if (Array.isArray(v)) return v.map(renderText).filter(Boolean).join(", ");

  if (typeof v === "object") {
    if (v.name != null) return String(v.name);
    if (v.title != null) return String(v.title);
    if (v.label != null) return String(v.label);
    if (v.value != null) return String(v.value);
    try {
      return JSON.stringify(v);
    } catch {
      return "";
    }
  }
  return String(v);
};

const renderListText = (v) => {
  if (Array.isArray(v)) return v.map(renderText).filter(Boolean).join(", ");
  return renderText(v);
};

/** ================== Day label ================== */
const formatDayNumberLabel = (day, indexFallback) => {
  const nRaw = day?.dayNumber ?? day?.dayNo ?? day?.order ?? null;
  const n = Number(nRaw);
  const safeN = Number.isFinite(n) && n > 0 ? n : indexFallback + 1;
  return `Ngày thứ ${safeN}`;
};

/** ================== Date/Time format ================== */
const formatVNDateTime = (value) => {
  if (!value) return "—";
  let iso = String(value).trim();
  const hasOffset = /[zZ]$/.test(iso) || /[+\-]\d{2}:\d{2}$/.test(iso);
  if (!hasOffset) iso += "Z";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
    hour12: false,
  });
};

// "07:00:00" -> "07:00"
const formatTimeSpanHHmm = (time) => {
  if (!time) return "";
  const parts = String(time).split(":");
  const hh = String(parts[0] || "00").padStart(2, "0");
  const mm = String(parts[1] || "00").padStart(2, "0");
  return `${hh}:${mm}`;
};

/** ================== Normalize plan structure (BE có thể đổi field) ================== */
const getDays = (plan) => {
  if (!plan) return [];
  if (Array.isArray(plan.days)) return plan.days;
  if (Array.isArray(plan.planDays)) return plan.planDays;
  return [];
};

const getExercises = (day) => {
  if (!day) return [];
  if (Array.isArray(day.exercises)) return day.exercises;
  if (Array.isArray(day.sessions)) return day.sessions;
  return [];
};

/** ================== BMI suggestion helpers ================== */
const isPlainObject = (x) =>
  x && typeof x === "object" && !Array.isArray(x);

const safeArray = (v) => (Array.isArray(v) ? v : []);

const tryParseJsonIfString = (v) => {
  if (typeof v !== "string") return v;
  const s = v.trim();
  if (!s.startsWith("{") && !s.startsWith("[")) return v;
  try {
    return JSON.parse(s);
  } catch {
    return v;
  }
};

const isWorkoutDaysObjectList = (arr) =>
  Array.isArray(arr) &&
  arr.some(
    (x) => isPlainObject(x) && (Array.isArray(x.sessions) || Array.isArray(x.exercises))
  );

const isMealDaysObjectList = (arr) =>
  Array.isArray(arr) &&
  arr.some((x) => isPlainObject(x) && Array.isArray(x.meals));

const renderSessionsTable = (sessions) => {
  const list = safeArray(sessions);
  if (!list.length) return <div className="text-muted">—</div>;

  return (
    <div className="table-responsive">
      <table className="table table-sm mb-0" style={{ fontSize: 14 }}>
        <thead>
          <tr style={{ background: "rgba(0,0,0,0.03)" }}>
            <th style={{ width: 44 }}>#</th>
            <th>Bài tập</th>
            <th style={{ width: 130 }}>Thời lượng</th>
            <th style={{ width: 170 }}>Hiệp</th>
          </tr>
        </thead>
        <tbody>
          {list.map((s, i) => (
            <tr key={i}>
              <td className="text-muted">{i + 1}</td>
              <td>
                <div style={{ fontWeight: 900 }}>
                  {renderText(s?.name) || `Bài tập ${i + 1}`}
                </div>
                {s?.description ? (
                  <div
                    className="text-muted"
                    style={{ fontSize: 13, lineHeight: 1.45 }}
                  >
                    {renderText(s.description)}
                  </div>
                ) : null}
              </td>
              <td>{renderText(s?.duration) || "—"}</td>
              <td>{renderText(s?.rounds) || "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

const renderMealsList = (meals) => {
  const list = safeArray(meals);
  if (!list.length) return <div className="text-muted">—</div>;

  return (
    <div className="d-flex flex-column gap-2">
      {list.map((line, i) => {
        const text = renderText(tryParseJsonIfString(line));
        const [label, ...rest] = String(text).split(":");
        const hasLabel = rest.length > 0;
        const labelText = hasLabel ? label.trim() : `Bữa ${i + 1}`;
        const contentText = hasLabel ? rest.join(":").trim() : String(text);

        return (
          <div
            key={i}
            className="p-2 rounded"
            style={{
              background: "rgba(28,143,54,0.06)",
              border: "1px solid rgba(28,143,54,0.12)",
            }}
          >
            <div className="d-flex flex-wrap align-items-center gap-2">
              <span
                className="badge rounded-pill"
                style={{
                  background: "rgba(28,143,54,0.16)",
                  color: "#1c8f36",
                  fontWeight: 900,
                }}
              >
                {labelText}
              </span>
              <span style={{ lineHeight: 1.5 }}>{contentText || "—"}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const DaysAccordion = ({ id, title, days, accent, renderDayBody }) => {
  const list = safeArray(days);
  if (!list.length) return <div className="text-muted">—</div>;

  return (
    <div className="mt-2">
      <div className="small text-muted fw-semibold mb-2">{title}</div>

      <div className="accordion" id={id}>
        {list.map((d, idx) => {
          const headingId = `${id}-h-${idx}`;
          const collapseId = `${id}-c-${idx}`;
          const dayLabel = formatDayNumberLabel(d, idx);
          const dayName = d?.dayName ? ` - ${renderText(d.dayName)}` : "";

          return (
            <div
              key={idx}
              className="accordion-item"
              style={{
                border: "1px solid rgba(0,0,0,0.08)",
                borderRadius: 14,
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <h2 className="accordion-header" id={headingId}>
                <button
                  className={`accordion-button ${idx === 0 ? "" : "collapsed"}`}
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#${collapseId}`}
                  aria-expanded={idx === 0 ? "true" : "false"}
                  aria-controls={collapseId}
                  style={{
                    fontWeight: 900,
                    background: "rgba(0,0,0,0.02)",
                    boxShadow: "none",
                  }}
                >
                  <span
                    className="badge rounded-pill me-2"
                    style={{
                      background: `${accent}22`,
                      color: accent,
                      fontWeight: 1000,
                    }}
                  >
                    {dayLabel}
                  </span>
                  <span style={{ fontWeight: 900 }}>
                    {renderText(d?.dayName)}
                  </span>
                  <span className="text-muted" style={{ fontWeight: 700 }}>
                    {dayName}
                  </span>
                </button>
              </h2>

              <div
                id={collapseId}
                className={`accordion-collapse collapse ${idx === 0 ? "show" : ""}`}
                aria-labelledby={headingId}
                data-bs-parent={`#${id}`}
              >
                <div className="accordion-body" style={{ background: "#fff" }}>
                  {renderDayBody(d)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function WorkoutMealPlan() {
  const [activeTab, setActiveTab] = useState("workout");

  // Workout / Meal plan
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);

  // Expand state Workout
  const [expandedWorkoutDays, setExpandedWorkoutDays] = useState([]);
  const [expandedExercises, setExpandedExercises] = useState([]);

  // Expand state Meal
  const [expandedMealDays, setExpandedMealDays] = useState([]);
  const [expandedMeals, setExpandedMeals] = useState([]);

  // BMI + PlanSuggestion
  const [loadingBmi, setLoadingBmi] = useState(true);
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [bmi, setBmi] = useState("");
  const [planSuggestion, setPlanSuggestion] = useState(null);
  const [bmiError, setBmiError] = useState("");

  /** ================== Load Workout & Meal plan ================== */
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);

        const [workoutRes, mealRes] = await Promise.allSettled([
          api.get("/WorkoutPlan/me"),
          api.get("/MealPlan/me"),
        ]);

        // WORKOUT
        if (
          workoutRes.status === "fulfilled" &&
          Array.isArray(workoutRes.value.data) &&
          workoutRes.value.data.length > 0
        ) {
          const wp = workoutRes.value.data[0];
          setWorkoutPlan(wp);

          const days = getDays(wp);
          setExpandedWorkoutDays(days.map((_, idx) => idx));

          const exKeys = [];
          days.forEach((d, di) => {
            getExercises(d).forEach((_, ei) => exKeys.push(`${di}-${ei}`));
          });
          setExpandedExercises(exKeys);
        } else {
          setWorkoutPlan(null);
          setExpandedWorkoutDays([]);
          setExpandedExercises([]);
        }

        // MEAL
        if (
          mealRes.status === "fulfilled" &&
          Array.isArray(mealRes.value.data) &&
          mealRes.value.data.length > 0
        ) {
          const mp = mealRes.value.data[0];
          setMealPlan(mp);

          const days = getDays(mp);
          setExpandedMealDays(days.map((_, idx) => idx));

          const mealKeys = [];
          days.forEach((d, di) => {
            (d.meals || []).forEach((_, mi) => mealKeys.push(`${di}-${mi}`));
          });
          setExpandedMeals(mealKeys);
        } else {
          setMealPlan(null);
          setExpandedMealDays([]);
          setExpandedMeals([]);
        }
      } catch (err) {
        console.error("Error fetching WorkoutPlan/me & MealPlan/me:", err);
        setWorkoutPlan(null);
        setMealPlan(null);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  /** ================== Load BMI + PlanSuggestion/bmi ================== */
  useEffect(() => {
    const fetchBmiAndSuggestion = async () => {
      try {
        setLoadingBmi(true);
        setBmiError("");
        setPlanSuggestion(null);

        const res = await api.get("/Profile/my-profile");
        const data = res.data || {};

        const w = data.weight ?? null;
        const h = data.height ?? null;

        setWeight(w);
        setHeight(h);

        if (!w || !h || Number(h) <= 0) {
          setBmi("");
          setBmiError(
            "Vui lòng cập nhật cân nặng và chiều cao trong hồ sơ để xem gợi ý BMI."
          );
          return;
        }

        const heightInMeters = Number(h) / 100;
        const bmiValue = (
          Number(w) /
          (heightInMeters * heightInMeters)
        ).toFixed(1);
        setBmi(bmiValue);

        // ✅ API mới: /PlanSuggestion/bmi (body)
        try {
          const sugRes = await api.post("/PlanSuggestion/bmi", {
            bmi: Number(bmiValue),
          });
          setPlanSuggestion(sugRes.data || null);
        } catch (postErr) {
          const status = postErr?.response?.status;
          if (status === 404 || status === 405 || status === 415) {
            const sugRes2 = await api.get("/PlanSuggestion/bmi", {
              params: { bmi: Number(bmiValue) },
            });
            setPlanSuggestion(sugRes2.data || null);
          } else {
            throw postErr;
          }
        }
      } catch (err) {
        console.error("Error fetching BMI suggestion:", err);
        setPlanSuggestion(null);
        setBmiError(
          err?.response?.data?.title ||
            err?.response?.data?.message ||
            err?.message ||
            "Không thể tải gợi ý theo BMI."
        );
      } finally {
        setLoadingBmi(false);
      }
    };

    fetchBmiAndSuggestion();
  }, []);

  const bmiNumber = parseFloat(bmi);
  const bmiColor =
    !bmi || Number.isNaN(bmiNumber)
      ? "#6c757d"
      : bmiNumber < 16
      ? "#0059ffff"
      : bmiNumber < 17
      ? "#0080ffff"
      : bmiNumber < 18.5
      ? "#00bfff"
      : bmiNumber < 25
      ? "#00c853"
      : bmiNumber < 30
      ? "#ffd54f"
      : bmiNumber < 35
      ? "#ff9800"
      : bmiNumber < 40
      ? "#ff6200ff"
      : "#e53935";

  /** ================== Toggle helpers ================== */
  const toggleWorkoutDay = (idx) => {
    setExpandedWorkoutDays((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleExercise = (dayIndex, exIndex) => {
    const key = `${dayIndex}-${exIndex}`;
    setExpandedExercises((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const toggleMealDay = (idx) => {
    setExpandedMealDays((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  const toggleMeal = (dayIndex, mealIndex) => {
    const key = `${dayIndex}-${mealIndex}`;
    setExpandedMeals((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const workoutDays = getDays(workoutPlan);
  const mealDays = getDays(mealPlan);

  const workoutDaysCount = workoutDays.length || 0;
  const mealDaysCount = mealDays.length || 0;

  // PlanSuggestion DTO
  const bmiCategoryText = planSuggestion?.category || "";
  const bmiNote = planSuggestion?.note || "";
  const sugMeal = planSuggestion?.mealPlan || null;
  const sugWorkout = planSuggestion?.workoutPlan || null;

  // parse focusAreas/dailyMeals if BE sometimes returns JSON string
  const sugWorkoutFocus = useMemo(() => {
    const raw = tryParseJsonIfString(sugWorkout?.focusAreas);
    return Array.isArray(raw) ? raw : safeArray(sugWorkout?.focusAreas);
  }, [sugWorkout]);

  const sugMealDaily = useMemo(() => {
    const raw = tryParseJsonIfString(sugMeal?.dailyMeals);
    return Array.isArray(raw) ? raw : safeArray(sugMeal?.dailyMeals);
  }, [sugMeal]);

  return (
    <div className="container py-4">
      <h1 className="mb-3 fw-bold text-center" style={{ color: "#c80036" }}>
        Kế hoạch tập luyện & dinh dưỡng
      </h1>

      {activeTab === "workout" && (
        <p className="text-center text-muted mb-4">
          Đây là kế hoạch tập luyện do huấn luyện viên cá nhân thiết kế cho bạn.
          Hãy trao đổi trực tiếp với PT nếu cần điều chỉnh lịch tập.
        </p>
      )}

      {activeTab === "meal" && (
        <p className="text-center text-muted mb-4">
          Đây là kế hoạch dinh dưỡng do huấn luyện viên cá nhân thiết kế cho bạn.
          Hãy tuân thủ và hỏi lại PT nếu có dị ứng hoặc không phù hợp khẩu vị.
        </p>
      )}

      {activeTab === "bmi" && (
        <p className="text-center text-muted mb-4">
          Gợi ý được lấy từ hệ thống dựa trên BMI (tính từ cân nặng & chiều cao
          bạn đã lưu). Nếu bạn cập nhật hồ sơ, dữ liệu tại đây sẽ thay đổi tương
          ứng.
        </p>
      )}

      {/* Tabs */}
      <div className="d-flex justify-content-center mb-4" style={{ gap: 8 }}>
        <button
          type="button"
          className={`btn btn-sm ${
            activeTab === "workout"
              ? "btn-primary"
              : "btn-outline-primary text-dark bg-white"
          }`}
          onClick={() => setActiveTab("workout")}
        >
          Kế hoạch tập luyện
        </button>
        <button
          type="button"
          className={`btn btn-sm ${
            activeTab === "meal"
              ? "btn-primary"
              : "btn-outline-primary text-dark bg-white"
          }`}
          onClick={() => setActiveTab("meal")}
        >
          Kế hoạch dinh dưỡng
        </button>
        <button
          type="button"
          className={`btn btn-sm ${
            activeTab === "bmi"
              ? "btn-primary"
              : "btn-outline-primary text-dark bg-white"
          }`}
          onClick={() => setActiveTab("bmi")}
        >
          Gợi ý theo BMI
        </button>
      </div>

      {/* ================== TAB: WORKOUT PLAN ================== */}
      {activeTab === "workout" && (
        <>
          <div
            className="mb-3 p-3 rounded shadow-sm text-center"
            style={{
              background:
                "linear-gradient(135deg, #fff3e0 0%, #ffe0b2 40%, #ffe8d6 100%)",
              border: "1px solid #ffd28c",
              fontSize: "0.95rem",
            }}
          >
            <strong>🎯 Mục tiêu chung:</strong> Tăng cơ, giảm mỡ, cải thiện sức
            bền, kiểm soát mỡ và hỗ trợ sức khỏe lâu dài.
          </div>

          {loadingPlans ? (
            <div className="text-center my-5">
              <Spin size="large" />
            </div>
          ) : !workoutPlan ? (
            <div className="alert alert-light border text-center">
              Chưa có kế hoạch tập luyện từ huấn luyện viên.
            </div>
          ) : (
            <div
              className="p-3 shadow rounded"
              style={{ background: "#fff5f7ff", border: "1px solid #ffd6e0" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="fw-bold mb-0" style={{ color: "#c80036" }}>
                  📌 Kế hoạch tập luyện (Workout Plan)
                </h3>
                <span
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: "#c80036",
                    color: "#fff",
                    fontSize: "0.75rem",
                  }}
                >
                  {workoutDaysCount > 0
                    ? `${workoutDaysCount} ngày luyện tập`
                    : "Chưa có ngày tập"}
                </span>
              </div>

              <div
                className="mb-3 p-3 rounded"
                style={{ background: "#fff", border: "1px dashed #ffc1c7" }}
              >
                <div className="row g-3 align-items-start">
                  <div className="col-12 col-md-8">
                    <div className="text-uppercase small text-muted fw-semibold mb-1">
                      📝 Mô tả kế hoạch
                    </div>
                    <div style={{ fontSize: "0.95rem" }}>
                      {renderText(workoutPlan.description) || "—"}
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-uppercase small text-muted fw-semibold mb-1">
                      ⏰ Cập nhật lần cuối
                    </div>
                    <div className="fw-semibold">
                      {formatVNDateTime(workoutPlan.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="mt-0" />

              {workoutDays.length === 0 ? (
                <p className="text-muted">
                  Chưa có chi tiết ngày tập trong kế hoạch này.
                </p>
              ) : (
                workoutDays.map((day, dayIndex) => {
                  const isOpen = expandedWorkoutDays.includes(dayIndex);
                  const exs = getExercises(day);

                  return (
                    <div
                      key={dayIndex}
                      className="mb-3 border rounded"
                      style={{ background: "transparent" }}
                    >
                      <div
                        className="d-flex justify-content-between align-items-center px-3 py-2"
                        style={{
                          cursor: "pointer",
                          backgroundColor: "transparent",
                          borderRadius: "0.25rem 0.25rem 0 0",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                        onClick={() => toggleWorkoutDay(dayIndex)}
                      >
                        <div>
                          <strong>{formatDayNumberLabel(day, dayIndex)}</strong>{" "}
                          {day.dayName && (
                            <span className="text-muted">
                              - {renderText(day.dayName)}
                            </span>
                          )}
                          {day.focusArea && (
                            <span className="text-muted ms-2">
                              ({renderListText(day.focusArea)})
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className="text-muted me-2"
                            style={{ fontSize: 12 }}
                          >
                            {isOpen ? "Thu gọn" : "Xem chi tiết"}
                          </span>
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "999px",
                              backgroundColor: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              lineHeight: 1,
                            }}
                          >
                            {isOpen ? "−" : "+"}
                          </span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="p-3">
                          <div className="row mb-2">
                            <div className="col-12 col-md-6 mb-2">
                              <div className="small text-muted mb-1">
                                Mô tả buổi tập
                              </div>
                              <div style={{ fontSize: "0.95rem" }}>
                                {renderText(day.description) || "—"}
                              </div>
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <div className="small text-muted mb-1">
                                Thời lượng
                              </div>
                              <div>
                                {day.durationMinutes != null
                                  ? `${renderText(day.durationMinutes)} phút`
                                  : "—"}
                              </div>
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <div className="small text-muted mb-1">Độ khó</div>
                              <div>{renderText(day.difficulty) || "—"}</div>
                            </div>
                          </div>

                          {day.notes && (
                            <div
                              className="mb-2 p-2 rounded"
                              style={{
                                background: "#fff",
                                borderLeft: "4px solid #c80036",
                                fontSize: "0.9rem",
                              }}
                            >
                              <strong>Ghi chú: </strong>
                              {renderText(day.notes)}
                            </div>
                          )}

                          <h6 className="mt-3 mb-2">
                            Danh sách bài tập trong ngày
                          </h6>

                          {exs.length === 0 ? (
                            <p className="text-muted">
                              Chưa có bài tập nào cho ngày này.
                            </p>
                          ) : (
                            exs.map((ex, exIndex) => {
                              const key = `${dayIndex}-${exIndex}`;
                              const exOpen = expandedExercises.includes(key);

                              const exTitle =
                                ex?.name ||
                                ex?.exerciseName ||
                                ex?.sessionName ||
                                ex?.timeSlotName ||
                                `Bài tập ${exIndex + 1}`;

                              return (
                                <div
                                  key={exIndex}
                                  className="p-2 mb-2 rounded"
                                  style={{ backgroundColor: "#ffffff" }}
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div
                                      className="d-flex align-items-center"
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        toggleExercise(dayIndex, exIndex)
                                      }
                                    >
                                      <strong className="me-2">
                                        Bài tập {exIndex + 1}
                                      </strong>
                                      <span
                                        className="text-muted"
                                        style={{ fontSize: 12 }}
                                      >
                                        - {renderText(exTitle)}
                                      </span>
                                    </div>
                                    <span
                                      className="text-muted"
                                      style={{ fontSize: 11, cursor: "pointer" }}
                                      onClick={() =>
                                        toggleExercise(dayIndex, exIndex)
                                      }
                                    >
                                      {exOpen ? "Thu gọn" : "Xem chi tiết"}
                                    </span>
                                  </div>

                                  {exOpen && (
                                    <div style={{ fontSize: "0.95rem" }}>
                                      <div className="row mb-2">
                                        <div className="col-12 col-md-6 mb-2">
                                          <div className="small text-muted mb-1">
                                            Mô tả
                                          </div>
                                          <div>
                                            {renderText(ex.description) || "—"}
                                          </div>
                                        </div>
                                        <div className="col-12 col-md-6 mb-2">
                                          <div className="small text-muted mb-1">
                                            Thiết bị / Nhóm cơ
                                          </div>
                                          <div>
                                            {renderText(ex.equipment) || "—"}
                                            {ex.muscleGroups && (
                                              <span className="text-muted">
                                                {" "}
                                                -{" "}
                                                {renderText(ex.muscleGroups)}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="row mb-2">
                                        <div className="col-4">
                                          <div className="small text-muted mb-1">
                                            Sets
                                          </div>
                                          <div>{ex.sets ?? "—"}</div>
                                        </div>
                                        <div className="col-4">
                                          <div className="small text-muted mb-1">
                                            Reps
                                          </div>
                                          <div>{ex.reps ?? "—"}</div>
                                        </div>
                                        <div className="col-4">
                                          <div className="small text-muted mb-1">
                                            Nghỉ (giây)
                                          </div>
                                          <div>{ex.restSeconds ?? "—"}</div>
                                        </div>
                                      </div>

                                      {ex.instructions && (
                                        <div
                                          className="mt-1 p-2 rounded"
                                          style={{
                                            background: "#faf5ff",
                                            borderLeft: "4px solid #7c3aed",
                                            fontSize: "0.9rem",
                                          }}
                                        >
                                          <strong>Lưu ý kỹ thuật: </strong>
                                          {renderText(ex.instructions)}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ================== TAB: MEAL PLAN ================== */}
      {activeTab === "meal" && (
        <>
          {loadingPlans ? (
            <div className="text-center my-5">
              <Spin size="large" />
            </div>
          ) : !mealPlan ? (
            <div className="alert alert-light border text-center">
              Chưa có kế hoạch dinh dưỡng từ huấn luyện viên.
            </div>
          ) : (
            <div
              className="p-3 shadow rounded"
              style={{ background: "#f3fff4", border: "1px solid #c7f5cf" }}
            >
              <div className="d-flex justify-content-between align-items-center mb-2">
                <h3 className="fw-bold mb-0" style={{ color: "#1c8f36" }}>
                  🥗 Kế hoạch dinh dưỡng (Meal Plan)
                </h3>
                <span
                  className="badge rounded-pill"
                  style={{
                    backgroundColor: "#1c8f36",
                    color: "#fff",
                    fontSize: "0.75rem",
                  }}
                >
                  {mealDaysCount > 0
                    ? `${mealDaysCount} ngày ăn uống`
                    : "Chưa có ngày ăn"}
                </span>
              </div>

              <div
                className="mb-3 p-3 rounded"
                style={{ background: "#ffffff", border: "1px dashed #a6e8b0" }}
              >
                <div className="row g-3 align-items-start">
                  <div className="col-12 col-md-8">
                    <div className="text-uppercase small text-muted fw-semibold mb-1">
                      📝 Mô tả kế hoạch
                    </div>
                    <div style={{ fontSize: "0.95rem" }}>
                      {renderText(mealPlan.description) || "—"}
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-uppercase small text-muted fw-semibold mb-1">
                      ⏰ Cập nhật lần cuối
                    </div>
                    <div className="fw-semibold">
                      {formatVNDateTime(mealPlan.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>

              <hr className="mt-0" />

              {mealDays.length === 0 ? (
                <p className="text-muted">
                  Chưa có chi tiết ngày ăn trong kế hoạch này.
                </p>
              ) : (
                mealDays.map((day, dayIndex) => {
                  const isOpen = expandedMealDays.includes(dayIndex);
                  const meals = Array.isArray(day.meals) ? day.meals : [];

                  return (
                    <div
                      key={dayIndex}
                      className="mb-3 border rounded"
                      style={{ background: "transparent" }}
                    >
                      <div
                        className="d-flex justify-content-between align-items-center px-3 py-2"
                        style={{
                          cursor: "pointer",
                          backgroundColor: "transparent",
                          borderRadius: "0.25rem 0.25rem 0 0",
                          borderBottom: "1px solid rgba(0,0,0,0.05)",
                        }}
                        onClick={() => toggleMealDay(dayIndex)}
                      >
                        <div>
                          <strong>{formatDayNumberLabel(day, dayIndex)}</strong>{" "}
                          {day.dayName && (
                            <span className="text-muted">
                              - {renderText(day.dayName)}
                            </span>
                          )}
                        </div>
                        <div className="d-flex align-items-center">
                          <span
                            className="text-muted me-2"
                            style={{ fontSize: 12 }}
                          >
                            {isOpen ? "Thu gọn" : "Xem chi tiết"}
                          </span>
                          <span
                            style={{
                              width: 24,
                              height: 24,
                              borderRadius: "999px",
                              backgroundColor: "#fff",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 16,
                              lineHeight: 1,
                            }}
                          >
                            {isOpen ? "−" : "+"}
                          </span>
                        </div>
                      </div>

                      {isOpen && (
                        <div className="p-3">
                          {meals.length === 0 ? (
                            <p className="text-muted">
                              Chưa có bữa ăn nào cho ngày này.
                            </p>
                          ) : (
                            meals.map((m, mealIndex) => {
                              const key = `${dayIndex}-${mealIndex}`;
                              const mOpen = expandedMeals.includes(key);

                              return (
                                <div
                                  key={mealIndex}
                                  className="p-2 mb-2 rounded"
                                  style={{ backgroundColor: "#ffffff" }}
                                >
                                  <div className="d-flex justify-content-between align-items-center mb-1">
                                    <div
                                      className="d-flex align-items-center"
                                      style={{ cursor: "pointer" }}
                                      onClick={() =>
                                        toggleMeal(dayIndex, mealIndex)
                                      }
                                    >
                                      <strong className="me-2">
                                        Bữa {mealIndex + 1}
                                      </strong>
                                      {m.mealType && (
                                        <span
                                          className="text-muted me-1"
                                          style={{ fontSize: 12 }}
                                        >
                                          ({renderText(m.mealType)})
                                        </span>
                                      )}
                                      {m.name && (
                                        <span
                                          className="text-muted"
                                          style={{ fontSize: 12 }}
                                        >
                                          - {renderText(m.name)}
                                        </span>
                                      )}
                                    </div>

                                    <div className="d-flex align-items-center">
                                      {m.mealTime && (
                                        <span
                                          className="text-muted me-3"
                                          style={{ fontSize: 12 }}
                                        >
                                          ⏰ {formatTimeSpanHHmm(m.mealTime)}
                                        </span>
                                      )}
                                      <span
                                        className="text-muted"
                                        style={{ fontSize: 11, cursor: "pointer" }}
                                        onClick={() =>
                                          toggleMeal(dayIndex, mealIndex)
                                        }
                                      >
                                        {mOpen ? "Thu gọn" : "Xem chi tiết"}
                                      </span>
                                    </div>
                                  </div>

                                  {mOpen && (
                                    <div style={{ fontSize: "0.95rem" }}>
                                      <div className="mb-2">
                                        <div className="small text-muted mb-1">
                                          Mô tả món ăn
                                        </div>
                                        <div>
                                          {renderText(m.description) || "—"}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="small text-muted mb-1">
                                          Hướng dẫn chế biến / lưu ý
                                        </div>
                                        <div>
                                          {renderText(m.instructions) || "—"}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </>
      )}

      {/* ================== TAB: BMI (PlanSuggestion/bmi) - NEW LAYOUT ================== */}
      {activeTab === "bmi" && (
        <div className="mt-2">
          <div
            className="p-4 shadow rounded"
            style={{
              background:
                "linear-gradient(135deg, #eef3ff 0%, #f7f9ff 55%, #ffffff 100%)",
              border: "1px solid rgba(42,63,219,0.18)",
            }}
          >
            <div className="text-center mb-3">
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "10px 14px",
                  borderRadius: 999,
                  background: "rgba(42,63,219,0.10)",
                  border: "1px solid rgba(42,63,219,0.18)",
                  fontWeight: 1000,
                  color: "#2a3fdb",
                }}
              >
                <span style={{ fontSize: 18 }}>📊</span>
                <span>Gợi ý theo BMI</span>
              </div>
            </div>

            {loadingBmi ? (
              <div className="text-center my-4">
                <Spin size="large" />
              </div>
            ) : (
              <>
                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-4">
                    <div
                      className="p-3 rounded-4 shadow-sm h-100"
                      style={{
                        background: "#fff",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        className="text-muted"
                        style={{ fontSize: 12, fontWeight: 800 }}
                      >
                        Cân nặng
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 1000 }}>
                        {weight != null ? `${weight} kg` : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div
                      className="p-3 rounded-4 shadow-sm h-100"
                      style={{
                        background: "#fff",
                        border: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div
                        className="text-muted"
                        style={{ fontSize: 12, fontWeight: 800 }}
                      >
                        Chiều cao
                      </div>
                      <div style={{ fontSize: 20, fontWeight: 1000 }}>
                        {height != null ? `${height} cm` : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div
                      className="p-3 rounded-4 shadow-sm h-100"
                      style={{
                        background: "#fff",
                        border: `2px solid ${bmiColor}`,
                      }}
                    >
                      <div
                        className="text-muted"
                        style={{ fontSize: 12, fontWeight: 800 }}
                      >
                        BMI
                      </div>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 1100,
                          color: bmiColor,
                        }}
                      >
                        {bmi || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {bmiError ? (
                  <div className="alert alert-light border text-center mb-0">
                    {bmiError}
                  </div>
                ) : (
                  <>
                    <div
                      className="p-3 rounded-4 mb-3"
                      style={{
                        background: "#fff",
                        borderLeft: `10px solid ${bmiColor}`,
                        borderTop: "1px solid rgba(0,0,0,0.06)",
                        borderRight: "1px solid rgba(0,0,0,0.06)",
                        borderBottom: "1px solid rgba(0,0,0,0.06)",
                      }}
                    >
                      <div className="d-flex flex-wrap align-items-center gap-2">
                        <span
                          className="badge rounded-pill"
                          style={{
                            background: `${bmiColor}22`,
                            color: bmiColor,
                            fontWeight: 1000,
                          }}
                        >
                          Trạng thái
                        </span>
                        <span style={{ fontWeight: 1000, fontSize: 16 }}>
                          {renderText(bmiCategoryText) ||
                            "Chưa có gợi ý từ hệ thống"}
                        </span>
                      </div>

                      {bmiNote ? (
                        <div
                          className="mt-2 text-muted"
                          style={{ lineHeight: 1.6 }}
                        >
                          {renderText(bmiNote)}
                        </div>
                      ) : null}
                    </div>

                    {/* 2 columns */}
                    <div className="row g-3">
                      {/* WORKOUT */}
                      <div className="col-12 col-lg-6">
                        <div
                          className="p-3 rounded-4 shadow-sm h-100"
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(42,63,219,0.15)",
                          }}
                        >
                          <div
                            className="mb-2"
                            style={{
                              fontWeight: 1100,
                              fontSize: 18,
                              color: "#2a3fdb",
                            }}
                          >
                            🏋️ Kế hoạch tập luyện
                          </div>

                          {!sugWorkout ? (
                            <div className="text-muted">
                              Chưa có gợi ý workout từ hệ thống.
                            </div>
                          ) : (
                            <>
                              <div className="mb-2">
                                <div className="small text-muted fw-semibold mb-1">
                                  Tiêu đề
                                </div>
                                <div style={{ fontWeight: 1000 }}>
                                  {renderText(sugWorkout.title) || "—"}
                                </div>
                              </div>

                              <div className="mb-2">
                                <div className="small text-muted fw-semibold mb-1">
                                  Mô tả
                                </div>
                                <div style={{ lineHeight: 1.6 }}>
                                  {renderText(sugWorkout.description) || "—"}
                                </div>
                              </div>

                              <div className="row g-2 mb-2">
                                <div className="col-6">
                                  <div className="small text-muted fw-semibold mb-1">
                                    Cấp độ
                                  </div>
                                  <div style={{ fontWeight: 900 }}>
                                    {renderText(sugWorkout.level) || "—"}
                                  </div>
                                </div>
                                <div className="col-6">
                                  <div className="small text-muted fw-semibold mb-1">
                                    Buổi/tuần
                                  </div>
                                  <div style={{ fontWeight: 900 }}>
                                    {sugWorkout.sessionsPerWeek != null
                                      ? renderText(sugWorkout.sessionsPerWeek)
                                      : "—"}
                                  </div>
                                </div>
                              </div>

                              {/* focusAreas: string[] hoặc object[] */}
                              {isWorkoutDaysObjectList(sugWorkoutFocus) ? (
                                <DaysAccordion
                                  id="acc-workout-sug"
                                  title="Lịch gợi ý theo ngày"
                                  days={sugWorkoutFocus}
                                  accent="#2a3fdb"
                                  renderDayBody={(d) =>
                                    renderSessionsTable(
                                      d.sessions || d.exercises || []
                                    )
                                  }
                                />
                              ) : (
                                <div className="mt-2">
                                  <div className="small text-muted fw-semibold mb-2">
                                    Nhóm tập trung
                                  </div>
                                  {sugWorkoutFocus.length ? (
                                    <div className="d-flex flex-wrap gap-2">
                                      {sugWorkoutFocus.map((x, i) => (
                                        <span
                                          key={i}
                                          className="badge rounded-pill"
                                          style={{
                                            background:
                                              "rgba(42,63,219,0.10)",
                                            color: "#2a3fdb",
                                            fontWeight: 900,
                                          }}
                                        >
                                          {renderText(x)}
                                        </span>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-muted">—</div>
                                  )}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {/* MEAL */}
                      <div className="col-12 col-lg-6">
                        <div
                          className="p-3 rounded-4 shadow-sm h-100"
                          style={{
                            background: "#fff",
                            border: "1px solid rgba(28,143,54,0.18)",
                          }}
                        >
                          <div
                            className="mb-2"
                            style={{
                              fontWeight: 1100,
                              fontSize: 18,
                              color: "#1c8f36",
                            }}
                          >
                            🍽️ Kế hoạch dinh dưỡng
                          </div>

                          {!sugMeal ? (
                            <div className="text-muted">
                              Chưa có gợi ý dinh dưỡng từ hệ thống.
                            </div>
                          ) : (
                            <>
                              <div className="mb-2">
                                <div className="small text-muted fw-semibold mb-1">
                                  Tiêu đề
                                </div>
                                <div style={{ fontWeight: 1000 }}>
                                  {renderText(sugMeal.title) || "—"}
                                </div>
                              </div>

                              <div className="mb-2">
                                <div className="small text-muted fw-semibold mb-1">
                                  Mô tả
                                </div>
                                <div style={{ lineHeight: 1.6 }}>
                                  {renderText(sugMeal.description) || "—"}
                                </div>
                              </div>

                              <div className="mb-2">
                                <div className="small text-muted fw-semibold mb-1">
                                  Calories/ngày (mục tiêu)
                                </div>
                                <div style={{ fontWeight: 1000 }}>
                                  {sugMeal.targetCaloriesPerDay != null
                                    ? renderText(sugMeal.targetCaloriesPerDay)
                                    : "—"}
                                </div>
                              </div>

                              {/* dailyMeals: string[] hoặc object[] */}
                              {isMealDaysObjectList(sugMealDaily) ? (
                                <DaysAccordion
                                  id="acc-meal-sug"
                                  title="Gợi ý bữa ăn theo ngày"
                                  days={sugMealDaily}
                                  accent="#1c8f36"
                                  renderDayBody={(d) =>
                                    renderMealsList(d.meals || [])
                                  }
                                />
                              ) : (
                                <div className="mt-2">
                                  <div className="small text-muted fw-semibold mb-2">
                                    Gợi ý bữa ăn mỗi ngày
                                  </div>
                                  {renderMealsList(sugMealDaily)}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
