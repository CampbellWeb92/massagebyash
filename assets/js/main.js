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
      if (typeof window.MBA_LIVE_BUSINESS_STATUS === "function") {
        const live = window.MBA_LIVE_BUSINESS_STATUS();
        if (live) {
          businessStatus.dataset.state = live.isOpen ? "open" : "closed";
          statusText.textContent = live.isOpen ? "Open now by appointment" : "Closed now";
          statusDetail.textContent = live.detail;
          return;
        }
      }
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

  // Booking form + live Supabase availability
  const bookingForm = document.querySelector("[data-whatsapp-form]");
  const nameInput = byId("name");
  const phoneInput = byId("phone");
  const clientType = byId("clientType");
  const serviceSelect = byId("service");
  const dateInput = byId("date");
  const dateDisplay = byId("dateDisplay");
  const timeInput = byId("time");
  const timeButtons = byId("timeButtons");
  const calendarDays = byId("calendarDays");
  const calendarMonthLabel = byId("calendarMonthLabel");
  const calendarSync = byId("calendarSync");
  const calendarPrev = byId("calendarPrev");
  const calendarNext = byId("calendarNext");
  const nextAvailableCard = byId("nextAvailableCard");
  const nextAvailableText = byId("nextAvailableText");
  const nextAvailableBtn = byId("nextAvailableBtn");
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
    return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 })
      .format(amount).replace(/\u00a0/g, " ");
  };
  const localDateString = (date) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  const parseLocalDate = (value) => { if (!value) return null; const [y,m,d]=value.split("-").map(Number); return new Date(y,m-1,d); };
  const formatDate = (value) => { const date=parseLocalDate(value); return date ? new Intl.DateTimeFormat("en-ZA",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).format(date) : ""; };
  const pad2 = (v) => String(v).padStart(2,"0");
  const timeToMinutes = (value) => { const [h,m]=String(value).slice(0,5).split(":").map(Number); return h*60+m; };
  const minutesToTime = (total) => `${pad2(Math.floor(total/60))}:${pad2(total%60)}`;
  const addDays = (date, amount) => { const copy=new Date(date); copy.setDate(copy.getDate()+amount); return copy; };
  const startOfMonth = (date) => new Date(date.getFullYear(),date.getMonth(),1);

  const getSelectedService = () => {
    const option=serviceSelect?.selectedOptions?.[0];
    if (!option?.value) return null;
    return { value:option.value,title:option.dataset.title||option.textContent.trim(),duration:Number(option.dataset.duration)||30,price:Number(option.dataset.price)||0,coveredAddonAllowed:option.dataset.coveredAddon==="true",label:option.textContent.trim() };
  };
  const setDateHelp = (input,message,isError=false) => {
    const helperId=input?.getAttribute("aria-describedby"),helper=helperId?byId(helperId):null;
    if (!helper) return; helper.textContent=message; helper.classList.toggle("field-error",isError);
  };
  const setTimeHelp = (message,isError=false) => { const h=byId("timeHelp"); if(!h)return; h.textContent=message;h.classList.toggle("field-error",isError); };

  let scheduleDb=null;
  let scheduleChannels=[];
  let scheduleReady=false;
  let liveSchedule={};
  let liveBlocks={};
  let holidayOverrides={};
  let liveSettings={defaultBufferMinutes:15,minNoticeMinutes:120,maxAdvanceDays:60};
  let calendarViewDate=startOfMonth(new Date());
  let selectedDateKey="";
  let nextAvailableChoice=null;

  const easterSunday = (year) => {
    const a=year%19,b=Math.floor(year/100),c=year%100,d=Math.floor(b/4),e=b%4,f=Math.floor((b+8)/25),g=Math.floor((b-f+1)/3);
    const h=(19*a+b-d-g+15)%30,i=Math.floor(c/4),k=c%4,l=(32+2*e+2*i-h-k)%7,m=Math.floor((a+11*h+22*l)/451);
    const month=Math.floor((h+l-7*m+114)/31),day=((h+l-7*m+114)%31)+1;
    return new Date(year,month-1,day);
  };
  const southAfricanPublicHolidays = (year) => {
    const easter=easterSunday(year);
    const holidays=[
      {date:new Date(year,0,1),name:"New Year's Day"},{date:new Date(year,2,21),name:"Human Rights Day"},
      {date:addDays(easter,-2),name:"Good Friday"},{date:addDays(easter,1),name:"Family Day"},
      {date:new Date(year,3,27),name:"Freedom Day"},{date:new Date(year,4,1),name:"Workers' Day"},
      {date:new Date(year,5,16),name:"Youth Day"},{date:new Date(year,7,9),name:"National Women's Day"},
      {date:new Date(year,8,24),name:"Heritage Day"},{date:new Date(year,11,16),name:"Day of Reconciliation"},
      {date:new Date(year,11,25),name:"Christmas Day"},{date:new Date(year,11,26),name:"Day of Goodwill"}
    ];
    const expanded=[...holidays]; holidays.forEach(h=>{if(h.date.getDay()===0)expanded.push({date:addDays(h.date,1),name:`${h.name} (observed)`});}); return expanded;
  };
  const automaticHolidayFor = (key) => { const date=parseLocalDate(key); return date?southAfricanPublicHolidays(date.getFullYear()).find(h=>localDateString(h.date)===key)||null:null; };
  const holidayInfoFor = (key) => {
    const override=holidayOverrides[key],auto=automaticHolidayFor(key);
    if(override?.mode==="normal") return null;
    if(override?.mode==="closed") return {name:override.name||auto?.name||"Public holiday",closed:true,customSlots:[]};
    if(override?.mode==="holiday") return {name:override.name||auto?.name||"Public holiday",closed:false,customSlots:override.customSlots||[]};
    return auto?{name:auto.name,closed:false,customSlots:[]}:null;
  };
  const makeBusinessSlots = (startHour,endHour) => {
    const slots=[]; for(let hour=startHour;hour<=endHour;hour+=1){slots.push(`${pad2(hour)}:00`);if(hour<endHour){slots.push(`${pad2(hour)}:15`);slots.push(`${pad2(hour)}:30`);}} return slots;
  };
  const getScheduleDay = (key) => liveSchedule[key]||{wholeDay:false,blockedSlots:[],customSlots:[],publicNote:""};
  const getBlocks = (key) => liveBlocks[key]||[];
  const publicNoteForDay = (key) => [...new Set([getScheduleDay(key).publicNote,holidayOverrides[key]?.publicNote,...getBlocks(key).map(b=>b.publicNote)].map(v=>String(v||"").trim()).filter(Boolean))].join(" ");
  const baseAvailabilityForDay = (key) => {
    const date=parseLocalDate(key); if(!date)return{closed:true,holiday:false,holidayName:"",slots:[]};
    const dayData=getScheduleDay(key),holiday=holidayInfoFor(key); let closed=false,slots=[],holidayName="";
    if(holiday?.closed){closed=true;holidayName=holiday.name;}
    else if(holiday){holidayName=holiday.name;slots=holiday.customSlots?.length?holiday.customSlots:makeBusinessSlots(9,15);}
    else {const wd=date.getDay();if(wd===0||wd===1)closed=true;else if(wd===6)slots=makeBusinessSlots(9,15);else slots=makeBusinessSlots(9,17);}
    if(dayData.customSlots?.length){closed=false;slots=[...dayData.customSlots].sort();}
    return {closed,holiday:!!holiday,holidayName,slots};
  };
  const johannesburgParts = () => Object.fromEntries(new Intl.DateTimeFormat("en-ZA",{timeZone:"Africa/Johannesburg",year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hourCycle:"h23"}).formatToParts(new Date()).map(({type,value})=>[type,value]));
  const pseudoJohannesburgNow = () => { const p=johannesburgParts();return new Date(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute)); };
  const bookingWindowAllows = (key,time) => {
    const [y,m,d]=key.split("-").map(Number),[h,min]=time.split(":").map(Number);const candidate=new Date(y,m-1,d,h,min),now=pseudoJohannesburgNow();
    const deltaMinutes=(candidate-now)/60000;if(deltaMinutes<liveSettings.minNoticeMinutes)return false;
    const latest=addDays(new Date(now.getFullYear(),now.getMonth(),now.getDate()),liveSettings.maxAdvanceDays);return candidate<=new Date(latest.getFullYear(),latest.getMonth(),latest.getDate(),23,59);
  };
  const rangeOverlapsBlocks = (key,start,end) => {
    const s=timeToMinutes(start),e=timeToMinutes(end),day=getScheduleDay(key);if(day.wholeDay)return true;
    if((day.blockedSlots||[]).some(t=>{const m=timeToMinutes(t);return m>=s&&m<e;}))return true;
    return getBlocks(key).some(b=>s<timeToMinutes(b.endTime)&&e>timeToMinutes(b.startTime));
  };
  const eligibleStartSlots = (key,service) => {
    const base=baseAvailabilityForDay(key),day=getScheduleDay(key);if(base.closed||day.wholeDay||!service||!base.slots.length)return[];
    // A client may only start when the selected service itself finishes by closing time.
    // The private buffer still protects the period after the appointment from another booking,
    // but it does not make a valid client appointment end earlier than necessary.
    const close=timeToMinutes(base.slots.at(-1)),required=service.duration;
    return base.slots.filter(start=>timeToMinutes(start)+required<=close && bookingWindowAllows(key,start));
  };
  const availableStartSlots = (key,service) => eligibleStartSlots(key,service).filter(start=>{
    const protectedEnd=minutesToTime(timeToMinutes(start)+service.duration+liveSettings.defaultBufferMinutes);
    return !rangeOverlapsBlocks(key,start,protectedEnd);
  });
  const todayKey = () => { const p=johannesburgParts();return `${p.year}-${p.month}-${p.day}`; };
  const lastBookableKey = () => localDateString(addDays(parseLocalDate(todayKey()),liveSettings.maxAdvanceDays));
  const statusForDay = (key) => {
    const base=baseAvailabilityForDay(key),date=parseLocalDate(key),today=parseLocalDate(todayKey());
    if(date<today)return"past";if(key>lastBookableKey())return"future";if(base.closed)return"closed";if(getScheduleDay(key).wholeDay)return"blocked";
    const service=getSelectedService();if(service){const eligible=eligibleStartSlots(key,service),available=availableStartSlots(key,service);if(!available.length)return"blocked";if(available.length<eligible.length)return"partial";return base.holiday?"holiday":"available";}
    const slots=base.slots,blocked=slots.filter(t=>rangeOverlapsBlocks(key,t,minutesToTime(timeToMinutes(t)+1))).length;if(slots.length&&blocked===slots.length)return"blocked";if(blocked)return"partial";return base.holiday?"holiday":"available";
  };
  const setCalendarSync = (message,state="live") => { if(calendarSync){calendarSync.textContent=message;calendarSync.dataset.state=state;} };
  const monthDates = (monthDate) => {const first=startOfMonth(monthDate),start=new Date(first);start.setDate(first.getDate()-((first.getDay()+6)%7));return Array.from({length:42},(_,i)=>{const d=new Date(start);d.setDate(start.getDate()+i);return d;});};

  const showUnavailableDateNotice = (key) => {
    const note=publicNoteForDay(key),base=baseAvailabilityForDay(key),status=statusForDay(key);
    let reason=status==="closed"?"Closed on this date.":status==="future"?`Bookings are available up to ${liveSettings.maxAdvanceDays} days ahead.`:"No appointment start times are available for the selected service.";
    if(base.holidayName)reason=`${base.holidayName}. ${reason}`;
    setDateHelp(dateDisplay,`${formatDate(key)} — ${reason}${note?` Client notice: ${note}`:""}`,true);
  };
  const selectBookingDate = (key) => {
    if(!["available","holiday","partial"].includes(statusForDay(key))){showUnavailableDateNotice(key);return false;}
    selectedDateKey=key;if(dateInput)dateInput.value=key;if(dateDisplay){dateDisplay.value=formatDate(key);dateDisplay.removeAttribute("aria-invalid");}
    const note=publicNoteForDay(key);setDateHelp(dateDisplay,`${formatDate(key)} selected.${note?` Client notice: ${note}`:""}`);renderBookingCalendar();renderTimeButtons(key);return true;
  };
  const renderBookingCalendar = () => {
    if(!calendarDays||!calendarMonthLabel)return;
    calendarMonthLabel.textContent=new Intl.DateTimeFormat("en-ZA",{month:"long",year:"numeric"}).format(calendarViewDate);calendarDays.innerHTML="";
    const cm=calendarViewDate.getMonth(),cy=calendarViewDate.getFullYear(),today=todayKey();
    monthDates(calendarViewDate).forEach(date=>{
      const key=localDateString(date),status=statusForDay(key),base=baseAvailabilityForDay(key),outside=date.getMonth()!==cm||date.getFullYear()!==cy;
      const selectable=["available","holiday","partial"].includes(status),note=publicNoteForDay(key),btn=document.createElement("button");btn.type="button";btn.className=`calendar-day ${status}${outside?" outside":""}${key===selectedDateKey?" selected":""}${key===today?" today":""}${note?" has-note":""}`;btn.dataset.date=key;btn.setAttribute("role","gridcell");
      if(outside||status==="past"){btn.disabled=true;}else if(!selectable){btn.setAttribute("aria-disabled","true");}
      const statusLabel=selectable?(status==="partial"?"Limited availability":"Available"):(status==="closed"?"Closed":status==="future"?"Outside booking window":"Unavailable");
      btn.setAttribute("aria-label",`${formatDate(key)}: ${statusLabel}${base.holidayName?`, ${base.holidayName}`:""}${note?`, Client notice: ${note}`:""}`);
      btn.title=`${statusLabel}${base.holidayName?` — ${base.holidayName}`:""}${note?` — ${note}`:""}`;
      btn.innerHTML=`<span class="calendar-day-number">${date.getDate()}</span><span class="calendar-day-status" aria-hidden="true"></span>${note?'<span class="calendar-day-note-badge" aria-hidden="true">!</span>':""}`;
      if(!btn.disabled)btn.addEventListener("click",()=>selectable?selectBookingDate(key):showUnavailableDateNotice(key));calendarDays.appendChild(btn);
    });
    const publicNotes=byId("calendarPublicNotes");if(publicNotes){publicNotes.innerHTML="";const notes=Object.keys({...liveSchedule,...holidayOverrides}).filter(day=>{const d=parseLocalDate(day);return d&&d.getFullYear()===cy&&d.getMonth()===cm&&publicNoteForDay(day);}).sort();if(notes.length){const h=document.createElement("strong");h.className="calendar-public-notes-title";h.textContent="Client availability notices";publicNotes.appendChild(h);const list=document.createElement("div");list.className="calendar-public-notes-list";notes.forEach(day=>{const p=document.createElement("p"),b=document.createElement("b");b.textContent=`${formatDate(day)}: `;p.append(b,document.createTextNode(publicNoteForDay(day)));list.appendChild(p);});publicNotes.appendChild(list);publicNotes.hidden=false;}else publicNotes.hidden=true;}
    if(calendarPrev)calendarPrev.disabled=calendarViewDate<=startOfMonth(parseLocalDate(today));
  };
  const renderTimeButtons = (key,preferred="") => {
    if(!timeButtons||!timeInput)return;timeButtons.innerHTML="";timeInput.value="";const service=getSelectedService();if(!key||!service){timeButtons.innerHTML='<p class="time-placeholder">Choose a service and available date first.</p>';return;}
    const available=availableStartSlots(key,service);if(!available.length){timeButtons.innerHTML='<p class="time-placeholder">No available times for this service on this date.</p>';setTimeHelp("Please choose another date.",true);return;}
    setTimeHelp(`Only times where your selected ${service.duration}-minute appointment finishes by closing time are shown.`);
    available.forEach(t=>{const b=document.createElement("button");b.type="button";b.className="time-choice";b.setAttribute("role","radio");b.setAttribute("aria-checked","false");b.dataset.time=t;b.textContent=t;b.addEventListener("click",()=>{timeButtons.querySelectorAll(".time-choice").forEach(x=>{x.classList.remove("selected");x.setAttribute("aria-checked","false");});b.classList.add("selected");b.setAttribute("aria-checked","true");timeInput.value=t;setTimeHelp(`${t} selected. Your request will remain Pending until accepted.`);});timeButtons.appendChild(b);if(t===preferred)b.click();});
  };
  const validateDateAndTime = () => {
    const service=getSelectedService();if(!service){serviceSelect?.focus();return false;}if(!selectedDateKey||!["available","holiday","partial"].includes(statusForDay(selectedDateKey))){dateDisplay?.setAttribute("aria-invalid","true");setDateHelp(dateDisplay,"Please choose an available date.",true);return false;}if(!timeInput?.value||!availableStartSlots(selectedDateKey,service).includes(timeInput.value)){setTimeHelp("Please choose one of the available appointment times.",true);timeButtons?.scrollIntoView({behavior:"smooth",block:"center"});return false;}return true;
  };
  const findNextAvailable = () => {
    const service=getSelectedService();nextAvailableChoice=null;if(!service){if(nextAvailableCard)nextAvailableCard.hidden=true;return;}
    const start=parseLocalDate(todayKey());for(let i=0;i<=liveSettings.maxAdvanceDays;i+=1){const key=localDateString(addDays(start,i)),times=availableStartSlots(key,service);if(times.length){nextAvailableChoice={day:key,time:times[0]};break;}}
    if(nextAvailableCard)nextAvailableCard.hidden=false;if(nextAvailableText)nextAvailableText.textContent=nextAvailableChoice?`${formatDate(nextAvailableChoice.day)} at ${nextAvailableChoice.time}`:"No appointment currently available in the booking window";if(nextAvailableBtn)nextAvailableBtn.disabled=!nextAvailableChoice;
  };
  nextAvailableBtn?.addEventListener("click",()=>{if(!nextAvailableChoice)return;calendarViewDate=startOfMonth(parseLocalDate(nextAvailableChoice.day));selectBookingDate(nextAvailableChoice.day);renderTimeButtons(nextAvailableChoice.day,nextAvailableChoice.time);document.querySelector(".booking-date-field")?.scrollIntoView({behavior:"smooth",block:"start"});});

  const applyScheduleRows = (rows) => {liveSchedule={};(rows||[]).forEach(r=>{liveSchedule[r.day]={wholeDay:Boolean(r.whole_day),blockedSlots:Array.isArray(r.blocked_slots)?r.blocked_slots:[],customSlots:Array.isArray(r.custom_slots)?r.custom_slots:[],publicNote:String(r.public_note??r.private_note??"").trim()};});};
  const applyBlockRows = (rows) => {liveBlocks={};(rows||[]).forEach(r=>{(liveBlocks[r.day] ||= []).push({id:r.appointment_id,startTime:String(r.start_time).slice(0,5),endTime:String(r.end_time).slice(0,5),kind:r.kind,publicNote:r.public_note||""});});};
  const applyHolidayRows = (rows) => {holidayOverrides={};(rows||[]).forEach(r=>holidayOverrides[r.day]={name:r.name||"",mode:r.mode,customSlots:r.custom_slots||[],publicNote:r.public_note||""});};
  window.MBA_LIVE_BUSINESS_STATUS = () => {
    if (!scheduleReady) return null;
    const p=johannesburgParts(),key=`${p.year}-${p.month}-${p.day}`,nowMinutes=Number(p.hour)*60+Number(p.minute),base=baseAvailabilityForDay(key),day=getScheduleDay(key);
    if(base.closed||day.wholeDay||!base.slots.length) return {isOpen:false,detail:publicNoteForDay(key)||"Currently unavailable. Strictly by appointment."};
    const open=timeToMinutes(base.slots[0]),close=timeToMinutes(base.slots.at(-1)),isOpen=nowMinutes>=open&&nowMinutes<close;
    return {isOpen,detail:isOpen?`Appointment hours today are ${base.slots[0]}–${base.slots.at(-1)}. Please book in advance.`:(publicNoteForDay(key)||`Appointment hours today are ${base.slots[0]}–${base.slots.at(-1)}.`)};
  };

  const loadLiveSchedule = async () => {
    // Preserve the client's selected time while we do the final live refresh.
    // If that slot is still available after syncing, renderTimeButtons() re-selects it.
    // If another booking has taken it, it stays cleared and validation asks for a new time.
    const previouslySelectedTime=timeInput?.value||"";
    if(!scheduleDb)return false;setCalendarSync("Syncing live availability…","loading");
    let [days,blocks,holidays,settingsRes]=await Promise.all([
      scheduleDb.from("public_schedule_days").select("day,whole_day,blocked_slots,custom_slots,public_note"),
      scheduleDb.from("public_schedule_blocks").select("appointment_id,day,start_time,end_time,kind,public_note"),
      scheduleDb.from("holiday_overrides").select("day,name,mode,custom_slots,public_note"),
      scheduleDb.from("schedule_settings").select("default_buffer_minutes,min_notice_minutes,max_advance_days").eq("id",1).maybeSingle()
    ]);
    if(days.error){
      const legacy=await scheduleDb.from("schedule_days").select("day,whole_day,blocked_slots,custom_slots,private_note");
      if(legacy.error){console.error("Schedule sync error:",days.error,legacy.error);scheduleReady=false;setCalendarSync("Live sync unavailable — please confirm by WhatsApp","error");renderBookingCalendar();return false;}
      days={data:legacy.data,error:null};blocks={data:[],error:null};holidays={data:[],error:null};settingsRes={data:null,error:null};
      setCalendarSync("Legacy schedule connected — run upgrade SQL","error");
    }
    applyScheduleRows(days.data);applyBlockRows(blocks.data||[]);applyHolidayRows(holidays.data||[]);if(settingsRes.data)liveSettings={defaultBufferMinutes:settingsRes.data.default_buffer_minutes,minNoticeMinutes:settingsRes.data.min_notice_minutes,maxAdvanceDays:settingsRes.data.max_advance_days};scheduleReady=true;if(!calendarSync?.dataset.state?.includes("error"))setCalendarSync("Live schedule connected","live");
    if(selectedDateKey&&!["available","holiday","partial"].includes(statusForDay(selectedDateKey))){selectedDateKey="";if(dateInput)dateInput.value="";if(dateDisplay)dateDisplay.value="";if(timeInput)timeInput.value="";}
    renderBookingCalendar();renderTimeButtons(selectedDateKey,previouslySelectedTime);findNextAvailable();updateBusinessStatus();return true;
  };
  const connectLiveSchedule = () => {
    const url=window.SCHEDULE_SUPABASE_URL,key=window.SCHEDULE_SUPABASE_PUBLISHABLE_KEY;if(!window.supabase?.createClient||!url||!key){setCalendarSync("Live sync unavailable — please confirm by WhatsApp","error");renderBookingCalendar();return;}
    scheduleDb=window.supabase.createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});loadLiveSchedule();
    ["public_schedule_days","public_schedule_blocks","holiday_overrides","schedule_settings"].forEach(table=>{const ch=scheduleDb.channel(`website-${table}`).on("postgres_changes",{event:"*",schema:"public",table},()=>loadLiveSchedule()).subscribe();scheduleChannels.push(ch);});
  };
  calendarPrev?.addEventListener("click",()=>{calendarViewDate=new Date(calendarViewDate.getFullYear(),calendarViewDate.getMonth()-1,1);renderBookingCalendar();});
  calendarNext?.addEventListener("click",()=>{calendarViewDate=new Date(calendarViewDate.getFullYear(),calendarViewDate.getMonth()+1,1);renderBookingCalendar();});

  const updateAddonAvailability = () => {const service=getSelectedService(),allowed=Boolean(service?.coveredAddonAllowed);if(coveredAddon){coveredAddon.disabled=!allowed;if(!allowed)coveredAddon.checked=false;}coveredAddonLabel?.classList.toggle("is-disabled",!allowed);if(addonHelp)addonHelp.textContent=allowed?"Covered oral is available for the selected Sensual Massage appointment.":"Select a Sensual Massage option to enable the covered-oral add-on.";};
  const getPriceBreakdown = () => {const service=getSelectedService(),base=service?.price||0,isReturning=clientType?.value==="returning",gfePrice=gfeAddon?.checked?(isReturning?0:300):0,coveredPrice=coveredAddon?.checked?100:0,addons=gfePrice+coveredPrice,total=base+addons,deposit=clientType?.value==="new"&&total?Math.min(500,total):0,balance=total?total-deposit:0;return{service,base,gfePrice,coveredPrice,addons,total,deposit,balance};};
  const updatePriceSummary = () => {const p=getPriceBreakdown();if(basePriceOutput)basePriceOutput.textContent=p.service?formatMoney(p.base):"—";if(addonPriceOutput)addonPriceOutput.textContent=formatMoney(p.addons);if(totalPriceOutput)totalPriceOutput.textContent=p.service?formatMoney(p.total):"—";if(depositPriceOutput){if(!clientType?.value)depositPriceOutput.textContent="Choose client type";else if(clientType.value==="new")depositPriceOutput.textContent=formatMoney(p.deposit||500);else depositPriceOutput.textContent="Not required";}if(balancePriceOutput)balancePriceOutput.textContent=p.service?formatMoney(p.balance):"—";};
  serviceSelect?.addEventListener("change",()=>{updateAddonAvailability();if(timeInput)timeInput.value="";renderBookingCalendar();renderTimeButtons(selectedDateKey);findNextAvailable();updatePriceSummary();});
  clientType?.addEventListener("change",updatePriceSummary);gfeAddon?.addEventListener("change",updatePriceSummary);coveredAddon?.addEventListener("change",updatePriceSummary);

  updateAddonAvailability();updatePriceSummary();renderBookingCalendar();connectLiveSchedule();

  const serviceLinks=[...document.querySelectorAll("[data-book-service], [data-book-addon]")];
  const openBookingFromService=(control)=>{if(!bookingForm)return;const requestedService=control.dataset.bookService,requestedAddon=control.dataset.bookAddon;if(requestedService&&serviceSelect){const option=serviceSelect.querySelector(`option[value="${requestedService}"]`);if(!option)return;serviceSelect.value=requestedService;serviceSelect.dispatchEvent(new Event("change",{bubbles:true}));}if(requestedAddon==="gfe"&&gfeAddon){gfeAddon.checked=true;gfeAddon.dispatchEvent(new Event("change",{bubbles:true}));}bookingForm.scrollIntoView({behavior:"smooth",block:"start"});window.setTimeout(()=>requestedAddon==="gfe"?gfeAddon?.focus({preventScroll:true}):serviceSelect?.focus({preventScroll:true}),450);};
  serviceLinks.forEach(control=>control.addEventListener("click",()=>openBookingFromService(control)));

  const savePendingRequest = async (price) => {
    if(!scheduleDb||!scheduleReady)return {saved:false,error:"Live booking database unavailable"};
    const start=timeInput.value,end=minutesToTime(timeToMinutes(start)+price.service.duration);
    const payload={day:selectedDateKey,start_time:start,end_time:end,blocked_until_time:end,duration_minutes:price.service.duration,buffer_minutes:0,kind:"booking",status:"pending",service:price.service.label,client_name:nameInput?.value.trim()||"",client_phone:phoneInput?.value.trim()||"",client_type:clientType?.value||"",client_notes:notesInput?.value.trim()||"",public_note:"",source:"website"};
    const {error}=await scheduleDb.from("appointments").insert(payload);return {saved:!error,error:error?.message||""};
  };
  bookingForm?.addEventListener("submit",async(event)=>{
    event.preventDefault();
    if(!bookingForm.checkValidity()){bookingForm.reportValidity();return;}
    if(!validateDateAndTime())return;
    const whatsappWindow=window.open("about:blank","_blank");
    if(whatsappWindow) whatsappWindow.opener=null;
    await loadLiveSchedule();
    if(!validateDateAndTime()){whatsappWindow?.close();return;}
    const price=getPriceBreakdown(),addOns=[];if(gfeAddon?.checked)addOns.push(price.gfePrice===0?"GFE add-on (repeat-client rate: R0)":"GFE add-on (+R300)");if(coveredAddon?.checked)addOns.push("Covered oral add-on (+R100)");
    const submit=bookingForm.querySelector("button[type=submit]");if(submit){submit.disabled=true;submit.textContent="Saving request…";}
    const pending=await savePendingRequest(price);
    if(submit){submit.disabled=false;submit.textContent="Continue to WhatsApp";}
    const requestStatus=pending.saved?"A Pending request has been saved to the booking system.":"The live Pending save was unavailable, so please rely on this WhatsApp request.";
    const message=["Hello Ashleigh","","I'd like to request an appointment:",`• Name: ${nameInput?.value.trim()||""}`,`• WhatsApp: ${phoneInput?.value.trim()||""}`,`• Client type: ${clientType?.selectedOptions?.[0]?.textContent||""}`,`• Service: ${price.service?.label||""}`,`• Add-ons: ${addOns.length?addOns.join(", "):"None"}`,`• Calculated appointment total: ${formatMoney(price.total)}`,clientType?.value==="new"?`• New-client deposit: ${formatMoney(price.deposit)} required to secure the booking`:"• Deposit: Not required for returning client",`• Remaining balance: ${formatMoney(price.balance)}`,`• First preference: ${formatDate(selectedDateKey)} at ${timeInput?.value||""}`,notesInput?.value.trim()?`• Notes: ${notesInput.value.trim()}`:"","I understand that this request remains Pending until accepted and confirmed.",requestStatus,"","Thank you 💚"].filter(Boolean).join("\n");
    const whatsappUrl=`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    if(whatsappWindow) whatsappWindow.location.href=whatsappUrl; else window.location.href=whatsappUrl;
  });
  window.addEventListener("pagehide",()=>{if(scheduleDb)scheduleChannels.forEach(ch=>scheduleDb.removeChannel(ch));});

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
