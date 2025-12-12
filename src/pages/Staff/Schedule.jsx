import React, { useEffect, useRef, useState } from "react";
import api from "../../config/axios";

// ===== Helpers thời gian & format =====
function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

/** Date -> yyyy-mm-dd (nếu sau này cần) */
function dateObjToISO(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** parse "HH:MM:SS" -> [hh, mm] */
function parseHHMMSS(str) {
  if (!str) return [0, 0];
  const [h, m] = str.split(":");
  return [Number(h) || 0, Number(m) || 0];
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

/** Chuẩn hóa từ API /staff-schedule/my-schedules */
function normalizeScheduleData(arr) {
  const today = startOfDay(new Date());
  const out = [];

  (arr || []).forEach((it) => {
    if (!it.scheduleDate) return;

    const d = new Date(it.scheduleDate);
    const [sh, sm] = parseHHMMSS(it.startTime);
    const [eh, em] = parseHHMMSS(it.endTime);

    const start = new Date(
      d.getFullYear(),
      d.getMonth(),
      d.getDate(),
      sh,
      sm,
      0,
      0
    );
    const end =
      eh || em
        ? new Date(
            d.getFullYear(),
            d.getMonth(),
            d.getDate(),
            eh,
            em,
            0,
            0
          )
        : null;

    const dateOnly = startOfDay(d);
    const statusRaw = it.status || "Scheduled";
    const status =
      dateOnly.getTime() > today.getTime() ? statusRaw : statusRaw; // giữ nguyên theo API

    out.push({
      title: it.timeSlotName || "Lịch làm việc",
      start,
      end,
      allDay: false,
      status,
      scheduleId: it.scheduleId,
      scheduleDate: it.scheduleDate,
      timeSlotId: it.timeSlotId,
      timeSlotName: it.timeSlotName,
      notes: it.notes || "",
    });
  });

  out.sort((a, b) => +a.start - +b.start);
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

function StaffSchedule() {
  const holderRef = useRef(null);
  const tmplRef = useRef(null);

  const dataRef = useRef([]); // dữ liệu lịch từ API

  const [selectedEvent, setSelectedEvent] = useState(null);
  const eventModalRef = useRef(null);

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
          return (
            "_" +
            this.getFullYear() +
            "_" +
            (this.getMonth() + 1) +
            "_" +
            this.getDate()
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

        // CLICK CHIP EVENT → mở modal detail (view only)
        $el.on("click", ".event-chip", function (e) {
          e.preventDefault();
          e.stopPropagation();
          const index = +this.getAttribute("data-index");
          if (!isNaN(index) && options.data[index]) {
            options.onOpenEvent && options.onOpenEvent(options.data[index]);
          }
          return false;
        });

        function monthAddEvent(index, event) {
          const e = new Date(event.start);
          const dayCell = $("." + e.toDateCssClass());
          if (!dayCell.length || dayCell.hasClass("has-event")) return;

          const timeStr = event.start.toTimeString();
          const endStr = event.end ? " - " + event.end.toTimeString() : "";
          const status = (event.status || "").toLowerCase();

          const $chip = $(`
            <div class="event-chip status-${status.replace(
              /\s+/g,
              "-"
            )}" data-index="${index}" title="${event.title}">
              <div class="event-chip-title">${event.title}</div>
              <div class="event-chip-time">${timeStr}${endStr}</div>
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

      // 👉 GỌI API LẤY LỊCH CỦA STAFF
      let schedulesFromApi = [];
      try {
        const res = await api.get("/staff-schedule/my-schedules");
        schedulesFromApi = res.data || [];
      } catch (err) {
        console.error("Failed to load /staff-schedule/my-schedules:", err);
      }

      dataRef.current = schedulesFromApi;
      const normalized = normalizeScheduleData(schedulesFromApi);

      window.jQuery(holderRef.current).calendar({
        data: normalized,
        onOpenEvent: (ev) => {
          setSelectedEvent({
            title: ev.title,
            date: ev.start,
            start: ev.start,
            end: ev.end,
            status: ev.status || "Scheduled",
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
  position:relative; padding:8px; min-height:110px; background:#ffffff; border:1px solid #e5e7eb;
  overflow:hidden; word-wrap:break-word; transition:background-color .15s ease, border-color .15s ease, box-shadow .15s ease;
}
.calendar-day .date{ font-weight:600; margin-bottom:6px; }
.current{ background:#fff; }
.prev-month, .next-month{ background:#f4f5f7 !important; color:#9aa0a6; opacity:.9; }
.prev-month .date, .next-month .date{ color:#9aa0a6; font-weight:600; }

/* ===== TODAY ===== */
.calendar-day.today{
  background:linear-gradient(135deg,#fff7d6,#fef9c3) !important;
  border:1px solid #facc15 !important;
  box-shadow:0 0 0 1px #fde68a inset;
}
.calendar-day.today .date{ font-weight:800; color:#b45309; }

/* ===== HAS EVENT ===== */
.calendar-day.has-event{
  background:#f9fafb !important;
  border-color:#e5e7eb !important;
}
.calendar-day.has-event .date{ font-weight:700; color:#0f172a; }
.calendar-day.has-event.today{
  background:linear-gradient(135deg,#fef3c7,#fee2e2) !important;
  border-color:#f97316 !important;
}

/* ===== EVENT CHIP ===== */
.event-chip{
  margin-top:6px;
  padding:8px 10px;
  border-radius:12px;
  cursor:pointer;
  font-size:12px;
  line-height:1.25;
  display:grid;
  gap:3px;
  max-width:100%;
  border:1px solid transparent;
  box-shadow:0 4px 10px rgba(15,23,42,0.08);
  transition:transform .15s ease, box-shadow .15s ease, background .15s ease, border-color .15s ease;
}
.event-chip-title{
  font-weight:600;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}
.event-chip-time{
  opacity:.9;
  font-size:11px;
  white-space:nowrap;
  overflow:hidden;
  text-overflow:ellipsis;
}

/* Hover effect */
.event-chip:hover{
  transform:translateY(-1px);
  box-shadow:0 6px 16px rgba(15,23,42,0.16);
}

/* ===== STATUS COLORS (chỉ dùng màu, không show text status) ===== */

/* Scheduled = xanh dương pastel */
.event-chip.status-scheduled{
  background:linear-gradient(135deg,#e0f2fe,#eff6ff);
  border-color:#93c5fd;
}
.event-chip.status-scheduled .event-chip-title{ color:#0f172a; }
.event-chip.status-scheduled .event-chip-time{ color:#1d4ed8; }

/* Present = xanh lá nhẹ */
.event-chip.status-present{
  background:linear-gradient(135deg,#dcfce7,#ecfdf5);
  border-color:#86efac;
}
.event-chip.status-present .event-chip-title{ color:#065f46; }
.event-chip.status-present .event-chip-time{ color:#15803d; }

/* Absent = đỏ cam */
.event-chip.status-absent{
  background:linear-gradient(135deg,#fee2e2,#fef2f2);
  border-color:#fecaca;
}
.event-chip.status-absent .event-chip-title{ color:#7f1d1d; }
.event-chip.status-absent .event-chip-time{ color:#b91c1c; }

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
  .event-chip{ font-size:11px; padding:6px 8px; }
  .event-chip-time{ font-size:10px; }
  .nav-arrow{ font-size:20px; padding:2px 8px; }
}
      `}</style>

      {/* TIÊU ĐỀ: LỊCH LÀM VIỆC (staff view only) */}
      <div className="d-flex justify-content-center align-items-center mb-3">
        <h1 style={{ margin: 0, color: "#c80036", fontWeight: "bold" }}>
          Lịch làm việc
        </h1>
      </div>

      {/* MODAL CHI TIẾT EVENT - chỉ xem, không show status */}
      <div
        className="modal fade"
        id="eventDetailModal"
        tabIndex="-1"
        aria-hidden="true"
        ref={eventModalRef}
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {selectedEvent?.title || "Chi tiết lịch làm việc"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => setSelectedEvent(null)}
              />
            </div>
            <div className="modal-body">
              {selectedEvent ? (
                <>
                  <div className="mb-2 text-muted">
                    Ngày:{" "}
                    <strong>{toDDMMYYYY(selectedEvent.date)}</strong>
                  </div>
                  <div className="mb-2">
                    Thời gian:{" "}
                    <strong>
                      {hhmm(selectedEvent.start)}
                      {selectedEvent.end
                        ? ` - ${hhmm(selectedEvent.end)}`
                        : ""}
                    </strong>
                  </div>
                  {/* Không hiển thị trạng thái cho staff */}
                </>
              ) : (
                <div className="text-muted">
                  Không có dữ liệu lịch làm việc.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
                onClick={() => setSelectedEvent(null)}
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

export default StaffSchedule;
