import React, { useEffect, useState } from "react";
import { Spin } from "antd";
import api from "../../config/axios";

// ================= MOCK DATA =================
const workoutPlanMock = {
  id: 1,
  trainerName: "Nguyễn Văn A",
  updatedAt: "2025-12-06T09:30:00Z",
  content: `
    <hr/>
    <h5>Thứ 2 – Ngực & Tay sau</h5>
    <ul>
      <li>Bench Press: 4 hiệp x 8–10 reps</li>
      <li>Incline Dumbbell Press: 3 hiệp x 10–12 reps</li>
      <li>Cable Fly: 3 hiệp x 12–15 reps</li>
      <li>Triceps Pushdown: 3 hiệp x 10–12 reps</li>
    </ul>

    <h5>Thứ 4 – Lưng & Tay trước</h5>
    <ul>
      <li>Lat Pulldown: 4 hiệp x 8–10 reps</li>
      <li>Seated Row: 3 hiệp x 10–12 reps</li>
      <li>Face Pull: 3 hiệp x 12–15 reps</li>
      <li>Biceps Curl: 3 hiệp x 10–12 reps</li>
    </ul>

    <h5>Thứ 6 – Chân & Vai</h5>
    <ul>
      <li>Squat: 4 hiệp x 8–10 reps</li>
      <li>Leg Press: 3 hiệp x 10–12 reps</li>
      <li>Lateral Raise: 3 hiệp x 12–15 reps</li>
      <li>Shoulder Press: 3 hiệp x 8–10 reps</li>
    </ul>

    <p><em>Ghi chú: Nghỉ 60–90 giây giữa các hiệp, luôn khởi động kỹ trước buổi tập.</em></p>
  `,
};

const mealPlanMock = {
  id: 1,
  trainerName: "Nguyễn Văn A",
  updatedAt: "2025-12-06T09:45:00Z",
  content: `
    <h5>Bữa sáng</h5>
    <ul>
      <li>Yến mạch 50g + sữa tươi không đường</li>
      <li>1 quả chuối</li>
      <li>1 ly nước lọc lớn</li>
    </ul>

    <h5>Bữa trưa</h5>
    <ul>
      <li>150–200g ức gà/ cá</li>
      <li>100g cơm gạo lứt hoặc khoai lang</li>
      <li>Rau luộc/ salad (ít sốt)</li>
    </ul>

    <h5>Bữa xế trước tập</h5>
    <ul>
      <li>1 hũ sữa chua không đường</li>
      <li>Hạnh nhân / hạt điều 10–15 hạt</li>
    </ul>

    <h5>Bữa tối (sau tập)</h5>
    <ul>
      <li>150g cá/ thịt nạc</li>
      <li>Rau xanh (luộc hoặc xào ít dầu)</li>
      <li>Có thể thêm 1 quả trứng luộc</li>
    </ul>

    <p><em>Ghi chú: Uống tối thiểu 2–2.5 lít nước/ngày, hạn chế nước ngọt, đồ chiên nhiều dầu.</em></p>
  `,
};

// ================= END MOCK DATA =================

// 👉 Logic gợi ý theo BMI (copy từ ProfileMember)
const getBmiSuggestions = (bmiValue) => {
  const bmi = parseFloat(bmiValue);
  if (isNaN(bmi)) return { category: "", workout: "", meal: "" };

  if (bmi < 16)
    return {
      category: "🚨 Gầy độ III",
      workout:
        "Tập rất nhẹ nhàng, ưu tiên phục hồi thể lực. 3 buổi/tuần, mỗi buổi 30–40 phút. Bắt đầu với bài bodyweight như plank, squat, push-up nhẹ. Tăng dần tạ nhỏ khi cơ thể quen.",
      meal:
        "Tăng 500–700 kcal/ngày. Ăn nhiều bữa nhỏ 5–6 lần/ngày. Ưu tiên: sữa nguyên kem, trứng, cá hồi, gạo, khoai lang, bơ, phô mai. Hạn chế đồ uống có gas và cà phê quá mức.",
    };

  if (bmi < 17)
    return {
      category: "⚠️ Gầy độ II",
      workout:
        "4 buổi/tuần tập full-body. 3 ngày tập tạ nhẹ – trung bình (compound: squat, bench, deadlift), 1 ngày cardio nhẹ (đi bộ nhanh 20 phút). Nghỉ đủ giấc, tăng trọng lượng tạ dần theo tuần.",
      meal:
        "Tăng 400–600 kcal/ngày. Bổ sung protein ≥1.6g/kg cơ thể. Ăn trước khi ngủ bữa nhẹ có sữa hoặc trứng. Uống sữa tăng cân hoặc whey protein sau tập để hỗ trợ phục hồi.",
    };

  if (bmi < 18.5)
    return {
      category: "⚠️ Gầy độ I",
      workout:
        "Tập tăng cơ 4–5 buổi/tuần: 3 ngày tập tạ, 2 ngày cardio nhẹ (đạp xe, bơi). Ưu tiên bài compound và progressive overload. Chú trọng ăn sau tập trong 30 phút đầu.",
      meal:
        "Ăn 3 bữa chính + 2 bữa phụ. Ưu tiên carb tốt (gạo lứt, yến mạch), protein (thịt gà, cá, trứng), healthy fat (bơ, hạt). Uống đủ 2–2.5L nước/ngày.",
    };

  if (bmi < 25)
    return {
      category: "✅ Bình thường",
      workout:
        "Duy trì thể trạng: 5 buổi/tuần (3 buổi strength training, 2 buổi cardio HIIT hoặc chạy bộ). Kết hợp stretching, yoga cuối tuần để tăng linh hoạt. Mục tiêu: duy trì sức khỏe và cơ bắp.",
      meal:
        "Ăn cân đối theo tỷ lệ 40% carb – 30% protein – 30% fat. Ưu tiên rau xanh, trái cây tươi, chất xơ hòa tan. Hạn chế đường, rượu bia, nước ngọt. Ăn chậm, đúng giờ.",
    };

  if (bmi < 30)
    return {
      category: "⚠️ Thừa cân",
      workout:
        "Tập 5–6 buổi/tuần: 3 buổi cardio (HIIT, chạy nhanh – chậm xen kẽ 30 phút), 2–3 buổi tập tạ full-body. Tăng NEAT (đi bộ, leo cầu thang). Chú trọng đốt mỡ vùng bụng bằng plank, mountain climber.",
      meal:
        "Giảm 10–20% calo so với mức duy trì. Giảm tinh bột trắng (cơm, bánh mì), tránh ăn khuya. Ưu tiên thịt nạc, cá, trứng, rau xanh, trái cây ít đường (táo, bưởi). Uống 2.5–3L nước/ngày.",
    };

  if (bmi < 35)
    return {
      category: "⚠️ Béo phì độ I",
      workout:
        "Tập 6 buổi/tuần: 4 ngày cardio (đi bộ nhanh, đạp xe, bơi), 2 ngày tạ nhẹ – trung bình. Chú trọng bài giảm áp lực khớp gối: elliptical, plank, resistance band. Nghỉ chủ động 1 ngày.",
      meal:
        "Ăn kiểu low-carb hoặc Mediterranean. Cắt đường, nước ngọt, thức ăn nhanh. Ưu tiên rau, đạm nạc, dầu olive. Chia nhỏ bữa ăn, không bỏ bữa sáng. Uống trà xanh hoặc detox tự nhiên.",
    };

  if (bmi < 40)
    return {
      category: "⚠️ Béo phì độ II",
      workout:
        "Tập đều đặn hằng ngày 30–45 phút: đi bộ nhanh, bơi, yoga giảm áp lực. Bắt đầu với nhịp tim mục tiêu 60–70% tối đa. Tránh chạy hoặc nhảy mạnh để bảo vệ khớp.",
      meal:
        "Giảm khẩu phần nghiêm ngặt: ăn chậm, tránh ăn ngoài. Ưu tiên rau củ hấp, súp, cá hấp. Loại bỏ đường, tinh bột tinh chế, nước ngọt. Giữ mức calo giảm 25–30%.",
    };

  return {
    category: "🚨 Béo phì độ III",
    workout:
      "Tham khảo bác sĩ hoặc HLV cá nhân. Bắt đầu nhẹ với đi bộ 15 phút/ngày, yoga hít thở, giãn cơ. Khi thể lực cải thiện, tăng dần cường độ. Tránh quá sức để giảm nguy cơ tim mạch.",
    meal:
      "Theo dõi bởi chuyên gia dinh dưỡng. Áp dụng chế độ Very Low Calorie Diet (VLCD) nếu cần. Ưu tiên rau củ, protein nạc, giảm hoàn toàn đường, chất béo bão hòa. Uống đủ nước, chia nhỏ bữa.",
  };
};

export default function WorkoutMealPlan() {
  const [activeTab, setActiveTab] = useState("plan"); // "plan" | "about"

  const [loadingPlans, setLoadingPlans] = useState(true);
  const [workout, setWorkout] = useState(null);
  const [meal, setMeal] = useState(null);

  const [loadingBmi, setLoadingBmi] = useState(true);
  const [weight, setWeight] = useState(null);
  const [height, setHeight] = useState(null);
  const [bmi, setBmi] = useState("");
  const [bmiSuggestions, setBmiSuggestions] = useState({
    category: "",
    workout: "",
    meal: "",
  });

  // mock load plans
  useEffect(() => {
    const timer = setTimeout(() => {
      setWorkout(workoutPlanMock);
      setMeal(mealPlanMock);
      setLoadingPlans(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // load BMI data từ /Profile/my-profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoadingBmi(true);
        const res = await api.get("/Profile/my-profile");
        const data = res.data || {};

        const w = data.weight ?? null;
        const h = data.height ?? null;

        setWeight(w);
        setHeight(h);

        if (w && h && h > 0) {
          const heightInMeters = h / 100;
          const bmiValue = (w / (heightInMeters * heightInMeters)).toFixed(1);
          setBmi(bmiValue);
          setBmiSuggestions(getBmiSuggestions(bmiValue));
        } else {
          setBmi("");
          setBmiSuggestions({ category: "", workout: "", meal: "" });
        }
      } catch (err) {
        console.error("Error fetching /Profile/my-profile for BMI:", err);
        setBmi("");
        setBmiSuggestions({ category: "", workout: "", meal: "" });
      } finally {
        setLoadingBmi(false);
      }
    };

    fetchProfile();
  }, []);

  const bmiColor =
    !bmi
      ? "#6c757d"
      : bmi < 16
      ? "#0059ffff"
      : bmi < 17
      ? "#0080ffff"
      : bmi < 18.5
      ? "#00bfff"
      : bmi < 25
      ? "#00c853"
      : bmi < 30
      ? "#ffd54f"
      : bmi < 35
      ? "#ff9800"
      : bmi < 40
      ? "#ff6200ff"
      : "#e53935";

  const formatVNDateTime = (iso) => {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("vi-VN");
  };

  return (
    <div className="container py-4">
      <h1 className="mb-3 fw-bold text-center" style={{ color: "#c80036" }}>
        Kế hoạch tập luyện & dinh dưỡng
      </h1>

      {activeTab === "plan" && (
        <p className="text-center text-muted mb-4">
          Đây là kế hoạch do huấn luyện viên cá nhân thiết kế cho bạn.
          Hãy trao đổi trực tiếp với PT nếu cần điều chỉnh lịch tập hoặc chế độ ăn.
        </p>
      )}

      {activeTab === "about" && (
        <p className="text-center text-muted mb-4">
          Các gợi ý được hệ thống tạo tự động dựa trên cân nặng và chiều cao bạn đã lưu.
          Nếu bạn thay đổi thông tin trong trang hồ sơ, dữ liệu tại đây sẽ được cập nhật ngay lập tức.
        </p>
      )}

      {/* Tabs */}
      <div className="d-flex justify-content-center mb-4" style={{ gap: 8 }}>
        <button
          type="button"
          className={`btn btn-sm ${
            activeTab === "plan"
              ? "btn-primary"
              : "btn-outline-primary text-dark bg-white"
          }`}
          onClick={() => setActiveTab("plan")}
        >
          Kế hoạch của PT
        </button>
        <button
          type="button"
          className={`btn btn-sm ${
            activeTab === "about"
              ? "btn-primary"
              : "btn-outline-primary text-dark bg-white"
          }`}
          onClick={() => setActiveTab("about")}
        >
          Gợi ý theo BMI
        </button>
      </div>

      {/* Tab: Kế hoạch của PT (Workout + Meal) */}
      {activeTab === "plan" && (
        <>
          {/* 🎯 Mục tiêu chung */}
          <div
            className="mb-3 p-3 rounded shadow-sm text-center"
            style={{
              background: "#fff8e1",
              border: "1px solid #ffe082",
              fontSize: "0.95rem",
            }}
          >
            <strong>🎯 Mục tiêu:</strong>{" "}
            Tăng cơ, giảm mỡ, cải thiện sức bền, kiểm soát mỡ và hỗ trợ sức khỏe lâu dài.
          </div>

          {loadingPlans ? (
            <div className="text-center my-5">
              <Spin size="large" />
            </div>
          ) : (
            <div className="row g-3">
              {/* Card kế hoạch tập luyện */}
              <div className="col-12 col-lg-6">
                <div
                  className="p-3 shadow rounded h-100"
                  style={{ background: "#fff5f7ff", border: "1px solid #ffd6e0" }}
                >
                  <h3 className="fw-bold mb-3" style={{ color: "#c80036" }}>
                    📌 Kế hoạch tập luyện (Workout Plan)
                  </h3>

                  {!workout ? (
                    <p className="text-muted mt-3">Chưa có kế hoạch tập luyện.</p>
                  ) : (
                    <>
                      <div className="mb-2 small text-muted">
                        <div>
                          <strong>Huấn luyện viên:</strong>{" "}
                          {workout.trainerName || "—"}
                        </div>
                        <div>
                          <strong>Cập nhật lần cuối:</strong>{" "}
                          {formatVNDateTime(workout.updatedAt)}
                        </div>
                      </div>

                      <div
                        className="mt-2"
                        style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: workout.content }}
                      />
                    </>
                  )}
                </div>
              </div>

              {/* Card kế hoạch dinh dưỡng */}
              <div className="col-12 col-lg-6">
                <div
                  className="p-3 shadow rounded h-100"
                  style={{ background: "#f3fff4", border: "1px solid #c7f5cf" }}
                >
                  <h3 className="fw-bold mb-3" style={{ color: "#1c8f36" }}>
                    🥗 Kế hoạch dinh dưỡng (Meal Plan)
                  </h3>

                  {!meal ? (
                    <p className="text-muted mt-3">Chưa có kế hoạch dinh dưỡng.</p>
                  ) : (
                    <>
                      <div className="mb-2 small text-muted">
                        <div>
                          <strong>Huấn luyện viên:</strong>{" "}
                          {meal.trainerName || "—"}
                        </div>
                        <div>
                          <strong>Cập nhật lần cuối:</strong>{" "}
                          {formatVNDateTime(meal.updatedAt)}
                        </div>
                      </div>

                      <hr />

                      <div
                        className="mt-2"
                        style={{ fontSize: "0.95rem", lineHeight: 1.6 }}
                        dangerouslySetInnerHTML={{ __html: meal.content }}
                      />
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Tab: Gợi ý theo BMI */}
      {activeTab === "about" && (
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
              Gợi ý theo BMI
            </h4>

            {loadingBmi ? (
              <div className="text-center my-4">
                <Spin size="large" />
              </div>
            ) : (
              <>
                {/* 3 ô cân nặng / chiều cao / BMI */}
                <div className="row g-3 mb-4">
                  {/* Cân nặng */}
                  <div className="col-12 col-md-4">
                    <div
                      className="rounded p-3 text-center shadow-sm"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e4e8ff",
                      }}
                    >
                      <div style={{ fontSize: "0.9rem", color: "#6c6c6c" }}>
                        Cân nặng
                      </div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                        {weight != null ? `${weight} kg` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* Chiều cao */}
                  <div className="col-12 col-md-4">
                    <div
                      className="rounded p-3 text-center shadow-sm"
                      style={{
                        background: "#ffffff",
                        border: "1px solid #e4e8ff",
                      }}
                    >
                      <div style={{ fontSize: "0.9rem", color: "#6c6c6c" }}>
                        Chiều cao
                      </div>
                      <div style={{ fontSize: "1.2rem", fontWeight: 700 }}>
                        {height != null ? `${height} cm` : "—"}
                      </div>
                    </div>
                  </div>

                  {/* BMI */}
                  <div className="col-12 col-md-4">
                    <div
                      className="rounded p-3 text-center shadow-sm"
                      style={{
                        background: "#ffffff",
                        border: `2px solid ${bmiColor}`,
                      }}
                    >
                      <div style={{ fontSize: "0.9rem", color: "#6c6c6c" }}>
                        BMI
                      </div>
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

                {/* Khung gợi ý */}
                <div
                  className="p-4 rounded"
                  style={{
                    background: "#ffffff",
                    borderLeft: `8px solid ${bmiColor}`,
                    boxShadow: "0 3px 12px rgba(0,0,0,0.1)",
                  }}
                >
                  {/* Trạng thái */}
                  <div
                    style={{
                      fontWeight: 700,
                      marginBottom: 10,
                      fontSize: "1.05rem",
                      color: bmiColor,
                    }}
                  >
                    Trạng thái BMI:{" "}
                    <span>{bmiSuggestions.category || "Chưa đủ dữ liệu"}</span>
                  </div>

                  {/* Workout + Meal → 2 cột */}
                  <div className="row mt-3 g-3">
                    {/* Workout column */}
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
                        <div>
                          {bmiSuggestions.workout ||
                            "Vui lòng cập nhật cân nặng và chiều cao để xem gợi ý chi tiết."}
                        </div>
                      </div>
                    </div>

                    {/* Meal column */}
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
                        <div>
                          {bmiSuggestions.meal ||
                            "Vui lòng cập nhật cân nặng và chiều cao để xem gợi ý chi tiết."}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
