import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const mockData = [
  { date: "2025-11-05", time: "09:00-10:00", title: "Standup meeting", status: "not yet" },
  { date: "2025-11-12", time: "14:00-15:30", title: "Code review" },
  { date: "2025-11-20", time: "08:00-09:00", title: "Training session", status: "not yet" },
  { date: "2025-11-25", time: "19:00-20:00", title: "Sprint retro" },
  { date: "2025-10-28", time: "10:00-11:00", title: "Past Sync", status: "present" },
  { date: "2025-10-29", time: "15:00-16:00", title: "Missed Call", status: "absent" },
];

/** 👉 Thay mảng này bằng mockdata trainer ở trang home của bạn */
const trainersMock = [
  { id: "t1", name: "Anna Nguyen" },
  { id: "t2", name: "Duc Tran" },
  { id: "t3", name: "Hoang Le" },
  { id: "t4", name: "Mika Pham" },
];

function parseTimeRange(timeStr) {
  if (!timeStr) return [0, 0, 0, 0];
  const [start, end] = timeStr.split("-");
  const [sh, sm] = start.split(":").map((v) => +v);
  const [eh, em] = end ? end.split(":").map((v) => +v) : [sh, sm];
  return [sh, sm, eh, em];
}
function startOfDay(d) { const x = new Date(d); x.setHours(0,0,0,0); return x; }

function normalizeMockData(arr) {
  const today = startOfDay(new Date());
  const seen = new Set();
  const out = [];
  for (const it of arr) {
    const d = new Date(it.date);
    const k = `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
    if (seen.has(k)) continue; // mỗi ngày 1 event theo thiết kế gốc
    seen.add(k);
    const [sh, sm, eh, em] = parseTimeRange(it.time);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm, 0, 0);
    const end = eh || em ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em, 0, 0) : null;
    const dateOnly = startOfDay(d);
    const status = dateOnly.getTime() > today.getTime() ? "not yet" : (it.status || "present");
    out.push({
      title: it.title,
      start, end, allDay:false, status,
      text: `<div><strong>${it.title}</strong><br/>${it.time||""}<br/><em>Status: ${status}</em></div>`
    });
  }
  out.sort((a,b)=>+a.start-+b.start);
  return out;
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

/** Tạo danh sách slot mỗi tiếng từ 05:00 đến 21:00 (16 slot) */
function buildTimeSlots() {
  const slots = [];
  for (let h = 5; h < 21; h++) {
    const start = `${String(h).padStart(2,"0")}:00`;
    const end = `${String(h+1).padStart(2,"0")}:00`;
    slots.push({ id: `${start}-${end}`, label: `${start} - ${end}`, start, end });
  }
  return slots;
}

/** dd/MM/yyyy hôm nay */
function formatTodayVN() {
  const d = new Date();
  return toDDMMYYYY(d);
}
function toDDMMYYYY(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2,"0");
  const mm = String(date.getMonth()+1).padStart(2,"0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}
/** dd/MM/yyyy -> Date (strict) */
function toDateFromDDMMYYYY(vn) {
  if (!vn) return null;
  const m = vn.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1],10), mm = parseInt(m[2],10), yyyy = parseInt(m[3],10);
  const iso = `${yyyy}-${String(mm).padStart(2,"0")}-${String(dd).padStart(2,"0")}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() !== yyyy || (d.getMonth()+1) !== mm || d.getDate() !== dd) return null;
  return d;
}
/** dd/mm/yyyy -> yyyy-mm-dd (cho normalize) */
function parseVNDateToISO(vn) {
  const d = toDateFromDDMMYYYY(vn);
  if (!d) return null;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  return `${yyyy}-${mm}-${dd}`;
}

export default function Calendar() {
  const holderRef = useRef(null);
  const tmplRef = useRef(null);

  const dataRef = useRef([...mockData]);
  const modalRef = useRef(null);

  // Date state cho DatePicker
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [vnDate, setVnDate] = useState(formatTodayVN());

  // Slot state: toàn bộ slot + slot bị disable + slot đang chọn
  const allSlots = buildTimeSlots();
  const [disabledSlots, setDisabledSlots] = useState(new Set());
  const [selectedSlotId, setSelectedSlotId] = useState("");

  // Tính các slot bị disable theo ngày chọn (slot < now+24h)
  function computeDisabledSlots(dateObj) {
    const now = new Date();
    const disabled = new Set();
    if (!dateObj) return disabled;

    for (const s of allSlots) {
      const [h, m] = s.start.split(":").map(Number);
      const slotDateTime = new Date(dateObj);
      slotDateTime.setHours(h, m, 0, 0);
      const diffHours = (slotDateTime - now) / (1000 * 60 * 60);
      if (diffHours < 24) disabled.add(s.id);
    }
    return disabled;
  }

  // Khởi tạo & cập nhật disabledSlots khi đổi ngày; auto chọn slot hợp lệ đầu tiên
  useEffect(() => {
    const ds = computeDisabledSlots(selectedDate);
    setDisabledSlots(ds);
    const firstValid = allSlots.find(s => !ds.has(s.id));
    setSelectedSlotId(firstValid ? firstValid.id : "");
  }, [selectedDate]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    (async () => {
      await loadScript("https://code.jquery.com/jquery-3.6.4.min.js");

      let PopoverClass =
        (window.bootstrap && window.bootstrap.Popover) || null;
      if (!PopoverClass) {
        try {
          const mod = await import("bootstrap/dist/js/bootstrap.bundle.min.js");
          PopoverClass = (window.bootstrap && window.bootstrap.Popover) || mod.Popover;
        } catch (e) {
          console.error("Bootstrap JS not available", e);
          return;
        }
      }

      const $ = window.jQuery;
      if (!$) return;

      // quicktmpl
      $.extend({
        quicktmpl: function (template) {
          return new Function(
            "obj",
            "var p=[],print=function(){p.push.apply(p,arguments);};with(obj){p.push('" +
              template
                .replace(/[\r\t\n]/g, " ")
                .split('{{').join('\t')
                .replace(/((^|\}\})[^\t]*)'/g, "$1\r")
                .replace(/\t:(.*?)\}\}/g, "',$1,'")
                .split('}}').join("p.push('")
                .split('\t').join("');")
                .split('\r').join("\\'") +
              "');}return p.join('');"
          );
        },
      });

      // Date helpers
      $.extend(Date.prototype, {
        toDateCssClass: function () { return "_" + this.getFullYear() + "_" + (this.getMonth()+1) + "_" + this.getDate(); },
        toDateInt: function () { return (this.getFullYear()*12 + this.getMonth())*32 + this.getDate(); },
        toTimeString: function () {
          const h=this.getHours(), m=this.getMinutes();
          const hh = h>12? h-12 : h; const ampm = h>=12? " CH":" SA";
          if (h===0 && m===0) return "";
          return m>0? `${hh}:${String(m).padStart(2,"0")}${ampm}` : `${hh}${ampm}`;
        },
      });

      const tmplEl = tmplRef.current;
      const t = $.quicktmpl(tmplEl ? tmplEl.innerHTML : "");

      // Popover helpers (BS5)
      let currentPopover = null;
      const POPOVER_OPTS = {
        html: true,
        container: "body",
        placement: "auto",
        trigger: "manual",
        sanitize: false
      };
      function getOrCreatePopover(elem, opts) {
        let instance = (window.bootstrap?.Popover?.getInstance?.(elem)) || null;
        if (!instance) instance = new (window.bootstrap?.Popover || PopoverClass)(elem, { ...POPOVER_OPTS, ...opts });
        return instance;
      }
      function hideCurrent() {
        if (currentPopover) { try { currentPopover.hide(); } catch {} currentPopover = null; }
      }
      $(document).on("click", (e) => {
        if (!$(e.target).closest(".popover, .js-cal-years, .js-cal-months, .event").length) hideCurrent();
      });

      function calendar($el, options) {
        $el
          .on("click", ".js-cal-prev", function () {
            if (options.mode === "year") options.date.setFullYear(options.date.getFullYear() - 1);
            else if (options.mode === "month") options.date.setMonth(options.date.getMonth() - 1);
            else if (options.mode === "week") options.date.setDate(options.date.getDate() - 7);
            else options.date.setDate(options.date.getDate() - 1);
            hideCurrent(); draw();
          })
          .on("click", ".js-cal-next", function () {
            if (options.mode === "year") options.date.setFullYear(options.date.getFullYear() + 1);
            else if (options.mode === "month") options.date.setMonth(options.date.getMonth() + 1);
            else if (options.mode === "week") options.date.setDate(options.date.getDate() + 7);
            else options.date.setDate(options.date.getDate() + 1);
            hideCurrent(); draw();
          })
          .on("click", ".js-cal-months", function (e) {
            e.preventDefault(); e.stopPropagation();
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
            if (currentPopover && currentPopover === pop) { pop.hide(); currentPopover=null; return false; }
            hideCurrent(); pop.show(); currentPopover = pop; return false;
          })
          .on("click", ".js-cal-years", function (e) {
            e.preventDefault(); e.stopPropagation();
            const btn = this;
            const base = options.date.getFullYear();
            const start = base - 6, end = base + 6;
            let s = '<div class="list-group">';
            for (let y = start; y <= end; y++) {
              s += `<button type="button" class="list-group-item list-group-item-action js-cal-option"
                         data-date="${new Date(y, options.date.getMonth(), 1).toISOString()}"
                         data-mode="month">${y}</button>`;
            }
            s += "</div>";
            const pop = getOrCreatePopover(btn, { content: s });
            if (currentPopover && currentPopover === pop) { pop.hide(); currentPopover=null; return false; }
            hideCurrent(); pop.show(); currentPopover = pop; return false;
          });

        $(document).off("click.calOpt").on("click.calOpt", ".js-cal-option", function () {
          const $t = $(this);
          const o = $t.data();
          if (o.date) o.date = new Date(o.date);
          $.extend(options, o);
          hideCurrent();
          $(".popover").remove();
          draw();
        });

        $el.on("click", ".event", function (e) {
          e.preventDefault(); e.stopPropagation();
          const card = this;
          const index = +card.getAttribute("data-index");
          if (isNaN(index)) return true;
          const data = options.data[index];
          let time = data.start.toTimeString();
          if (time && data.end) time = time + " - " + data.end.toTimeString();
          const content = `<p><strong>${time}</strong></p>${data.text || data.title}`;
          const pop = getOrCreatePopover(card, { content });
          if (currentPopover && currentPopover === pop) { pop.hide(); currentPopover=null; return false; }
          hideCurrent(); pop.show(); currentPopover = pop; return false;
        });

        function monthAddEvent(index, event) {
          const e = new Date(event.start);
          const dayCell = $("." + e.toDateCssClass());
          if (!dayCell.length || dayCell.hasClass("has-event")) return;
          const time = event.start.toTimeString();
          const status = (event.status || "").toLowerCase();
          const $chip = $(`
            <div class="event-chip status-${status}" data-index="${index}" title="${event.title}">
              <div class="event-chip-title">${event.title}</div>
              <div class="event-chip-time">${time}${event.end ? " - " + event.end.toTimeString() : ""}</div>
              <div class="event-chip-badge">${status}</div>
            </div>
          `);
          dayCell.addClass("has-event").append($chip);
        }

        function yearAddEvents(events, year) {
          const counts = new Array(12).fill(0);
          $.each(events, (i, v) => { if (v.start.getFullYear() === year) counts[v.start.getMonth()]++; });
          $.each(counts, (i, v) => { if (v !== 0) $(".month-" + i).append('<span class="badge bg-info ms-2">'+v+"</span>"); });
        }

        function draw() {
          $el.html(t(options));
          $("." + new Date().toDateCssClass()).addClass("today");
          if (options.data && options.data.length) {
            if (options.mode === "year") yearAddEvents(options.data, options.date.getFullYear());
            else if (options.mode === "month" || options.mode === "week") $.each(options.data, monthAddEvent);
          }
        }
        draw();
      }

      (function (defaults, $, window, document) {
        $.extend({
          calendar: function (options) { return $.extend(defaults, options); },
        }).fn.extend({
          calendar: function (options) {
            options = $.extend({}, defaults, options);
            return $(this).each(function () { calendar($(this), options); });
          },
        });
      })(
        {
          days: ["Thứ hai","Thứ ba","Thứ tư","Thứ năm","Thứ sáu","Thứ bảy","Chủ nhật"],
          months: ["Tháng 1","Tháng 2","Tháng 3","Tháng 4","Tháng 5","Tháng 6","Tháng 7","Tháng 8","Tháng 9","Tháng 10","Tháng 11","Tháng 12"],
          shortMonths: ["Th1","Th2","Th3","Th4","Th5","Th6","Th7","Th8","Th9","Th10","Th11","Th12"],
          date: new Date(),
          daycss: ["","","","","","c-saturday","c-sunday"],
          thismonthcss: "current",
          lastmonthcss: "prev-month",
          nextmonthcss: "next-month",
          mode: "month",
          data: [],
        },
        window.jQuery,
        window,
        document
      );

      const normalized = normalizeMockData(dataRef.current);
      window.jQuery(holderRef.current).calendar({ data: normalized });
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

/* ===== BOOKING BUTTON ===== */
.btn-booking{
  background:#c80036;
  border-color:#c80036;
  font-weight:700;
}
.btn-booking:hover,
.btn-booking:focus{
  filter:brightness(0.92);
  background:#b10030;
  border-color:#b10030;
}

/* ===== CALENDAR TABLE ===== */
.calendar-table{ width:100%; table-layout:fixed; border-collapse:separate; border-spacing:0; }
.calendar-table th, .calendar-table td{ vertical-align:top; }
.calendar-table thead .c-weeks th, .calendar-table tbody td.calendar-day{ width:14.285714%; }

/* ===== DAY CELL ===== */
.calendar-day{
  position:relative; padding:8px; min-height:110px; background:#fff; border:1px solid #e5e7eb;
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
  cursor:pointer; font-size:12px; line-height:1.25; display:grid; gap:2px; max-width:100%;
}
.event-chip-title{ font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.event-chip-time{ opacity:.9; font-size:11px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.event-chip-badge{
  display:inline-block; margin-top:2px; padding:2px 6px; border-radius:999px; font-size:10px; font-weight:700;
  text-transform:uppercase; letter-spacing:.3px;
}

/* ===== STATUS COLORS ===== */
.event-chip.status-present{ background:#e6ffed; border-color:#9ae6b4; }
.event-chip.status-present .event-chip-badge{ background:#34d399; color:#053321; }

.event-chip.status-absent{ background:#ffe6e6; border-color:#ffb3b3; }
.event-chip.status-absent .event-chip-badge{ background:#f87171; color:#4a0a0a; }

.event-chip.status-not\\ yet, .event-chip.status-not-yet{ background:#f1f5f9; border-color:#cbd5e1; }
.event-chip.status-not\\ yet .event-chip-badge, .event-chip.status-not-yet .event-chip-badge{ background:#94a3b8; color:#0f172a; }

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
  .calendar-day{ min-height:90px; padding:6px; }
  .event-chip{ font-size:11px; }
  .event-chip-time{ font-size:10px; }
  .nav-arrow{ font-size:20px; padding:2px 8px; }
}
      `}</style>

      {/* TIÊU ĐỀ + NÚT BOOKING */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 style={{ margin: 0, color: "#c80036", fontWeight: "bold" }}>Lịch</h1>
        <button
          type="button"
          className="btn btn-booking"
          data-bs-toggle="modal"
          data-bs-target="#bookingModal"
          aria-label="Booking"
        >
          Booking
        </button>
      </div>

      {/* MODAL: CHỌN TRAINER + TIMESLOT + DATE (react-datepicker dd/MM/yyyy) */}
      <div className="modal fade" id="bookingModal" tabIndex="-1" aria-hidden="true" ref={modalRef}>
        <div className="modal-dialog">
          <form
            className="modal-content"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const vnDateFromForm = (fd.get("date_vn") || "").toString().trim();
              const isoDate = parseVNDateToISO(vnDateFromForm);
              if (!isoDate) {
                alert("❌ Ngày không hợp lệ. Vui lòng chọn theo định dạng dd/mm/yyyy.");
                return;
              }

              const trainerId = fd.get("trainer");
              const trainerName = trainersMock.find(t => t.id === trainerId)?.name || "Trainer";

              // dùng selectedSlotId để tránh chọn option bị disable
              const slot = selectedSlotId; // e.g. "05:00-06:00"
              if (!slot || disabledSlots.has(slot)) {
                alert("❌ Khung giờ không hợp lệ. Vui lòng chọn khung giờ khác (≥ 24h).");
                return;
              }
              const [start, end] = slot.split("-");

              // === 🕒 Kiểm tra: phải đặt trước ít nhất 24h ===
              const [sh, sm] = start.split(":").map(Number);
              const bookingDateTime = new Date(`${isoDate}T${String(sh).padStart(2,"0")}:${String(sm).padStart(2,"0")}:00`);
              const now = new Date();
              const diffHours = (bookingDateTime - now) / (1000 * 60 * 60);
              if (diffHours < 24) {
                alert("⚠️ Bạn chỉ có thể đặt lịch ít nhất 24 tiếng trước giờ bắt đầu.");
                return;
              }

              // === 🔍 Kiểm tra trùng lịch (cùng ngày + time + trainer) ===
              const conflict = dataRef.current.find(
                ev => ev.date === isoDate && ev.time === `${start}-${end}` && ev.title.includes(trainerName)
              );
              if (conflict) {
                alert("❌ Lịch này đã tồn tại cho trainer đã chọn trong khung giờ đó.");
                return;
              }

              // === ✅ Nếu hợp lệ → thêm mới ===
              dataRef.current.push({
                date: isoDate,
                time: `${start}-${end}`,
                title: `Training với ${trainerName}`,
              });

              window.jQuery(holderRef.current).calendar({
                data: normalizeMockData(dataRef.current),
              });

              // Đóng modal & reset form + state
              const modalInst =
                window.bootstrap?.Modal.getInstance(modalRef.current) ||
                new window.bootstrap.Modal(modalRef.current);
              modalInst.hide();
              e.currentTarget.reset();
              setSelectedDate(new Date());
              setVnDate(formatTodayVN());
            }}
          >
            <div className="modal-header">
              <h5 className="modal-title">Chọn Trainer</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>

            <div className="modal-body">
              {/* Trainer select */}
              <div className="mb-3">
                <label className="form-label">Trainer</label>
                <select name="trainer" className="form-select" required defaultValue={trainersMock[0]?.id || ""}>
                  {trainersMock.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Date dd/mm/yyyy — dùng react-datepicker; lưu vào hidden input name="date_vn" */}
              <div className="mb-3">
                <label className="form-label d-block">Ngày (dd/mm/yyyy)</label>
                <div style={{ position: "relative", width: "100%" }}>
                  <DatePicker
                    id="booking-date-picker"
                    selected={selectedDate}
                    onChange={(date) => {
                      setSelectedDate(date);
                      setVnDate(date ? toDDMMYYYY(date) : "");
                    }}
                    dateFormat="dd/MM/yyyy"
                    placeholderText="dd/mm/yyyy"
                    showMonthDropdown
                    showYearDropdown
                    dropdownMode="select"
                    isClearable={false}
                    minDate={new Date()}       // 🔒 chặn ngày quá khứ
                    className="form-control"
                    wrapperClassName="w-100"
                  />
                  <input type="hidden" name="date_vn" value={vnDate || ""} />
                </div>
              </div>

              {/* Timeslot select — render tất cả, khóa xám slot < now+24h */}
              <div className="mb-3">
                <label className="form-label">Timeslot (mỗi tiếng một slot)</label>
                <select
                  name="slot"
                  className="form-select"
                  required
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                >
                  {allSlots.map(s => (
                    <option key={s.id} value={s.id} disabled={disabledSlots.has(s.id)}>
                      {s.label}{disabledSlots.has(s.id) ? "" : ""}
                    </option>
                  ))}
                </select>
                {allSlots.every(s => disabledSlots.has(s.id)) && (
                  <div className="form-text text-danger mt-1">
                    Không còn khung giờ khả dụng (cần ≥ 24h tính từ hiện tại).
                  </div>
                )}
              </div>

              <div className="form-text mt-2">
                • Sự kiện tương lai tự động có trạng thái <code>not yet</code>. Mỗi ngày hiển thị 1 event (theo logic hiện có).
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal">Hủy</button>
              <button type="submit" className="btn btn-primary" disabled={!selectedSlotId || disabledSlots.has(selectedSlotId)}>
                Lưu
              </button>
            </div>
          </form>
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
    last.setDate(last.getDate()+6);
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
