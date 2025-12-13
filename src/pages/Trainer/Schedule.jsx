import React, { useEffect, useRef, useState } from "react";
import api from "../../config/axios"; // chỉnh lại path nếu cần

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

/** format HH:MM từ Date */
function hhmm(d) {
  if (!d) return "";
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/** dd/mm/yyyy cho UI */
function toDDMMYYYY(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

/** "HH:mm:ss" | "HH:mm" -> "HH:mm" */
function toHHmmFromApiTime(apiTime) {
  if (!apiTime) return "";
  const parts = String(apiTime).split(":");
  const hh = (parts[0] || "00").padStart(2, "0");
  const mm = (parts[1] || "00").padStart(2, "0");
  return `${hh}:${mm}`;
}

/** Map status backend -> tiếng Việt */
function mapStatusVi(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (!s) return "Không rõ";
  if (s === "scheduled" || s === "booked") return "Đã đặt";
  if (s === "completed" || s === "done" || s === "present") return "Đã hoàn thành";
  if (s === "cancelled" || s === "canceled") return "Đã hủy";
  if (s === "absent" || s === "missed") return "Vắng";
  if (s === "pending") return "Chờ xử lý";
  if (s === "approved") return "Đã duyệt";
  return raw; // fallback giữ nguyên
}

function badgeClassByStatus(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (s === "scheduled" || s === "booked") return "bg-primary";
  if (s === "completed" || s === "done" || s === "present") return "bg-success";
  if (s === "cancelled" || s === "canceled" || s === "absent" || s === "missed") return "bg-danger";
  return "bg-secondary";
}

/**
 * Chuẩn hóa dữ liệu từ API /TrainingSession/trainer/pt-calendar
 * -> gom theo ngày, mỗi event chứa mảng sessions để show detail trong modal
 *
 * API mẫu:
 * {
 *  sessionId, sessionDate, timeSlotId, timeSlotName, startTime, endTime,
 *  memberId, memberName, memberEmail, memberPackageId, packageName,
 *  sessionType, notes, bookingDate, status
 * }
 */
function normalizePtCalendarData(apiList) {
  const today = startOfDay(new Date());
  const map = new Map();

  (apiList || []).forEach((item) => {
    const dateStr = (item.sessionDate || "").slice(0, 10);
    if (!dateStr) return;

    const d = new Date(dateStr); // yyyy-mm-dd
    if (isNaN(d.getTime())) return;

    const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

    let sh = 0,
      sm = 0,
      eh = 0,
      em = 0;

    // ưu tiên parse từ timeSlotName nếu có dạng "09:00-10:00"
    if (item.timeSlotName && String(item.timeSlotName).includes("-")) {
      [sh, sm, eh, em] = parseTimeRange(String(item.timeSlotName));
    } else {
      const st = toHHmmFromApiTime(item.startTime);
      const et = toHHmmFromApiTime(item.endTime);
      const [h1, m1] = (st || "00:00").split(":").map((v) => +v || 0);
      const [h2, m2] = (et || st || "00:00").split(":").map((v) => +v || 0);
      sh = h1;
      sm = m1;
      eh = h2;
      em = m2;
    }

    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh || 0, sm || 0, 0, 0);
    const end = new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh || sh || 0, em || sm || 0, 0, 0);

    const timeLabel = item.timeSlotName?.trim()
      ? item.timeSlotName
      : `${hhmm(start)}${end ? ` - ${hhmm(end)}` : ""}`;

    const sessionInfo = {
      sessionId: item.sessionId,
      memberName: item.memberName || "",
      memberEmail: item.memberEmail || "",
      packageName: item.packageName || "",
      sessionType: item.sessionType || "",
      notes: item.notes || "",
      statusRaw: item.status || "",
      statusVi: mapStatusVi(item.status),
      timeLabel,
      start,
      end,
      raw: item,
    };

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        date: startOfDay(d),
        start,
        end,
        sessions: [sessionInfo],
      });
    } else {
      const g = map.get(dateKey);
      g.sessions.push(sessionInfo);
      if (start < g.start) g.start = start;
      if (end && (!g.end || end > g.end)) g.end = end;
    }
  });

  const out = [];
  for (const [, g] of map.entries()) {
    // title hiển thị trên calendar (chip) – chỉ dùng count
    const status = g.date.getTime() > today.getTime() ? "upcoming" : "past";
    out.push({
      title: `${g.sessions.length} buổi`,
      start: g.start,
      end: g.end,
      allDay: false,
      status,
      date: g.date,
      sessions: g.sessions,
    });
  }
  out.sort((a, b) => +a.start - +b.start);
  return out;
}

function TrainerSchedule() {
  const holderRef = useRef(null);
  const tmplRef = useRef(null);

  const [selectedDay, setSelectedDay] = useState(null);
  const eventModalRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

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

      // quicktmpl
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

      // Date helpers
      $.extend(Date.prototype, {
        toDateCssClass: function () {
          return "_" + this.getFullYear() + "_" + (this.getMonth() + 1) + "_" + this.getDate();
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
          return m > 0 ? `${hh}:${String(m).padStart(2, "0")}${ampm}` : `${hh}${ampm}`;
        },
      });

      const tmplEl = tmplRef.current;
      const t = $.quicktmpl(tmplEl ? tmplEl.innerHTML : "");

      // Popover helpers
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
          (window.bootstrap && window.bootstrap.Popover) || (BootstrapBundle && BootstrapBundle.Popover);
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
        if (!$(e.target).closest(".popover, .js-cal-years, .js-cal-months, .event-chip").length)
          hideCurrent();
      });

      function calendar($el, options) {
        $el
          .on("click", ".js-cal-prev", function () {
            if (options.mode === "year") options.date.setFullYear(options.date.getFullYear() - 1);
            else if (options.mode === "month") options.date.setMonth(options.date.getMonth() - 1);
            else if (options.mode === "week") options.date.setDate(options.date.getDate() - 7);
            else options.date.setDate(options.date.getDate() - 1);
            hideCurrent();
            draw();
          })
          .on("click", ".js-cal-next", function () {
            if (options.mode === "year") options.date.setFullYear(options.date.getFullYear() + 1);
            else if (options.mode === "month") options.date.setMonth(options.date.getMonth() + 1);
            else if (options.mode === "week") options.date.setDate(options.date.getDate() + 7);
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
            const o = $t.data();
            if (o.date) o.date = new Date(o.date);
            $.extend(options, o);
            hideCurrent();
            $(".popover").remove();
            draw();
          });

        // CLICK CHIP EVENT → mở modal
        $el.on("click", ".event-chip", function (e) {
          e.preventDefault();
          e.stopPropagation();
          const index = +this.getAttribute("data-index");
          if (!isNaN(index) && options.data[index]) {
            options.onOpenEvent && options.onOpenEvent(options.data[index]);
          }
          return false;
        });

        // CLICK Ô NGÀY có event → mở modal
        $el.on("click", ".calendar-day.has-event", function () {
          const dateStr = this.getAttribute("data-date");
          if (!dateStr || !options.data) return;
          const d = new Date(dateStr);
          const cssClass = d.toDateCssClass();
          const ev = options.data.find((x) => x.date && x.date.toDateCssClass() === cssClass);
          if (ev && options.onOpenEvent) options.onOpenEvent(ev);
        });

        // render icon 👥 cho ngày có lịch
        function monthAddEvent(index, event) {
          const e = new Date(event.start);
          const dayCell = $("." + e.toDateCssClass());
          if (!dayCell.length || dayCell.hasClass("has-event")) return;

          const count = (event.sessions && event.sessions.length) || 0;
          const $chip = $(
            `
            <div class="event-chip status-has" data-index="${index}" title="${count} buổi PT">
              <span class="event-chip-icon">👥</span>
              ${count > 1 ? `<span class="event-chip-count">x${count}</span>` : ""}
            </div>
          `
          );

          dayCell.addClass("has-event").attr("data-date", e.toISOString()).append($chip);
        }

        function yearAddEvents(events, year) {
          const counts = new Array(12).fill(0);
          $.each(events, (i, v) => {
            if (v.start.getFullYear() === year) counts[v.start.getMonth()]++;
          });
          $.each(counts, (i, v) => {
            if (v !== 0)
              $(".month-" + i).append('<span class="badge bg-info ms-2">' + v + "</span>");
          });
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
          shortMonths: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"],
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

      // ==== CALL API LẤY PT CALENDAR CỦA TRAINER ====
      let apiData = [];
      try {
        const res = await api.get("/TrainingSession/trainer/pt-calendar");
        apiData = Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error("Failed to load PT calendar:", err);
      }
      if (!isMounted) return;

      const normalized = normalizePtCalendarData(apiData);

      window.jQuery(holderRef.current).calendar({
        data: normalized,
        onOpenEvent: (ev) => {
          setSelectedDay({
            date: ev.date || ev.start,
            sessions: ev.sessions || [],
          });

          try {
            const ModalClass =
              (window.bootstrap && window.bootstrap.Modal) || (BootstrapBundle && BootstrapBundle.Modal);
            if (ModalClass) {
              const inst = ModalClass.getOrCreateInstance(document.getElementById("eventDetailModal"));
              inst.show();
            }
          } catch (e) {
            console.warn("Cannot open event modal:", e);
          }
        },
      });
    })();

    return () => {
      isMounted = false;
    };
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

/* ===== EVENT CHIP (ICON MEMBER) ===== */
.event-chip{
  margin-top:4px; padding:4px 6px; border-radius:999px; background:#ffe4ef; border:1px dashed #ff9eb2;
  cursor:pointer; font-size:12px; line-height:1; display:inline-flex; align-items:center; gap:4px;
}
.event-chip-icon{ font-size:14px; line-height:1; }
.event-chip-count{ font-size:11px; font-weight:600; }
.event-chip.status-has{ background:#fef2ff; border-color:#e9d5ff; }

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

@media (max-width: 576px){
  .calendar-day{ min-height:90px; padding:6px; }
  .event-chip{ font-size:11px; }
  .nav-arrow{ font-size:20px; padding:2px 8px; }
}
      `}</style>

      <div className="d-flex justify-content-center align-items-center mb-3">
        <h1 style={{ margin: 0, color: "#c80036", fontWeight: "bold" }}>Lịch PT</h1>
      </div>

      {/* MODAL CHI TIẾT LỊCH PT TRONG 1 NGÀY */}
      <div className="modal fade" id="eventDetailModal" tabIndex="-1" aria-hidden="true" ref={eventModalRef}>
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedDay ? `Lịch ngày ${toDDMMYYYY(selectedDay.date)}` : "Chi tiết lịch"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setSelectedDay(null)}
              />
            </div>

            <div className="modal-body">
              {selectedDay?.sessions?.length ? (
                <div className="list-group">
                  {selectedDay.sessions
                    .slice()
                    .sort((a, b) => +a.start - +b.start)
                    .map((s, idx) => (
                      <div key={s.sessionId ?? idx} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div className="fw-bold">
                            {s.memberName || "Hội viên"}
                            {s.memberEmail ? (
                              <div className="small text-muted">{s.memberEmail}</div>
                            ) : null}
                          </div>

                          <span className={`badge ${badgeClassByStatus(s.statusRaw)}`} style={{ whiteSpace: "nowrap" }}>
                            {s.statusVi}
                          </span>
                        </div>

                        <div className="small text-muted mt-1">
                          Khung giờ: <strong>{s.timeLabel}</strong>
                        </div>

                        <div className="small text-muted mt-1">
                          Gói: <strong>{s.packageName || "—"}</strong>
                        </div>

                        {s.notes ? (
                          <div className="small text-muted mt-2">
                            Ghi chú: <span>{s.notes}</span>
                          </div>
                        ) : null}
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-muted">Không có lịch trong ngày này.</div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-light" data-bs-dismiss="modal" onClick={() => setSelectedDay(null)}>
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

export default TrainerSchedule;
