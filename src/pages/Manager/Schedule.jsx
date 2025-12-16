import React, { useEffect, useRef, useState, useMemo } from "react";
import api from "../../config/axios";
import { message } from "antd";

/** ================= Helpers thời gian & format ================= */
function parseTimeRange(timeStr) {
  if (!timeStr) return [0, 0, 0, 0];
  const [start, end] = timeStr.split("-");
  const [sh, sm] = start.split(":").map((v) => +v);
  const [eh, em] = end ? end.split(":").map((v) => +v) : [sh, sm];
  return [sh, sm, eh, em];
}
function dateObjToISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
function toDDMMYYYY(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
function toHHmmFromApiTime(apiTime) {
  if (!apiTime) return "";
  const parts = String(apiTime).split(":");
  const hh = (parts[0] || "00").padStart(2, "0");
  const mm = (parts[1] || "00").padStart(2, "0");
  return `${hh}:${mm}`;
}
function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src*="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = false;
    s.onload = resolve;
    s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(s);
  });
}
function isPastOrToday(isoOrDate) {
  if (!isoOrDate) return false;
  const d = new Date(isoOrDate);
  if (isNaN(d.getTime())) return false;
  const today = new Date();
  d.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  return d.getTime() <= today.getTime();
}

/** ================= Helpers UI ================= */
function getPersonInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
function statusBadgeClass(status) {
  const st = (status || "").toLowerCase();
  if (st === "scheduled" || st === "present") return "badge bg-success";
  if (st === "off") return "badge bg-secondary";
  if (st === "absent") return "badge bg-danger";
  if (st === "not yet") return "badge bg-secondary";
  return "badge bg-secondary";
}

/** ================= API ================= */
async function apiGetScheduleDay(isoDate) {
  const res = await api.get("/staff-schedule/day", { params: { date: isoDate } });
  return res.data;
}
async function apiAssignStaffToSlot({ scheduleDate, timeSlotId, staffIds, status, notes }) {
  await api.post("/staff-schedule/assign", { scheduleDate, timeSlotId, staffIds, status, notes });
}
async function apiGetAllBookedTrainingSessions() {
  // user: GET /api/TrainingSession/all-booked
  const res = await api.get("/TrainingSession/all-booked");
  return res.data || [];
}

/** ================= Convert BE Staff Day -> FE Event ================= */
function dayDtoToEvent(dayDto) {
  const isoDate = (dayDto?.date || "").slice(0, 10);
  const d = new Date(isoDate);
  const slots = Array.isArray(dayDto?.slots) ? dayDto.slots : [];

  const shifts = slots.map((sl) => {
    const start = toHHmmFromApiTime(sl.startTime);
    const end = toHHmmFromApiTime(sl.endTime);
    const time = start && end ? `${start}-${end}` : "";

    return {
      name: sl.slotName || "Ca",
      time,
      timeSlotId: sl.timeSlotId,
      staff: (sl.staffs || []).map((st) => ({
        staffId: st.staffId,
        name: st.name,
        status: st.status || "Scheduled",
        notes: st.notes || "",
      })),
    };
  });

  const totalStaff = shifts.reduce((sum, sh) => sum + ((sh.staff || []).length || 0), 0);
  const dayStatus = totalStaff === 0 ? "Off" : "Scheduled";

  let startTime = "00:00";
  let endTime = "00:00";
  if (shifts.length) {
    let minH = 23,
      minM = 59,
      maxH = 0,
      maxM = 0;
    shifts.forEach((sh) => {
      if (!sh.time) return;
      const [shh, smm, ehh, emm] = parseTimeRange(sh.time);
      if (shh < minH || (shh === minH && smm < minM)) {
        minH = shh;
        minM = smm;
      }
      if (ehh > maxH || (ehh === maxH && emm > maxM)) {
        maxH = ehh;
        maxM = emm;
      }
    });
    if (!(minH === 23 && maxH === 0)) {
      startTime = `${String(minH).padStart(2, "0")}:${String(minM).padStart(2, "0")}`;
      endTime = `${String(maxH).padStart(2, "0")}:${String(maxM).padStart(2, "0")}`;
    }
  }

  const [shh, smm] = startTime.split(":").map((v) => +v || 0);
  const [ehh, emm] = endTime.split(":").map((v) => +v || 0);

  return {
    date: isoDate,
    rawDate: isoDate,
    title: "Lịch trực",
    status: dayStatus,
    start: new Date(d.getFullYear(), d.getMonth(), d.getDate(), shh, smm, 0, 0),
    end: new Date(d.getFullYear(), d.getMonth(), d.getDate(), ehh, emm, 0, 0),
    shifts,
    isNew: false,
    scheduleId: null,
  };
}

/** ================= Convert Training sessions -> FE day events ================= */
function trainingSessionsToDayEvents(sessions) {
  // group by date -> then group by trainerId
  const byDate = new Map();

  (sessions || []).forEach((s) => {
    const iso = String(s.sessionDate || "").slice(0, 10);
    if (!iso) return;

    const trainerId = s.trainerId ?? "unknown";
    const trainerName = s.trainerName || `Trainer #${trainerId}`;

    const start = toHHmmFromApiTime(s.startTime);
    const end = toHHmmFromApiTime(s.endTime);
    const time = start && end ? `${start}-${end}` : "";

    if (!byDate.has(iso)) byDate.set(iso, new Map());
    const byTrainer = byDate.get(iso);
    if (!byTrainer.has(trainerId)) byTrainer.set(trainerId, { trainerId, trainerName, sessions: [] });

    byTrainer.get(trainerId).sessions.push({
      sessionId: s.sessionId,
      timeSlotName: s.timeSlotName || "",
      timeSlotId: s.timeSlotId,
      memberId: s.memberId,
      memberName: s.memberName || `Member #${s.memberId ?? "?"}`,
      time,
      start,
      end,
    });
  });

  const events = [];
  for (const [iso, trainerMap] of byDate.entries()) {
    const d = new Date(iso);
    const trainers = [...trainerMap.values()].map((t) => {
      const sorted = [...t.sessions].sort((a, b) => (a.start || "").localeCompare(b.start || ""));
      return { ...t, sessions: sorted };
    });

    // compute min/max time across all sessions
    let minH = 23,
      minM = 59,
      maxH = 0,
      maxM = 0;
    let hasAny = false;

    trainers.forEach((tr) => {
      tr.sessions.forEach((ss) => {
        if (!ss.time) return;
        const [shh, smm, ehh, emm] = parseTimeRange(ss.time);
        hasAny = true;
        if (shh < minH || (shh === minH && smm < minM)) {
          minH = shh;
          minM = smm;
        }
        if (ehh > maxH || (ehh === maxH && emm > maxM)) {
          maxH = ehh;
          maxM = emm;
        }
      });
    });

    const start = hasAny
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), minH, minM, 0, 0)
      : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const end = hasAny
      ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), maxH, maxM, 0, 0)
      : new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);

    const totalSessions = trainers.reduce((sum, tr) => sum + (tr.sessions?.length || 0), 0);
    const trainerCount = trainers.length;

    events.push({
      rawDate: iso,
      date: iso,
      title: "Lịch PT",
      status: totalSessions > 0 ? "Scheduled" : "Off",
      start,
      end,
      shifts: trainers.map((tr) => ({
        // reuse field name `shifts` for renderer consistency
        name: tr.trainerName,
        trainerId: tr.trainerId,
        sessions: tr.sessions,
      })),
      meta: { totalSessions, trainerCount },
    });
  }

  // ensure stable sort by date
  events.sort((a, b) => String(a.rawDate).localeCompare(String(b.rawDate)));
  return events;
}

/** ================= Normalize FE events for calendar renderer ================= */
function normalizeScheduleData(arr) {
  const out = [];
  (arr || []).forEach((item) => {
    if (!item.date && !item.rawDate) return;
    const iso = item.rawDate || item.date;
    const d = new Date(iso);

    let start = item.start;
    let end = item.end;

    if (!start || isNaN(new Date(start).getTime())) start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    if (end && isNaN(new Date(end).getTime())) end = null;

    let statusRaw = item.status || "Scheduled";
    let status = statusRaw.toLowerCase() === "off" ? "Off" : "Scheduled";

    out.push({
      title: item.title || "Lịch",
      start,
      end,
      allDay: false,
      status,
      shifts: item.shifts || [],
      rawDate: iso,
      scheduleId: item.scheduleId,
      meta: item.meta,
    });
  });

  out.sort((a, b) => +a.start - +b.start);
  return out;
}

/** ================= Staff helper ================= */
function shiftStaffIds(shift) {
  const arr = Array.isArray(shift?.staff) ? shift.staff : [];
  return arr.map((x) => x.staffId).filter((x) => x != null);
}

export default function ManageSchedule() {
  const holderStaffRef = useRef(null);
  const holderTrainerRef = useRef(null);
  const tmplRef = useRef(null);

  const eventModalRef = useRef(null);
  const personModalRef = useRef(null);
  const trainerModalRef = useRef(null);

  const bootstrapRef = useRef({ Modal: null, Popover: null });

  const [activeTab, setActiveTab] = useState("staff"); // "staff" | "trainer"

  /** ============ STAFF STATE ============ */
  const [staffList, setStaffList] = useState([]);
  const staffDataRef = useRef([]);
  const [allStaffSchedule, setAllStaffSchedule] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null); // staff event
  const [selectedPerson, setSelectedPerson] = useState(null);

  const [editingShiftIndex, setEditingShiftIndex] = useState(null);
  const [editingStaffIds, setEditingStaffIds] = useState([]);

  const selectedIso = useMemo(() => {
    return selectedEvent?.rawDate || selectedEvent?.date || selectedEvent?.start || null;
  }, [selectedEvent]);

  const readOnly = useMemo(() => {
    if (!selectedIso) return true;
    return isPastOrToday(selectedIso);
  }, [selectedIso]);

  /** ============ TRAINER STATE ============ */
  const trainerDataRef = useRef([]);
  const [allTrainerSchedule, setAllTrainerSchedule] = useState([]);
  const [selectedTrainerDay, setSelectedTrainerDay] = useState(null);

  /** ================= init calendar plugin once ================= */
  const ensureCalendarPlugin = async () => {
    // load jquery
    await loadScript("https://code.jquery.com/jquery-3.6.4.min.js");

    // load bootstrap bundle (Modal/Popover)
    try {
      const BootstrapBundle = await import("bootstrap/dist/js/bootstrap.bundle.min.js");
      window.bootstrap = window.bootstrap || {};
      window.bootstrap.Modal = window.bootstrap.Modal || BootstrapBundle.Modal;
      window.bootstrap.Popover = window.bootstrap.Popover || BootstrapBundle.Popover;

      bootstrapRef.current.Modal = window.bootstrap.Modal;
      bootstrapRef.current.Popover = window.bootstrap.Popover;
    } catch (e) {
      console.error("Bootstrap JS not available", e);
    }

    const $ = window.jQuery;
    if (!$) return;

    if (window.__SMARTGYM_CALENDAR_PLUGIN_LOADED__) return;

    $.extend({
      quicktmpl: function (template) {
        return new Function(
          "obj",
          "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" +
            template
              .replace(/[\r\t\n]/g, " ")
              .split("{{")
              .join("\t")
              .replace(/((^|\}\})[^\t]*)'/g, "$1\r")
              .replace(/\t:(.*?)\}\}/g, "',$1,'")
              .split("}}")
              .join("p.push('")
              .split("\t")
              .join("');")
              .split("\r")
              .join("\\'") +
            "');}return p.join('');"
        );
      },
    });

    $.extend(Date.prototype, {
      toDateCssClass: function () {
        return "_" + this.getFullYear() + "_" + (this.getMonth() + 1) + "_" + this.getDate();
      },
      toDateInt: function () {
        return (this.getFullYear() * 12 + this.getMonth()) * 32 + this.getDate();
      },
    });

    function calendar($el, options) {
      const tmplEl = document.getElementById("tmpl");
      const t = $.quicktmpl(tmplEl ? tmplEl.innerHTML : "");

      let currentPopover = null;
      const POPOVER_OPTS = {
        html: true,
        container: "body",
        placement: "auto",
        trigger: "manual",
        sanitize: false,
      };

      function getOrCreatePopover(elem, opts) {
        const PopCtor = bootstrapRef.current.Popover || window.bootstrap?.Popover;
        if (!PopCtor) return null;
        let instance = PopCtor.getInstance ? PopCtor.getInstance(elem) : null;
        if (!instance) instance = new PopCtor(elem, { ...POPOVER_OPTS, ...opts });
        return instance;
      }

      function hideCurrent() {
        if (currentPopover) {
          try {
            currentPopover.hide();
          } catch {}
          currentPopover = null;
        }
      }

      $(document).off("click.smartgymPop").on("click.smartgymPop", (e) => {
        if (!$(e.target).closest(".popover, .js-cal-years, .js-cal-months, .event-chip").length) hideCurrent();
      });

      $el
        .off("click.calNav")
        .on("click.calNav", ".js-cal-prev", function () {
          if (options.mode === "year") options.date.setFullYear(options.date.getFullYear() - 1);
          else if (options.mode === "month") options.date.setMonth(options.date.getMonth() - 1);
          else if (options.mode === "week") options.date.setDate(options.date.getDate() - 7);
          else options.date.setDate(options.date.getDate() - 1);
          hideCurrent();
          draw();
        })
        .on("click.calNav", ".js-cal-next", function () {
          if (options.mode === "year") options.date.setFullYear(options.date.getFullYear() + 1);
          else if (options.mode === "month") options.date.setMonth(options.date.getMonth() + 1);
          else if (options.mode === "week") options.date.setDate(options.date.getDate() + 7);
          else options.date.setDate(options.date.getDate() + 1);
          hideCurrent();
          draw();
        })
        .on("click.calNav", ".js-cal-months", function (e) {
          e.preventDefault();
          e.stopPropagation();
          const btn = this;
          let s = '<div class="list-group">';
          for (let m = 0; m < 12; m++) {
            const label = `${options.months[m]}`;
            s += `<button type="button" class="list-group-item list-group-item-action js-cal-option"
                       data-date="${new Date(options.date.getFullYear(), m, 1).toISOString()}"
                       data-mode="month">${label}</button>`;
          }
          s += "</div>";
          const pop = getOrCreatePopover(btn, { content: s });
          if (!pop) return false;
          if (currentPopover && currentPopover === pop) {
            pop.hide();
            currentPopover = null;
            return false;
          }
          hideCurrent();
          pop.show();
          currentPopover = pop;
          return false;
        })
        .on("click.calNav", ".js-cal-years", function (e) {
          e.preventDefault();
          e.stopPropagation();
          const btn = this;
          const base = options.date.getFullYear();
          const start = base - 6,
            end = base + 6;
          let s = '<div class="list-group">';
          for (let y = start; y <= end; y++) {
            s += `<button type="button" class="list-group-item list-group-item-action js-cal-option"
                       data-date="${new Date(y, options.date.getMonth(), 1).toISOString()}"
                       data-mode="month">${y}</button>`;
          }
          s += "</div>";
          const pop = getOrCreatePopover(btn, { content: s });
          if (!pop) return false;
          if (currentPopover && currentPopover === pop) {
            pop.hide();
            currentPopover = null;
            return false;
          }
          hideCurrent();
          pop.show();
          currentPopover = pop;
          return false;
        });

      $(document)
        .off("click.calOpt")
        .on("click.calOpt", ".js-cal-option", function () {
          const $t = $(this);
          if ($t.hasClass("calendar-day")) return;
          const o = $t.data();
          if (o.date) o.date = new Date(o.date);
          $.extend(options, o);
          hideCurrent();
          $(".popover").remove();
          draw();
        });

      // CLICK CHIP
      $el.off("click.eventChip").on("click.eventChip", ".event-chip", function (e) {
        e.preventDefault();
        e.stopPropagation();
        const index = +this.getAttribute("data-index");
        if (!isNaN(index) && options.data[index]) {
          options.onOpenEvent && options.onOpenEvent(options.data[index]);
        }
        return false;
      });

      // CLICK NGÀY
      $el.off("click.dayCell").on("click.dayCell", ".calendar-day", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const dateStr = this.getAttribute("data-date");
        if (!dateStr) return false;
        const clickedDate = new Date(dateStr);
        const iso = dateObjToISO(clickedDate);

        options.onOpenEvent &&
          options.onOpenEvent({
            title: options.defaultTitle || "Lịch",
            start: clickedDate,
            end: null,
            status: "Scheduled",
            shifts: [],
            rawDate: iso,
            date: iso,
          });

        return false;
      });

      function monthAddEvent(index, event) {
        const e = new Date(event.start);
        const dayCell = $("." + e.toDateCssClass());
        if (!dayCell.length || dayCell.hasClass("has-event")) return;

        // render chip per mode:
        // - Staff: show staff initials
        // - Trainer: show trainer initials + counts
        const isTrainerMode = event.title === "Lịch PT";

        let avatars = [];
        if (!isTrainerMode) {
          // staff mode: unique staff across shifts
          let staffs = [];
          (event.shifts || []).forEach((shift) => {
            (shift.staff || []).forEach((s) => staffs.push(s));
          });
          const map = new Map();
          staffs.forEach((s) => {
            if (s?.staffId == null) return;
            if (!map.has(s.staffId)) map.set(s.staffId, s);
          });
          avatars = [...map.values()].map((x) => ({ id: x.staffId, name: x.name }));
        } else {
          // trainer mode: unique trainers (each shift is trainer)
          avatars = (event.shifts || []).map((tr) => ({
            id: tr.trainerId ?? tr.name,
            name: tr.name,
          }));
        }

        const maxShow = 4;
        const total = avatars.length;

        const totalSessions =
          isTrainerMode && event.meta ? event.meta.totalSessions : (avatars.length || 0);

        const subtitle = isTrainerMode
          ? `${totalSessions} buổi • ${total} PT`
          : `${total} Staff`;

        const $chip = $(`
          <div class="event-chip" data-index="${index}" title="${event.title}">
            <div class="event-chip-avatars"></div>
            <div class="event-chip-title">${event.title}</div>
            <div class="event-chip-time">${subtitle}</div>
          </div>
        `);

        const $avatarWrap = $chip.find(".event-chip-avatars");
        avatars.slice(0, maxShow).forEach((st) => {
          const initials = getPersonInitials(st?.name || "?");
          $avatarWrap.append(`<div class="avatar-circle staff-avatar">${initials}</div>`);
        });
        if (total > maxShow) {
          const more = total - maxShow;
          $avatarWrap.append(`<div class="avatar-circle more-avatar">+${more}</div>`);
        }

        dayCell.addClass("has-event").append($chip);
      }

      function draw() {
        $el.html(t(options));
        $("." + new Date().toDateCssClass()).addClass("today");
        if (options.data && options.data.length) {
          if (options.mode === "month" || options.mode === "week") $.each(options.data, monthAddEvent);
        }
      }

      draw();
    }

    (function (defaults, $, window, document) {
      $.extend({
        calendar: function (options) {
          return $.extend(defaults, options);
        },
      }).fn.extend({
        calendar: function (options) {
          options = $.extend({}, defaults, options);
          return $(this).each(function () {
            calendar($(this), options);
          });
        },
      });
    })(
      {
        days: ["Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy", "Chủ nhật"],
        months: ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"],
        shortMonths: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"],
        date: new Date(),
        daycss: ["", "", "", "", "", "c-saturday", "c-sunday"],
        thismonthcss: "current",
        lastmonthcss: "prev-month",
        nextmonthcss: "next-month",
        mode: "month",
        data: [],
        onOpenEvent: null,
        defaultTitle: "Lịch",
      },
      window.jQuery,
      window,
      document
    );

    window.__SMARTGYM_CALENDAR_PLUGIN_LOADED__ = true;
  };

  /** ================= Calendar render helpers ================= */
  const rerenderStaffCalendar = (events) => {
    if (window.jQuery && holderStaffRef.current) {
      window.jQuery(holderStaffRef.current).calendar({
        data: normalizeScheduleData(events),
        onOpenEvent: onOpenEventFromStaffCalendar,
        defaultTitle: "Lịch trực",
      });
    }
  };

  const rerenderTrainerCalendar = (events) => {
    if (window.jQuery && holderTrainerRef.current) {
      window.jQuery(holderTrainerRef.current).calendar({
        data: normalizeScheduleData(events),
        onOpenEvent: onOpenEventFromTrainerCalendar,
        defaultTitle: "Lịch PT",
      });
    }
  };

  const upsertStaffEventToCache = (ev) => {
    const iso = ev.rawDate || ev.date || dateObjToISO(ev.start);
    const next = [...staffDataRef.current];
    const idx = next.findIndex((x) => (x.rawDate || x.date) === iso);
    if (idx >= 0) next[idx] = { ...next[idx], ...ev, rawDate: iso, date: iso };
    else next.push({ ...ev, rawDate: iso, date: iso });
    staffDataRef.current = next;
    setAllStaffSchedule(next);
    rerenderStaffCalendar(next);
    return next;
  };

  const fetchStaffDayAndCache = async (isoDate) => {
    const key = `fetch-day-${isoDate}`;
    message.loading({ content: "Đang tải lịch trong ngày...", key, duration: 0 });
    try {
      const dayDto = await apiGetScheduleDay(isoDate);
      const ev = dayDtoToEvent(dayDto);
      upsertStaffEventToCache(ev);
      message.success({ content: "Đã tải lịch.", key, duration: 1.2 });
      return ev;
    } catch (e) {
      console.error("GET /staff-schedule/day failed:", e);
      message.error({ content: "Không thể tải lịch trong ngày.", key, duration: 2 });
      return null;
    }
  };

  const showStaffEventModal = () => {
    try {
      const ModalCtor = bootstrapRef.current.Modal || window.bootstrap?.Modal;
      if (!ModalCtor) return;
      const el = document.getElementById("eventDetailModal");
      if (!el) return;
      const inst = ModalCtor.getOrCreateInstance(el);
      inst.show();
    } catch (e) {
      console.warn("Cannot open staff event modal:", e);
    }
  };

  const showTrainerModal = () => {
    try {
      const ModalCtor = bootstrapRef.current.Modal || window.bootstrap?.Modal;
      if (!ModalCtor) return;
      const el = document.getElementById("trainerDayModal");
      if (!el) return;
      const inst = ModalCtor.getOrCreateInstance(el);
      inst.show();
    } catch (e) {
      console.warn("Cannot open trainer modal:", e);
    }
  };

  /** ================= Staff actions ================= */
  const openPersonModal = (staff, status) => {
    if (!staff) return;
    setSelectedPerson({ ...staff, status: status || "Scheduled" });
  };

  const startEditShift = (shift, index) => {
    if (readOnly) return;
    setEditingShiftIndex(index);
    setEditingStaffIds(shiftStaffIds(shift));
  };

  const cancelEditShift = () => {
    setEditingShiftIndex(null);
    setEditingStaffIds([]);
  };

  const assignScheduleForEditingShift = async () => {
    if (!selectedEvent || editingShiftIndex == null) return;

    if (readOnly) {
      message.warning("Ngày quá khứ hoặc hôm nay chỉ xem lịch, không thể chỉnh sửa/xếp lịch.");
      return;
    }

    const isoDate = selectedEvent.rawDate || dateObjToISO(selectedEvent.date || selectedEvent.start);
    const baseShifts = selectedEvent.shifts || [];
    const shiftEditing = baseShifts[editingShiftIndex];
    if (!shiftEditing) return;

    const otherStaffIds = baseShifts
      .filter((_, idx) => idx !== editingShiftIndex)
      .flatMap((sh) => shiftStaffIds(sh));

    const duplicated = editingStaffIds.filter((id) => otherStaffIds.includes(id));
    if (duplicated.length) {
      message.error("Một số nhân viên đã được phân ca khác trong ngày. Không thể trực 2 ca cùng ngày.");
      return;
    }

    const timeSlotId = shiftEditing.timeSlotId || (editingShiftIndex === 0 ? 17 : 18);
    const isOff = editingStaffIds.length === 0;
    const payloadStatus = isOff ? "Off" : "Scheduled";

    const loadingKey = "assign-staff-schedule";
    message.loading({ content: "Đang xếp lịch...", key: loadingKey, duration: 0 });

    try {
      await apiAssignStaffToSlot({
        scheduleDate: isoDate,
        timeSlotId,
        staffIds: editingStaffIds,
        status: payloadStatus,
        notes: "",
      });

      const fresh = await fetchStaffDayAndCache(isoDate);
      if (fresh) setSelectedEvent(fresh);

      cancelEditShift();
      message.success({ content: "Xếp lịch thành công!", key: loadingKey, duration: 2 });
    } catch (err) {
      console.error("POST /staff-schedule/assign failed:", err);
      message.error({ content: "Xếp lịch thất bại. Vui lòng thử lại.", key: loadingKey, duration: 3 });
    }
  };

  const onOpenEventFromStaffCalendar = async (ev) => {
    setEditingShiftIndex(null);
    setEditingStaffIds([]);

    const isoDate = ev.rawDate || ev.date || dateObjToISO(ev.start || ev.date);

    const cached = staffDataRef.current.find((x) => (x.rawDate || x.date) === isoDate);
    if (cached) setSelectedEvent(cached);
    else setSelectedEvent({ ...ev, rawDate: isoDate, date: isoDate });

    const fresh = await fetchStaffDayAndCache(isoDate);
    if (fresh) setSelectedEvent(fresh);

    showStaffEventModal();
  };

  /** ================= Trainer actions (read-only) ================= */
  const loadTrainerSchedule = async () => {
    const key = "load-trainer-schedule";
    message.loading({ content: "Đang tải lịch PT...", key, duration: 0 });
    try {
      const list = await apiGetAllBookedTrainingSessions();
      const dayEvents = trainingSessionsToDayEvents(list);

      trainerDataRef.current = dayEvents;
      setAllTrainerSchedule(dayEvents);
      rerenderTrainerCalendar(dayEvents);

      message.success({ content: "Đã tải lịch PT.", key, duration: 1.2 });
    } catch (e) {
      console.error("GET /TrainingSession/all-booked failed:", e);
      trainerDataRef.current = [];
      setAllTrainerSchedule([]);
      rerenderTrainerCalendar([]);
      message.error({ content: "Không thể tải lịch PT.", key, duration: 2 });
    }
  };

  const onOpenEventFromTrainerCalendar = (ev) => {
    const isoDate = ev.rawDate || ev.date || dateObjToISO(ev.start || ev.date);
    const cached = trainerDataRef.current.find((x) => (x.rawDate || x.date) === isoDate);
    const picked = cached || { ...ev, rawDate: isoDate, date: isoDate };

    // nếu click vào ngày không có lịch, vẫn mở modal để báo "không có lịch"
    setSelectedTrainerDay(picked);
    showTrainerModal();
  };

  /** ================= Init: load plugin, init both calendars ================= */
  useEffect(() => {
    (async () => {
      await ensureCalendarPlugin();

      // load staff list (once)
      const staffKey = "load-staff-list";
      message.loading({ content: "Đang tải danh sách staff...", key: staffKey, duration: 0 });
      try {
        const res = await api.get("/staff-schedule/staffs");
        setStaffList(res.data || []);
        message.success({ content: "Đã tải danh sách staff.", key: staffKey, duration: 1.2 });
      } catch (e) {
        console.error("Failed to load staff list:", e);
        message.error({ content: "Không thể tải danh sách staff.", key: staffKey, duration: 2 });
      }

      // init staff calendar empty
      staffDataRef.current = [];
      setAllStaffSchedule([]);
      rerenderStaffCalendar([]);

      // init trainer calendar empty (lazy data)
      trainerDataRef.current = [];
      setAllTrainerSchedule([]);
      rerenderTrainerCalendar([]);

      // load trainer schedule once at start (so tab trainer có sẵn data)
      await loadTrainerSchedule();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** when switching tabs, re-render corresponding calendar to avoid sizing glitches */
  useEffect(() => {
    if (activeTab === "staff") rerenderStaffCalendar(allStaffSchedule);
    if (activeTab === "trainer") rerenderTrainerCalendar(allTrainerSchedule);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  return (
    <div className="container mt-5 mb-5">
      <style>{`
.nav-arrow{ font-weight:800;font-size:22px;line-height:1;padding:2px 10px;border:none;background:transparent;cursor:pointer; }
.nav-arrow:focus{ outline:none; }
.btn-link.no-underline{ text-decoration:none !important; }
.btn-link.bold{ font-weight:700 !important; }

.calendar-table{ width:100%; table-layout:fixed; border-collapse:separate; border-spacing:0; }
.calendar-table th, .calendar-table td{ vertical-align:top; }
.calendar-table thead .c-weeks th, .calendar-table tbody td.calendar-day{ width:14.285714%; }

.calendar-day{
  position:relative; padding:8px; min-height:120px; background:#fff; border:1px solid #e5e7eb;
  overflow:hidden; word-wrap:break-word; transition:background-color .15s ease, border-color .15s ease;
}
.calendar-day .date{ font-weight:600; margin-bottom:6px; }
.current{ background:#fff; }
.prev-month, .next-month{ background:#f4f5f7 !important; color:#9aa0a6; opacity:.9; }

.calendar-day.today{ background:#fff7cc !important; border:1px solid #ffd24d !important; box-shadow:inset 0 0 0 2px #ffe58a; }
.calendar-day.today .date{ font-weight:800; color:#b45309; }

.calendar-day.has-event{ background:#fff3f5 !important; border:1px solid #ffc7d2 !important; }
.calendar-day.has-event .date{ font-weight:700; color:#c80036; }

.event-chip{
  margin-top:6px; padding:6px 8px; border-radius:10px; background:#ffdbe3; border:1px dashed #ff9eb2;
  cursor:pointer; font-size:12px; line-height:1.25; display:grid; gap:3px; max-width:100%;
}
.event-chip-avatars{ display:flex; gap:4px; flex-wrap:wrap; margin-bottom:2px; }
.avatar-circle{
  width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:600; color:#fff;
}
.staff-avatar{ background:#1f3bb6; }
.more-avatar{ background:#6b7280; }

.event-chip-title{ font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.event-chip-time{ opacity:.9; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

.popover{ z-index:1080; max-width:320px; }

@media (max-width: 576px){
  .calendar-day{ min-height:100px; padding:6px; }
  .event-chip{ font-size:11px; }
  .event-chip-time{ font-size:10px; }
  .nav-arrow{ font-size:20px; padding:2px 8px; }
}
      `}</style>

      <div className="mb-3 text-center">
        <h1 style={{ margin: 0, color: "#c80036", fontWeight: "bold" }}>Quản lý lịch</h1>
        <div className="text-muted mt-1">Chọn tab Staff để xếp lịch, tab Trainer chỉ xem lịch đặt PT.</div>
      </div>

      {/* Tabs */}
      <div className="d-flex justify-content-center mb-3" style={{ gap: 8 }}>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "staff" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("staff")}
        >
          Lịch làm của Nhân viên
        </button>
        <button
          type="button"
          className={`btn btn-sm ${activeTab === "trainer" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("trainer")}
        >
          Lịch làm của Huấn luyện viên
        </button>
      </div>

      {/* STAFF TAB actions */}
      {activeTab === "staff" && (
        <div className="d-flex justify-content-center gap-2 mb-3">
          <button
            type="button"
            className="btn btn-danger"
            disabled={!selectedEvent || readOnly || editingShiftIndex == null}
            onClick={() => {
              if (!selectedEvent) return;
              if (readOnly) {
                message.warning("Ngày quá khứ/hôm nay chỉ xem lịch, không thể xếp lịch.");
                showStaffEventModal();
                return;
              }
              if (editingShiftIndex == null) {
                message.info("Hãy bấm 'Chỉnh sửa ca này' trong modal trước.");
                showStaffEventModal();
                return;
              }
              assignScheduleForEditingShift();
            }}
            title={
              !selectedEvent
                ? "Chọn 1 ngày/chip trước"
                : readOnly
                ? "Ngày quá khứ/hôm nay không thể xếp lịch"
                : editingShiftIndex == null
                ? "Chọn 'Chỉnh sửa ca này' trước"
                : ""
            }
          >
            Xếp lịch
          </button>
        </div>
      )}

      {/* ================= STAFF MODAL CHI TIẾT LỊCH ================= */}
      <div className="modal fade" id="eventDetailModal" tabIndex="-1" aria-hidden="true" ref={eventModalRef}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{selectedEvent?.title || "Chi tiết lịch trực"}</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setSelectedEvent(null);
                  cancelEditShift();
                }}
              />
            </div>

            <div className="modal-body">
              {selectedEvent ? (
                <>
                  <div className="mb-3 text-muted">
                    Ngày:{" "}
                    <strong>{toDDMMYYYY(new Date(selectedEvent.rawDate || selectedEvent.date || selectedEvent.start))}</strong>
                  </div>

                  {readOnly && (
                    <div className="alert alert-warning py-2">
                      Ngày này là <b>hôm nay</b> hoặc <b>đã qua</b> → chỉ được <b>xem lịch</b>, không thể chỉnh sửa/xếp lịch.
                    </div>
                  )}

                  {(selectedEvent.shifts || []).length === 0 ? (
                    <div className="text-muted">
                      Ngày này chưa có dữ liệu ca từ BE (slots rỗng). Hãy kiểm tra API /staff-schedule/day.
                    </div>
                  ) : null}

                  {(selectedEvent.shifts || []).map((shift, idx) => {
                    const isEditing = editingShiftIndex === idx;
                    const allShiftsForDay = selectedEvent.shifts || [];
                    const otherStaffIds = allShiftsForDay
                      .filter((_, i) => i !== idx)
                      .flatMap((sh) => shiftStaffIds(sh));

                    return (
                      <div key={idx} className="border rounded-3 p-3 mb-3" style={{ background: "#fafafa" }}>
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0" style={{ color: "#c80036", fontWeight: "bold" }}>
                            Ca {idx + 1}: {shift.name || ""}{" "}
                            {shift.time && <span className="text-muted ms-2">({shift.time})</span>}
                          </h6>

                          {!isEditing && !readOnly ? (
                            <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => startEditShift(shift, idx)}>
                              Chỉnh sửa ca này
                            </button>
                          ) : isEditing && !readOnly ? (
                            <div className="d-flex gap-2">
                              <button type="button" className="btn btn-sm btn-secondary" onClick={cancelEditShift}>
                                Hủy
                              </button>
                              <button type="button" className="btn btn-sm btn-danger" onClick={assignScheduleForEditingShift}>
                                Xếp lịch
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {!isEditing && (
                          <div className="mb-2">
                            <div className="fw-semibold mb-1">Staff trực:</div>
                            {Array.isArray(shift.staff) && shift.staff.length > 0 ? (
                              <div className="d-flex flex-wrap gap-2">
                                {shift.staff.map((s, i) => (
                                  <button
                                    key={i}
                                    type="button"
                                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                    data-bs-toggle="modal"
                                    data-bs-target="#personDetailModal"
                                    onClick={() => openPersonModal(s, s.status)}
                                  >
                                    {s.name || `Staff #${s.staffId}`}
                                    <span className={statusBadgeClass(s.status)}>{s.status}</span>
                                  </button>
                                ))}
                              </div>
                            ) : (
                              <div className="text-muted">Chưa phân công staff.</div>
                            )}
                          </div>
                        )}

                        {isEditing && !readOnly && (
                          <>
                            <div className="mb-2">
                              <small className="text-muted">Chọn checkbox. Staff đã trực ca khác trong ngày sẽ bị khóa.</small>
                            </div>

                            <div className="border rounded-3 p-2" style={{ maxHeight: 260, overflowY: "auto" }}>
                              {staffList.map((s) => {
                                const alreadyInOther = otherStaffIds.includes(s.staffId);
                                return (
                                  <div className="form-check" key={s.staffId}>
                                    <input
                                      className="form-check-input"
                                      type="checkbox"
                                      id={`shift-${idx}-staff-${s.staffId}`}
                                      checked={editingStaffIds.includes(s.staffId)}
                                      disabled={alreadyInOther}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setEditingStaffIds((prev) => (prev.includes(s.staffId) ? prev : [...prev, s.staffId]));
                                        } else {
                                          setEditingStaffIds((prev) => prev.filter((x) => x !== s.staffId));
                                        }
                                      }}
                                    />
                                    <label className="form-check-label" htmlFor={`shift-${idx}-staff-${s.staffId}`}>
                                      {s.name} {alreadyInOther && <span className="text-danger ms-1">(đã trực ca khác)</span>}
                                    </label>
                                  </div>
                                );
                              })}
                              {staffList.length === 0 && <div className="text-muted">Chưa có staff từ API.</div>}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-muted">Không có dữ liệu sự kiện.</div>
              )}
            </div>

            <div className="modal-footer d-flex justify-content-between">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => {
                  setSelectedEvent(null);
                  cancelEditShift();
                }}
              >
                Đóng
              </button>

              {!readOnly && editingShiftIndex != null ? (
                <button type="button" className="btn btn-danger" onClick={assignScheduleForEditingShift}>
                  Xếp lịch
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* ================= STAFF MODAL THÔNG TIN STAFF ================= */}
      <div className="modal fade" id="personDetailModal" tabIndex="-1" aria-hidden="true" ref={personModalRef}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedPerson ? `Staff: ${selectedPerson.name || selectedPerson.staffId}` : "Thông tin staff"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setSelectedPerson(null)} />
            </div>
            <div className="modal-body">
              {selectedPerson ? (
                <>
                  <div className="d-flex align-items-center mb-3">
                    <div className="avatar-circle staff-avatar" style={{ width: 40, height: 40, fontSize: 16 }}>
                      {getPersonInitials(selectedPerson.name || "")}
                    </div>
                    <div className="ms-3">
                      <div className="fw-semibold">{selectedPerson.name || `Staff #${selectedPerson.staffId}`}</div>
                      <div className="text-muted">{selectedPerson.role || "Staff"}</div>
                    </div>
                  </div>

                  <p className="mb-1">
                    <strong>Ghi chú:</strong> {selectedPerson.notes || "—"}
                  </p>
                  <p className="mb-0">
                    <strong>Trạng thái:</strong>{" "}
                    <span className={statusBadgeClass(selectedPerson.status)}>{selectedPerson.status}</span>
                  </p>
                </>
              ) : (
                <div className="text-muted">Không có dữ liệu.</div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal" onClick={() => setSelectedPerson(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= TRAINER MODAL (read-only) ================= */}
      <div className="modal fade" id="trainerDayModal" tabIndex="-1" aria-hidden="true" ref={trainerModalRef}>
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Chi tiết lịch PT</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" onClick={() => setSelectedTrainerDay(null)} />
            </div>
            <div className="modal-body">
              {selectedTrainerDay ? (
                <>
                  <div className="mb-3 text-muted">
                    Ngày:{" "}
                    <strong>{toDDMMYYYY(new Date(selectedTrainerDay.rawDate || selectedTrainerDay.date || selectedTrainerDay.start))}</strong>
                  </div>

                  {(!selectedTrainerDay.shifts || selectedTrainerDay.shifts.length === 0) && (
                    <div className="alert alert-light border text-center mb-0">
                      Ngày này chưa có lịch PT được đặt.
                    </div>
                  )}

                  {(selectedTrainerDay.shifts || []).map((tr, idx) => {
                    const sessions = tr.sessions || [];
                    return (
                      <div key={idx} className="border rounded-3 p-3 mb-3" style={{ background: "#fafafa" }}>
                        <div className="d-flex justify-content-between align-items-center">
                          <h6 className="mb-0" style={{ color: "#0b5ed7", fontWeight: 800 }}>
                            {tr.name}
                          </h6>
                          <span className="badge bg-primary">{sessions.length} buổi</span>
                        </div>

                        <hr className="my-2" />

                        {sessions.length === 0 ? (
                          <div className="text-muted">Không có buổi nào.</div>
                        ) : (
                          <div className="d-grid" style={{ gap: 8 }}>
                            {sessions.map((ss) => (
                              <div
                                key={ss.sessionId}
                                className="p-2 rounded d-flex justify-content-between align-items-center"
                                style={{ background: "#fff", border: "1px solid #e5e7eb" }}
                              >
                                <div>
                                  <div className="fw-semibold">
                                    {ss.memberName}
                                    {ss.timeSlotName ? <span className="text-muted"> • {ss.timeSlotName}</span> : null}
                                  </div>
                                  <div className="text-muted" style={{ fontSize: 12 }}>
                                    {ss.time ? `⏰ ${ss.time}` : "⏰ —"}
                                  </div>
                                </div>
                                <div className="text-muted" style={{ fontSize: 12 }}>
                                  #{ss.sessionId}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </>
              ) : (
                <div className="text-muted">Không có dữ liệu.</div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal" onClick={() => setSelectedTrainerDay(null)}>
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= Template calendar (shared) ================= */}
      <script type="text/tmpl" id="tmpl" ref={tmplRef}>
        {`
  {{ 
  var date = date || new Date(),
      month = date.getMonth(), 
      year = date.getFullYear(), 
      first = new Date(year, month, 1), 
      last = new Date(year, month + 1, 0),
      startingDay = (first.getDay()+6)%7, 
      thedate = new Date(year, month, 1 - startingDay),
      dayclass = lastmonthcss,
      i, j; 
  }}
  <table class="calendar-table table table-sm">
    <thead>
      <tr>
        <td colSpan="7">
          <table style="width:100%; white-space:nowrap;">
            <tr>
              <td style="text-align:left; width:33%;">
                <button class="js-cal-prev nav-arrow" aria-label="Prev">&lt;</button>
              </td>
              <td style="text-align:center; width:34%;">
                <span class="btn-group btn-group-lg">
                  <button class="js-cal-years btn btn-link no-underline bold">{{: year }}</button>
                  <button class="js-cal-months btn btn-link no-underline bold">{{: months[month] }}</button>
                </span>
              </td>
              <td style="text-align:right; width:33%;">
                <button class="js-cal-next nav-arrow" aria-label="Next">&gt;</button>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </thead>

    <thead>
      <tr class="c-weeks">
        {{ for (i = 0; i < 7; i++) { }}
          <th class="c-name">{{: days[i] }}</th>
        {{ } }}
      </tr>
    </thead>

    <tbody>
      {{ for (j = 0; j < 6; j++) { }}
      <tr>
        {{ for (i = 0; i < 7; i++) { }}
        {{ if (thedate > last) { dayclass = nextmonthcss; } else if (thedate >= first) { dayclass = thismonthcss; } }}
        <td class="calendar-day {{: dayclass }} {{: thedate.toDateCssClass() }} js-cal-option" data-date="{{: thedate.toISOString() }}">
          <div class="date">{{: thedate.getDate() }}</div>
          {{ thedate.setDate(thedate.getDate() + 1);}}
        </td>
        {{ } }}
      </tr>
      {{ } }}
    </tbody>
  </table>
        `}
      </script>

      {/* ================= Calendars ================= */}
      {activeTab === "staff" ? (
        <div id="holder-staff" ref={holderStaffRef} className="row" />
      ) : (
        <div id="holder-trainer" ref={holderTrainerRef} className="row" />
      )}
    </div>
  );
}
