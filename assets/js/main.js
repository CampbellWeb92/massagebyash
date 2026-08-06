(() => {
  "use strict";

  const WHATSAPP_NUMBER = "27795567346";
  const AGE_GATE_KEY = "massageByAshleighAgeVerifiedSessionV3";

  const ageGate = document.getElementById("ageGateModal");
  const enterButton = document.getElementById("ageGateEnter");
  const exitButton = document.getElementById("ageGateExit");
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
      // Session storage is optional; the modal can still close.
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

  document.querySelectorAll("[data-current-year]").forEach((element) => {
    element.textContent = String(new Date().getFullYear());
  });

  const backToTop = document.getElementById("backToTop");
  const updateBackToTop = () => {
    if (!backToTop) return;
    const show = window.scrollY > 420;
    backToTop.classList.toggle("show", show);
    backToTop.tabIndex = show ? 0 : -1;
  };

  window.addEventListener("scroll", updateBackToTop, { passive: true });
  updateBackToTop();

  const businessStatus = document.getElementById("businessStatus");
  const statusText = document.getElementById("statusText");
  const statusDetail = document.getElementById("statusDetail");

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
        ? `Regular hours run until ${closingTime}. Please confirm appointment availability on WhatsApp.`
        : "Please confirm availability on WhatsApp.";
    } catch {
      businessStatus.dataset.state = "unknown";
      statusText.textContent = "Confirm availability";
      statusDetail.textContent = "Please confirm current availability on WhatsApp.";
    }
  };

  updateBusinessStatus();
  window.setInterval(updateBusinessStatus, 60000);

  const bookingForm = document.querySelector("[data-whatsapp-form]");
  const dateInput = document.getElementById("date");

  if (dateInput) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    dateInput.min = `${yyyy}-${mm}-${dd}`;
  }

  bookingForm?.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("name")?.value.trim() || "";
    const service = document.getElementById("service")?.value || "";
    const date = dateInput?.value || "";
    const time = document.getElementById("time")?.value || "";
    const notes = document.getElementById("message")?.value.trim() || "";

    let formattedDate = "";
    if (date) {
      const [year, month, day] = date.split("-").map(Number);
      formattedDate = new Intl.DateTimeFormat("en-ZA", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      }).format(new Date(year, month - 1, day));
    }

    const message = [
      "Hello Ashleigh,",
      "",
      "I'd like to make a booking:",
      `• Name: ${name}`,
      `• Service: ${service}`,
      formattedDate ? `• Preferred date: ${formattedDate}` : "",
      time ? `• Preferred time: ${time}` : "",
      notes ? `• Notes: ${notes}` : "",
      "",
      "Thank you 💚"
    ].filter(Boolean).join("\n");

    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    const newWindow = window.open(whatsappUrl, "_blank");
    if (newWindow) newWindow.opener = null;
    else window.location.href = whatsappUrl;
  });

  const gallery = document.getElementById("gallery");
  const track = document.getElementById("galleryTrack");
  const slides = track ? [...track.querySelectorAll(".gallery-slide")] : [];
  const previousButton = document.getElementById("galleryPrev");
  const nextButton = document.getElementById("galleryNext");
  const dotsContainer = document.getElementById("galleryDots");
  const counter = document.getElementById("galleryCounter");
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

  const stickyNavigation = document.getElementById("site-navigation");
  const menuToggle = document.getElementById("menuToggle");
  const mainNavigation = document.getElementById("mainNavigation");
  const mobileMenuQuery = window.matchMedia("(max-width: 768px)");

  const updateStickyNavigationOffset = () => {
    if (!stickyNavigation) return;
    document.documentElement.style.setProperty(
      "--sticky-nav-offset",
      `${Math.ceil(stickyNavigation.getBoundingClientRect().height) + 16}px`
    );
  };

  updateStickyNavigationOffset();
  window.addEventListener("resize", updateStickyNavigationOffset, { passive: true });
  window.addEventListener("load", updateStickyNavigationOffset, { once: true });
  document.fonts?.ready.then(updateStickyNavigationOffset).catch(() => {});

  const setMobileMenuState = (isOpen, returnFocus = false) => {
    if (!menuToggle || !mainNavigation) return;

    mainNavigation.classList.toggle("is-open", isOpen);
    updateStickyNavigationOffset();
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute("aria-label", isOpen ? "Close navigation menu" : "Open navigation menu");
    if (returnFocus) menuToggle.focus();
  };

  menuToggle?.addEventListener("click", () => {
    const isOpen = menuToggle.getAttribute("aria-expanded") === "true";
    setMobileMenuState(!isOpen);
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
