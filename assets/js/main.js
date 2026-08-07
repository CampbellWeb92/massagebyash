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
  const timeSelect = byId("time");
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

  const isClosedDay = (value) => {
    const date = parseLocalDate(value);
    if (!date) return false;
    return date.getDay() === 0 || date.getDay() === 1;
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

  const validateDateInput = (input) => {
    if (!input) return false;
    input.setCustomValidity("");
    input.removeAttribute("aria-invalid");

    if (!input.value) {
      setDateHelp(input, "Tuesday to Saturday only. Strictly by appointment.");
      return false;
    }

    if (isClosedDay(input.value)) {
      input.setCustomValidity("Appointments are not available on Sundays or Mondays.");
      input.setAttribute("aria-invalid", "true");
      setDateHelp(input, "Sundays and Mondays are unavailable. Please choose Tuesday to Saturday.", true);
      return false;
    }

    setDateHelp(input, "Available day selected. Strictly by appointment.");
    return true;
  };

  const minutesToTime = (minutes) => {
    const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
    const mins = String(minutes % 60).padStart(2, "0");
    return `${hours}:${mins}`;
  };

  const populateTimes = (dateValue, select) => {
    if (!select) return;
    const previousValue = select.value;
    select.innerHTML = "";

    const service = getSelectedService();
    const date = parseLocalDate(dateValue);

    if (!dateValue || !date || !service || isClosedDay(dateValue)) {
      const option = document.createElement("option");
      option.value = "";
      option.textContent = "Choose a date and service first";
      select.appendChild(option);
      select.disabled = true;
      return;
    }

    const day = date.getDay();
    const open = 9 * 60;
    const close = day === 6 ? 15 * 60 : 17 * 60;
    const latestStart = close - service.duration;

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Choose a time";
    select.appendChild(placeholder);

    for (let minutes = open; minutes <= latestStart; minutes += 30) {
      const value = minutesToTime(minutes);
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      select.appendChild(option);
    }

    select.disabled = false;
    select.required = true;
    if ([...select.options].some((option) => option.value === previousValue)) {
      select.value = previousValue;
    }
  };

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

  if (dateInput) {
    dateInput.min = localDateString(new Date());
  }

  serviceSelect?.addEventListener("change", () => {
    updateAddonAvailability();
    populateTimes(dateInput?.value || "", timeSelect);
    updatePriceSummary();
  });

  clientType?.addEventListener("change", updatePriceSummary);
  gfeAddon?.addEventListener("change", updatePriceSummary);
  coveredAddon?.addEventListener("change", updatePriceSummary);

  dateInput?.addEventListener("change", () => {
    validateDateInput(dateInput);
    populateTimes(dateInput.value, timeSelect);
  });

  updateAddonAvailability();
  updatePriceSummary();

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

    validateDateInput(dateInput);
    populateTimes(dateInput?.value || "", timeSelect);

    if (!bookingForm.checkValidity()) {
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
      `• First preference: ${formatDate(dateInput?.value || "")} at ${timeSelect?.value || ""}`,
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
