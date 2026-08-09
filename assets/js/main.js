(() => {
  "use strict";

  const WHATSAPP_NUMBER = "27795567346";
  const AGE_GATE_KEY = "massageByAshleighAgeVerifiedSessionV4";

  const byId = (id) => document.getElementById(id);

  // Age gate
  const ageGate = byId("ageGateModal");
  const enterButton = byId("ageGateEnter");
  const exitButton = byId("ageGateExit");
  let previouslyFocusedElement = null;

  const getFocusableElements = () => {
    if (!ageGate) return [];
    return [...ageGate.querySelectorAll(
      'button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )].filter((element) =>
      !element.hasAttribute("disabled") &&
      !element.hidden &&
      element.getClientRects().length > 0
    );
  };

  const openAgeGate = () => {
    if (!ageGate) return;
    previouslyFocusedElement = document.activeElement;
    ageGate.hidden = false;
    ageGate.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    window.requestAnimationFrame(() => {
      ageGate.classList.add("is-active");
      enterButton?.focus();
    });
  };

  const closeAgeGate = () => {
    if (!ageGate) return;
    ageGate.classList.remove("is-active");
    ageGate.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    window.setTimeout(() => {
      ageGate.hidden = true;
      previouslyFocusedElement?.focus?.();
    }, 250);
  };

  const hasVerifiedAge = () => {
    try {
      return window.sessionStorage.getItem(AGE_GATE_KEY) === "true";
    } catch {
      return false;
    }
  };

  if (hasVerifiedAge()) {
    if (ageGate) {
      ageGate.hidden = true;
      ageGate.setAttribute("aria-hidden", "true");
    }
  } else {
    openAgeGate();
  }

  enterButton?.addEventListener("click", () => {
    try {
      window.sessionStorage.setItem(AGE_GATE_KEY, "true");
    } catch {
      // The gate can still close when storage is unavailable.
    }
    closeAgeGate();
  });

  exitButton?.addEventListener("click", () => {
    try {
      window.sessionStorage.removeItem(AGE_GATE_KEY);
    } catch {
      // Ignore storage restrictions.
    }

    if (window.history.length > 1 && document.referrer) {
      window.history.back();
    } else {
      window.location.replace("about:blank");
    }
  });

  ageGate?.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      enterButton?.focus();
      return;
    }

    if (event.key !== "Tab") return;
    const focusable = getFocusableElements();
    if (!focusable.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  // Shared page utilities
  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const backToTop = byId("backToTop");
  const updateBackToTop = () => {
    if (!backToTop) return;
    const show = window.scrollY > 420;
    backToTop.classList.toggle("show", show);
    backToTop.tabIndex = show ? 0 : -1;
  };

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();

  // Live Johannesburg business status. Public holidays are always confirmed manually.
  const businessStatus = byId("businessStatus");
  const statusText = byId("statusText");
  const statusDetail = byId("statusDetail");

  const getJohannesburgTime = () => {
    const formatter = new Intl.DateTimeFormat("en-ZA", {
      timeZone: "Africa/Johannesburg",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    });

    return Object.fromEntries(
      formatter.formatToParts(new Date()).map(({ type, value }) => [type, value])
    );
  };

  const updateBusinessStatus = () => {
    if (!businessStatus || !statusText || !statusDetail) return;

    try {
      const parts = getJohannesburgTime();
      const day = parts.weekday;
      const minutes = Number(parts.hour) * 60 + Number(parts.minute);
      let isOpen = false;
      let closingTime = "";

      if (["Tue", "Wed", "Thu", "Fri"].includes(day)) {
        isOpen = minutes >= 540 && minutes < 1020;
        closingTime = "17:00";
      } else if (day === "Sat") {
        isOpen = minutes >= 540 && minutes < 900;
        closingTime = "15:00";
      }

      businessStatus.dataset.state = isOpen ? "open" : "closed";
      statusText.textContent = isOpen ? "Open now" : "Closed now";
      statusDetail.textContent = isOpen
        ? `Currently open until ${closingTime}. Strictly by appointment.`
        : "Currently unavailable.";
    } catch {
      businessStatus.dataset.state = "unknown";
      statusText.textContent = "Confirm availability";
      statusDetail.textContent = "Strictly by appointment. Please check availability on WhatsApp.";
    }
  }

  updateBusinessStatus();
  window.setInterval(updateBusinessStatus, 60000);

  // Booking form
  const bookingForm = document.querySelector("[data-whatsapp-form]");
  const nameInput = byId("name");
  const clientType = byId("clientType");
  const serviceSelect = byId("service");
  const dateInput = byId("date");
  const dateDisplay = byId("dateDisplay");
  const timeSelect = byId("time");
  const calendarDays = byId("calendarDays");
  const calendarMonthLabel = byId("calendarMonthLabel");
  const calendarSync = byId("calendarSync");
  const calendarPrev = byId("calendarPrev");
  const calendarNext = byId("calendarNext");
  const gfeAddon = byId("gfeAddon");
  const coveredAddon = byId("coveredAddon");
  const coveredAddonLabel = byId("coveredAddonLabel");
  const addonHelp = byId("addonHelp");
  const notesInput = byId("message");
  const basePriceOutput = byId("basePrice");
  const addonPriceOutput = byId("addonPrice");
  const totalPriceOutput = byId("totalPrice");
  const depositPriceOutput = byId("depositPrice");
  const balancePriceOutput = byId("balancePrice");

  const formatMoney = (amount) => {
    if (!Number.isFinite(amount)) return "—";
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      maximumFractionDigits: 0
    }).format(amount).replace(/\u00a0/g, " ");
  };

  const localDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const parseLocalDate = (value) => {
    if (!value) return null;
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  };

  const formatDate = (value) => {
    const date = parseLocalDate(value);
    if (!date) return "";
    return new Intl.DateTimeFormat("en-ZA", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(date);
  };

  const getSelectedService = () => {
    const option = serviceSelect?.selectedOptions?.[0];
    if (!option || !option.value) return null;
    return {
      value: option.value,
      title: option.dataset.title || option.textContent.trim(),
      duration: Number(option.dataset.duration) || 30,
      price: Number(option.dataset.price) || 0,
      coveredAddonAllowed: option.dataset.coveredAddon === "true",
      label: option.textContent.trim()
    };
  };

  const setDateHelp = (input, message, isError = false) => {
    const helperId = input?.getAttribute("aria-describedby");
    const helper = helperId ? byId(helperId) : null;
    if (!helper) return;
    helper.textContent = message;
    helper.classList.toggle("field-error", isError);
  };

  // Live schedule shared with the private Booking-Schedule app.
  let scheduleDb = null;
  let scheduleChannel = null;
  let scheduleReady = false;
  let liveSchedule = {};
  let calendarViewDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  let selectedDateKey = "";

  const pad2 = (value) => String(value).padStart(2, "0");

  const addDays = (date, amount) => {
    const copy = new Date(date);
    copy.setDate(copy.getDate() + amount);
    return copy;
  };

  const easterSunday = (year) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  };

  const southAfricanPublicHolidays = (year) => {
    const easter = easterSunday(year);
    const holidays = [
      { date: new Date(year, 0, 1), name: "New Year's Day" },
      { date: new Date(year, 2, 21), name: "Human Rights Day" },
      { date: addDays(easter, -2), name: "Good Friday" },
      { date: addDays(easter, 1), name: "Family Day" },
      { date: new Date(year, 3, 27), name: "Freedom Day" },
      { date: new Date(year, 4, 1), name: "Workers' Day" },
      { date: new Date(year, 5, 16), name: "Youth Day" },
      { date: new Date(year, 7, 9), name: "National Women's Day" },
      { date: new Date(year, 8, 24), name: "Heritage Day" },
      { date: new Date(year, 11, 16), name: "Day of Reconciliation" },
      { date: new Date(year, 11, 25), name: "Christmas Day" },
      { date: new Date(year, 11, 26), name: "Day of Goodwill" }
    ];

    const expanded = [...holidays];
    holidays.forEach((holiday) => {
      if (holiday.date.getDay() === 0) {
        expanded.push({ date: addDays(holiday.date, 1), name: `${holiday.name} (observed)` });
      }
    });
    return expanded;
  };

  const publicHolidayFor = (key) => {
    const date = parseLocalDate(key);
    if (!date) return null;
    return southAfricanPublicHolidays(date.getFullYear())
      .find((item) => localDateString(item.date) === key) || null;
  };

  const makeBusinessSlots = (startHour, endHour) => {
    const slots = [];
    for (let hour = startHour; hour <= endHour; hour += 1) {
      slots.push(`${pad2(hour)}:00`);
      if (hour < endHour) {
        slots.push(`${pad2(hour)}:15`);
        slots.push(`${pad2(hour)}:30`);
      }
    }
    return slots;
  };

  const baseAvailabilityForDay = (key) => {
    const date = parseLocalDate(key);
    if (!date) return { closed: true, holiday: false, holidayName: "", slots: [] };

    const holiday = publicHolidayFor(key);
    if (holiday) {
      return {
        closed: false,
        holiday: true,
        holidayName: holiday.name,
        slots: makeBusinessSlots(9, 15)
      };
    }

    const weekday = date.getDay();
    if (weekday === 0 || weekday === 1) {
      return { closed: true, holiday: false, holidayName: "", slots: [] };
    }
    if (weekday === 6) {
      return { closed: false, holiday: false, holidayName: "", slots: makeBusinessSlots(9, 15) };
    }
    return { closed: false, holiday: false, holidayName: "", slots: makeBusinessSlots(9, 17) };
  };

  const timeToMinutes = (value) => {
    const [hours, minutes] = String(value).split(":").map(Number);
    return (hours * 60) + minutes;
  };

  const getScheduleDay = (key) => liveSchedule[key] || { wholeDay: false, blockedSlots: [], customSlots: [], publicNote: "" };

  const publicNoteForDay = (key) => String(getScheduleDay(key).publicNote || "").trim();

  const isClosedDay = (value) => baseAvailabilityForDay(value).closed;

  const eligibleStartSlots = (key, service) => {
    const base = baseAvailabilityForDay(key);
    if (base.closed || !service) return [];

    const closeMinutes = base.holiday || parseLocalDate(key)?.getDay() === 6 ? 15 * 60 : 17 * 60;
    const latestStart = closeMinutes - service.duration;
    return base.slots.filter((slot) => timeToMinutes(slot) <= latestStart);
  };

  const availableStartSlots = (key, service) => {
    const dayData = getScheduleDay(key);
    if (dayData.wholeDay) return [];

    const blocked = new Set(dayData.blockedSlots || []);
    return eligibleStartSlots(key, service).filter((start) => {
      const startMinutes = timeToMinutes(start);
      const endMinutes = startMinutes + service.duration;
      return ![...blocked].some((blockedTime) => {
        const blockedMinutes = timeToMinutes(blockedTime);
        return blockedMinutes >= startMinutes && blockedMinutes < endMinutes;
      });
    });
  };

  const statusForDay = (key) => {
    const base = baseAvailabilityForDay(key);
    if (base.closed) return "closed";

    const date = parseLocalDate(key);
    const today = parseLocalDate(localDateString(new Date()));
    if (date && today && date < today) return "past";

    const dayData = getScheduleDay(key);
    if (dayData.wholeDay) return "blocked";

    const service = getSelectedService();
    if (service) {
      const eligible = eligibleStartSlots(key, service);
      const available = availableStartSlots(key, service);
      if (!available.length) return "blocked";
      if (available.length < eligible.length) return "partial";
      return base.holiday ? "holiday" : "available";
    }

    const blocked = new Set(dayData.blockedSlots || []);
    if (base.slots.length && base.slots.every((time) => blocked.has(time))) return "blocked";
    if (blocked.size) return "partial";
    return base.holiday ? "holiday" : "available";
  };

  const setCalendarSync = (message, state = "live") => {
    if (!calendarSync) return;
    calendarSync.textContent = message;
    calendarSync.dataset.state = state;
  };

  const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

  const monthDates = (monthDate) => {
    const first = startOfMonth(monthDate);
    const start = new Date(first);
    const mondayOffset = (first.getDay() + 6) % 7;
    start.setDate(first.getDate() - mondayOffset);
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  };

  const renderBookingCalendar = () => {
    if (!calendarDays || !calendarMonthLabel) return;

    calendarMonthLabel.textContent = new Intl.DateTimeFormat("en-ZA", {
      month: "long",
      year: "numeric"
    }).format(calendarViewDate);

    calendarDays.innerHTML = "";
    const currentMonth = calendarViewDate.getMonth();
    const currentYear = calendarViewDate.getFullYear();
    const todayKey = localDateString(new Date());

    monthDates(calendarViewDate).forEach((date) => {
      const key = localDateString(date);
      const status = statusForDay(key);
      const base = baseAvailabilityForDay(key);
      const outside = date.getMonth() !== currentMonth || date.getFullYear() !== currentYear;
      const disabled = outside || ["closed", "blocked", "past"].includes(status);
      const button = document.createElement("button");
      button.type = "button";
      button.className = `calendar-day ${status}${outside ? " outside" : ""}${key === selectedDateKey ? " selected" : ""}${key === todayKey ? " today" : ""}`;
      button.disabled = disabled;
      button.dataset.date = key;
      button.setAttribute("role", "gridcell");

      const statusLabel = status === "available" || status === "holiday"
        ? "Available"
        : status === "partial"
          ? "Limited availability"
          : status === "closed"
            ? "Closed"
            : status === "past"
              ? "Past date"
              : "Unavailable";
      const holidayLabel = base.holiday ? `, ${base.holidayName}` : "";
      const publicNote = publicNoteForDay(key);
      const noteLabel = publicNote ? `, Client notice: ${publicNote}` : "";
      button.setAttribute("aria-label", `${formatDate(key)}: ${statusLabel}${holidayLabel}${noteLabel}`);
      button.title = `${statusLabel}${holidayLabel}${publicNote ? ` — ${publicNote}` : ""}`;
      if (publicNote) button.classList.add("has-note");
      button.innerHTML = `<span class="calendar-day-number">${date.getDate()}</span><span class="calendar-day-status" aria-hidden="true"></span>${publicNote ? '<span class="calendar-day-note-badge" aria-hidden="true">!</span>' : ""}`;

      if (!disabled) {
        button.addEventListener("click", () => {
          selectedDateKey = key;
          if (dateInput) dateInput.value = key;
          if (dateDisplay) {
            dateDisplay.value = formatDate(key);
            dateDisplay.removeAttribute("aria-invalid");
          }
          const publicNote = publicNoteForDay(key);
          setDateHelp(dateDisplay, `${formatDate(key)} selected. Live availability shown below.${publicNote ? ` Client notice: ${publicNote}` : ""}`);
          renderBookingCalendar();
          populateTimes(key, timeSelect);
        });
      }

      calendarDays.appendChild(button);
    });

    const publicNotes = document.getElementById("calendarPublicNotes");
    if (publicNotes) {
      publicNotes.innerHTML = "";
      const notesForMonth = Object.entries(liveSchedule)
        .filter(([day, data]) => {
          const date = parseLocalDate(day);
          return date
            && date.getFullYear() === currentYear
            && date.getMonth() === currentMonth
            && String(data.publicNote || "").trim();
        })
        .sort(([a], [b]) => a.localeCompare(b));

      if (notesForMonth.length) {
        const heading = document.createElement("strong");
        heading.className = "calendar-public-notes-title";
        heading.textContent = "Client availability notices";
        publicNotes.appendChild(heading);

        const list = document.createElement("div");
        list.className = "calendar-public-notes-list";
        notesForMonth.forEach(([day, data]) => {
          const item = document.createElement("p");
          const dateLabel = document.createElement("b");
          dateLabel.textContent = `${formatDate(day)}: `;
          item.appendChild(dateLabel);
          item.appendChild(document.createTextNode(String(data.publicNote || "").trim()));
          list.appendChild(item);
        });
        publicNotes.appendChild(list);
        publicNotes.hidden = false;
      } else {
        publicNotes.hidden = true;
      }
    }

    if (calendarPrev) {
      const thisMonth = startOfMonth(new Date());
      calendarPrev.disabled = calendarViewDate <= thisMonth;
    }
  };

  const validateDateInput = (input) => {
    if (!input) return false;
    dateDisplay?.removeAttribute("aria-invalid");

    const value = selectedDateKey || input.value;
    if (!value) {
      dateDisplay?.setAttribute("aria-invalid", "true");
      setDateHelp(dateDisplay, "Please choose an available date from the live calendar.", true);
      return false;
    }

    const status = statusForDay(value);
    if (["closed", "blocked", "past"].includes(status)) {
      dateDisplay?.setAttribute("aria-invalid", "true");
      setDateHelp(dateDisplay, "That date is no longer available. Please choose another date.", true);
      return false;
    }

    const publicNote = publicNoteForDay(value);
    setDateHelp(dateDisplay, `${formatDate(value)} selected. Live availability shown below.${publicNote ? ` Client notice: ${publicNote}` : ""}`);
    return true;
  };

  const populateTimes = (dateValue, select) => {
    if (!select) return;
    const previousValue = select.value;
    select.innerHTML = "";

    const service = getSelectedService();
    const key = selectedDateKey || dateValue;
    const date = parseLocalDate(key);

    if (!key || !date || !service || isClosedDay(key)) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Choose a service and available date first";
      select.appendChild(option);
      select.disabled = true;
      return;
    }

    const eligible = eligibleStartSlots(key, service);
    const available = new Set(availableStartSlots(key, service));
    const dayData = getScheduleDay(key);

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = available.size ? "Choose an available time" : "No times available on this date";
    select.appendChild(placeholder);

    eligible.forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      if (available.has(value)) {
        option.textContent = value;
      } else {
        option.textContent = `${value} — Unavailable`;
        option.disabled = true;
      }
      select.appendChild(option);
    });

    select.disabled = available.size === 0 || dayData.wholeDay;
    select.required = true;
    if (available.has(previousValue)) select.value = previousValue;

    if (available.size === 0) {
      setDateHelp(dateDisplay, `${formatDate(key)} is fully booked or blocked for this service duration. Please choose another date.`, true);
    }
  };

  const applyScheduleRows = (rows) => {
    liveSchedule = {};
    (rows || []).forEach((row) => {
      liveSchedule[row.day] = {
        wholeDay: Boolean(row.whole_day),
        blockedSlots: Array.isArray(row.blocked_slots) ? row.blocked_slots : [],
        customSlots: Array.isArray(row.custom_slots) ? row.custom_slots : [],
        publicNote: String(row.private_note || "").trim()
      };
    });
  };

  const loadLiveSchedule = async () => {
    if (!scheduleDb) return;
    setCalendarSync("Syncing live availability…", "loading");
    const { data, error } = await scheduleDb
      .from("schedule_days")
      .select("day,whole_day,blocked_slots,custom_slots,private_note");

    if (error) {
      console.error("Schedule sync error:", error);
      scheduleReady = false;
      setCalendarSync("Live sync unavailable — please confirm by WhatsApp", "error");
      renderBookingCalendar();
      populateTimes(selectedDateKey, timeSelect);
      return;
    }

    applyScheduleRows(data);
    scheduleReady = true;
    setCalendarSync("Live schedule connected", "live");

    if (selectedDateKey && ["closed", "blocked", "past"].includes(statusForDay(selectedDateKey))) {
      selectedDateKey = "";
      if (dateInput) dateInput.value = "";
      if (dateDisplay) dateDisplay.value = "";
    }
    renderBookingCalendar();
    populateTimes(selectedDateKey, timeSelect);
  };

  const connectLiveSchedule = () => {
    const url = window.SCHEDULE_SUPABASE_URL;
    const key = window.SCHEDULE_SUPABASE_PUBLISHABLE_KEY;
    if (!window.supabase?.createClient || !url || !key) {
      setCalendarSync("Live sync unavailable — please confirm by WhatsApp", "error");
      renderBookingCalendar();
      return;
    }

    scheduleDb = window.supabase.createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });

    loadLiveSchedule();
    scheduleChannel = scheduleDb
      .channel("website-schedule-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "schedule_days" }, () => {
        loadLiveSchedule();
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED" && scheduleReady) setCalendarSync("Live schedule connected", "live");
      });
  };

  calendarPrev?.addEventListener("click", () => {
    calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() - 1, 1);
    renderBookingCalendar();
  });

  calendarNext?.addEventListener("click", () => {
    calendarViewDate = new Date(calendarViewDate.getFullYear(), calendarViewDate.getMonth() + 1, 1);
    renderBookingCalendar();
  });

  const updateAddonAvailability = () => {
    const service = getSelectedService();
    const allowed = Boolean(service?.coveredAddonAllowed);

    if (coveredAddon) {
      coveredAddon.disabled = !allowed;
      if (!allowed) coveredAddon.checked = false;
    }

    coveredAddonLabel?.classList.toggle("is-disabled", !allowed);
    if (addonHelp) {
      addonHelp.textContent = allowed
        ? "Covered oral is available for the selected Sensual Massage appointment."
        : "Select a Sensual Massage option to enable the covered-oral add-on.";
    }
  };

  const getPriceBreakdown = () => {
    const service = getSelectedService();
    const base = service?.price || 0;
    const isReturning = clientType?.value === "returning";
    const gfePrice = gfeAddon?.checked ? (isReturning ? 0 : 300) : 0;
    const coveredPrice = coveredAddon?.checked ? 100 : 0;
    const addons = gfePrice + coveredPrice;
    const total = base + addons;
    const deposit = clientType?.value === "new" && total ? Math.min(500, total) : 0;
    const balance = total ? total - deposit : 0;
    return { service, base, gfePrice, coveredPrice, addons, total, deposit, balance };
  };

  const updatePriceSummary = () => {
    const price = getPriceBreakdown();
    if (basePriceOutput) basePriceOutput.textContent = price.service ? formatMoney(price.base) : "—";
    if (addonPriceOutput) addonPriceOutput.textContent = formatMoney(price.addons);
    if (totalPriceOutput) totalPriceOutput.textContent = price.service ? formatMoney(price.total) : "—";

    if (depositPriceOutput) {
      if (!clientType?.value) depositPriceOutput.textContent = "Choose client type";
      else if (clientType.value === "new") depositPriceOutput.textContent = formatMoney(price.deposit || 500);
      else depositPriceOutput.textContent = "Not required";
    }

    if (balancePriceOutput) {
      balancePriceOutput.textContent = price.service ? formatMoney(price.balance) : "—";
    }
  };

  serviceSelect?.addEventListener("change", () => {
    updateAddonAvailability();
    renderBookingCalendar();
    populateTimes(selectedDateKey, timeSelect);
    updatePriceSummary();
  });

  clientType?.addEventListener("change", updatePriceSummary);
  gfeAddon?.addEventListener("change", updatePriceSummary);
  coveredAddon?.addEventListener("change", updatePriceSummary);

  updateAddonAvailability();
  updatePriceSummary();
  renderBookingCalendar();
  connectLiveSchedule();

  // Individual service price buttons open the booking form and preselect the exact option.
  const serviceLinks = [...document.querySelectorAll("[data-book-service], [data-book-addon]")];

  const openBookingFromService = (control) => {
    if (!bookingForm) return;

    const requestedService = control.dataset.bookService;
    const requestedAddon = control.dataset.bookAddon;

    if (requestedService && serviceSelect) {
      const matchingOption = serviceSelect.querySelector(`option[value="${requestedService}"]`);
      if (!matchingOption) return;

      serviceSelect.value = requestedService;
      serviceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    }

    if (requestedAddon === "gfe" && gfeAddon) {
      gfeAddon.checked = true;
      gfeAddon.dispatchEvent(new Event("change", { bubbles: true }));
    }

    bookingForm.scrollIntoView({ behavior: "smooth", block: "start" });

    window.setTimeout(() => {
      if (requestedAddon === "gfe") gfeAddon?.focus({ preventScroll: true });
      else serviceSelect?.focus({ preventScroll: true });
    }, 450);
  };

  serviceLinks.forEach((control) => {
    control.addEventListener("click", () => openBookingFromService(control));
  });

  bookingForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const dateIsValid = validateDateInput(dateInput);
    populateTimes(selectedDateKey, timeSelect);

    if (!dateIsValid || !bookingForm.checkValidity()) {
      bookingForm.reportValidity();
      return;
    }

    const price = getPriceBreakdown();
    const addOns = [];
    if (gfeAddon?.checked) {
      addOns.push(price.gfePrice === 0 ? "GFE add-on (repeat-client rate: R0)" : "GFE add-on (+R300)");
    }
    if (coveredAddon?.checked) addOns.push("Covered oral add-on (+R100)");

    const message = [
      "Hello Ashleigh,",
      "",
      "I'd like to request an appointment:",
      `• Name: ${nameInput?.value.trim() || ""}`,
      `• Client type: ${clientType?.selectedOptions?.[0]?.textContent || ""}`,
      `• Service: ${price.service?.label || ""}`,
      `• Add-ons: ${addOns.length ? addOns.join(", ") : "None"}`,
      `• Calculated appointment total: ${formatMoney(price.total)}`,
      clientType?.value === "new"
        ? `• New-client deposit: ${formatMoney(price.deposit)} required to secure the booking`
        : "• Deposit: Not required for returning client",
      `• Remaining balance: ${formatMoney(price.balance)}`,
      `• First preference: ${formatDate(selectedDateKey || dateInput?.value || "")} at ${timeSelect?.value || ""}`,
      notesInput?.value.trim() ? `• Notes: ${notesInput.value.trim()}` : "",
      "",
      "I understand that appointments are strictly by appointment and that the booking is not confirmed until accepted.",
      "",
      "Thank you 💚"
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const newWindow = window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (!newWindow) window.location.href = whatsappUrl;
  });

  window.addEventListener("pagehide", () => {
    if (scheduleDb && scheduleChannel) scheduleDb.removeChannel(scheduleChannel);
  });

  // Gallery carousel
  const gallery = byId("gallery");
  const track = byId("galleryTrack");
  const slides = track ? [...track.querySelectorAll(".gallery-slide")] : [];
  const previousButton = byId("galleryPrev");
  const nextButton = byId("galleryNext");
  const dotsContainer = byId("galleryDots");
  const counter = byId("galleryCounter");
  let currentSlide = 0;
  let touchStartX = 0;
  let touchStartY = 0;

  gallery?.addEventListener("contextmenu", (event) => event.preventDefault());
  gallery?.addEventListener("dragstart", (event) => event.preventDefault());

  slides.forEach((slide) => {
    slide.querySelectorAll("img").forEach((image) => {
      image.draggable = false;
      image.setAttribute("draggable", "false");
    });
  });

  const goToSlide = (index) => {
    if (!track || !slides.length) return;
    currentSlide = (index + slides.length) % slides.length;
    track.style.transform = `translateX(-${currentSlide * 100}%)`;

    slides.forEach((slide, slideIndex) => {
      slide.setAttribute("aria-hidden", String(slideIndex !== currentSlide));
    });

    dotsContainer?.querySelectorAll(".gallery-dot").forEach((dot, dotIndex) => {
      dot.setAttribute("aria-current", String(dotIndex === currentSlide));
      dot.setAttribute("aria-label", `Show gallery image ${dotIndex + 1} of ${slides.length}`);
    });

    if (counter) counter.textContent = `${currentSlide + 1} / ${slides.length}`;
  };

  if (dotsContainer && slides.length) {
    slides.forEach((_, index) => {
      const dot = document.createElement("button");
      dot.className = "gallery-dot";
      dot.type = "button";
      dot.addEventListener("click", () => goToSlide(index));
      dotsContainer.appendChild(dot);
    });
  }

  previousButton?.addEventListener("click", () => goToSlide(currentSlide - 1));
  nextButton?.addEventListener("click", () => goToSlide(currentSlide + 1));

  gallery?.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goToSlide(currentSlide - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      goToSlide(currentSlide + 1);
    } else if (event.key === "Home") {
      event.preventDefault();
      goToSlide(0);
    } else if (event.key === "End") {
      event.preventDefault();
      goToSlide(slides.length - 1);
    }
  });

  gallery?.addEventListener("touchstart", (event) => {
    touchStartX = event.changedTouches[0].screenX;
    touchStartY = event.changedTouches[0].screenY;
  }, { passive: true });

  gallery?.addEventListener("touchend", (event) => {
    const deltaX = event.changedTouches[0].screenX - touchStartX;
    const deltaY = event.changedTouches[0].screenY - touchStartY;
    if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY)) return;
    goToSlide(deltaX > 0 ? currentSlide - 1 : currentSlide + 1);
  }, { passive: true });

  goToSlide(0);

  // Static mobile navigation menu
  const menuToggle = byId("menuToggle");
  const mainNavigation = byId("mainNavigation");
  const mobileMenuQuery = window.matchMedia("(max-width: 900px)");

  const setMobileMenuState = (isOpen, returnFocus = false) => {
    if (!menuToggle || !mainNavigation) return;
    mainNavigation.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    if (returnFocus) menuToggle.focus();
  };

  menuToggle?.addEventListener("click", () => {
    setMobileMenuState(menuToggle.getAttribute("aria-expanded") !== "true");
  });

  mainNavigation?.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => {
      if (mobileMenuQuery.matches) setMobileMenuState(false);
    });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
      setMobileMenuState(false, true);
    }
  });

  const resetMenuForViewport = () => {
    if (!mobileMenuQuery.matches) setMobileMenuState(false);
  };

  if (typeof mobileMenuQuery.addEventListener === "function") {
    mobileMenuQuery.addEventListener("change", resetMenuForViewport);
  } else {
    mobileMenuQuery.addListener(resetMenuForViewport);
  }

  // Highlight the section currently in view.
  const navLinks = [...document.querySelectorAll('.nav a[href^="#"]')];
  const observedSections = navLinks
    .map((link) => document.querySelector(link.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (!visible) return;
      navLinks.forEach((link) => {
        const isCurrent = link.getAttribute("href") === `#${visible.target.id}`;
        if (isCurrent) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: [0.05, 0.2, 0.5] });

    observedSections.forEach((section) => observer.observe(section));
  }

  document.addEventListener("visibilitychange", () => {
    document.querySelectorAll(".sparkles span").forEach((sparkle) => {
      sparkle.style.animationPlayState = document.hidden ? "paused" : "running";
    });
  });
})();
