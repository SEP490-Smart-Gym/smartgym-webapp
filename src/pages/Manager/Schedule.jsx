import React, { useEffect, useRef, useState } from "react";
import api from "../../config/axios";

/** ===== Helpers thời gian & format ===== */
function parseTimeRange(timeStr) {
  if (!timeStr) return [0, 0, 0, 0];
  const [start, end] = timeStr.split("-");
  const [sh, sm] = start.split(":").map((v) => +v);
  const [eh, em] = end ? end.split(":").map((v) => +v) : [sh, sm];
  return [sh, sm, eh, em];
}

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Date -> yyyy-mm-dd */
function dateObjToISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** dd/mm/yyyy cho UI */
function toDDMMYYYY(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** Chuẩn hoá dữ liệu lịch -> events cho calendar 
 * allSchedule item dạng:
 * {
 *   date: "2025-12-10",
 *   title: "Lịch trực",
 *   status: "Scheduled" | "Off",
 *   scheduleId?: number,
 *   shifts: [
 *     {
 *       name: "Ca sáng",
 *       time: "05:00-13:00",
 *       timeSlotId: 17,
 *       staff: [{ staffId, status }]
 *     }
 *   ]
 * }
 */
function normalizeScheduleData(arr) {
  const today = startOfDay(new Date());
  const out = [];

  (arr || []).forEach((item) => {
    if (!item.date) return;
    const d = new Date(item.date);

    let start, end;
    if (Array.isArray(item.shifts) && item.shifts.length > 0) {
      let minH = 23,
        minM = 59,
        maxH = 0,
        maxM = 0;

      item.shifts.forEach((shift) => {
        if (!shift.time) return;
        const [sh, sm, eh, em] = parseTimeRange(shift.time);
        if (sh < minH || (sh === minH && sm < minM)) {
          minH = sh;
          minM = sm;
        }
        if (eh > maxH || (eh === maxH && em > maxM)) {
          maxH = eh;
          maxM = em;
        }
      });

      if (minH === 23 && maxH === 0) {
        start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
        end = null;
      } else {
        start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), minH, minM, 0, 0);
        end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), maxH, maxM, 0, 0);
      }
    } else {
      start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      end = null;
    }

    const dateOnly = startOfDay(d);

    let statusRaw = item.status || "Scheduled";
    // status Off là nghỉ, Scheduled là làm việc
    let status =
      statusRaw.toLowerCase() === "off"
        ? "Off"
        : "Scheduled";

    // nếu cần thêm logic quá khứ/tương lai thì chỉnh thêm ở đây
    if (dateOnly.getTime() > today.getTime()) {
      status = status; // hiện giữ nguyên
    }

    out.push({
      title: item.title || "Lịch trực",
      start,
      end,
      allDay: false,
      status,
      shifts: item.shifts || [],
      rawDate: item.date,
      scheduleId: item.scheduleId, // nếu có id từ BE
    });
  });

  out.sort((a, b) => +a.start - +b.start);
  return out;
}

/** load script jQuery */
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

/** Helpers UI */
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
  if (st === "off") return "badge bg-secondary"; // nghỉ
  if (st === "absent") return "badge bg-danger";
  if (st === "not yet") return "badge bg-secondary";
  return "badge bg-secondary";
}

/** PUT update lịch làm việc /staff-schedule/{id} */
async function updateScheduleStatus(scheduleId, status, notes = "") {
  if (!scheduleId) return false;
  try {
    await api.put(`/staff-schedule/${scheduleId}`, {
      status,
      notes,
    });
    return true;
  } catch (err) {
    console.error("PUT /staff-schedule/{id} failed:", err);
    return false;
  }
}

export default function ManageSchedule() {
  const holderRef = useRef(null);
  const tmplRef = useRef(null);
  const eventModalRef = useRef(null);
  const personModalRef = useRef(null);

  /** staff từ API */
  const [staffList, setStaffList] = useState([]);
  const staffListRef = useRef([]);

  /** allSchedule: [{ date, title, status, scheduleId?, shifts: [...] }] */
  const [allSchedule, setAllSchedule] = useState([]);
  const dataRef = useRef([]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedPerson, setSelectedPerson] = useState(null);

  const [editingShiftIndex, setEditingShiftIndex] = useState(null);
  const [editingStaffIds, setEditingStaffIds] = useState([]);

  // ngày quá khứ + hôm nay không được sửa
  const isPastOrToday = (() => {
    if (!selectedEvent) return false;
    const d = new Date(selectedEvent.date || selectedEvent.start);
    const today = new Date();
    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    return d.getTime() <= today.getTime();
  })();

  const handleCancelEvent = (event) => {
    if (!event) return;
    if (!window.confirm(`Bạn có chắc muốn xoá lịch trực ngày này?`)) return;

    const eventDate = event.start || event.date;
    const isoDate = dateObjToISO(eventDate);

    const newSchedule = allSchedule.filter((ev) => ev.date !== isoDate);
    setAllSchedule(newSchedule);
    dataRef.current = newSchedule;

    if (window.jQuery && holderRef.current) {
      window.jQuery(holderRef.current).calendar({
        data: normalizeScheduleData(dataRef.current),
      });
    }

    setSelectedEvent(null);
    try {
      const ModalClass = window.bootstrap && window.bootstrap.Modal;
      if (ModalClass && eventModalRef.current) {
        const inst =
          ModalClass.getInstance(eventModalRef.current) ||
          new ModalClass(eventModalRef.current);
        inst.hide();
      }
    } catch (e) {
      console.warn("Cannot close event modal:", e);
    }
  };

  /** mở modal info staff */
  const openPersonModal = (staff, status) => {
    if (!staff) return;
    setSelectedPerson({
      ...staff,
      status: status || "Scheduled",
    });
  };

  const startEditShift = (shift, index) => {
    setEditingShiftIndex(index);
    const staffIds = Array.isArray(shift.staff)
      ? shift.staff.map((s) => s.staffId)
      : [];
    setEditingStaffIds(staffIds);
  };

  const cancelEditShift = () => {
    setEditingShiftIndex(null);
    setEditingStaffIds([]);
  };

  const saveEditShift = async () => {
    if (selectedEvent == null || editingShiftIndex == null) return;

    const isoDate =
      selectedEvent.rawDate || dateObjToISO(selectedEvent.date || selectedEvent.start);

    const dayIndex = allSchedule.findIndex((d) => d.date === isoDate);
    const baseShifts =
      dayIndex >= 0
        ? allSchedule[dayIndex].shifts || []
        : selectedEvent.shifts || [];

    // chặn trùng staff giữa 2 ca
    const otherStaffIds = baseShifts
      .filter((_, idx) => idx !== editingShiftIndex)
      .flatMap((sh) => (sh.staff || []).map((s) => s.staffId));

    const duplicatedStaff = editingStaffIds.filter((id) =>
      otherStaffIds.includes(id)
    );
    if (duplicatedStaff.length) {
      alert(
        "❌ Một số nhân viên đã được phân ca khác trong ngày. Không thể cho trực 2 ca cùng ngày."
      );
      return;
    }

    const newShifts = baseShifts.map((sh, idx) => {
      if (idx !== editingShiftIndex) return sh;
      return {
        ...sh,
        staff: editingStaffIds.map((id) => ({
          staffId: id,
          status: "Scheduled",
        })),
      };
    });

    const newSchedule = [...allSchedule];
    if (dayIndex >= 0) {
      newSchedule[dayIndex] = {
        ...newSchedule[dayIndex],
        shifts: newShifts,
      };
    } else {
      newSchedule.push({
        date: isoDate,
        title: selectedEvent.title || "Lịch trực",
        status: "Scheduled",
        shifts: newShifts,
        scheduleId: selectedEvent.scheduleId, // nếu sau này có
      });
    }

    setAllSchedule(newSchedule);
    dataRef.current = newSchedule;

    setSelectedEvent((prev) =>
      prev
        ? {
            ...prev,
            shifts: newShifts,
            rawDate: isoDate,
            isNew: false,
          }
        : prev
    );

    if (window.jQuery && holderRef.current) {
      window.jQuery(holderRef.current).calendar({
        data: normalizeScheduleData(newSchedule),
      });
    }

    /** 👉 Gọi API assign cho ca đang chỉnh + update status (Scheduled / Off) */
    try {
      const shiftAssigned = newShifts[editingShiftIndex];
      let timeSlotId = shiftAssigned.timeSlotId;

      // set cứng timeSlotId: 17 = ca sáng, 18 = ca chiều
      if (!timeSlotId) {
        timeSlotId = editingShiftIndex === 0 ? 17 : 18;
      }

      const staffIds = editingStaffIds;
      const isOff = staffIds.length === 0;
      const newStatus = isOff ? "Off" : "Scheduled";

      console.log("POST /staff-schedule/assign payload = ", {
        scheduleDate: isoDate,
        timeSlotId,
        staffIds,
        status: "Scheduled",
        notes: "",
      });

      // chỉ assign nếu có nhân viên
      if (!isOff && timeSlotId && staffIds.length > 0) {
        await api.post("/staff-schedule/assign", {
          scheduleDate: isoDate,
          timeSlotId,
          staffIds,
          status: "Scheduled",
          notes: "",
        });
      }

      // Nếu có scheduleId (lấy từ BE), update trạng thái làm việc / nghỉ
      if (selectedEvent && selectedEvent.scheduleId) {
        await updateScheduleStatus(selectedEvent.scheduleId, newStatus, "");
      }
    } catch (err) {
      console.error("Error calling /staff-schedule/assign or PUT schedule:", err);
    }

    // ❗ Sau khi lưu: chỉ thoát chế độ edit, KHÔNG đóng modal
    cancelEditShift();
  };

  useEffect(() => {
    (async () => {
      await loadScript("https://code.jquery.com/jquery-3.6.4.min.js");

      let BootstrapBundle = null;
      try {
        BootstrapBundle = await import("bootstrap/dist/js/bootstrap.bundle.min.js");
      } catch (e) {
        console.error("Bootstrap JS not available", e);
      }

      const $ = window.jQuery;
      if (!$) return;

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
          return (
            "_" + this.getFullYear() + "_" + (this.getMonth() + 1) + "_" + this.getDate()
          );
        },
        toDateInt: function () {
          return (this.getFullYear() * 12 + this.getMonth()) * 32 + this.getDate();
        },
        toTimeString: function () {
          const h = this.getHours(),
            m = this.getMinutes();
          const hh = h > 12 ? h - 12 : h;
          const ampm = h >= 12 ? " CH" : " SA";
          if (h === 0 && m === 0) return "";
          return m > 0
            ? `${hh}:${String(m).padStart(2, "0")}${ampm}`
            : `${hh}${ampm}`;
        },
      });

      const tmplEl = tmplRef.current;
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
        const PopCtor =
          (window.bootstrap && window.bootstrap.Popover) ||
          (BootstrapBundle && BootstrapBundle.Popover);
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
      $(document).on("click", (e) => {
        if (
          !$(e.target).closest(
            ".popover, .js-cal-years, .js-cal-months, .event-chip"
          ).length
        )
          hideCurrent();
      });

      const getStaffByIdRef = (id) =>
        (staffListRef.current || []).find((s) => s.staffId === id) || null;

      function calendar($el, options) {
        $el
          .on("click", ".js-cal-prev", function () {
            if (options.mode === "year")
              options.date.setFullYear(options.date.getFullYear() - 1);
            else if (options.mode === "month")
              options.date.setMonth(options.date.getMonth() - 1);
            else if (options.mode === "week")
              options.date.setDate(options.date.getDate() - 7);
            else options.date.setDate(options.date.getDate() - 1);
            hideCurrent();
            draw();
          })
          .on("click", ".js-cal-next", function () {
            if (options.mode === "year")
              options.date.setFullYear(options.date.getFullYear() + 1);
            else if (options.mode === "month")
              options.date.setMonth(options.date.getMonth() + 1);
            else if (options.mode === "week")
              options.date.setDate(options.date.getDate() + 7);
            else options.date.setDate(options.date.getDate() + 1);
            hideCurrent();
            draw();
          })
          .on("click", ".js-cal-months", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const btn = this;
            let s = '<div class="list-group">';
            for (let m = 0; m < 12; m++) {
              const label = `${options.months[m]}`;
              s += `<button type="button" class="list-group-item list-group-item-action js-cal-option"
                         data-date="${new Date(
                           options.date.getFullYear(),
                           m,
                           1
                         ).toISOString()}"
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
          .on("click", ".js-cal-years", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const btn = this;
            const base = options.date.getFullYear();
            const start = base - 6,
              end = base + 6;
            let s = '<div class="list-group">';
            for (let y = start; y <= end; y++) {
              s += `<button type="button" class="list-group-item list-group-item-action js-cal-option"
                         data-date="${new Date(
                           y,
                           options.date.getMonth(),
                           1
                         ).toISOString()}"
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

        // js-cal-option cho month/year (không đụng ô ngày)
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

        // CLICK CHIP EVENT → mở modal detail
        $el.on("click", ".event-chip", function (e) {
          e.preventDefault();
          e.stopPropagation();
          const index = +this.getAttribute("data-index");
          if (!isNaN(index) && options.data[index]) {
            options.onOpenEvent && options.onOpenEvent(options.data[index]);
          }
          return false;
        });

        // CLICK NGÀY
        $el.on("click", ".calendar-day", function (e) {
          e.preventDefault();
          e.stopPropagation();
          const dateStr = this.getAttribute("data-date");
          if (!dateStr) return;
          const clickedDate = new Date(dateStr);
          const dayIso = dateObjToISO(clickedDate);

          const existingEvent = (options.data || []).find((ev) => {
            const evDateIso = dateObjToISO(ev.start || ev.date);
            return evDateIso === dayIso;
          });

          if (existingEvent) {
            options.onOpenEvent && options.onOpenEvent(existingEvent);
            return false;
          }

          // chặn ngày quá khứ + hôm nay
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const clickedNorm = new Date(clickedDate);
          clickedNorm.setHours(0, 0, 0, 0);
          if (clickedNorm.getTime() <= today.getTime()) {
            alert("Không thể thêm lịch cho ngày đã qua hoặc hôm nay.");
            return false;
          }

          const newEvent = {
            title: "Lịch trực",
            start: clickedDate,
            end: null,
            status: "Scheduled",
            shifts: [
              {
                name: "Ca sáng",
                time: "05:00-13:00",
                timeSlotId: 17,
                staff: [],
              },
              {
                name: "Ca chiều",
                time: "13:00-21:00",
                timeSlotId: 18,
                staff: [],
              },
            ],
            rawDate: dayIso,
            isNew: true,
            scheduleId: null,
          };
          options.onOpenEvent && options.onOpenEvent(newEvent);
          return false;
        });

        function monthAddEvent(index, event) {
          const e = new Date(event.start);
          const dayCell = $("." + e.toDateCssClass());
          if (!dayCell.length || dayCell.hasEvent) return;

          let staffIds = [];
          (event.shifts || []).forEach((shift) => {
            if (Array.isArray(shift.staff)) {
              staffIds.push(...shift.staff.map((s) => s.staffId));
            }
          });
          staffIds = [...new Set(staffIds)];
          const totalStaff = staffIds.length;

          const $chip = $(`
            <div class="event-chip" data-index="${index}" title="${event.title}">
              <div class="event-chip-avatars"></div>
              <div class="event-chip-title">${event.title}</div>
              <div class="event-chip-time">
                ${totalStaff} Staff
              </div>
            </div>
          `);

          const $avatarWrap = $chip.find(".event-chip-avatars");
          const maxShow = 4;

          staffIds.slice(0, maxShow).forEach((id) => {
            const staff = getStaffByIdRef(id);
            const name = staff?.name || "?";
            const initials = getPersonInitials(name);
            $avatarWrap.append(
              `<div class="avatar-circle staff-avatar">${initials}</div>`
            );
          });
          if (staffIds.length > maxShow) {
            const more = staffIds.length - maxShow;
            $avatarWrap.append(
              `<div class="avatar-circle more-avatar">+${more}</div>`
            );
          }

          dayCell.addClass("has-event").append($chip);
        }

        function yearAddEvents(events, year) {
          const counts = new Array(12).fill(0);
          $.each(events, (i, v) => {
            if (v.start.getFullYear() === year) counts[v.start.getMonth()]++;
          });
          $.each(counts, (i, v) => {
            if (v !== 0)
              $(".month-" + i).append(
                '<span class="badge bg-info ms-2">' + v + "</span>"
              );
          });
        }

        function draw() {
          $el.html(t(options));
          $("." + new Date().toDateCssClass()).addClass("today");
          if (options.data && options.data.length) {
            if (options.mode === "year")
              yearAddEvents(options.data, options.date.getFullYear());
            else if (options.mode === "month" || options.mode === "week")
              $.each(options.data, monthAddEvent);
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
          days: [
            "Thứ hai",
            "Thứ ba",
            "Thứ tư",
            "Thứ năm",
            "Thứ sáu",
            "Thứ bảy",
            "Chủ nhật",
          ],
          months: [
            "Tháng 1",
            "Tháng 2",
            "Tháng 3",
            "Tháng 4",
            "Tháng 5",
            "Tháng 6",
            "Tháng 7",
            "Tháng 8",
            "Tháng 9",
            "Tháng 10",
            "Tháng 11",
            "Tháng 12",
          ],
          shortMonths: [
            "Th1",
            "Th2",
            "Th3",
            "Th4",
            "Th5",
            "Th6",
            "Th7",
            "Th8",
            "Th9",
            "Th10",
            "Th11",
            "Th12",
          ],
          date: new Date(),
          daycss: ["", "", "", "", "", "c-saturday", "c-sunday"],
          thismonthcss: "current",
          lastmonthcss: "prev-month",
          nextmonthcss: "next-month",
          mode: "month",
          data: [],
          onOpenEvent: null,
        },
        window.jQuery,
        window,
        document
      );

      /** ===== Call API lấy staff list ===== */
      try {
        const res = await api.get("/staff-schedule/staffs");
        const staffsFromApi = res.data || [];
        setStaffList(staffsFromApi);
        staffListRef.current = staffsFromApi;
      } catch (e) {
        console.error("Failed to load staff list:", e);
      }

      // hiện tại chưa GET schedule từ BE → allSchedule = []
      dataRef.current = [];
      const normalized = normalizeScheduleData(dataRef.current);

      window.jQuery(holderRef.current).calendar({
        data: normalized,
        onOpenEvent: (ev) => {
          setEditingShiftIndex(null);
          setEditingStaffIds([]);

          setSelectedEvent({
            title: ev.title,
            date: ev.start,
            start: ev.start,
            end: ev.end,
            status: ev.status || "Scheduled",
            shifts: ev.shifts || [],
            rawDate: ev.rawDate,
            isNew: ev.isNew || false,
            scheduleId: ev.scheduleId, // nếu có từ BE
          });
          try {
            const ModalClass =
              (window.bootstrap && window.bootstrap.Modal) ||
              (BootstrapBundle && BootstrapBundle.Modal);
            if (ModalClass) {
              const inst = ModalClass.getOrCreateInstance(
                document.getElementById("eventDetailModal")
              );
              inst.show();
            }
          } catch (e) {
            console.warn("Cannot open event modal:", e);
          }
        },
      });
    })();
  }, []);

  return (
    <div className="container mt-5 mb-5">
      <style>{`
/* ===== NAV & TITLES ===== */
.nav-arrow{
  font-weight:800;
  font-size:22px;
  line-height:1;
  padding:2px 10px;
  border:none;
  background:transparent;
  cursor:pointer;
}
.nav-arrow:focus{ outline:none; }

.btn-link.no-underline{ text-decoration:none !important; }
.btn-link.bold{ font-weight:700 !important; }

/* ===== CALENDAR TABLE ===== */
.calendar-table{ width:100%; table-layout:fixed; border-collapse:separate; border-spacing:0; }
.calendar-table th, .calendar-table td{ vertical-align:top; }
.calendar-table thead .c-weeks th, .calendar-table tbody td.calendar-day{ width:14.285714%; }

/* ===== DAY CELL ===== */
.calendar-day{
  position:relative; padding:8px; min-height:120px; background:#fff; border:1px solid #e5e7eb;
  overflow:hidden; word-wrap:break-word; transition:background-color .15s ease, border-color .15s ease;
}
.calendar-day .date{ font-weight:600; margin-bottom:6px; }
.current{ background:#fff; }
.prev-month, .next-month{ background:#f4f5f7 !important; color:#9aa0a6; opacity:.9; }
.prev-month .date, .next-month .date{ color:#9aa0a6; font-weight:600; }

/* ===== TODAY ===== */
.calendar-day.today{ background:#fff7cc !important; border:1px solid #ffd24d !important; box-shadow:inset 0 0 0 2px #ffe58a; }
.calendar-day.today .date{ font-weight:800; color:#b45309; }

/* ===== HAS EVENT ===== */
.calendar-day.has-event{ background:#fff3f5 !important; border:1px solid #ffc7d2 !important; }
.calendar-day.has-event .date{ font-weight:700; color:#c80036; }
.calendar-day.has-event.today{ background:#ffe9a8 !important; border-color:#ffcc66 !important; }

/* ===== EVENT CHIP ===== */
.event-chip{
  margin-top:6px; padding:6px 8px; border-radius:10px; background:#ffdbe3; border:1px dashed #ff9eb2;
  cursor:pointer; font-size:12px; line-height:1.25; display:grid; gap:3px; max-width:100%;
}
.event-chip-avatars{
  display:flex; gap:4px; flex-wrap:wrap; margin-bottom:2px;
}
.avatar-circle{
  width:22px; height:22px; border-radius:50%; display:flex; align-items:center; justify-content:center;
  font-size:11px; font-weight:600; color:#fff;
}
.staff-avatar{ background:#1f3bb6; }
.more-avatar{ background:#6b7280; }

.event-chip-title{ font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.event-chip-time{ opacity:.9; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

/* ===== YEAR VIEW ===== */
.calendar-table td.calendar-month{
  width:25%; padding:12px; cursor:pointer; border:1px solid #e5e7eb; background:#fff;
  transition:background-color .15s ease, border-color .15s ease;
}
.calendar-table td.calendar-month:hover{ background:#fafafa; }
.calendar-table td.calendar-month .badge{ margin-left:.5rem; vertical-align:middle; }

/* ===== POPOVER ===== */
.popover{ z-index:1080; max-width:320px; }
.popover .list-group-item{ text-align:left; }

/* ===== RESPONSIVE ===== */
@media (max-width: 576px){
  .calendar-day{ min-height:100px; padding:6px; }
  .event-chip{ font-size:11px; }
  .event-chip-time{ font-size:10px; }
  .nav-arrow{ font-size:20px; padding:2px 8px; }
}
      `}</style>

      {/* TIÊU ĐỀ CĂN GIỮA */}
      <div className="mb-3 text-center">
        <h1 style={{ margin: 0, color: "#c80036", fontWeight: "bold" }}>
          Quản lý lịch trực Staff
        </h1>
      </div>

      {/* MODAL CHI TIẾT LỊCH */}
      <div
        className="modal fade"
        id="eventDetailModal"
        tabIndex="-1"
        aria-hidden="true"
        ref={eventModalRef}
      >
        <div className="modal-dialog modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedEvent?.title || "Chi tiết lịch trực"}
              </h5>
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
                    <strong>{toDDMMYYYY(selectedEvent.date || selectedEvent.start)}</strong>
                  </div>

                  {(selectedEvent.shifts || []).map((shift, idx) => {
                    const isEditing = editingShiftIndex === idx;

                    const allShiftsForDay = selectedEvent.shifts || [];
                    const otherStaffIds = allShiftsForDay
                      .filter((_, i) => i !== idx)
                      .flatMap((sh) => (sh.staff || []).map((s) => s.staffId));

                    return (
                      <div
                        key={idx}
                        className="border rounded-3 p-3 mb-3"
                        style={{ background: "#fafafa" }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="mb-0">
                            Ca {idx + 1}: {shift.name || ""}{" "}
                            {shift.time && (
                              <span className="text-muted ms-2">
                                ({shift.time})
                              </span>
                            )}
                          </h6>

                          {!isEditing && !isPastOrToday ? (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => startEditShift(shift, idx)}
                            >
                              Chỉnh sửa ca này
                            </button>
                          ) : isEditing && !isPastOrToday ? (
                            <div className="d-flex gap-2">
                              <button
                                type="button"
                                className="btn btn-sm btn-secondary"
                                onClick={cancelEditShift}
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-success"
                                onClick={saveEditShift}
                              >
                                Lưu ca này
                              </button>
                            </div>
                          ) : null}
                        </div>

                        {/* VIEW MODE */}
                        {!isEditing && (
                          <>
                            <div className="mb-2">
                              <div className="fw-semibold mb-1">
                                Staff trực:
                              </div>
                              {Array.isArray(shift.staff) &&
                              shift.staff.length > 0 ? (
                                <div className="d-flex flex-wrap gap-2">
                                  {shift.staff.map((s, i) => {
                                    const staff = staffList.find(
                                      (st) => st.staffId === s.staffId
                                    );
                                    if (!staff) return null;
                                    return (
                                      <button
                                        key={i}
                                        type="button"
                                        className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
                                        data-bs-toggle="modal"
                                        data-bs-target="#personDetailModal"
                                        onClick={() =>
                                          openPersonModal(staff, s.status)
                                        }
                                      >
                                        {staff.name}
                                        <span
                                          className={statusBadgeClass(
                                            s.status
                                          )}
                                        >
                                          {s.status}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-muted">
                                  Chưa phân công staff.
                                </div>
                              )}
                            </div>
                          </>
                        )}

                        {/* EDIT MODE – chỉ cho ngày tương lai */}
                        {isEditing && !isPastOrToday && (
                          <>
                            <div className="mb-2">
                              <small className="text-muted">
                                Chọn bằng checkbox, mỗi ca có thể nhiều staff.  
                                Staff đã trực ca khác trong ngày sẽ bị khóa.
                              </small>
                            </div>
                            <div className="row g-3">
                              <div className="col-12">
                                <label className="form-label">
                                  Chọn Staff
                                </label>
                                <div
                                  className="border rounded-3 p-2"
                                  style={{ maxHeight: 260, overflowY: "auto" }}
                                >
                                  {staffList.map((s) => {
                                    const alreadyInOther = otherStaffIds.includes(
                                      s.staffId
                                    );
                                    return (
                                      <div
                                        className="form-check"
                                        key={s.staffId}
                                      >
                                        <input
                                          className="form-check-input"
                                          type="checkbox"
                                          id={`shift-${idx}-staff-${s.staffId}`}
                                          checked={editingStaffIds.includes(
                                            s.staffId
                                          )}
                                          disabled={alreadyInOther}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setEditingStaffIds((prev) =>
                                                prev.includes(s.staffId)
                                                  ? prev
                                                  : [...prev, s.staffId]
                                              );
                                            } else {
                                              setEditingStaffIds((prev) =>
                                                prev.filter(
                                                  (x) => x !== s.staffId
                                                )
                                              );
                                            }
                                          }}
                                        />
                                        <label
                                          className="form-check-label"
                                          htmlFor={`shift-${idx}-staff-${s.staffId}`}
                                        >
                                          {s.name}{" "}
                                          {alreadyInOther && (
                                            <span className="text-danger ms-1">
                                              (đã trực ca khác)
                                            </span>
                                          )}
                                        </label>
                                      </div>
                                    );
                                  })}
                                  {staffList.length === 0 && (
                                    <div className="text-muted">
                                      Chưa có staff từ API.
                                    </div>
                                  )}
                                </div>
                              </div>
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
            <div className="modal-footer">
              {selectedEvent &&
                new Date(selectedEvent.start || selectedEvent.date) >
                  new Date() && (
                  <button
                    type="button"
                    className="btn btn-danger me-auto"
                    onClick={() => handleCancelEvent(selectedEvent)}
                  >
                    Xoá lịch trực ngày này
                  </button>
                )}

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
            </div>
          </div>
        </div>
      </div>

      {/* MODAL THÔNG TIN STAFF */}
      <div
        className="modal fade"
        id="personDetailModal"
        tabIndex="-1"
        aria-hidden="true"
        ref={personModalRef}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedPerson
                  ? `Staff: ${selectedPerson.name}`
                  : "Thông tin staff"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setSelectedPerson(null);
                  try {
                    const ModalClass =
                      window.bootstrap && window.bootstrap.Modal;
                    if (ModalClass && eventModalRef.current) {
                      const inst =
                        ModalClass.getInstance(eventModalRef.current) ||
                        new ModalClass(eventModalRef.current);
                      inst.show();
                    }
                  } catch (e) {
                    console.warn("Cannot re-open event modal:", e);
                  }
                }}
              />
            </div>
            <div className="modal-body">
              {selectedPerson ? (
                <>
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="avatar-circle staff-avatar"
                      style={{ width: 40, height: 40, fontSize: 16 }}
                    >
                      {getPersonInitials(selectedPerson.name)}
                    </div>
                    <div className="ms-3">
                      <div className="fw-semibold">{selectedPerson.name}</div>
                      <div className="text-muted">
                        {selectedPerson.role || "Staff"}
                      </div>
                    </div>
                  </div>
                  <p className="mb-1">
                    <strong>Điện thoại:</strong>{" "}
                    {selectedPerson.phoneNumber || "—"}
                  </p>
                  <p className="mb-1">
                    <strong>Email:</strong> {selectedPerson.email || "—"}
                  </p>
                  <p className="mb-0">
                    <strong>Trạng thái:</strong>{" "}
                    <span
                      className={statusBadgeClass(
                        selectedPerson.status
                      )}
                    >
                      {selectedPerson.status}
                    </span>
                  </p>
                </>
              ) : (
                <div className="text-muted">Không có dữ liệu.</div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => {
                  setSelectedPerson(null);
                  try {
                    const ModalClass =
                      window.bootstrap && window.bootstrap.Modal;
                    if (ModalClass && eventModalRef.current) {
                      const inst =
                        ModalClass.getInstance(eventModalRef.current) ||
                        new ModalClass(eventModalRef.current);
                      inst.show();
                    }
                  } catch (e) {
                    console.warn("Cannot re-open event modal:", e);
                  }
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Template calendar */}
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
      today = new Date(),
      i, j; 
  if (mode === 'week') {
    thedate = new Date(date);
    thedate.setDate(date.getDate() - ((date.getDay()+6)%7));
    first = new Date(thedate);
    last = new Date(thedate);
    last.setDate(thedate.getDate()+6);
  } else if (mode === 'day') {
    thedate = new Date(date);
    first = new Date(thedate);
    last = new Date(thedate);
    last.setDate(thedate.getDate() + 1);
  }
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

    {{ if (mode ==='year') { month = 0; }}
    <tbody>
      {{ for (j = 0; j < 3; j++) { }}
      <tr>
        {{ for (i = 0; i < 4; i++) { }}
        <td class="calendar-month month-{{:month}} js-cal-option" data-date="{{: new Date(year, month, 1).toISOString() }}" data-mode="month">
          {{: months[month] }}
          {{ month++;}}
        </td>
        {{ } }}
      </tr>
      {{ } }}
    </tbody>
    {{ } }}

    {{ if (mode ==='month' || mode ==='week') { }}
    <thead>
      <tr class="c-weeks">
        {{ for (i = 0; i < 7; i++) { }}
          <th class="c-name">{{: days[i] }}</th>
        {{ } }}
      </tr>
    </thead>
    <tbody>
      {{ for (j = 0; j < 6 && (j < 1 || mode === 'month'); j++) { }}
      <tr>
        {{ for (i = 0; i < 7; i++) { }}
        {{ if (thedate > last) { dayclass = nextmonthcss; } else if (thedate >= first) { dayclass = thismonthcss; } }}
        <td class="calendar-day {{: dayclass }} {{: thedate.toDateCssClass() }} {{: date.toDateCssClass() === thedate.toDateCssClass() ? 'selected':'' }} {{: daycss[i] }} js-cal-option" data-date="{{: thedate.toISOString() }}">
          <div class="date">{{: thedate.getDate() }}</div>
          {{ thedate.setDate(thedate.getDate() + 1);}}
        </td>
        {{ } }}
      </tr>
      {{ } }}
    </tbody>
    {{ } }}

    {{ if (mode ==='day') { }}
    <tbody>
      <tr>
        <td colSpan="7">
          <table class="table table-striped table-sm">
            <thead>
              <tr>
                <th> </th>
                <th style="text-align:center; width: 100%">{{: days[(date.getDay()+6)%7] }}</th>
              </tr>
            </thead>
            <tbody>
              <tr><th class="timetitle">Cả ngày</th><td class="{{: date.toDateCssClass() }}"></td></tr>
              <tr><th class="timetitle">Trước 6 giờ sáng</th><td class="time-0-0"></td></tr>
              {{ for (i = 6; i < 22; i++) { }}
              <tr><th class="timetitle">{{: i <= 12 ? i : i - 12 }} {{: i < 12 ? "SA" : "CH"}}</th><td class="time-{{: i}}-0"></td></tr>
              <tr><th class="timetitle">{{: i <= 12 ? i : i - 12 }}:30 {{: i < 12 ? "SA" : "CH"}}</th><td class="time-{{: i}}-30"></td></tr>
              {{ } }}
              <tr><th class="timetitle">Sau 10 giờ tối</th><td class="time-22-0"></td></tr>
            </tbody>
          </table>
        </td>
      </tr>
    </tbody>
    {{ } }}
  </table>
        `}
      </script>

      <div id="holder" ref={holderRef} className="row" />
    </div>
  );
}
