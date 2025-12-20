// src/views/TrainerMemberList.jsx
import {
  Button,
  Card,
  CardHeader,
  CardBody,
  Container,
  Row,
  Col,
  Table,
  Input,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  FormGroup,
  Label,
  Collapse,
} from "reactstrap";
import React, { useEffect, useState, useMemo } from "react";
import { HiUserGroup } from "react-icons/hi2";
import { FiSearch } from "react-icons/fi";
import { message } from "antd";
import api from "../../config/axios";

// ====== Helper format date yyyy-MM-dd -> dd/MM/yyyy ======
const formatDDMMYYYY = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

// ====== Helper format giới tính sang tiếng Việt ======
const formatGender = (g) => {
  if (!g) return "—";
  const v = String(g).toLowerCase();
  if (v === "male") return "Nam";
  if (v === "female") return "Nữ";
  if (v === "other") return "Khác";
  return g;
};

// ====== Helper xử lý TimeSpan cho mealTime ======
const normalizeMealTimeFromApi = (time) => {
  if (!time) return "";
  const parts = String(time).split(":");
  if (parts.length >= 2) {
    const hh = parts[0].padStart(2, "0");
    const mm = parts[1].padStart(2, "0");
    return `${hh}:${mm}`;
  }
  return String(time);
};

const toApiTimeSpan = (uiTime) => {
  if (!uiTime) return null;
  const parts = String(uiTime).split(":");
  if (parts.length < 2) return null;
  const hh = parts[0].padStart(2, "0");
  const mm = parts[1].padStart(2, "0");
  return `${hh}:${mm}:00`;
};

// ====== Workout Plan helpers ======
const createEmptyExercise = () => ({
  name: "",
  description: "",
  sets: 0,
  reps: 0,
  restSeconds: 0,
  equipment: "",
  muscleGroups: "",
  instructions: "",
});

const createEmptyDay = (dayNumber = 1) => ({
  dayNumber,
  dayName: "",
  focusArea: "",
  description: "",
  durationMinutes: 0,
  difficulty: "",
  notes: "",
  exercises: [createEmptyExercise()],
});

const defaultDays = () => [createEmptyDay(1)];

// ====== Meal Plan helpers ======
const createEmptyMeal = () => ({
  mealType: "Bữa chính",
  name: "",
  description: "",
  instructions: "",
  mealTime: "07:00",
});

const createEmptyMealDay = (dayNumber = 1) => ({
  dayNumber,
  dayName: `Ngày ${dayNumber}`,
  meals: [createEmptyMeal()],
});

const defaultMealDays = () => [createEmptyMealDay(1)];

const TrainerMemberList = () => {
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadError, setLoadError] = useState("");

  const [search, setSearch] = useState("");

  // Modal chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);

  // Tab trong modal: "info" | "meal" | "workout"
  const [activeModalTab, setActiveModalTab] = useState("info");

  // Profile detail của member
  const [memberProfile, setMemberProfile] = useState(null);

  // ====== Workout Plan state ======
  const [workoutPlanId, setWorkoutPlanId] = useState(null);
  const [workoutDescription, setWorkoutDescription] = useState("");
  const [days, setDays] = useState(defaultDays());
  const [workoutLoading, setWorkoutLoading] = useState(false);
  const [workoutSaving, setWorkoutSaving] = useState(false);

  // Ngày / bài tập nào đang expand (Workout)
  const [expandedDays, setExpandedDays] = useState([]);
  const [expandedExercises, setExpandedExercises] = useState([]);

  // ====== Meal Plan state ======
  const [mealPlanId, setMealPlanId] = useState(null);
  const [mealDescription, setMealDescription] = useState("");
  const [mealDays, setMealDays] = useState(defaultMealDays());
  const [mealLoading, setMealLoading] = useState(false);
  const [mealSaving, setMealSaving] = useState(false);

  // Ngày / bữa nào đang expand (Meal)
  const [expandedMealDays, setExpandedMealDays] = useState([]);
  const [expandedMeals, setExpandedMeals] = useState([]);

  /** ================== VALIDATION (Workout) ================== */
  const initDayError = () => ({
    dayName: "",
    focusArea: "",
    difficulty: "",
    durationMinutes: "",
    exercises: [],
  });

  const initExerciseError = () => ({
    name: "",
    sets: "",
    reps: "",
    restSeconds: "",
  });

  const [workoutErrors, setWorkoutErrors] = useState({
    description: "",
    days: [],
  });

  const isBlank = (v) => String(v ?? "").trim() === "";
  const toInt = (v) => {
    const n = Number(v);
    if (!Number.isFinite(n)) return NaN;
    return Math.trunc(n);
  };
  const inRange = (n, min, max) => Number.isFinite(n) && n >= min && n <= max;

  const inputStyleByError = (hasError) => ({
    borderColor: hasError ? "#ef4444" : undefined,
    boxShadow: hasError ? "0 0 0 0.15rem rgba(239,68,68,0.15)" : undefined,
  });

  const errorText = (msg) =>
    msg ? (
      <div style={{ color: "#ef4444", fontSize: 12, marginTop: 4 }}>{msg}</div>
    ) : null;

  const ensureWorkoutErrorsShape = (nextDays) => {
    setWorkoutErrors((prev) => {
      const daysErr = Array.isArray(prev.days) ? [...prev.days] : [];

      while (daysErr.length < nextDays.length) daysErr.push(initDayError());
      while (daysErr.length > nextDays.length) daysErr.pop();

      nextDays.forEach((d, di) => {
        const exLen = (d.exercises || []).length;
        const exErr = Array.isArray(daysErr[di]?.exercises)
          ? [...daysErr[di].exercises]
          : [];
        while (exErr.length < exLen) exErr.push(initExerciseError());
        while (exErr.length > exLen) exErr.pop();

        daysErr[di] = {
          ...initDayError(),
          ...(daysErr[di] || {}),
          exercises: exErr,
        };
      });

      return { ...prev, days: daysErr };
    });
  };

  const setDayFieldError = (dayIndex, field, msg) => {
    setWorkoutErrors((prev) => {
      const daysErr = [...(prev.days || [])];
      daysErr[dayIndex] = { ...(daysErr[dayIndex] || initDayError()), [field]: msg };
      return { ...prev, days: daysErr };
    });
  };

  const setExFieldError = (dayIndex, exIndex, field, msg) => {
    setWorkoutErrors((prev) => {
      const daysErr = [...(prev.days || [])];
      const dayErr = { ...(daysErr[dayIndex] || initDayError()) };
      const exErr = [...(dayErr.exercises || [])];
      exErr[exIndex] = { ...(exErr[exIndex] || initExerciseError()), [field]: msg };
      dayErr.exercises = exErr;
      daysErr[dayIndex] = dayErr;
      return { ...prev, days: daysErr };
    });
  };

  const clearWorkoutAllErrors = () => {
    setWorkoutErrors({ description: "", days: [] });
  };

  const validateWorkoutPlan = () => {
    let ok = true;

    ensureWorkoutErrorsShape(days);

    // description required
    const desc = String(workoutDescription || "").trim();
    if (!desc) {
      ok = false;
      setWorkoutErrors((prev) => ({
        ...prev,
        description: "Vui lòng nhập mô tả tổng quan kế hoạch tập luyện.",
      }));
    } else {
      setWorkoutErrors((prev) => ({ ...prev, description: "" }));
    }

    days.forEach((d, di) => {
      const dayName = String(d.dayName || "").trim();
      const focusArea = String(d.focusArea || "").trim();
      const difficulty = String(d.difficulty || "").trim();
      const duration = toInt(d.durationMinutes);

      if (!dayName) {
        ok = false;
        setDayFieldError(di, "dayName", "Vui lòng nhập tên ngày tập.");
      } else setDayFieldError(di, "dayName", "");

      if (!focusArea) {
        ok = false;
        setDayFieldError(di, "focusArea", "Vui lòng nhập vùng tập trung / nhóm cơ chính.");
      } else setDayFieldError(di, "focusArea", "");

      if (!difficulty) {
        ok = false;
        setDayFieldError(di, "difficulty", "Vui lòng nhập độ khó buổi tập.");
      } else setDayFieldError(di, "difficulty", "");

      if (!Number.isFinite(duration)) {
        ok = false;
        setDayFieldError(di, "durationMinutes", "Thời lượng phải là số.");
      } else if (!inRange(duration, 10, 300)) {
        ok = false;
        setDayFieldError(di, "durationMinutes", "Thời lượng nên trong khoảng 10–300 phút.");
      } else setDayFieldError(di, "durationMinutes", "");

      (d.exercises || []).forEach((ex, ei) => {
        const name = String(ex.name || "").trim();
        const sets = toInt(ex.sets);
        const reps = toInt(ex.reps);
        const rest = toInt(ex.restSeconds);

        if (!name) {
          ok = false;
          setExFieldError(di, ei, "name", "Vui lòng nhập tên bài tập.");
        } else setExFieldError(di, ei, "name", "");

        if (!Number.isFinite(sets)) {
          ok = false;
          setExFieldError(di, ei, "sets", "Sets phải là số.");
        } else if (!inRange(sets, 1, 20)) {
          ok = false;
          setExFieldError(di, ei, "sets", "Sets nên trong khoảng 1–20.");
        } else setExFieldError(di, ei, "sets", "");

        if (!Number.isFinite(reps)) {
          ok = false;
          setExFieldError(di, ei, "reps", "Reps phải là số.");
        } else if (!inRange(reps, 1, 200)) {
          ok = false;
          setExFieldError(di, ei, "reps", "Reps nên trong khoảng 1–200.");
        } else setExFieldError(di, ei, "reps", "");

        if (!Number.isFinite(rest)) {
          ok = false;
          setExFieldError(di, ei, "restSeconds", "Nghỉ phải là số.");
        } else if (!inRange(rest, 0, 600)) {
          ok = false;
          setExFieldError(di, ei, "restSeconds", "Nghỉ nên trong khoảng 0–600 giây.");
        } else setExFieldError(di, ei, "restSeconds", "");
      });
    });

    if (!ok) message.error("Vui lòng kiểm tra lại các trường bắt buộc trong Kế hoạch tập luyện.");
    return ok;
  };

  /** ================== FETCH MEMBERS ================== */
  const fetchMembers = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const res = await api.get("/Profile/trainer/assigned-members");
      const data = Array.isArray(res.data) ? res.data : [];

      const mapped = data.map((m, idx) => ({
        id: m.userId || idx + 1,
        profileId: m.profileId,
        fullName:
          `${m.lastName || ""} ${m.firstName || ""}`.trim() ||
          m.email ||
          `Member #${m.userId}`,
        email: m.email,
        phoneNumber: m.phoneNumber,
        avatar: "/img/useravt.jpg",
        currentPackageName: m.target || "",
        startedDate: null,
        weight: m.weight,
        height: m.height,
        target: m.target,
        healthStatus: m.healthStatus,
        gender: m.gender,
        age: m.age,
      }));

      setMembers(mapped);
    } catch (err) {
      console.error("Error fetching assigned members:", err);
      setLoadError("Không tải được danh sách hội viên. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return members;
    return members.filter(
      (m) =>
        m.fullName?.toLowerCase().includes(keyword) ||
        m.email?.toLowerCase().includes(keyword)
    );
  }, [members, search]);

  /** ================== RESET STATES ================== */
  const resetWorkoutState = () => {
    const baseDays = defaultDays();
    const allDayIdx = baseDays.map((_, idx) => idx);
    const allExKeys = [];
    baseDays.forEach((d, di) => {
      (d.exercises || []).forEach((_, ei) => allExKeys.push(`${di}-${ei}`));
    });

    setWorkoutPlanId(null);
    setWorkoutDescription("");
    setDays(baseDays);
    setExpandedDays(allDayIdx);
    setExpandedExercises(allExKeys);
    setWorkoutLoading(false);
    setWorkoutSaving(false);

    clearWorkoutAllErrors();
    ensureWorkoutErrorsShape(baseDays);
  };

  const resetMealState = () => {
    const baseDays = defaultMealDays();
    const allDayIdx = baseDays.map((_, idx) => idx);
    const allMealKeys = [];
    baseDays.forEach((d, di) => {
      (d.meals || []).forEach((_, mi) => allMealKeys.push(`${di}-${mi}`));
    });

    setMealPlanId(null);
    setMealDescription("");
    setMealDays(baseDays);
    setExpandedMealDays(allDayIdx);
    setExpandedMeals(allMealKeys);
    setMealLoading(false);
    setMealSaving(false);
  };

  /** ================== LOAD PLANS ================== */
  const loadWorkoutPlan = async (profileId) => {
    if (!profileId) {
      resetWorkoutState();
      return;
    }
    try {
      setWorkoutLoading(true);
      const res = await api.get(`/WorkoutPlan/profile/${profileId}`);
      const data = res.data;

      if (!data) {
        resetWorkoutState();
        return;
      }

      const mappedDays =
        Array.isArray(data.days) && data.days.length > 0
          ? data.days.map((d, idx) => ({
              dayNumber: d.dayNumber ?? idx + 1,
              dayName: d.dayName || "",
              focusArea: d.focusArea || "",
              description: d.description || "",
              durationMinutes: d.durationMinutes ?? 0,
              difficulty: d.difficulty || "",
              notes: d.notes || "",
              exercises:
                Array.isArray(d.exercises) && d.exercises.length > 0
                  ? d.exercises.map((ex) => ({
                      name: ex.name || "",
                      description: ex.description || "",
                      sets: ex.sets ?? 0,
                      reps: ex.reps ?? 0,
                      restSeconds: ex.restSeconds ?? 0,
                      equipment: ex.equipment || "",
                      muscleGroups: ex.muscleGroups || "",
                      instructions: ex.instructions || "",
                    }))
                  : [createEmptyExercise()],
            }))
          : defaultDays();

      const allDayIdx = mappedDays.map((_, idx) => idx);
      const allExKeys = [];
      mappedDays.forEach((d, di) => {
        (d.exercises || []).forEach((_, ei) => allExKeys.push(`${di}-${ei}`));
      });

      setWorkoutPlanId(data.planId ?? data.id ?? null);
      setWorkoutDescription(data.description || "");
      setDays(mappedDays);
      setExpandedDays(allDayIdx);
      setExpandedExercises(allExKeys);

      clearWorkoutAllErrors();
      ensureWorkoutErrorsShape(mappedDays);
    } catch (err) {
      console.error("Error loading Kế hoạch tập luyện:", err);
      if (err?.response?.status === 404) {
        resetWorkoutState();
      } else {
        message.error("Không tải được Kế hoạch tập luyện của hội viên này.");
        resetWorkoutState();
      }
    } finally {
      setWorkoutLoading(false);
    }
  };

  const loadMealPlan = async (profileId) => {
    if (!profileId) {
      resetMealState();
      return;
    }
    try {
      setMealLoading(true);
      const res = await api.get(`/MealPlan/profile/${profileId}`);
      const data = res.data;

      if (!data) {
        resetMealState();
        return;
      }

      const mappedDays =
        Array.isArray(data.days) && data.days.length > 0
          ? data.days.map((d, idx) => ({
              dayNumber: d.dayNumber ?? idx + 1,
              dayName: d.dayName || `Ngày ${idx + 1}`,
              meals:
                Array.isArray(d.meals) && d.meals.length > 0
                  ? d.meals.map((m, mi) => ({
                      mealType: m.mealType || "Bữa chính",
                      name: m.name || `Món ${mi + 1}`,
                      description: m.description || "",
                      instructions: m.instructions || "",
                      mealTime: normalizeMealTimeFromApi(m.mealTime),
                    }))
                  : [createEmptyMeal()],
            }))
          : defaultMealDays();

      const allDayIdx = mappedDays.map((_, idx) => idx);
      const allMealKeys = [];
      mappedDays.forEach((d, di) => {
        (d.meals || []).forEach((_, mi) => allMealKeys.push(`${di}-${mi}`));
      });

      setMealPlanId(data.planId ?? data.id ?? null);
      setMealDescription(data.description || "");
      setMealDays(mappedDays);
      setExpandedMealDays(allDayIdx);
      setExpandedMeals(allMealKeys);
    } catch (err) {
      console.error("Error loading meal plan:", err);
      if (err?.response?.status === 404) {
        resetMealState();
      } else {
        message.error("Không tải được Meal Plan của hội viên này.");
        resetMealState();
      }
    } finally {
      setMealLoading(false);
    }
  };

  /** ================== OPEN/CLOSE MODAL ================== */
  const handleOpenDetail = async (member) => {
    setSelectedMember(member);
    setDetailOpen(true);
    setActiveModalTab("info");

    setMemberProfile({
      gender: member.gender,
      age: member.age,
      weight: member.weight,
      height: member.height,
      target: member.target,
      healthStatus: member.healthStatus,
    });

    resetWorkoutState();
    resetMealState();

    if (member.profileId) {
      await Promise.all([loadWorkoutPlan(member.profileId), loadMealPlan(member.profileId)]);
    }
  };

  const handleCloseDetail = () => {
    if (workoutSaving || mealSaving) return;
    setDetailOpen(false);
    setSelectedMember(null);
    setMemberProfile(null);
    resetWorkoutState();
    resetMealState();
  };

  /** ================== WORKOUT: UPDATE DAY/EX ================== */
  const updateDay = (dayIndex, field, value) => {
    const clone = [...days];
    clone[dayIndex] = {
      ...clone[dayIndex],
      [field]: field === "durationMinutes" ? Number(value) || 0 : value,
    };
    setDays(clone);
  };

  const updateExercise = (dayIndex, exIndex, field, value) => {
    const clone = [...days];
    const day = clone[dayIndex];
    const exList = [...(day.exercises || [])];
    exList[exIndex] = {
      ...exList[exIndex],
      [field]: ["sets", "reps", "restSeconds"].includes(field)
        ? Number(value) || 0
        : value,
    };
    clone[dayIndex] = { ...day, exercises: exList };
    setDays(clone);
  };

  const addDay = () => {
    const nextNum = days.length + 1;
    const newDay = createEmptyDay(nextNum);
    const newDays = [...days, newDay];

    const allDayIdx = newDays.map((_, idx) => idx);
    const newExKeys = [];
    (newDay.exercises || []).forEach((_, ei) => newExKeys.push(`${newDays.length - 1}-${ei}`));

    setDays(newDays);
    setExpandedDays(allDayIdx);
    setExpandedExercises((prev) => [...prev, ...newExKeys]);

    ensureWorkoutErrorsShape(newDays);
  };

  const removeDay = (dayIndex) => {
    if (days.length <= 1) {
      message.warning("Cần ít nhất 1 ngày tập.");
      return;
    }
    const clone = days.filter((_, idx) => idx !== dayIndex);
    const reindexed = clone.map((d, idx) => ({ ...d, dayNumber: idx + 1 }));

    const allDayIdx = reindexed.map((_, idx) => idx);
    const allExKeys = [];
    reindexed.forEach((d, di) => {
      (d.exercises || []).forEach((_, ei) => allExKeys.push(`${di}-${ei}`));
    });

    setDays(reindexed);
    setExpandedDays(allDayIdx);
    setExpandedExercises(allExKeys);

    ensureWorkoutErrorsShape(reindexed);
  };

  const addExercise = (dayIndex) => {
    const clone = [...days];
    const exList = [...(clone[dayIndex].exercises || [])];
    exList.push(createEmptyExercise());
    clone[dayIndex].exercises = exList;

    setDays(clone);

    const newIndex = exList.length - 1;
    const key = `${dayIndex}-${newIndex}`;
    setExpandedExercises((prev) => (prev.includes(key) ? prev : [...prev, key]));

    ensureWorkoutErrorsShape(clone);
  };

  const removeExercise = (dayIndex, exIndex) => {
    const clone = [...days];
    const exList = [...(clone[dayIndex].exercises || [])];
    if (exList.length <= 1) {
      message.warning("Mỗi ngày cần ít nhất 1 bài tập.");
      return;
    }
    exList.splice(exIndex, 1);
    clone[dayIndex].exercises = exList;

    setDays(clone);
    setExpandedExercises((prev) => prev.filter((k) => !k.startsWith(`${dayIndex}-`)));

    ensureWorkoutErrorsShape(clone);
  };

  const toggleDayCollapse = (dayIndex) => {
    setExpandedDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((i) => i !== dayIndex) : [...prev, dayIndex]
    );
  };

  const toggleExerciseCollapse = (dayIndex, exIndex) => {
    const key = `${dayIndex}-${exIndex}`;
    setExpandedExercises((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  /** ================== MEAL: UPDATE DAY/MEAL ================== */
  const updateMealDay = (dayIndex, field, value) => {
    const clone = [...mealDays];
    clone[dayIndex] = { ...clone[dayIndex], [field]: value };
    setMealDays(clone);
  };

  const updateMeal = (dayIndex, mealIndex, field, value) => {
    const clone = [...mealDays];
    const day = clone[dayIndex];
    const mealList = [...(day.meals || [])];
    mealList[mealIndex] = { ...mealList[mealIndex], [field]: value };
    clone[dayIndex] = { ...day, meals: mealList };
    setMealDays(clone);
  };

  const addMealDay = () => {
    const nextNum = mealDays.length + 1;
    const newDay = createEmptyMealDay(nextNum);
    const newDays = [...mealDays, newDay];

    const allDayIdx = newDays.map((_, idx) => idx);
    const newMealKeys = [];
    (newDay.meals || []).forEach((_, mi) => newMealKeys.push(`${newDays.length - 1}-${mi}`));

    setMealDays(newDays);
    setExpandedMealDays(allDayIdx);
    setExpandedMeals((prev) => [...prev, ...newMealKeys]);
  };

  const removeMealDay = (dayIndex) => {
    if (mealDays.length <= 1) {
      message.warning("Cần ít nhất 1 ngày ăn trong kế hoạch.");
      return;
    }
    const clone = mealDays.filter((_, idx) => idx !== dayIndex);
    const reindexed = clone.map((d, idx) => ({
      ...d,
      dayNumber: idx + 1,
      dayName: d.dayName || `Ngày ${idx + 1}`,
    }));

    const allDayIdx = reindexed.map((_, idx) => idx);
    const allMealKeys = [];
    reindexed.forEach((d, di) => {
      (d.meals || []).forEach((_, mi) => allMealKeys.push(`${di}-${mi}`));
    });

    setMealDays(reindexed);
    setExpandedMealDays(allDayIdx);
    setExpandedMeals(allMealKeys);
  };

  const addMeal = (dayIndex) => {
    const clone = [...mealDays];
    const mealList = [...(clone[dayIndex].meals || [])];
    mealList.push(createEmptyMeal());
    clone[dayIndex].meals = mealList;
    setMealDays(clone);

    const newIndex = mealList.length - 1;
    const key = `${dayIndex}-${newIndex}`;
    setExpandedMeals((prev) => (prev.includes(key) ? prev : [...prev, key]));
  };

  const removeMeal = (dayIndex, mealIndex) => {
    const clone = [...mealDays];
    const mealList = [...(clone[dayIndex].meals || [])];
    if (mealList.length <= 1) {
      message.warning("Mỗi ngày cần ít nhất 1 bữa ăn.");
      return;
    }
    mealList.splice(mealIndex, 1);
    clone[dayIndex].meals = mealList;
    setMealDays(clone);

    setExpandedMeals((prev) => prev.filter((k) => !k.startsWith(`${dayIndex}-`)));
  };

  const toggleMealDayCollapse = (dayIndex) => {
    setExpandedMealDays((prev) =>
      prev.includes(dayIndex) ? prev.filter((i) => i !== dayIndex) : [...prev, dayIndex]
    );
  };

  const toggleMealCollapse = (dayIndex, mealIndex) => {
    const key = `${dayIndex}-${mealIndex}`;
    setExpandedMeals((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  /** ================== SAVE WORKOUT ================== */
  const handleSaveWorkoutPlan = async () => {
    if (!selectedMember?.profileId) {
      message.error("Không tìm thấy profileId của hội viên.");
      return;
    }

    if (!validateWorkoutPlan()) return;

    const profileId = selectedMember.profileId;

    const payload = {
      profileId,
      description:
        workoutDescription || `Workout plan cho ${selectedMember.fullName || "member"}`,
      days: days.map((d, idx) => ({
        dayNumber: d.dayNumber || idx + 1,
        dayName: d.dayName || "",
        focusArea: d.focusArea || "",
        description: d.description || "",
        durationMinutes: Number(d.durationMinutes) || 0,
        difficulty: d.difficulty || "",
        notes: d.notes || "",
        exercises: (d.exercises || []).map((ex) => ({
          name: ex.name || "",
          description: ex.description || "",
          sets: Number(ex.sets) || 0,
          reps: Number(ex.reps) || 0,
          restSeconds: Number(ex.restSeconds) || 0,
          equipment: ex.equipment || "",
          muscleGroups: ex.muscleGroups || "",
          instructions: ex.instructions || "",
        })),
      })),
    };

    try {
      setWorkoutSaving(true);

      if (!workoutPlanId) {
        const res = await api.post("/WorkoutPlan", payload);
        const data = res.data;
        setWorkoutPlanId(data?.planId ?? data?.id ?? null);
        message.success("Đã tạo mới Kế hoạch tập luyện.");
      } else {
        await api.put(`/WorkoutPlan/${workoutPlanId}`, {
          description: payload.description,
          days: payload.days,
        });
        message.success("Đã cập nhật Kế hoạch tập luyện.");
      }
    } catch (err) {
      console.error("Error saving workout plan:", err);
      const msg =
        err?.response?.data?.title ||
        err?.response?.data?.message ||
        err?.message ||
        "Lưu Kế hoạch tập luyện thất bại.";
      message.error(msg);
    } finally {
      setWorkoutSaving(false);
    }
  };

  /** ================== SAVE MEAL ================== */
  const handleSaveMealPlan = async () => {
    if (!selectedMember?.profileId || selectedMember.profileId <= 0) {
      message.error("Không tìm thấy profileId hợp lệ của hội viên.");
      return;
    }

    const profileId = selectedMember.profileId;

    const payload = {
      profileId,
      description: mealDescription || `Meal plan cho ${selectedMember.fullName || "member"}`,
      days: mealDays.map((d, idx) => ({
        dayNumber: d.dayNumber || idx + 1,
        dayName: d.dayName || `Ngày ${idx + 1}`,
        meals: (d.meals || []).map((m, mi) => ({
          mealType: m.mealType || "Bữa chính",
          name: m.name || `Món ${mi + 1}`,
          description: m.description || "",
          instructions: m.instructions || "",
          mealTime: toApiTimeSpan(m.mealTime),
        })),
      })),
    };

    try {
      setMealSaving(true);

      if (!mealPlanId) {
        const res = await api.post("/MealPlan", payload);
        const data = res.data;
        setMealPlanId(data?.planId ?? data?.id ?? null);
        message.success("Đã tạo mới Kế hoạch dinh dưỡng.");
      } else {
        await api.put(`/MealPlan/${mealPlanId}`, {
          description: payload.description,
          days: payload.days,
        });
        message.success("Đã cập nhật Kế hoạch dinh dưỡng.");
      }
    } catch (err) {
      console.error("Error saving meal plan:", err);
      const raw = err?.response?.data;
      const msg =
        raw?.detail ||
        raw?.title ||
        raw?.message ||
        err?.message ||
        "Lưu Kế hoạch dinh dưỡng thất bại.";
      message.error(msg);
    } finally {
      setMealSaving(false);
    }
  };

  return (
    <Container className="mt-5 mb-5" fluid>
      <Row className="justify-content-center">
        <Col xl="10">
          <Card className="shadow-lg border-0">
            <CardHeader
              className="d-flex flex-column flex-md-row justify-content-between align-items-md-center align-items-start"
              style={{
                background:
                  "linear-gradient(135deg, #0c1844 0%, #1f3b8f 50%, #2f7dd1 100%)",
                color: "#fff",
                borderRadius: "0.5rem 0.5rem 0 0",
                borderBottom: "none",
              }}
            >
              <div className="d-flex align-items-center gap-2 mb-3 mb-md-0">
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.12)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: 8,
                  }}
                >
                  <HiUserGroup size={22} />
                </div>
                <div>
                  <h3 className="mb-0" style={{ fontWeight: 700 }}>
                    Hội viên đang được bạn huấn luyện
                  </h3>
                  <small style={{ opacity: 0.85 }}>
                    Xem nhanh thông tin hội viên và cập nhật Meal / Workout plan.
                  </small>
                </div>
              </div>

              <div className="d-flex align-items-center" style={{ gap: 8 }}>
                <div className="position-relative">
                  <FiSearch
                    style={{
                      position: "absolute",
                      left: 10,
                      top: "50%",
                      transform: "translateY(-50%)",
                      opacity: 0.7,
                      color: "#6b7280",
                    }}
                  />
                  <Input
                    type="text"
                    placeholder="Tìm theo tên hoặc email..."
                    style={{
                      paddingLeft: 32,
                      minWidth: 260,
                      background: "rgba(255,255,255,0.95)",
                      border: "none",
                    }}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Button
                  size="sm"
                  color="light"
                  style={{ color: "#0c1844", fontWeight: 600 }}
                  onClick={fetchMembers}
                >
                  Refresh
                </Button>
              </div>
            </CardHeader>

            <CardBody
              style={{
                background: "#f3f4f6",
                borderRadius: "0 0 0.5rem 0.5rem",
              }}
            >
              {loading && (
                <div className="text-center my-4">
                  <div
                    className="spinner-border"
                    style={{ color: "#0c1844" }}
                    role="status"
                  >
                    <span className="sr-only">Loading...</span>
                  </div>
                  <div className="mt-2 text-muted">Đang tải danh sách hội viên...</div>
                </div>
              )}

              {!loading && loadError && (
                <div className="alert alert-danger mb-0">{loadError}</div>
              )}

              {!loading && !loadError && filteredMembers.length === 0 && (
                <div className="alert alert-light border text-center mb-0">
                  Hiện chưa có hội viên nào đang được bạn huấn luyện.
                </div>
              )}

              {!loading && !loadError && filteredMembers.length > 0 && (
                <div
                  className="table-responsive"
                  style={{
                    background: "#ffffff",
                    borderRadius: "0.5rem",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.04)",
                  }}
                >
                  <Table
                    hover
                    className="align-items-center mb-0"
                    style={{ borderCollapse: "separate", borderSpacing: 0 }}
                  >
                    <thead className="thead-light">
                      <tr>
                        <th style={{ width: 60 }}>#</th>
                        <th>👤 Hội viên</th>
                        <th>🎯 Mục tiêu</th>
                        <th>🩺 Tình trạng sức khỏe</th>
                        <th className="text-right"> </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMembers.map((m, idx) => (
                        <tr key={m.id || idx}>
                          <td className="align-middle text-muted">{idx + 1}</td>
                          <td className="align-middle">
                            <div className="d-flex align-items-center">
                              <img
                                src={m.avatar || "/img/useravt.jpg"}
                                alt="avatar"
                                className="rounded-circle"
                                style={{
                                  width: 46,
                                  height: 46,
                                  objectFit: "cover",
                                  marginRight: 12,
                                  border: "2px solid #e5e7eb",
                                  background: "#f9fafb",
                                }}
                                onError={(e) => {
                                  e.currentTarget.src = "/img/useravt.jpg";
                                }}
                              />
                              <div>
                                <div style={{ fontWeight: 600, color: "#111827" }}>
                                  {m.fullName || "Không rõ tên"}
                                </div>
                                <div className="text-muted" style={{ fontSize: 12 }}>
                                  {m.email || "—"}
                                </div>
                                {m.phoneNumber && (
                                  <div
                                    className="text-muted"
                                    style={{
                                      fontSize: 11,
                                      opacity: 0.9,
                                      marginTop: 2,
                                    }}
                                  >
                                    📞 {m.phoneNumber}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="align-middle">
                            <span style={{ fontSize: 13, fontWeight: 500 }}>
                              {m.currentPackageName || m.target || "—"}
                            </span>
                          </td>
                          <td className="align-middle text-muted">
                            {m.healthStatus || "—"}
                          </td>
                          <td className="align-middle text-right">
                            <Button
                              size="sm"
                              color="primary"
                              style={{
                                borderRadius: 999,
                                paddingInline: 16,
                                fontSize: 13,
                              }}
                              onClick={() => handleOpenDetail(m)}
                            >
                              Chi tiết
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* ========= MODAL CHI TIẾT MEMBER ========= */}
      <Modal isOpen={detailOpen} toggle={handleCloseDetail} size="lg" centered>
        <ModalHeader toggle={handleCloseDetail} style={{ borderBottom: "none", paddingBottom: 0 }} />
        <ModalBody style={{ backgroundColor: "#f9fafb" }}>
          {selectedMember && (
            <>
              {/* HERO HEADER */}
              <div
                style={{
                  background:
                    "linear-gradient(135deg, #0c1844 0%, #1f3b8f 50%, #2f7dd1 100%)",
                  borderRadius: "0.75rem",
                  padding: "16px 18px",
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginBottom: 16,
                  boxShadow: "0 10px 25px rgba(15,23,42,0.25)",
                }}
              >
                <img
                  src={selectedMember.avatar || "/img/useravt.jpg"}
                  alt="avatar"
                  className="rounded-circle"
                  style={{
                    width: 72,
                    height: 72,
                    objectFit: "cover",
                    border: "2px solid rgba(255,255,255,0.6)",
                    background: "#0f172a",
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/img/useravt.jpg";
                  }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                    {selectedMember.fullName}
                  </div>
                  <div style={{ fontSize: 13, opacity: 0.85 }}>
                    {selectedMember.email || "—"}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 8,
                      marginTop: 8,
                      fontSize: 12,
                    }}
                  >
                    {selectedMember.phoneNumber && (
                      <span
                        style={{
                          backgroundColor: "rgba(15,23,42,0.3)",
                          padding: "4px 10px",
                          borderRadius: 999,
                        }}
                      >
                        📞 {selectedMember.phoneNumber}
                      </span>
                    )}
                    {selectedMember.currentPackageName && (
                      <span
                        style={{
                          backgroundColor: "#22c55e",
                          padding: "4px 10px",
                          borderRadius: 999,
                          color: "#052e16",
                          fontWeight: 600,
                        }}
                      >
                        {selectedMember.currentPackageName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="d-none d-md-block">
                  <span
                    style={{
                      backgroundColor: "rgba(15,23,42,0.5)",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11,
                      letterSpacing: 0.5,
                      textTransform: "uppercase",
                    }}
                  >
                    Hội viên của bạn
                  </span>
                </div>
              </div>

              {/* Tabs */}
              <div className="d-flex justify-content-center mb-3" style={{ gap: 8 }}>
                <Button
                  size="sm"
                  type="button"
                  style={{
                    borderRadius: 999,
                    paddingInline: 16,
                    fontWeight: activeModalTab === "info" ? 700 : 500,
                    backgroundColor: activeModalTab === "info" ? "#0c1844" : "transparent",
                    color: activeModalTab === "info" ? "#fff" : "#4b5563",
                    borderColor: activeModalTab === "info" ? "#0c1844" : "#e5e7eb",
                  }}
                  onClick={() => setActiveModalTab("info")}
                >
                  Thông tin
                </Button>
                <Button
                  size="sm"
                  type="button"
                  style={{
                    borderRadius: 999,
                    paddingInline: 16,
                    fontWeight: activeModalTab === "meal" ? 700 : 500,
                    backgroundColor: activeModalTab === "meal" ? "#0c1844" : "transparent",
                    color: activeModalTab === "meal" ? "#fff" : "#4b5563",
                    borderColor: activeModalTab === "meal" ? "#0c1844" : "#e5e7eb",
                  }}
                  onClick={() => setActiveModalTab("meal")}
                >
                  Kế hoạch dinh dưỡng
                </Button>
                <Button
                  size="sm"
                  type="button"
                  style={{
                    borderRadius: 999,
                    paddingInline: 16,
                    fontWeight: activeModalTab === "workout" ? 700 : 500,
                    backgroundColor: activeModalTab === "workout" ? "#0c1844" : "transparent",
                    color: activeModalTab === "workout" ? "#fff" : "#4b5563",
                    borderColor: activeModalTab === "workout" ? "#0c1844" : "#e5e7eb",
                  }}
                  onClick={() => setActiveModalTab("workout")}
                >
                  Kế hoạch tập luyện
                </Button>
              </div>

              {/* CONTENT */}
              <div
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "0.75rem",
                  padding: "16px 18px",
                  boxShadow: "0 6px 16px rgba(15,23,42,0.08)",
                }}
              >
                {/* Tab 1: Info */}
                {activeModalTab === "info" && (
                  <>
                    <Row>
                      <Col md="6" className="mb-3">
                        <h6
                          style={{
                            fontSize: 13,
                            textTransform: "uppercase",
                            letterSpacing: 0.06,
                            color: "#6b7280",
                            fontWeight: 700,
                            marginBottom: 8,
                          }}
                        >
                          Thông tin cơ bản
                        </h6>
                        <div
                          style={{
                            backgroundColor: "#f9fafb",
                            borderRadius: 12,
                            padding: "10px 12px",
                            fontSize: 13,
                          }}
                        >
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Họ tên</span>
                            <span style={{ fontWeight: 600 }}>{selectedMember.fullName}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Email</span>
                            <span>{selectedMember.email || "—"}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Số điện thoại</span>
                            <span>{selectedMember.phoneNumber || "—"}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Mục tiêu</span>
                            <span>{memberProfile?.target || "—"}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Tình trạng sức khỏe</span>
                            <span>{memberProfile?.healthStatus || "—"}</span>
                          </div>
                        </div>
                      </Col>

                      <Col md="6" className="mb-3">
                        <h6
                          style={{
                            fontSize: 13,
                            textTransform: "uppercase",
                            letterSpacing: 0.06,
                            color: "#6b7280",
                            fontWeight: 700,
                            marginBottom: 8,
                          }}
                        >
                          Thông tin thể chất
                        </h6>
                        <div
                          style={{
                            backgroundColor: "#f9fafb",
                            borderRadius: 12,
                            padding: "10px 12px",
                            fontSize: 13,
                          }}
                        >
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Giới tính</span>
                            <span>{formatGender(memberProfile?.gender)}</span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Tuổi</span>
                            <span>
                              {memberProfile?.age != null ? `${memberProfile.age} tuổi` : "—"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between mb-1">
                            <span className="text-muted">Cân nặng</span>
                            <span>
                              {memberProfile?.weight != null ? `${memberProfile.weight} kg` : "—"}
                            </span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Chiều cao</span>
                            <span>
                              {memberProfile?.height != null ? `${memberProfile.height} cm` : "—"}
                            </span>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </>
                )}

                {/* Tab 2: Meal Plan */}
                {activeModalTab === "meal" && (
                  <>
                    {mealLoading ? (
                      <div className="text-center my-3 text-muted">
                        Đang tải Kế hoạch dinh dưỡng..
                      </div>
                    ) : (
                      <>
                        <FormGroup className="mb-3">
                          <Label style={{ fontWeight: 600, fontSize: 13 }}>
                            📝 Mô tả tổng quan kế hoạch ăn uống (Meal Plan)
                          </Label>
                          <Input
                            type="textarea"
                            rows={3}
                            value={mealDescription}
                            onChange={(e) => setMealDescription(e.target.value)}
                            placeholder="Ví dụ: Kế hoạch ăn uống 3 bữa chính + 1 bữa phụ..."
                            style={{ fontSize: 13 }}
                          />
                        </FormGroup>

                        {mealDays.map((day, dayIndex) => {
                          const isOpenDay = expandedMealDays.includes(dayIndex);
                          return (
                            <div
                              key={dayIndex}
                              className="mb-3 border rounded"
                              style={{ backgroundColor: "#f9fafb" }}
                            >
                              <div
                                className="d-flex justify-content-between align-items-center px-3 py-2"
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: "#e5e7eb",
                                  borderRadius: "0.25rem 0.25rem 0 0",
                                }}
                                onClick={() => toggleMealDayCollapse(dayIndex)}
                              >
                                <div>
                                  <strong>Ngày ăn {day.dayNumber}</strong>{" "}
                                  {day.dayName && <span className="text-muted">- {day.dayName}</span>}
                                </div>
                                <div className="d-flex align-items-center">
                                  <span className="text-muted me-3" style={{ fontSize: 12 }}>
                                    {isOpenDay ? "Thu gọn" : "Xem chi tiết"}
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
                                    {isOpenDay ? "−" : "+"}
                                  </span>
                                </div>
                              </div>

                              <Collapse isOpen={isOpenDay}>
                                <div className="p-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                                      Cấu hình chi tiết cho ngày ăn này
                                    </div>
                                    <div>
                                      <Button
                                        size="sm"
                                        color="secondary"
                                        outline
                                        className="me-2"
                                        onClick={() => addMeal(dayIndex)}
                                      >
                                        + Thêm bữa ăn
                                      </Button>
                                      <Button
                                        size="sm"
                                        color="danger"
                                        outline
                                        onClick={() => removeMealDay(dayIndex)}
                                      >
                                        Xóa ngày ăn
                                      </Button>
                                    </div>
                                  </div>

                                  <FormGroup className="mb-3">
                                    <Label style={{ fontSize: 12 }}>
                                      Tên ngày ăn{" "}
                                      <span className="text-muted">(ví dụ: Ngày 1 - Thứ 2)</span>
                                    </Label>
                                    <Input
                                      placeholder="Nhập tên ngày ăn"
                                      value={day.dayName}
                                      onChange={(e) => updateMealDay(dayIndex, "dayName", e.target.value)}
                                    />
                                  </FormGroup>

                                  <h6 className="mb-2">Danh sách bữa ăn trong ngày</h6>

                                  {day.meals.map((m, mealIndex) => {
                                    const mealKey = `${dayIndex}-${mealIndex}`;
                                    const isOpenMeal = expandedMeals.includes(mealKey);

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
                                            onClick={() => toggleMealCollapse(dayIndex, mealIndex)}
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
                                            <span className="text-muted me-2" style={{ fontSize: 11 }}>
                                              {isOpenMeal ? "Thu gọn" : "Xem chi tiết"}
                                            </span>
                                            <Button
                                              size="sm"
                                              color="danger"
                                              outline
                                              onClick={() => removeMeal(dayIndex, mealIndex)}
                                            >
                                              Xóa bữa ăn
                                            </Button>
                                          </div>
                                        </div>

                                        <Collapse isOpen={isOpenMeal}>
                                          <Row className="mb-2">
                                            <Col md="4" className="mb-2">
                                              <FormGroup className="mb-0">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>Loại bữa ăn</Label>

                                                <Input
                                                  type="select"
                                                  value={m.mealType || ""}
                                                  onChange={(e) =>
                                                    updateMeal(dayIndex, mealIndex, "mealType", e.target.value)
                                                  }
                                                >
                                                  <option value="" disabled>
                                                    -- Chọn loại bữa ăn --
                                                  </option>
                                                  <option value="Bữa Sáng">Bữa Sáng</option>
                                                  <option value="Bữa Trưa">Bữa Trưa</option>
                                                  <option value="Bữa Tối">Bữa Tối</option>
                                                  <option value="Bữa Phụ">Bữa Phụ</option>
                                                </Input>
                                              </FormGroup>
                                            </Col>
                                            <Col md="4" className="mb-2">
                                              <FormGroup className="mb-0">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>Tên món ăn</Label>
                                                <Input
                                                  placeholder="Ví dụ: Ức gà áp chảo..."
                                                  value={m.name}
                                                  onChange={(e) =>
                                                    updateMeal(dayIndex, mealIndex, "name", e.target.value)
                                                  }
                                                />
                                              </FormGroup>
                                            </Col>
                                            
                                            <Col md="4" className="mb-2">
                                              <FormGroup className="mb-0">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>Thời gian ăn (HH:mm)</Label>
                                                <Input
                                                  placeholder="Ví dụ: 07:30"
                                                  value={m.mealTime}
                                                  onChange={(e) =>
                                                    updateMeal(dayIndex, mealIndex, "mealTime", e.target.value)
                                                  }
                                                />
                                              </FormGroup>
                                            </Col>
                                          </Row>

                                          <FormGroup className="mb-2">
                                            <Label style={{ fontSize: 12, color: "#6b7280" }}>Mô tả món ăn</Label>
                                            <Input
                                              type="textarea"
                                              rows={2}
                                              placeholder="Mô tả khẩu phần, lưu ý..."
                                              value={m.description}
                                              onChange={(e) =>
                                                updateMeal(dayIndex, mealIndex, "description", e.target.value)
                                              }
                                            />
                                          </FormGroup>

                                          <FormGroup className="mb-0">
                                            <Label style={{ fontSize: 12, color: "#6b7280" }}>Gợi ý chế biến</Label>
                                            <Input
                                              type="textarea"
                                              rows={2}
                                              placeholder="Ví dụ: ưu tiên luộc/hấp..."
                                              value={m.instructions}
                                              onChange={(e) =>
                                                updateMeal(dayIndex, mealIndex, "instructions", e.target.value)
                                              }
                                            />
                                          </FormGroup>
                                        </Collapse>
                                      </div>
                                    );
                                  })}
                                </div>
                              </Collapse>
                            </div>
                          );
                        })}

                        <div className="d-flex justify-content-between align-items-center mt-1" style={{ fontSize: 12, color: "#6b7280" }}>
                          <Button color="secondary" size="sm" onClick={addMealDay}>
                            + Thêm ngày ăn
                          </Button>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={handleSaveMealPlan}
                            disabled={mealSaving}
                            style={{ borderRadius: 999, paddingInline: 16 }}
                          >
                            {mealSaving ? "Đang lưu Kế hoạch dinh dưỡng..." : "Lưu Kế hoạch dinh dưỡng"}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}

                {/* Tab 3: Workout Plan (✅ required + validate + show label & error) */}
                {activeModalTab === "workout" && (
                  <>
                    {workoutLoading ? (
                      <div className="text-center my-3 text-muted">
                        Đang tải Kế hoạch tập luyện...
                      </div>
                    ) : (
                      <>
                        <FormGroup className="mb-3">
                          <Label style={{ fontWeight: 600, fontSize: 13 }}>
                            📝 Mô tả tổng quan Kế hoạch tập luyện{" "}
                            <span style={{ color: "#ef4444" }}>*</span>
                          </Label>
                          <Input
                            type="textarea"
                            rows={3}
                            value={workoutDescription}
                            onChange={(e) => setWorkoutDescription(e.target.value)}
                            onBlur={() => {
                              setWorkoutErrors((prev) => ({
                                ...prev,
                                description: isBlank(workoutDescription)
                                  ? "Vui lòng nhập mô tả tổng quan kế hoạch tập luyện."
                                  : "",
                              }));
                            }}
                            placeholder="Ví dụ: Lịch tập 4 buổi/tuần..."
                            style={{ fontSize: 13, ...inputStyleByError(!!workoutErrors.description) }}
                          />
                          {errorText(workoutErrors.description)}
                        </FormGroup>

                        {days.map((day, dayIndex) => {
                          const isOpenDay = expandedDays.includes(dayIndex);
                          return (
                            <div
                              key={dayIndex}
                              className="mb-3 border rounded"
                              style={{ backgroundColor: "#f9fafb" }}
                            >
                              <div
                                className="d-flex justify-content-between align-items-center px-3 py-2"
                                style={{
                                  cursor: "pointer",
                                  backgroundColor: "#e5e7eb",
                                  borderRadius: "0.25rem 0.25rem 0 0",
                                }}
                                onClick={() => toggleDayCollapse(dayIndex)}
                              >
                                <div>
                                  <strong>Ngày tập {day.dayNumber}</strong>{" "}
                                  {day.dayName && (
                                    <span className="text-muted">- {day.dayName}</span>
                                  )}
                                </div>
                                <div className="d-flex align-items-center">
                                  <span className="text-muted me-3" style={{ fontSize: 12 }}>
                                    {isOpenDay ? "Thu gọn" : "Xem chi tiết"}
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
                                    {isOpenDay ? "−" : "+"}
                                  </span>
                                </div>
                              </div>

                              <Collapse isOpen={isOpenDay}>
                                <div className="p-3" onClick={(e) => e.stopPropagation()}>
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                      <Button
                                        size="sm"
                                        color="secondary"
                                        outline
                                        className="me-2"
                                        onClick={() => addExercise(dayIndex)}
                                      >
                                        + Thêm bài tập
                                      </Button>
                                      <Button
                                        size="sm"
                                        color="danger"
                                        outline
                                        onClick={() => removeDay(dayIndex)}
                                      >
                                        Xóa ngày
                                      </Button>
                                    </div>
                                  </div>

                                  <Row>
                                    <Col md="6" className="mb-2">
                                      <FormGroup className="mb-2">
                                        <Label style={{ fontSize: 12, color: "#6b7280" }}>
                                          Tên ngày tập{" "}
                                          <span style={{ color: "#ef4444" }}>*</span>{" "}
                                          <span className="text-muted">(ví dụ: Day 1 - Ngực &amp; Tay sau)</span>
                                        </Label>
                                        <Input
                                          placeholder="Nhập tên ngày tập"
                                          value={day.dayName}
                                          onChange={(e) => updateDay(dayIndex, "dayName", e.target.value)}
                                          onBlur={() => {
                                            const v = String(days?.[dayIndex]?.dayName || "").trim();
                                            setDayFieldError(dayIndex, "dayName", v ? "" : "Vui lòng nhập tên ngày tập.");
                                          }}
                                          style={inputStyleByError(!!workoutErrors.days?.[dayIndex]?.dayName)}
                                        />
                                        {errorText(workoutErrors.days?.[dayIndex]?.dayName)}
                                      </FormGroup>

                                      <FormGroup className="mb-2">
                                        <Label style={{ fontSize: 12, color: "#6b7280" }}>
                                          Vùng tập trung / Nhóm cơ chính{" "}
                                          <span style={{ color: "#ef4444" }}>*</span>
                                        </Label>
                                        <Input
                                          placeholder="Ví dụ: Ngực, Lưng, Chân..."
                                          value={day.focusArea}
                                          onChange={(e) => updateDay(dayIndex, "focusArea", e.target.value)}
                                          onBlur={() => {
                                            const v = String(days?.[dayIndex]?.focusArea || "").trim();
                                            setDayFieldError(
                                              dayIndex,
                                              "focusArea",
                                              v ? "" : "Vui lòng nhập vùng tập trung / nhóm cơ chính."
                                            );
                                          }}
                                          style={inputStyleByError(!!workoutErrors.days?.[dayIndex]?.focusArea)}
                                        />
                                        {errorText(workoutErrors.days?.[dayIndex]?.focusArea)}
                                      </FormGroup>

                                      <FormGroup className="mb-2">
                                        <Label style={{ fontSize: 12, color: "#6b7280" }}>Mô tả buổi tập (tổng quan)</Label>
                                        <Input
                                          type="textarea"
                                          rows={2}
                                          placeholder="Ví dụ: Khởi động, tập chính..."
                                          value={day.description}
                                          onChange={(e) => updateDay(dayIndex, "description", e.target.value)}
                                        />
                                      </FormGroup>
                                    </Col>

                                    <Col md="6" className="mb-2">
                                      <FormGroup className="mb-2">
                                        <Label style={{ fontSize: 12, color: "#6b7280" }}>
                                          Thời lượng buổi tập (phút){" "}
                                          <span style={{ color: "#ef4444" }}>*</span>
                                        </Label>
                                        <Input
                                          type="number"
                                          placeholder="Ví dụ: 60"
                                          value={day.durationMinutes}
                                          onChange={(e) => updateDay(dayIndex, "durationMinutes", e.target.value)}
                                          onBlur={() => {
                                            const n = toInt(days?.[dayIndex]?.durationMinutes);
                                            let msg = "";
                                            if (!Number.isFinite(n)) msg = "Thời lượng phải là số.";
                                            else if (!inRange(n, 10, 300)) msg = "Thời lượng nên trong khoảng 10–300 phút.";
                                            setDayFieldError(dayIndex, "durationMinutes", msg);
                                          }}
                                          style={inputStyleByError(!!workoutErrors.days?.[dayIndex]?.durationMinutes)}
                                        />
                                        {errorText(workoutErrors.days?.[dayIndex]?.durationMinutes)}
                                      </FormGroup>

                                      <FormGroup className="mb-2">
                                        <Label style={{ fontSize: 12, color: "#6b7280" }}>
                                          Độ khó buổi tập <span style={{ color: "#ef4444" }}>*</span>
                                        </Label>

                                        <Input
                                          type="select"
                                          value={day.difficulty || ""}
                                          onChange={(e) => {
                                            const v = e.target.value;
                                            updateDay(dayIndex, "difficulty", v);

                                            // nếu chọn rồi thì clear lỗi ngay (optional nhưng mượt UX)
                                            setDayFieldError(dayIndex, "difficulty", v ? "" : "Vui lòng chọn độ khó buổi tập.");
                                          }}
                                          onBlur={() => {
                                            const v = String(days?.[dayIndex]?.difficulty || "").trim();
                                            setDayFieldError(
                                              dayIndex,
                                              "difficulty",
                                              v ? "" : "Vui lòng chọn độ khó buổi tập."
                                            );
                                          }}
                                          style={inputStyleByError(!!workoutErrors.days?.[dayIndex]?.difficulty)}
                                        >
                                          <option value="" disabled>
                                            -- Chọn độ khó --
                                          </option>
                                          <option value="Dễ">Dễ</option>
                                          <option value="Trung bình">Trung bình</option>
                                          <option value="Khó">Khó</option>
                                          <option value="Nâng cao">Nâng cao</option>
                                        </Input>

                                        {errorText(workoutErrors.days?.[dayIndex]?.difficulty)}
                                      </FormGroup>

                                      <FormGroup className="mb-0">
                                        <Label style={{ fontSize: 12, color: "#6b7280" }}>Ghi chú thêm cho ngày tập</Label>
                                        <Input
                                          type="textarea"
                                          rows={2}
                                          placeholder="Ví dụ: Lưu ý tư thế..."
                                          value={day.notes}
                                          onChange={(e) => updateDay(dayIndex, "notes", e.target.value)}
                                        />
                                      </FormGroup>
                                    </Col>
                                  </Row>

                                  <hr />

                                  <h6 className="mb-2">Danh sách bài tập trong ngày</h6>

                                  {day.exercises.map((ex, exIndex) => {
                                    const exKey = `${dayIndex}-${exIndex}`;
                                    const isOpenEx = expandedExercises.includes(exKey);

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
                                            onClick={() => toggleExerciseCollapse(dayIndex, exIndex)}
                                          >
                                            <strong className="me-2">Bài tập {exIndex + 1}</strong>
                                            {ex.name && (
                                              <span className="text-muted" style={{ fontSize: 12 }}>
                                                - {ex.name}
                                              </span>
                                            )}
                                          </div>
                                          <div className="d-flex align-items-center">
                                            <span className="text-muted me-2" style={{ fontSize: 11 }}>
                                              {isOpenEx ? "Thu gọn" : "Xem chi tiết"}
                                            </span>
                                            <Button
                                              size="sm"
                                              color="danger"
                                              outline
                                              onClick={() => removeExercise(dayIndex, exIndex)}
                                            >
                                              Xóa bài tập
                                            </Button>
                                          </div>
                                        </div>

                                        <Collapse isOpen={isOpenEx}>
                                          <Row className="mb-2">
                                            <Col md="6" className="mb-2">
                                              <FormGroup className="mb-2">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>
                                                  Tên bài tập{" "}
                                                  <span style={{ color: "#ef4444" }}>*</span>
                                                </Label>
                                                <Input
                                                  placeholder="Ví dụ: Bench press, Squat..."
                                                  value={ex.name}
                                                  onChange={(e) =>
                                                    updateExercise(dayIndex, exIndex, "name", e.target.value)
                                                  }
                                                  onBlur={() => {
                                                    const v = String(days?.[dayIndex]?.exercises?.[exIndex]?.name || "").trim();
                                                    setExFieldError(dayIndex, exIndex, "name", v ? "" : "Vui lòng nhập tên bài tập.");
                                                  }}
                                                  style={inputStyleByError(!!workoutErrors.days?.[dayIndex]?.exercises?.[exIndex]?.name)}
                                                />
                                                {errorText(workoutErrors.days?.[dayIndex]?.exercises?.[exIndex]?.name)}
                                              </FormGroup>

                                              <FormGroup className="mb-0">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>Mô tả bài tập</Label>
                                                <Input
                                                  type="textarea"
                                                  rows={2}
                                                  placeholder="Mô tả ngắn..."
                                                  value={ex.description}
                                                  onChange={(e) =>
                                                    updateExercise(dayIndex, exIndex, "description", e.target.value)
                                                  }
                                                />
                                              </FormGroup>
                                            </Col>

                                            <Col md="6" className="mb-2">
                                              <FormGroup className="mb-2">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>Thiết bị sử dụng</Label>
                                                <Input
                                                  placeholder="Ví dụ: Tạ đơn..."
                                                  value={ex.equipment}
                                                  onChange={(e) =>
                                                    updateExercise(dayIndex, exIndex, "equipment", e.target.value)
                                                  }
                                                />
                                              </FormGroup>
                                              <FormGroup className="mb-0">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>Nhóm cơ chính tham gia</Label>
                                                <Input
                                                  placeholder="Ví dụ: Ngực, Vai..."
                                                  value={ex.muscleGroups}
                                                  onChange={(e) =>
                                                    updateExercise(dayIndex, exIndex, "muscleGroups", e.target.value)
                                                  }
                                                />
                                              </FormGroup>
                                            </Col>
                                          </Row>

                                          <Row className="mb-2">
                                            <Col md="4" className="mb-2">
                                              <FormGroup className="mb-0">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>
                                                  Số hiệp (sets){" "}
                                                  <span style={{ color: "#ef4444" }}>*</span>
                                                </Label>
                                                <Input
                                                  type="number"
                                                  placeholder="VD: 3"
                                                  value={ex.sets}
                                                  onChange={(e) =>
                                                    updateExercise(dayIndex, exIndex, "sets", e.target.value)
                                                  }
                                                  onBlur={() => {
                                                    const n = toInt(days?.[dayIndex]?.exercises?.[exIndex]?.sets);
                                                    let msg = "";
                                                    if (!Number.isFinite(n)) msg = "Sets phải là số.";
                                                    else if (!inRange(n, 1, 20)) msg = "Sets nên trong khoảng 1–20.";
                                                    setExFieldError(dayIndex, exIndex, "sets", msg);
                                                  }}
                                                  style={inputStyleByError(!!workoutErrors.days?.[dayIndex]?.exercises?.[exIndex]?.sets)}
                                                />
                                                {errorText(workoutErrors.days?.[dayIndex]?.exercises?.[exIndex]?.sets)}
                                              </FormGroup>
                                            </Col>

                                            <Col md="4" className="mb-2">
                                              <FormGroup className="mb-0">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>
                                                  Số lần (reps){" "}
                                                  <span style={{ color: "#ef4444" }}>*</span>
                                                </Label>
                                                <Input
                                                  type="number"
                                                  placeholder="VD: 10"
                                                  value={ex.reps}
                                                  onChange={(e) =>
                                                    updateExercise(dayIndex, exIndex, "reps", e.target.value)
                                                  }
                                                  onBlur={() => {
                                                    const n = toInt(days?.[dayIndex]?.exercises?.[exIndex]?.reps);
                                                    let msg = "";
                                                    if (!Number.isFinite(n)) msg = "Reps phải là số.";
                                                    else if (!inRange(n, 1, 200)) msg = "Reps nên trong khoảng 1–200.";
                                                    setExFieldError(dayIndex, exIndex, "reps", msg);
                                                  }}
                                                  style={inputStyleByError(!!workoutErrors.days?.[dayIndex]?.exercises?.[exIndex]?.reps)}
                                                />
                                                {errorText(workoutErrors.days?.[dayIndex]?.exercises?.[exIndex]?.reps)}
                                              </FormGroup>
                                            </Col>

                                            <Col md="4" className="mb-2">
                                              <FormGroup className="mb-0">
                                                <Label style={{ fontSize: 12, color: "#6b7280" }}>
                                                  Nghỉ giữa hiệp (giây){" "}
                                                  <span style={{ color: "#ef4444" }}>*</span>
                                                </Label>
                                                <Input
                                                  type="number"
                                                  placeholder="VD: 60"
                                                  value={ex.restSeconds}
                                                  onChange={(e) =>
                                                    updateExercise(dayIndex, exIndex, "restSeconds", e.target.value)
                                                  }
                                                  onBlur={() => {
                                                    const n = toInt(days?.[dayIndex]?.exercises?.[exIndex]?.restSeconds);
                                                    let msg = "";
                                                    if (!Number.isFinite(n)) msg = "Nghỉ phải là số.";
                                                    else if (!inRange(n, 0, 600)) msg = "Nghỉ nên trong khoảng 0–600 giây.";
                                                    setExFieldError(dayIndex, exIndex, "restSeconds", msg);
                                                  }}
                                                  style={inputStyleByError(!!workoutErrors.days?.[dayIndex]?.exercises?.[exIndex]?.restSeconds)}
                                                />
                                                {errorText(workoutErrors.days?.[dayIndex]?.exercises?.[exIndex]?.restSeconds)}
                                              </FormGroup>
                                            </Col>
                                          </Row>

                                          <FormGroup className="mb-0">
                                            <Label style={{ fontSize: 12, color: "#6b7280" }}>Hướng dẫn / Lưu ý kỹ thuật</Label>
                                            <Input
                                              type="textarea"
                                              rows={2}
                                              placeholder="Ví dụ: Giữ lưng thẳng..."
                                              value={ex.instructions}
                                              onChange={(e) =>
                                                updateExercise(dayIndex, exIndex, "instructions", e.target.value)
                                              }
                                            />
                                          </FormGroup>
                                        </Collapse>
                                      </div>
                                    );
                                  })}
                                </div>
                              </Collapse>
                            </div>
                          );
                        })}

                        <div className="d-flex justify-content-between align-items-center mt-1" style={{ fontSize: 12, color: "#6b7280" }}>
                          <Button color="secondary" size="sm" onClick={addDay}>
                            + Thêm ngày tập
                          </Button>
                          <Button
                            color="primary"
                            size="sm"
                            onClick={handleSaveWorkoutPlan}
                            disabled={workoutSaving}
                            style={{ borderRadius: 999, paddingInline: 16 }}
                          >
                            {workoutSaving ? "Đang lưu Kế hoạch tập luyện..." : "Lưu Kế hoạch tập luyện"}
                          </Button>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </ModalBody>

        <ModalFooter style={{ borderTop: "none" }}>
          <Button color="secondary" outline onClick={handleCloseDetail}>
            Đóng
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default TrainerMemberList;
