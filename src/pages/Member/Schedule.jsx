import React, { useEffect, useRef } from "react";

/** ========= Mock data (mỗi ngày chỉ 1 event) ========= */
const mockData = [
  { date: "2025-11-05", time: "09:00-10:00", title: "Standup meeting", status: "not yet" },
  { date: "2025-11-12", time: "14:00-15:30", title: "Code review" },
  { date: "2025-11-20", time: "08:00-09:00", title: "Training session", status: "not yet" },
  { date: "2025-11-25", time: "19:00-20:00", title: "Sprint retro" },
  { date: "2025-10-28", time: "10:00-11:00", title: "Past Sync", status: "present" },
  { date: "2025-10-29", time: "15:00-16:00", title: "Missed Call", status: "absent" },
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
    if (seen.has(k)) continue;
    seen.add(k);
    const [sh, sm, eh, em] = parseTimeRange(it.time);
    const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), sh, sm, 0, 0);
    const end = eh || em ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em, 0, 0) : null;
    const dateOnly = startOfDay(d);
    const status = dateOnly.getTime() > today.getTime() ? "not yet" : (it.status || "present");
    out.push({
      title: it.title, start, end, allDay:false, status,
      text: `<div><strong>${it.title}</strong><br/>${it.time||""}<br/><em>Status: ${status}</em></div>`
    });
  }
  out.sort((a,b)=>+a.start-+b.start);
  return out;
}

function loadCSS(href) {
  return new Promise((resolve, reject) => {
    const existing = Array.from(document.styleSheets).find(s => s.href && s.href.includes(href));
    if (existing) return resolve();
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    link.onload = resolve;
    link.onerror = () => reject(new Error(`Failed to load CSS: ${href}`));
    document.head.appendChild(link);
  });
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

export default function Calendar() {
  const holderRef = useRef(null);
  const tmplRef = useRef(null);

  useEffect(() => {
    (async () => {
      // 🔁 DÙNG BOOTSTRAP 5 + POPPER v2 — KHÔNG NẠP BS4
      await loadCSS("https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css");
      // jQuery chỉ để delegate & templating (không phụ thuộc vào BS)
      await loadScript("https://code.jquery.com/jquery-3.6.4.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/@popperjs/core@2.11.8/dist/umd/popper.min.js");
      await loadScript("https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.min.js");

      const $ = window.jQuery;
      const bootstrap = window.bootstrap;
      if (!bootstrap) return;

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

      // === Popover helpers (BS5) ===
      let currentPopover = null;
      const POPOVER_OPTS = {
        html: true,
        container: "body",
        placement: "auto",  // <— hợp lệ với Popper v2
        trigger: "manual",
        sanitize: false     // cho phép HTML content do ta tạo
      };
      function getOrCreatePopover(elem, opts) {
        let instance = bootstrap.Popover.getInstance(elem);
        if (!instance) instance = new bootstrap.Popover(elem, { ...POPOVER_OPTS, ...opts });
        return instance;
      }
      function hideCurrent() {
        if (currentPopover) {
          try { currentPopover.hide(); } catch {}
          currentPopover = null;
        }
      }
      // Đóng khi click ra ngoài
      $(document).on("click", (e) => {
        if (!$(e.target).closest(".popover, .js-cal-years, .js-cal-months, .event").length) {
          hideCurrent();
        }
      });

      function calendar($el, options) {
        // ===== Prev/Next =====
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

          // ===== Click MONTH label -> popover 12 tháng (BS5) =====
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
            hideCurrent();
            pop.show();
            currentPopover = pop;
            return false;
          })

          // ===== Click YEAR label -> popover dải năm (±6) (BS5) =====
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
            hideCurrent();
            pop.show();
            currentPopover = pop;
            return false;
          });

        // ===== Click item trong popover =====
        $(document).off("click.calOpt").on("click.calOpt", ".js-cal-option", function () {
          const $t = $(this);
          const o = $t.data();
          if (o.date) o.date = new Date(o.date);
          $.extend(options, o);
          hideCurrent();
          $(".popover").remove();
          draw();
        });

        // ===== Popover chi tiết event (BS5) =====
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
          hideCurrent();
          pop.show();
          currentPopover = pop;
          return false;
        });

        /** ====== monthAddEvent ====== */
        function monthAddEvent(index, event) {
          const e = new Date(event.start);
          const dayCell = $("." + e.toDateCssClass());
          if (!dayCell.length || dayCell.hasClass("has-event")) return;
          const time = event.start.toTimeString();
          const status = (event.status || "").toLowerCase(); // present|absent|not yet
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

      const normalized = normalizeMockData(mockData);
      window.jQuery(holderRef.current).calendar({ data: normalized });
    })();
  }, []);

  return (
    <div className="container mt-5 mb-5">
      <style>{`
        .nav-arrow{font-weight:800;font-size:22px;line-height:1;padding:2px 10px;border:none;background:transparent;cursor:pointer;}
        .nav-arrow:focus{outline:none;}
        .btn-link.no-underline{text-decoration:none!important;}
        .btn-link.bold{font-weight:700!important;}

        .calendar-day.has-event{background:#fff3f5!important;border:1px solid #ffc7d2!important;position:relative;}
        .calendar-day.has-event .date{font-weight:700;color:#c80036;}

        .event-chip{margin-top:6px;padding:6px 8px;border-radius:10px;background:#ffdbe3;border:1px dashed #ff9eb2;cursor:pointer;font-size:12px;line-height:1.25;display:grid;gap:2px;}
        .event-chip-title{font-weight:600;}
        .event-chip-time{opacity:.9;font-size:11px;}
        .event-chip-badge{display:inline-block;margin-top:2px;padding:2px 6px;border-radius:999px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;}

        .event-chip.status-present{background:#e6ffed;border-color:#9ae6b4;}
        .event-chip.status-present .event-chip-badge{background:#34d399;color:#053321;}
        .event-chip.status-absent{background:#ffe6e6;border-color:#ffb3b3;}
        .event-chip.status-absent .event-chip-badge{background:#f87171;color:#4a0a0a;}
        .event-chip.status-not\\ yet{background:#f1f5f9;border-color:#cbd5e1;}
        .event-chip.status-not\\ yet .event-chip-badge{background:#94a3b8;color:#0f172a;}

        .calendar-day.today{background:#fff7cc!important;border:1px solid #ffd24d!important;box-shadow:inset 0 0 0 2px #ffe58a;}
        .calendar-day.today .date{font-weight:800;color:#b45309;}
        .calendar-day.has-event.today{background:#ffe9a8!important;border-color:#ffcc66!important;}
        .calendar-day.has-event.today .event-chip{background:#ffe3a3;border-color:#ffc770;}

        .calendar-day.prev-month,.calendar-day.next-month{background:#f4f5f7!important;color:#9aa0a6;opacity:.9;}
        .calendar-day.prev-month .date,.calendar-day.next-month .date{color:#9aa0a6;font-weight:600;}
        .calendar-day.prev-month .event-chip,.calendar-day.next-month .event-chip{background:#eef0f2;border-color:#d7dbe0;color:#6b7280;}

        .popover{z-index:1080;max-width:320px;}
        .popover .list-group-item{text-align:left;}
      `}</style>

      <h1 style={{ textAlign: "center", color: "#c80036", fontWeight: "bold" }}>Lịch</h1>

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
