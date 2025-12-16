import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import api from "../../config/axios";

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

// Format TimeSpan "07:00:00" -> "07:00"
const formatTimeSpanHHmm = (time) => {
  if (!time) return "";
  const parts = String(time).split(":");
  if (parts.length >= 2) {
    const hh = String(parts[0]).padStart(2, "0");
    const mm = String(parts[1]).padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return String(time);
};

export default function WorkoutMealPlan() {
  const [activeTab, setActiveTab] = useState("workout");

  // Workout / Meal plan từ API
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [mealPlan, setMealPlan] = useState(null);

  // Expand state Workout
  const [expandedWorkoutDays, setExpandedWorkoutDays] = useState([]);
  const [expandedExercises, setExpandedExercises] = useState([]);

  // Expand state Meal
  const [expandedMealDays, setExpandedMealDays] = useState([]);
  const [expandedMeals, setExpandedMeals] = useState([]);

  // BMI + PlanSuggestion from API
  const [loadingBmi, setLoadingBmi] = useState(true);
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [bmi, setBmi] = useState("");
  const [planSuggestion, setPlanSuggestion] = useState(null); // ✅ data từ /PlanSuggestion/bmi
  const [bmiError, setBmiError] = useState("");

  // Load Workout & Meal plan từ API
  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);
        const [workoutRes, mealRes] = await Promise.allSettled([
          api.get("/WorkoutPlan/me"),
          api.get("/MealPlan/me"),
        ]);

        if (
          workoutRes.status === "fulfilled" &&
          Array.isArray(workoutRes.value.data) &&
          workoutRes.value.data.length > 0
        ) {
          const wp = workoutRes.value.data[0];
          setWorkoutPlan(wp);

          const dayIdxs = (wp.days || []).map((_, idx) => idx);
          setExpandedWorkoutDays(dayIdxs);

          const exKeys = [];
          (wp.days || []).forEach((d, di) => {
            (d.exercises || []).forEach((_, ei) => exKeys.push(`${di}-${ei}`));
          });
          setExpandedExercises(exKeys);
        } else {
          setWorkoutPlan(null);
        }

        if (
          mealRes.status === "fulfilled" &&
          Array.isArray(mealRes.value.data) &&
          mealRes.value.data.length > 0
        ) {
          const mp = mealRes.value.data[0];
          setMealPlan(mp);

          const dayIdxs = (mp.days || []).map((_, idx) => idx);
          setExpandedMealDays(dayIdxs);

          const mealKeys = [];
          (mp.days || []).forEach((d, di) => {
            (d.meals || []).forEach((_, mi) => mealKeys.push(`${di}-${mi}`));
          });
          setExpandedMeals(mealKeys);
        } else {
          setMealPlan(null);
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

  // load BMI data từ /Profile/my-profile + gọi PlanSuggestion/bmi
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

        if (!w || !h || h <= 0) {
          setBmi("");
          setBmiError("Vui lòng cập nhật cân nặng và chiều cao trong hồ sơ để xem gợi ý BMI.");
          return;
        }

        const heightInMeters = h / 100;
        const bmiValue = (w / (heightInMeters * heightInMeters)).toFixed(1);
        setBmi(bmiValue);

        // ✅ gọi API PlanSuggestion/bmi
        // Nếu BE dùng query: /PlanSuggestion/bmi?bmi=xx
        // thì axios params là đúng.
        const sugRes = await api.get("/PlanSuggestion/bmi", {
          params: { bmi: Number(bmiValue) },
        });

        setPlanSuggestion(sugRes.data || null);
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

  // Toggle helpers
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

  const workoutDaysCount = (workoutPlan?.days || []).length || 0;
  const mealDaysCount = (mealPlan?.days || []).length || 0;

  // ✅ Helpers lấy dữ liệu từ planSuggestion DTO
  const bmiCategoryText = planSuggestion?.category || "";
  const bmiNote = planSuggestion?.note || "";
  const sugMeal = planSuggestion?.mealPlan || null;
  const sugWorkout = planSuggestion?.workoutPlan || null;

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
          Gợi ý được lấy từ hệ thống dựa trên BMI (tính từ cân nặng & chiều cao bạn đã lưu).
          Nếu bạn cập nhật hồ sơ, dữ liệu tại đây sẽ thay đổi tương ứng.
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

      {/* TAB: WORKOUT PLAN */}
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
            <strong>🎯 Mục tiêu chung:</strong> Tăng cơ, giảm mỡ, cải thiện sức bền,
            kiểm soát mỡ và hỗ trợ sức khỏe lâu dài.
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
                style={{
                  background: "#fff",
                  border: "1px dashed #ffc1c7",
                }}
              >
                <div className="row g-3 align-items-start">
                  <div className="col-12 col-md-8">
                    <div className="text-uppercase small text-muted fw-semibold mb-1">
                      📝 Mô tả kế hoạch
                    </div>
                    <div style={{ fontSize: "0.95rem" }}>
                      {workoutPlan.description || "—"}
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

              {(workoutPlan.days || []).length === 0 ? (
                <p className="text-muted">Chưa có chi tiết ngày tập trong kế hoạch này.</p>
              ) : (
                (workoutPlan.days || []).map((day, dayIndex) => {
                  const isOpen = expandedWorkoutDays.includes(dayIndex);
                  const exs = day.exercises || [];
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
                          <strong>Ngày {day.dayNumber || dayIndex + 1}</strong>{" "}
                          {day.dayName && (
                            <span className="text-muted">- {day.dayName}</span>
                          )}
                          {day.focusArea && (
                            <span className="text-muted ms-2">({day.focusArea})</span>
                          )}
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="text-muted me-2" style={{ fontSize: 12 }}>
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
                              <div className="small text-muted mb-1">Mô tả buổi tập</div>
                              <div style={{ fontSize: "0.95rem" }}>
                                {day.description || "—"}
                              </div>
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <div className="small text-muted mb-1">Thời lượng</div>
                              <div>
                                {day.durationMinutes ? `${day.durationMinutes} phút` : "—"}
                              </div>
                            </div>
                            <div className="col-12 col-md-3 mb-2">
                              <div className="small text-muted mb-1">Độ khó</div>
                              <div>{day.difficulty || "—"}</div>
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
                              {day.notes}
                            </div>
                          )}

                          <h6 className="mt-3 mb-2">Danh sách bài tập trong ngày</h6>

                          {exs.length === 0 ? (
                            <p className="text-muted">Chưa có bài tập nào cho ngày này.</p>
                          ) : (
                            exs.map((ex, exIndex) => {
                              const key = `${dayIndex}-${exIndex}`;
                              const exOpen = expandedExercises.includes(key);
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
                                      onClick={() => toggleExercise(dayIndex, exIndex)}
                                    >
                                      <strong className="me-2">Bài tập {exIndex + 1}</strong>
                                      {ex.name && (
                                        <span className="text-muted" style={{ fontSize: 12 }}>
                                          - {ex.name}
                                        </span>
                                      )}
                                    </div>
                                    <span
                                      className="text-muted"
                                      style={{ fontSize: 11, cursor: "pointer" }}
                                      onClick={() => toggleExercise(dayIndex, exIndex)}
                                    >
                                      {exOpen ? "Thu gọn" : "Xem chi tiết"}
                                    </span>
                                  </div>

                                  {exOpen && (
                                    <div style={{ fontSize: "0.95rem" }}>
                                      <div className="row mb-2">
                                        <div className="col-12 col-md-6 mb-2">
                                          <div className="small text-muted mb-1">Mô tả</div>
                                          <div>{ex.description || "—"}</div>
                                        </div>
                                        <div className="col-12 col-md-6 mb-2">
                                          <div className="small text-muted mb-1">
                                            Thiết bị / Nhóm cơ
                                          </div>
                                          <div>
                                            {ex.equipment || "—"}{" "}
                                            {ex.muscleGroups && (
                                              <span className="text-muted"> - {ex.muscleGroups}</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div className="row mb-2">
                                        <div className="col-4">
                                          <div className="small text-muted mb-1">Sets</div>
                                          <div>{ex.sets ?? "—"}</div>
                                        </div>
                                        <div className="col-4">
                                          <div className="small text-muted mb-1">Reps</div>
                                          <div>{ex.reps ?? "—"}</div>
                                        </div>
                                        <div className="col-4">
                                          <div className="small text-muted mb-1">Nghỉ (giây)</div>
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
                                          {ex.instructions}
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

      {/* TAB: MEAL PLAN */}
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
                  {mealDaysCount > 0 ? `${mealDaysCount} ngày ăn uống` : "Chưa có ngày ăn"}
                </span>
              </div>

              <div
                className="mb-3 p-3 rounded"
                style={{
                  background: "#ffffff",
                  border: "1px dashed #a6e8b0",
                }}
              >
                <div className="row g-3 align-items-start">
                  <div className="col-12 col-md-8">
                    <div className="text-uppercase small text-muted fw-semibold mb-1">
                      📝 Mô tả kế hoạch
                    </div>
                    <div style={{ fontSize: "0.95rem" }}>
                      {mealPlan.description || "—"}
                    </div>
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="text-uppercase small text-muted fw-semibold mb-1">
                      ⏰ Cập nhật lần cuối
                    </div>
                    <div className="fw-semibold">{formatVNDateTime(mealPlan.updatedAt)}</div>
                  </div>
                </div>
              </div>

              <hr className="mt-0" />

              {(mealPlan.days || []).length === 0 ? (
                <p className="text-muted">Chưa có chi tiết ngày ăn trong kế hoạch này.</p>
              ) : (
                (mealPlan.days || []).map((day, dayIndex) => {
                  const isOpen = expandedMealDays.includes(dayIndex);
                  const meals = day.meals || [];
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
                          <strong>Ngày {day.dayNumber || dayIndex + 1}</strong>{" "}
                          {day.dayName && <span className="text-muted">- {day.dayName}</span>}
                        </div>
                        <div className="d-flex align-items-center">
                          <span className="text-muted me-2" style={{ fontSize: 12 }}>
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
                            <p className="text-muted">Chưa có bữa ăn nào cho ngày này.</p>
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
                                      onClick={() => toggleMeal(dayIndex, mealIndex)}
                                    >
                                      <strong className="me-2">Bữa {mealIndex + 1}</strong>
                                      {m.mealType && (
                                        <span className="text-muted me-1" style={{ fontSize: 12 }}>
                                          ({m.mealType})
                                        </span>
                                      )}
                                      {m.name && (
                                        <span className="text-muted" style={{ fontSize: 12 }}>
                                          - {m.name}
                                        </span>
                                      )}
                                    </div>
                                    <div className="d-flex align-items-center">
                                      {m.mealTime && (
                                        <span className="text-muted me-3" style={{ fontSize: 12 }}>
                                          ⏰ {formatTimeSpanHHmm(m.mealTime)}
                                        </span>
                                      )}
                                      <span
                                        className="text-muted"
                                        style={{ fontSize: 11, cursor: "pointer" }}
                                        onClick={() => toggleMeal(dayIndex, mealIndex)}
                                      >
                                        {mOpen ? "Thu gọn" : "Xem chi tiết"}
                                      </span>
                                    </div>
                                  </div>

                                  {mOpen && (
                                    <div style={{ fontSize: "0.95rem" }}>
                                      <div className="mb-2">
                                        <div className="small text-muted mb-1">Mô tả món ăn</div>
                                        <div>{m.description || "—"}</div>
                                      </div>
                                      <div>
                                        <div className="small text-muted mb-1">
                                          Hướng dẫn chế biến / lưu ý
                                        </div>
                                        <div>{m.instructions || "—"}</div>
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

      {/* TAB: GỢI Ý BMI (✅ API PlanSuggestion/bmi) */}
      {activeTab === "bmi" && (
        <div className="mt-2">
          <div
            className="p-4 shadow rounded"
            style={{
              background: "#eef3ff",
              border: "1px solid #c8d6ff",
            }}
          >
            <h4
              className="fw-bold mb-3 text-center"
              style={{
                fontSize: "1.3rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: "#2a3fdb",
              }}
            >
              📊 Gợi ý theo BMI
            </h4>

            {loadingBmi ? (
              <div className="text-center my-4">
                <Spin size="large" />
              </div>
            ) : (
              <>
                {/* 3 ô cân nặng / chiều cao / BMI */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-4">
                    <div
                      className="rounded p-3 text-center shadow-sm"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e4e8ff",
                      }}
                    >
                      <div style={{ fontSize: "0.9rem", color: "#6c6c6c" }}>Cân nặng</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                        {weight != null ? `${weight} kg` : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div
                      className="rounded p-3 text-center shadow-sm"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e4e8ff",
                      }}
                    >
                      <div style={{ fontSize: "0.9rem", color: "#6c6c6c" }}>Chiều cao</div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                        {height != null ? `${height} cm` : "—"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-md-4">
                    <div
                      className="rounded p-3 text-center shadow-sm"
                      style={{
                        background: "#ffffff",
                        border: `2px solid ${bmiColor}`,
                      }}
                    >
                      <div style={{ fontSize: "0.9rem", color: "#6c6c6c" }}>BMI</div>
                      <div
                        style={{
                          fontSize: "1.3rem",
                          fontWeight: 800,
                          color: bmiColor,
                        }}
                      >
                        {bmi || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nếu thiếu dữ liệu hoặc lỗi */}
                {(bmiError && (
                  <div className="alert alert-light border text-center mb-0">{bmiError}</div>
                )) ||
                  null}

                {/* Khung gợi ý (nếu có planSuggestion) */}
                {!bmiError && (
                  <div
                    className="p-4 rounded"
                    style={{
                      background: "#ffffff",
                      borderLeft: `8px solid ${bmiColor}`,
                      boxShadow: "0 3px 12px rgba(0,0,0,0.1)",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        marginBottom: 10,
                        fontSize: "1.05rem",
                        color: bmiColor,
                      }}
                    >
                      Trạng thái BMI:{" "}
                      <span>{bmiCategoryText || "Chưa có gợi ý từ hệ thống"}</span>
                    </div>

                    {bmiNote && (
                      <div
                        className="mb-3 p-2 rounded"
                        style={{
                          background: "#f7f9ff",
                          border: "1px solid #dee3ff",
                          lineHeight: 1.55,
                          fontSize: "0.95rem",
                        }}
                      >
                        <strong>📝 Ghi chú: </strong>
                        {bmiNote}
                      </div>
                    )}

                    {/* Workout + Meal → 2 cột */}
                    <div className="row mt-3 g-3">
                      <div className="col-12 col-md-6">
                        <div
                          className="p-3 rounded shadow-sm h-100"
                          style={{
                            background: "#fafbff",
                            border: "1px solid #dee3ff",
                            lineHeight: 1.55,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 1000,
                              marginBottom: 6,
                              textAlign: "center",
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
                                <div className="small text-muted fw-semibold mb-1">Tiêu đề</div>
                                <div className="fw-bold">{sugWorkout.title || "—"}</div>
                              </div>

                              <div className="mb-2">
                                <div className="small text-muted fw-semibold mb-1">Mô tả</div>
                                <div>{sugWorkout.description || "—"}</div>
                              </div>

                              <div className="row g-2">
                                <div className="col-6">
                                  <div className="small text-muted fw-semibold mb-1">Cấp độ</div>
                                  <div>{sugWorkout.level || "—"}</div>
                                </div>
                                <div className="col-6">
                                  <div className="small text-muted fw-semibold mb-1">
                                    Buổi/tuần
                                  </div>
                                  <div>
                                    {sugWorkout.sessionsPerWeek != null
                                      ? sugWorkout.sessionsPerWeek
                                      : "—"}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2">
                                <div className="small text-muted fw-semibold mb-1">
                                  Nhóm tập trung
                                </div>
                                {Array.isArray(sugWorkout.focusAreas) &&
                                sugWorkout.focusAreas.length > 0 ? (
                                  <ul className="mb-0" style={{ paddingLeft: 18, color: "#353535ff" }}>
                                    {sugWorkout.focusAreas.map((x, i) => (
                                      <li key={i}>{x}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div>—</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <div
                          className="p-3 rounded shadow-sm h-100"
                          style={{
                            background: "#fafbff",
                            border: "1px solid #dee3ff",
                            lineHeight: 1.55,
                          }}
                        >
                          <div
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: 1000,
                              marginBottom: 6,
                              textAlign: "center",
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
                                <div className="small text-muted fw-semibold mb-1">Tiêu đề</div>
                                <div className="fw-bold">{sugMeal.title || "—"}</div>
                              </div>

                              <div className="mb-2">
                                <div className="small text-muted fw-semibold mb-1">Mô tả</div>
                                <div>{sugMeal.description || "—"}</div>
                              </div>

                              <div className="mb-2">
                                <div className="small text-muted fw-semibold mb-1">
                                  Calories/ngày (mục tiêu)
                                </div>
                                <div>
                                  {sugMeal.targetCaloriesPerDay != null
                                    ? sugMeal.targetCaloriesPerDay
                                    : "—"}
                                </div>
                              </div>

                              <div>
                                <div className="small text-muted fw-semibold mb-1">
                                  Gợi ý bữa ăn mỗi ngày
                                </div>
                                {Array.isArray(sugMeal.dailyMeals) &&
                                sugMeal.dailyMeals.length > 0 ? (
                                  <ul className="mb-0" style={{ paddingLeft: 18, color: "#353535ff" }}>
                                    {sugMeal.dailyMeals.map((x, i) => (
                                      <li key={i}>{x}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <div>—</div>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
