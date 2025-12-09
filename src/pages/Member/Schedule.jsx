import React, { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api from "../../config/axios";
import { message } from "antd";

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

// ====== Mapping TIME từ API "HH:mm:ss" -> "HH:mm" ======
function toHHmmFromApiTime(apiTime) {
  if (!apiTime) return "";
  const parts = apiTime.split(":");
  const hh = (parts[0] || "00").padStart(2, "0");
  const mm = (parts[1] || "00").padStart(2, "0");
  return `${hh}:${mm}`;
}

// ====== Mapping STATUS từ backend -> status frontend ======
function mapSessionStatus(session) {
  const raw = (session.status || "").toLowerCase().trim();
  if (raw === "scheduled" || raw === "booked") return "not yet";
  if (raw === "completed" || raw === "present" || raw === "done")
    return "present";
  if (
    raw === "cancelled" ||
    raw === "canceled" ||
    raw === "absent" ||
    raw === "missed"
  )
    return "absent";
  return "";
}

function normalizeMockData(arr) {
  const today = startOfDay(new Date());
  const seen = new Set();
  const out = [];

  for (const it of arr) {
    const d = new Date(it.date);
    const k = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
    if (seen.has(k)) continue;
    seen.add(k);

    const [sh, sm, eh, em] = parseTimeRange(it.time);
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
        ? new Date(d.getFullYear(), d.getMonth(), d.getDate(), eh, em, 0, 0)
        : null;
    const dateOnly = startOfDay(d);
    const status =
      dateOnly.getTime() > today.getTime() ? "not yet" : it.status || "present";

    out.push({
      id: it.id,
      title: it.title || "",
      start,
      end,
      allDay: false,
      status,
      text: `<div><strong>${it.title || "Buổi tập"}</strong><br/>${
        it.time || ""
      }<br/><em>Status: ${status}</em></div>`,
    });
  }

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

function toDDMMYYYY(date) {
  if (!date) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatTodayVN() {
  const d = new Date();
  return toDDMMYYYY(d);
}

function toDateFromDDMMYYYY(vn) {
  if (!vn) return null;
  const m = vn.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;

  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yyyy = parseInt(m[3], 10);

  const iso = `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(
    2,
    "0"
  )}`;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  if (d.getFullYear() !== yyyy || d.getMonth() + 1 !== mm || d.getDate() !== dd)
    return null;
  return d;
}

/** dd/mm/yyyy -> yyyy-mm-dd (cho API) */
function parseVNDateToISO(vn) {
  const d = toDateFromDDMMYYYY(vn);
  if (!d) return null;
  return dateObjToISO(d);
}

/** Date -> yyyy-mm-dd */
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

export default function Calendar() {
  const holderRef = useRef(null);
  const tmplRef = useRef(null);

  // dataRef: Lưu dạng đơn giản {id, date, time, title, status}
  const dataRef = useRef([]);
  const bookingModalRef = useRef(null);
  const eventModalRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [vnDate, setVnDate] = useState(formatTodayVN());

  const [allSlots, setAllSlots] = useState([]); // {id, label, start, end}
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState("");

  const [memberPackageId, setMemberPackageId] = useState(null);
  const [packageError, setPackageError] = useState("");

  const [disabledSlots, setDisabledSlots] = useState(new Set());
  const [selectedSlotId, setSelectedSlotId] = useState("");

  const [selectedEvent, setSelectedEvent] = useState(null);

  // ==== state cho ĐỔI LỊCH ====
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(null);
  const [rescheduleVnDate, setRescheduleVnDate] = useState("");
  const [rescheduleSlotId, setRescheduleSlotId] = useState("");
  const [rescheduleDisabledSlots, setRescheduleDisabledSlots] = useState(
    new Set()
  );
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // 🔥 loading state + ref chặn double submit
  const [bookingLoading, setBookingLoading] = useState(false);
  const bookingInProgressRef = useRef(false);

  // ==== GỌI API timeslot + gói đang active ====
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setSlotsLoading(true);
      setPackageError("");
      setSlotsError("");

      // 1) TimeSlot
      try {
        const slotRes = await api.get("/TimeSlot");
        if (!cancelled) {
          const slotData = Array.isArray(slotRes.data) ? slotRes.data : [];
          const mappedSlots = slotData
            .filter(
              (s) =>
                s.isActive !== false &&
                s.id !== 17 &&
                s.id !== 18 // loại timeslot 17 & 18
            )
            .map((s) => {
              const start = (s.startTime || "").slice(0, 5); // "08:00:00" -> "08:00"
              const end = (s.endTime || "").slice(0, 5);
              const label = s.slotName ? s.slotName : `${start} - ${end}`;
              return {
                id: s.id,
                label,
                start,
                end,
              };
            });
          setAllSlots(mappedSlots);
          if (mappedSlots.length > 0) {
            setSelectedSlotId(String(mappedSlots[0].id));
          }
        }
      } catch (err) {
        console.error("Error loading TimeSlot:", err);
        if (!cancelled) {
          setSlotsError("Không tải được danh sách khung giờ.");
        }
      } finally {
        if (!cancelled) setSlotsLoading(false);
      }

      // 2) Active member package
      try {
        const pkgRes = await api.get("/MemberPackage/my-active-package");
        if (!cancelled) {
          const pkg = pkgRes.data;
          if (pkg && pkg.id) {
            setMemberPackageId(pkg.id);
          } else {
            setPackageError("Không tìm thấy gói tập đang hoạt động.");
          }
        }
      } catch (err) {
        console.error("Error loading active package:", err);
        if (!cancelled) {
          if (err?.response?.status === 401) {
            setPackageError(
              "Bạn cần đăng nhập để sử dụng lịch đặt buổi tập."
            );
          } else {
            setPackageError(
              "Bạn chưa đăng ký gói tập nào. Vui lòng mua gói trước khi đặt lịch."
            );
          }
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // 1 ngày chỉ 1 slot – cho phép exclude 1 event (khi đổi lịch)
  function dayAlreadyBooked(dateObj, excludeId = null) {
    if (!dateObj) return false;
    const iso = dateObjToISO(dateObj);
    return dataRef.current.some((ev) => {
      if (!ev.date) return false;
      if (ev.date !== iso) return false;
      if (excludeId && ev.id === excludeId) return false;
      return true;
    });
  }

  // tính slot disable theo 24h
  function computeDisabledSlots(dateObj) {
    const now = new Date();
    const disabled = new Set();
    if (!dateObj) return disabled;

    for (const s of allSlots) {
      const [h, m] = s.start.split(":").map(Number);
      const slotDateTime = new Date(dateObj);
      slotDateTime.setHours(h, m, 0, 0);
      const diffHours = (slotDateTime - now) / (1000 * 60 * 60);
      if (diffHours < 24) disabled.add(String(s.id));
    }
    return disabled;
  }

  // 👉 HỦY LỊCH: gọi API /TrainingSession/{id}/cancel
  const handleCancelEvent = async (event) => {
    if (!event) return;

    if (!event.id) {
      message.error("Không tìm thấy ID buổi tập để hủy.");
      return;
    }

    // ✅ CHỈ ĐƯỢC HỦY TRƯỚC 24 GIỜ
    const startRaw = event.start || event.date;
    const startTime =
      startRaw instanceof Date ? startRaw : new Date(startRaw);
    if (isNaN(startTime.getTime())) {
      message.error("Không xác định được thời gian buổi tập.");
      return;
    }

    const now = new Date();
    const diffHours = (startTime - now) / (1000 * 60 * 60);

    if (diffHours < 24) {
      message.warning("Bạn chỉ có thể hủy lịch trước ít nhất 24 giờ.");
      return;
    }

    if (
      !window.confirm(
        `Bạn có chắc muốn hủy sự kiện "${event.title || ""}"?`
      )
    ) {
      return;
    }

    try {
      await api.put(`/TrainingSession/${event.id}/cancel`);

      // xóa khỏi dataRef.current theo id
      dataRef.current = dataRef.current.filter((ev) => ev.id !== event.id);

      if (window.jQuery && holderRef.current) {
        window.jQuery(holderRef.current).calendar({
          data: normalizeMockData(dataRef.current),
          onOpenEvent: handleOpenEventRef.current, // ✅ luôn truyền lại
        });
      }

      setSelectedDate((prev) => new Date(prev));
      setSelectedSlotId("");
      setDisabledSlots(new Set());

      setShowRescheduleForm(false);
      setRescheduleDate(null);
      setRescheduleVnDate("");
      setRescheduleSlotId("");
      setRescheduleDisabledSlots(new Set());

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

      message.success("Đã hủy lịch buổi tập.");
    } catch (err) {
      console.error("Cancel session error:", err);
      message.error("Có lỗi khi hủy buổi tập. Vui lòng thử lại sau.");
    }
  };

  // cập nhật disable khi đổi ngày hoặc list slot thay đổi (Booking)
  useEffect(() => {
    if (!allSlots.length) {
      setDisabledSlots(new Set());
      setSelectedSlotId("");
      return;
    }

    if (dayAlreadyBooked(selectedDate)) {
      const all = new Set(allSlots.map((s) => String(s.id)));
      setDisabledSlots(all);
      setSelectedSlotId("");
      return;
    }

    const ds = computeDisabledSlots(selectedDate);
    setDisabledSlots(ds);
    const firstValid = allSlots.find((s) => !ds.has(String(s.id)));
    setSelectedSlotId(firstValid ? String(firstValid.id) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, allSlots.length]);

  // cập nhật disable cho ĐỔI LỊCH
  useEffect(() => {
    if (!allSlots.length || !rescheduleDate) {
      setRescheduleDisabledSlots(new Set());
      if (!rescheduleDate) setRescheduleSlotId("");
      return;
    }

    // nếu ngày đó đã có event khác → disable toàn bộ
    if (dayAlreadyBooked(rescheduleDate, selectedEvent?.id)) {
      const all = new Set(allSlots.map((s) => String(s.id)));
      setRescheduleDisabledSlots(all);
      setRescheduleSlotId("");
      return;
    }

    const ds = computeDisabledSlots(rescheduleDate);
    setRescheduleDisabledSlots(ds);
    const firstValid = allSlots.find((s) => !ds.has(String(s.id)));
    setRescheduleSlotId(firstValid ? String(firstValid.id) : "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rescheduleDate, allSlots.length, selectedEvent?.id]);

  // dùng ref để truyền vào jQuery calendar (vì handleOpenEvent được khai báo sau)
  const handleOpenEventRef = useRef(null);

  useEffect(() => {
    (async () => {
      await loadScript("https://code.jquery.com/jquery-3.6.4.min.js");

      let BootstrapBundle = null;
      try {
        BootstrapBundle = await import(
          "bootstrap/dist/js/bootstrap.bundle.min.js"
        );
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
            const base = options.date instanceof Date ? options.date : new Date();
            const year = base.getFullYear();
            const month = base.getMonth();
            options.date = new Date(year, month - 1, 1);
            hideCurrent();
            draw();
          })
          .on("click", ".js-cal-next", function () {
            const base = options.date instanceof Date ? options.date : new Date();
            const year = base.getFullYear();
            const month = base.getMonth();
            options.date = new Date(year, month + 1, 1);
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

        function monthAddEvent(index, event) {
          const e = new Date(event.start);
          const dayCell = $("." + e.toDateCssClass());
          if (!dayCell.length || dayCell.hasEvent) return;
          const time = event.start.toTimeString();
          const status = (event.status || "").toLowerCase();
          const $chip = $(`
            <div class="event-chip status-${status.replace(/\s+/g, "-")}" data-index="${index}" title="${event.title}">
              <div class="event-chip-title">${event.title}</div>
              <div class="event-chip-time">${time}${
                event.end ? " - " + event.end.toTimeString() : ""
              }</div>
              <div class="event-chip-badge">${status}</div>
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

      // Handler mở modal chi tiết event
      const handleOpenEvent = (ev) => {
        const baseDate = ev.start instanceof Date ? ev.start : new Date(ev.start);

        setSelectedEvent({
          id: ev.id,
          title: ev.title,
          date: baseDate,
          start: ev.start,
          end: ev.end,
          status: ev.status || "present",
        });

        // reset state đổi lịch mỗi lần mở modal
        setShowRescheduleForm(false);
        setRescheduleDate(null);
        setRescheduleVnDate("");
        setRescheduleSlotId("");
        setRescheduleDisabledSlots(new Set());

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
      };

      // lưu vào ref để các chỗ khác (cancel / reschedule / booking) dùng được
      handleOpenEventRef.current = handleOpenEvent;

      // khởi tạo calendar rỗng
      window.jQuery(holderRef.current).calendar({
        data: normalizeMockData(dataRef.current),
        onOpenEvent: handleOpenEvent,
      });

      // 🔥 TẢI LỊCH TẬP TỪ API /TrainingSession – CHỈ LẤY STATUS = "Scheduled"
      try {
        const res = await api.get("/TrainingSession");
        const rawSessions = Array.isArray(res.data) ? res.data : [];

        const sessions = rawSessions.filter(
          (s) => (s.status || "").toLowerCase().trim() === "scheduled"
        );

        const mappedEvents = sessions.map((s) => {
          const isoDate = (s.sessionDate || "").slice(0, 10);
          const startLabel = toHHmmFromApiTime(s.startTime);
          const endLabel = toHHmmFromApiTime(s.endTime);
          const timeLabel =
            startLabel && endLabel
              ? `${startLabel}-${endLabel}`
              : startLabel || "";

          const title = s.trainerName || "";

          return {
            id: s.id,
            date: isoDate,
            time: timeLabel,
            title,
            status: mapSessionStatus(s),
          };
        });

        dataRef.current = mappedEvents;

        window.jQuery(holderRef.current).calendar({
          data: normalizeMockData(dataRef.current),
          onOpenEvent: handleOpenEvent, // ✅ luôn truyền
        });
      } catch (err) {
        console.error("Error loading TrainingSession:", err);
      }
    })();
  }, []);

  // ✅ TÍNH CÓ ĐƯỢC HỦY HAY KHÔNG (DÙNG CHO GIAO DIỆN)
  const canCancelSelectedEvent = (() => {
    if (!selectedEvent) return false;
    if ((selectedEvent.status || "").toLowerCase() !== "not yet") return false;

    const startRaw = selectedEvent.start || selectedEvent.date;
    const startTime =
      startRaw instanceof Date ? startRaw : new Date(startRaw);
    if (isNaN(startTime.getTime())) return false;

    const now = new Date();
    const diffHours = (startTime - now) / (1000 * 60 * 60);

    return diffHours >= 24;
  })();

  // ✅ CÓ ĐƯỢC ĐỔI LỊCH HAY KHÔNG (status phải là "not yet")
  const canRescheduleSelectedEvent = (() => {
    if (!selectedEvent) return false;
    return (selectedEvent.status || "").toLowerCase() === "not yet";
  })();

  // bắt đầu chế độ đổi lịch – set ngày mặc định = ngày sự kiện
  const startReschedule = () => {
    if (!selectedEvent) return;
    const baseDate =
      selectedEvent.date instanceof Date
        ? selectedEvent.date
        : new Date(selectedEvent.date);

    setRescheduleDate(baseDate);
    setRescheduleVnDate(toDDMMYYYY(baseDate));
    setShowRescheduleForm(true);
  };

  // SUBMIT ĐỔI LỊCH – PUT /TrainingSession/{id}/reschedule
  const handleRescheduleSubmit = async () => {
    if (!selectedEvent || !selectedEvent.id) {
      message.error("Không tìm thấy buổi tập để đổi lịch.");
      return;
    }
    if (!rescheduleDate || !rescheduleSlotId) {
      message.warning("Vui lòng chọn ngày mới và khung giờ mới.");
      return;
    }

    // 1 ngày chỉ 1 slot – không trùng ngày với event khác
    if (dayAlreadyBooked(rescheduleDate, selectedEvent.id)) {
      message.warning(
        "Ngày này đã có buổi tập khác. Vui lòng chọn ngày khác."
      );
      return;
    }

    const isoDate = dateObjToISO(rescheduleDate);
    const slotObj = allSlots.find(
      (s) => String(s.id) === String(rescheduleSlotId)
    );
    if (!slotObj) {
      message.error("Không tìm thấy thông tin khung giờ.");
      return;
    }

    // phải trước 24h (slot mới)
    const [sh, sm] = slotObj.start.split(":").map(Number);
    const newDateTime = new Date(
      `${isoDate}T${String(sh).padStart(2, "0")}:${String(sm).padStart(
        2,
        "0"
      )}:00`
    );
    const now = new Date();
    const diffHours = (newDateTime - now) / (1000 * 60 * 60);
    if (diffHours < 24) {
      message.warning(
        "Vui lòng chọn khung giờ mới cách thời điểm hiện tại ít nhất 24 giờ."
      );
      return;
    }

    try {
      setRescheduleLoading(true);

      await api.put(`/TrainingSession/${selectedEvent.id}/reschedule`, {
        newSessionDate: isoDate,
        newTimeSlotId: slotObj.id,
      });

      // update lại dataRef.current
      const timeLabel = `${slotObj.start}-${slotObj.end}`;
      dataRef.current = dataRef.current.map((ev) =>
        ev.id === selectedEvent.id
          ? { ...ev, date: isoDate, time: timeLabel }
          : ev
      );

      if (window.jQuery && holderRef.current) {
        window.jQuery(holderRef.current).calendar({
          data: normalizeMockData(dataRef.current),
          onOpenEvent: handleOpenEventRef.current, // ✅ luôn truyền
        });
      }

      message.success("Đổi lịch thành công.");

      // đóng modal
      try {
        const ModalClass = window.bootstrap && window.bootstrap.Modal;
        if (ModalClass && eventModalRef.current) {
          const inst =
            ModalClass.getInstance(eventModalRef.current) ||
            new ModalClass(eventModalRef.current);
          inst.hide();
        } else {
          eventModalRef.current
            ?.querySelector(".btn-close")
            ?.click();
        }
      } catch (e) {
        console.warn("Cannot close event modal:", e);
        eventModalRef.current?.querySelector(".btn-close")?.click();
      }

      // reset form đổi lịch
      setShowRescheduleForm(false);
      setRescheduleDate(null);
      setRescheduleVnDate("");
      setRescheduleSlotId("");
      setRescheduleDisabledSlots(new Set());
    } catch (err) {
      console.error("Reschedule session error:", err);
      const apiMsg =
        err?.response?.data?.message || err?.response?.data?.title;
      message.error(
        apiMsg || "Có lỗi khi đổi lịch. Vui lòng thử lại sau."
      );
    } finally {
      setRescheduleLoading(false);
    }
  };

  // ✅ TÍNH CAN CANCEL / CAN RESCHEDULE (đã ở trên)

  return (
    <div className="container mt-5 mb-5">
      <style>{`
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

        .btn-booking{
          background:#c80036;
          border-color:#c80036;
          color:#fff;
          font-weight:700;
          padding:10px 20px;
          transform: skewX(-10deg);
          transition:0.2s ease-in-out;
        }
        .btn-booking span{
          display:inline-block;
          transform:skewX(10deg);
        }
        .btn-booking:hover{
          filter:brightness(0.92);
          transform:skewX(-10deg) scale(1.02);
        }

        .calendar-table{ width:100%; table-layout:fixed; border-collapse:separate; border-spacing:0; }
        .calendar-table th, .calendar-table td{ vertical-align:top; }
        .calendar-table thead .c-weeks th, .calendar-table tbody td.calendar-day{ width:14.285714%; }

        .calendar-day{
          position:relative; padding:8px; min-height:110px; background:#fff; border:1px solid #e5e7eb;
          overflow:hidden; word-wrap:break-word; transition:background-color .15s ease, border-color .15s ease;
        }
        .calendar-day .date{ font-weight:600; margin-bottom:6px; }
        .current{ background:#fff; }
        .prev-month, .next-month{ background:#f4f5f7 !important; color:#9aa0a6; opacity:.9; }
        .prev-month .date, .next-month .date{ color:#9aa0a6; font-weight:600; }

        .calendar-day.today{
          background:#fff7cc !important;
          border:1px solid #ffd24d !important;
          box-shadow:inset 0 0 0 2px #ffe58a;
        }
        .calendar-day.today .date{ font-weight:800; color:#b45309; }

        .calendar-day.has-event{ background:#fff3f5 !important; border:1px solid #ffc7d2 !important; }
        .calendar-day.has-event .date{ font-weight:700; color:#c80036; }
        .calendar-day.has-event.today{ background:#ffe9a8 !important; border-color:#ffcc66 !important; }

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

        .event-chip.status-present{ background:#e6ffed; border-color:#9ae6b4; }
        .event-chip.status-present .event-chip-badge{ background:#34d399; color:#053321; }

        .event-chip.status-absent{ background:#ffe6e6; border-color:#ffb3b3; }
        .event-chip.status-absent .event-chip-badge{ background:#f87171; color:#4a0a0a; }

        .event-chip.status-not\\ yet,
        .event-chip.status-not-yet{
          background:#f1f5f9;
          border-color:#cbd5e1;
        }
        .event-chip.status-not\\ yet .event-chip-badge,
        .event-chip.status-not-yet .event-chip-badge{
          background:#94a3b8; color:#0f172a;
        }

        .calendar-table td.calendar-month{
          width:25%; padding:12px; cursor:pointer; border:1px solid #e5e7eb; background:#fff;
          transition:background-color .15s ease, border-color .15s ease;
        }
        .calendar-table td.calendar-month:hover{ background:#fafafa; }
        .calendar-table td.calendar-month .badge{ margin-left:.5rem; vertical-align:middle; }

        .popover{ z-index:1080; max-width:320px; }
        .popover .list-group-item{ text-align:left; }

        @media (max-width: 576px){
          .calendar-day{ min-height:90px; padding:6px; }
          .event-chip{ font-size:11px; }
          .event-chip-time{ font-size:10px; }
          .nav-arrow{ font-size:20px; padding:2px 8px; }
        }
      `}</style>

      {/* TIÊU ĐỀ + NÚT BOOKING */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 style={{ margin: 0, color: "#c80036", fontWeight: "bold" }}>
          Lịch
        </h1>
        <button
          className="btn btn-booking"
          data-bs-toggle="modal"
          data-bs-target="#bookingModal"
        >
          <span>Đặt lịch tập</span>
        </button>
      </div>

      {/* MODAL: Đặt lịch tập */}
      <div
        className="modal fade"
        id="bookingModal"
        tabIndex="-1"
        aria-hidden="true"
        ref={bookingModalRef}
      >
        <div className="modal-dialog">
          <form
            className="modal-content"
            onSubmit={async (e) => {
              e.preventDefault();

              // 🔒 nếu đang booking thì không gửi thêm
              if (bookingInProgressRef.current) return;
              bookingInProgressRef.current = true;
              setBookingLoading(true);

              try {
                const fd = new FormData(e.currentTarget);
                const vnDateFromForm = (fd.get("date_vn") || "")
                  .toString()
                  .trim();
                const isoDate = parseVNDateToISO(vnDateFromForm);

                if (!isoDate) {
                  message.error(
                    "Ngày không hợp lệ. Vui lòng chọn theo định dạng dd/mm/yyyy."
                  );
                  return;
                }

                if (!memberPackageId) {
                  message.error(
                    "Bạn chưa có gói tập đang hoạt động. Vui lòng mua gói trước khi đặt lịch."
                  );
                  return;
                }

                if (dataRef.current.some((ev) => ev.date === isoDate)) {
                  message.warning(
                    "Mỗi ngày chỉ được đặt 1 slot. Vui lòng chọn ngày khác."
                  );
                  return;
                }

                const slotId = selectedSlotId;
                if (!slotId || disabledSlots.has(String(slotId))) {
                  message.error("Khung giờ không hợp lệ.");
                  return;
                }

                const slotObj = allSlots.find(
                  (s) => String(s.id) === String(slotId)
                );
                if (!slotObj) {
                  message.error(
                    "Không tìm thấy thông tin khung giờ. Vui lòng tải lại trang."
                  );
                  return;
                }

                const { start, end, id: timeSlotId } = slotObj;

                // phải trước 24h
                const [sh, sm] = start.split(":").map(Number);
                const bookingDateTime = new Date(
                  `${isoDate}T${String(sh).padStart(2, "0")}:${String(
                    sm
                  ).padStart(2, "0")}:00`
                );
                const now = new Date();
                const diffHours =
                  (bookingDateTime - now) / (1000 * 60 * 60);
                if (diffHours < 24) {
                  message.warning(
                    "Vui lòng đặt lịch trước ít nhất 24 giờ."
                  );
                  return;
                }

                const timeLabel = `${start}-${end}`;

                const payload = {
                  sessionDate: isoDate,
                  timeSlotId: timeSlotId,
                  memberPackageId: memberPackageId,
                  notes: "",
                };
                const res = await api.post("/TrainingSession/book", payload);
                const created = res.data;

                const title = created?.trainerName || "";

                dataRef.current.push({
                  id: created?.id,
                  date: isoDate,
                  time: timeLabel,
                  title,
                  status: "not yet",
                });

                // reset & redraw calendar, đưa date về hiện tại
                if (window.jQuery && holderRef.current) {
                  window.jQuery(holderRef.current).calendar({
                    date: new Date(),
                    data: normalizeMockData(dataRef.current),
                    onOpenEvent: handleOpenEventRef.current,
                  });
                }

                message.success("Đã đặt lịch thành công!");

                // Tự tắt modal (chắc chắn)
                try {
                  const ModalClass =
                    window.bootstrap && window.bootstrap.Modal;
                  if (ModalClass && bookingModalRef.current) {
                    const inst =
                      ModalClass.getInstance(bookingModalRef.current) ||
                      new ModalClass(bookingModalRef.current);
                    inst.hide();
                  } else {
                    bookingModalRef.current
                      ?.querySelector(".btn-close")
                      ?.click();
                  }
                } catch (errHide) {
                  console.warn("Cannot close booking modal:", errHide);
                  bookingModalRef.current
                    ?.querySelector(".btn-close")
                    ?.click();
                }

                // Reset form + state ngày/slot về hôm nay
                e.currentTarget.reset();
                const nowDate = new Date();
                setSelectedDate(nowDate);
                setVnDate(toDDMMYYYY(nowDate));

                if (allSlots.length) {
                  const ds = computeDisabledSlots(nowDate);
                  setDisabledSlots(ds);
                  const firstValid = allSlots.find(
                    (s) => !ds.has(String(s.id))
                  );
                  setSelectedSlotId(firstValid ? String(firstValid.id) : "");
                } else {
                  setDisabledSlots(new Set());
                  setSelectedSlotId("");
                }
              } catch (err) {
                console.error("Book session error:", err);

                const apiMsg = err?.response?.data?.message;

                if (apiMsg === "No remaining sessions in this package") {
                  message.error(
                    "Bạn đã sử dụng hết số buổi trong gói này. Vui lòng gia hạn hoặc mua gói mới trước khi đặt thêm lịch."
                  );
                } else if (apiMsg) {
                  message.error(apiMsg);
                } else {
                  message.error(
                    "Có lỗi khi đặt lịch. Vui lòng thử lại sau."
                  );
                }
              } finally {
                bookingInProgressRef.current = false;
                setBookingLoading(false);
              }
            }}
          >
            <div className="modal-header">
              <h5 className="modal-title">Chọn lịch tập</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>

            <div className="modal-body">
              {/* Date dd/mm/yyyy */}
              <div className="mb-3">
                <label className="form-label d-block">
                  Ngày (dd/mm/yyyy)
                </label>
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
                    minDate={new Date()}
                    className="form-control"
                    wrapperClassName="w-100"
                  />
                  <input type="hidden" name="date_vn" value={vnDate || ""} />
                </div>
                {dayAlreadyBooked(selectedDate) && (
                  <div className="form-text text-danger mt-2">
                    Ngày này đã có lịch. Vui lòng chọn ngày khác.
                  </div>
                )}
              </div>

              {/* Timeslot select */}
              <div className="mb-3">
                <label className="form-label">Timeslot</label>
                {slotsLoading && (
                  <div className="form-text text-muted">
                    Đang tải khung giờ...
                  </div>
                )}
                {slotsError && (
                  <div className="form-text text-danger">{slotsError}</div>
                )}
                <select
                  name="slot"
                  className="form-select"
                  required
                  value={selectedSlotId}
                  onChange={(e) => setSelectedSlotId(e.target.value)}
                  disabled={
                    dayAlreadyBooked(selectedDate) || !allSlots.length
                  }
                >
                  {allSlots.map((s) => (
                    <option
                      key={s.id}
                      value={s.id}
                      disabled={disabledSlots.has(String(s.id))}
                    >
                      {s.label}
                    </option>
                  ))}
                </select>
                {(dayAlreadyBooked(selectedDate) ||
                  (allSlots.length &&
                    allSlots.every((s) =>
                      disabledSlots.has(String(s.id))
                    ))) && (
                  <div className="form-text text-danger mt-1">
                    {dayAlreadyBooked(selectedDate)
                      ? "Ngày này đã có lịch."
                      : "Không còn khung giờ khả dụng."}
                  </div>
                )}
              </div>

              {packageError && (
                <div className="alert alert-warning py-2 mb-0">
                  {packageError}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={
                  bookingLoading ||
                  !selectedSlotId ||
                  disabledSlots.has(String(selectedSlotId)) ||
                  dayAlreadyBooked(selectedDate) ||
                  !allSlots.length ||
                  !memberPackageId
                }
              >
                {bookingLoading ? "Đang lưu..." : "Lưu"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* MODAL CHI TIẾT EVENT */}
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
                {selectedEvent?.title || "Chi tiết sự kiện"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={() => {
                  setSelectedEvent(null);
                  setShowRescheduleForm(false);
                  setRescheduleDate(null);
                  setRescheduleVnDate("");
                  setRescheduleSlotId("");
                  setRescheduleDisabledSlots(new Set());
                }}
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
                  <div className="mb-2">
                    Trạng thái:{" "}
                    <span
                      className={
                        (selectedEvent.status || "").toLowerCase() ===
                        "present"
                          ? "badge bg-success"
                          : (selectedEvent.status || "").toLowerCase() ===
                            "absent"
                          ? "badge bg-danger"
                          : "badge bg-secondary"
                      }
                    >
                      {selectedEvent.status}
                    </span>
                  </div>
                  {!canCancelSelectedEvent && (
                    <div className="text-muted small mb-3">
                      Lưu ý: Chỉ có thể hủy lịch trước giờ tập ít nhất 24 giờ.
                    </div>
                  )}

                  {/* Form đổi lịch */}
                  {showRescheduleForm && (
                    <>
                      <hr />
                      <h6 className="mb-2">Đổi lịch buổi tập</h6>
                      <div className="mb-3">
                        <label className="form-label d-block">
                          Ngày mới (dd/mm/yyyy)
                        </label>
                        <DatePicker
                          selected={rescheduleDate}
                          onChange={(date) => {
                            setRescheduleDate(date);
                            setRescheduleVnDate(
                              date ? toDDMMYYYY(date) : ""
                            );
                          }}
                          dateFormat="dd/MM/yyyy"
                          placeholderText="dd/mm/yyyy"
                          showMonthDropdown
                          showYearDropdown
                          dropdownMode="select"
                          minDate={new Date()}
                          className="form-control"
                          wrapperClassName="w-100"
                        />
                        {selectedEvent &&
                          rescheduleDate &&
                          dayAlreadyBooked(
                            rescheduleDate,
                            selectedEvent.id
                          ) && (
                            <div className="form-text text-danger mt-2">
                              Ngày này đã có buổi tập khác. Vui lòng chọn
                              ngày khác.
                            </div>
                          )}
                      </div>

                      <div className="mb-2">
                        <label className="form-label">Timeslot mới</label>
                        <select
                          className="form-select"
                          value={rescheduleSlotId}
                          onChange={(e) =>
                            setRescheduleSlotId(e.target.value)
                          }
                          disabled={
                            !rescheduleDate ||
                            !allSlots.length ||
                            dayAlreadyBooked(
                              rescheduleDate,
                              selectedEvent.id
                            )
                          }
                        >
                          <option value="">-- Chọn khung giờ --</option>
                          {allSlots.map((s) => (
                            <option
                              key={s.id}
                              value={s.id}
                              disabled={rescheduleDisabledSlots.has(
                                String(s.id)
                              )}
                            >
                              {s.label}
                            </option>
                          ))}
                        </select>
                        {rescheduleDate &&
                          allSlots.length > 0 &&
                          !dayAlreadyBooked(
                            rescheduleDate,
                            selectedEvent?.id
                          ) &&
                          allSlots.every((s) =>
                            rescheduleDisabledSlots.has(String(s.id))
                          ) && (
                            <div className="form-text text-danger mt-1">
                              Không còn khung giờ khả dụng (cách hiện tại &lt;
                              24 giờ).
                            </div>
                          )}
                      </div>

                      <div className="text-muted small mt-1">
                        Lưu ý: Khung giờ mới phải cách thời điểm hiện tại ít
                        nhất <strong>24 giờ</strong>.
                      </div>
                    </>
                  )}
                </>
              ) : (
                <div className="text-muted">
                  Không có dữ liệu sự kiện.
                </div>
              )}
            </div>
            <div className="modal-footer">
              {canCancelSelectedEvent && (
                <button
                  type="button"
                  className="btn btn-danger me-auto"
                  onClick={() => handleCancelEvent(selectedEvent)}
                >
                  Hủy lịch
                </button>
              )}

              {canRescheduleSelectedEvent && (
                <button
                  type="button"
                  className="btn btn-light"
                  onClick={() => {
                    if (!showRescheduleForm) {
                      startReschedule();
                    } else {
                      handleRescheduleSubmit();
                    }
                  }}
                  disabled={
                    showRescheduleForm &&
                    (rescheduleLoading ||
                      !selectedEvent ||
                      !rescheduleDate ||
                      !rescheduleSlotId ||
                      rescheduleDisabledSlots.has(
                        String(rescheduleSlotId)
                      ) ||
                      dayAlreadyBooked(
                        rescheduleDate,
                        selectedEvent?.id
                      ))
                  }
                >
                  {showRescheduleForm
                    ? rescheduleLoading
                      ? "Đang đổi lịch..."
                      : "Lưu đổi lịch"
                    : "Đổi lịch"}
                </button>
              )}
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

            {{ if (mode === 'year') { month = 0; }}
            <tbody>
              {{ for (j = 0; j < 3; j++) { }}
              <tr>
                {{ for (i = 0; i < 4; i++) { }}
                <td class="calendar-month month-{{:month}} js-cal-option"
                    data-date="{{: new Date(year, month, 1).toISOString() }}"
                    data-mode="month">
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
              {{ for (j = 0; j < 6 && (mode === 'month' ? thedate <= last : j < 1); j++) { }}
              <tr>
                {{ for (i = 0; i < 7; i++) { }}
                {{ if (thedate > last) { dayclass = nextmonthcss; } 
                  else if (thedate >= first) { dayclass = thismonthcss; } }}
                <td class="calendar-day {{: dayclass }} {{: thedate.toDateCssClass() }}
                      {{: date.toDateCssClass() === thedate.toDateCssClass() ? 'selected':'' }}
                      {{: daycss[i] }} js-cal-option"
                    data-date="{{: thedate.toISOString() }}">
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
