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

/** Date -> yyyy-mm-dd (nếu sau này cần) */
function dateObjToISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
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

/**
 * Chuẩn hóa dữ liệu từ API /api/TrainerSchedule/my-schedules
 * Mỗi ngày gom tất cả schedule lại → 1 event cho calendar
 * nhưng event đó chứa mảng sessions để hiển thị chi tiết trong modal
 */
function normalizeScheduleData(apiList) {
  const today = startOfDay(new Date());
  const map = new Map();

  (apiList || []).forEach((item) => {
    if (!item.sessionDate) return;

    const d = new Date(item.sessionDate);
    const dateKey = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;

    const [sh, sm, eh, em] = parseTimeRange(item.timeSlotName || item.time || "");
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh || 0, sm || 0, 0, 0);
    const end =
      eh || em
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh || 0, em || 0, 0, 0)
        : null;

    const scheduleInfo = {
      id: item.id,
      memberName: item.memberName || "",
      timeSlotName: item.timeSlotName || item.time || "",
      status: item.status || "",
      start,
      end,
      raw: item,
    };

    if (!map.has(dateKey)) {
      map.set(dateKey, {
        date: startOfDay(d),
        start,
        end,
        sessions: [scheduleInfo],
      });
    } else {
      const g = map.get(dateKey);
      g.sessions.push(scheduleInfo);
      if (start < g.start) g.start = start;
      if (end && (!g.end || end > g.end)) g.end = end;
    }
  });

  const out = [];
  for (const [, g] of map.entries()) {
    const status = g.date.getTime() > today.getTime() ? "upcoming" : "past";
    out.push({
      title: `${g.sessions.length} lịch dạy`,
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

function getStatusBadgeClass(status) {
  const s = (status || "").toLowerCase();
  if (s === "present" || s === "đã dạy" || s === "completed") return "badge bg-success";
  if (s === "absent" || s === "hủy" || s === "cancelled" || s === "missed")
    return "badge bg-danger";
  if (s === "upcoming" || s === "scheduled") return "badge bg-primary";
  return "badge bg-secondary";
}

function StaffSchedule() {
  const holderRef = useRef(null);
  const tmplRef = useRef(null);

  // state lưu dữ liệu ngày đang xem chi tiết
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
        if (!$(e.target).closest(".popover, .js-cal-years, .js-cal-months, .event-chip").length) hideCurrent();
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

        // CLICK CẢ Ô NGÀY (calendar-day) nếu có lịch → mở modal
        $el.on("click", ".calendar-day.has-event", function (e) {
          // đừng ngăn chặn bubble hoàn toàn, chỉ tránh trùng với chip nếu cần
          const dateStr = this.getAttribute("data-date");
          if (!dateStr || !options.data) return;
          const d = new Date(dateStr);
          const cssClass = d.toDateCssClass();
          const ev = options.data.find((x) => x.date && x.date.toDateCssClass() === cssClass);
          if (ev && options.onOpenEvent) {
            options.onOpenEvent(ev);
          }
        });

        // render icon 👥 cho ngày có lịch
        function monthAddEvent(index, event) {
          const e = new Date(event.start);
          const dayCell = $("." + e.toDateCssClass());
          if (!dayCell.length || dayCell.hasClass("has-event")) return;
          const count = (event.sessions && event.sessions.length) || 0;
          const $chip = $(`
            <div class="event-chip status-has" data-index="${index}" title="${count} lịch dạy">
              <span class="event-chip-icon">👥</span>
              ${count > 1 ? `<span class="event-chip-count">x${count}</span>` : ""}
            </div>
          `);
          dayCell.addClass("has-event").append($chip);
        }

        function yearAddEvents(events, year) {
          const counts = new Array(12).fill(0);
          $.each(events, (i, v) => {
            if (v.start.getFullYear() === year) counts[v.start.getMonth()]++;
          });
          $.each(counts, (i, v) => {
            if (v !== 0) $(".month-" + i).append('<span class="badge bg-info ms-2">' + v + "</span>");
          });
        }

        function draw() {
          $el.html(t(options));
          $("." + new Date().toDateCssClass()).addClass("today");
          if (options.data && options.data.length) {
            if (options.mode === "year") yearAddEvents(options.data, options.date.getFullYear());
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

      // ==== CALL API LẤY LỊCH DẠY CỦA TRAINER ====
      let apiData = [];
      try {
        const res = await api.get("/api/TrainerSchedule/my-schedules");
        apiData = res.data || [];
      } catch (err) {
        console.error("Failed to load trainer schedules:", err);
      }
      if (!isMounted) return;

      const normalized = normalizeScheduleData(apiData);

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

/* ===== RESPONSIVE ===== */
@media (max-width: 576px){
  .calendar-day{ min-height:90px; padding:6px; }
  .event-chip{ font-size:11px; }
  .nav-arrow{ font-size:20px; padding:2px 8px; }
}
      `}</style>

      {/* TIÊU ĐỀ: LỊCH LÀM VIỆC (trainer view) */}
      <div className="d-flex justify-content-center align-items-center mb-3">
        <h1 style={{ margin: 0, color: "#c80036", fontWeight: "bold" }}>Lịch làm việc</h1>
      </div>

      {/* MODAL CHI TIẾT LỊCH DẠY TRONG 1 NGÀY */}
      <div className="modal fade" id="eventDetailModal" tabIndex="-1" aria-hidden="true" ref={eventModalRef}>
        <div className="modal-dialog modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedDay ? `Lịch dạy ngày ${toDDMMYYYY(selectedDay.date)}` : "Chi tiết lịch dạy"}
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
              {selectedDay && selectedDay.sessions && selectedDay.sessions.length ? (
                <div className="list-group">
                  {selectedDay.sessions.map((s, idx) => (
                    <div key={s.id || idx} className="list-group-item">
                      <div className="fw-bold">
                        {s.memberName || "Member"}
                      </div>
                      <div className="small text-muted">
                        Khung giờ:{" "}
                        <strong>
                          {s.timeSlotName ||
                            `${hhmm(s.start)}${s.end ? ` - ${hhmm(s.end)}` : ""}`}
                        </strong>
                      </div>
                      {s.status ? (
                        <div className="mt-1">
                          <span className={getStatusBadgeClass(s.status)}>
                            {s.status}
                          </span>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-muted">Không có lịch dạy trong ngày này.</div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => setSelectedDay(null)}
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

export default StaffSchedule;
