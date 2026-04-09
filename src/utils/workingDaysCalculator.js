/**
 * workingDaysCalculator.js  (frontend)
 *
 * HOUR-BASED task scheduler — starts from RIGHT NOW.
 *
 * Day 1:  cursor = max(currentTime, dayStart).
 *         If currentTime >= dayEnd → skip this day.
 * Day 2+: cursor = dayStart.
 *
 * Breaks are cut out of every day's productive slots.
 */

const DAY_NAMES = ["sunday","monday","tuesday","wednesday","thursday","friday","saturday"];

function parseTime(str) {
  if (!str) return { h: 9, m: 0 };
  const [h, m] = str.split(":").map(Number);
  return { h: h || 0, m: m || 0 };
}

function toMins(h, m) { return h * 60 + m; }

function isHoliday(date, holidays = []) {
  return holidays.some(hol => {
    const d = new Date(hol.date);
    return d.getFullYear() === date.getFullYear()
        && d.getMonth()    === date.getMonth()
        && d.getDate()     === date.getDate();
  });
}

function getDayConfig(date, workingHours = []) {
  return workingHours.find(w => w.day === DAY_NAMES[date.getDay()]) || null;
}

function getProductiveSlots(cfg) {
  if (!cfg || !cfg.isWorking) return [];
  const { h: sh, m: sm } = parseTime(cfg.startTime);
  const { h: eh, m: em } = parseTime(cfg.endTime);
  const dayStart = toMins(sh, sm);
  const dayEnd   = toMins(eh, em);

  const breaks = (cfg.breaks || []).map(b => {
    const { h: bsh, m: bsm } = parseTime(b.startTime);
    const { h: beh, m: bem } = parseTime(b.endTime);
    return { start: toMins(bsh, bsm), end: toMins(beh, bem) };
  }).sort((a, b) => a.start - b.start);

  const slots = [];
  let cursor = dayStart;
  for (const brk of breaks) {
    if (brk.start > cursor) slots.push({ startMin: cursor, endMin: Math.min(brk.start, dayEnd) });
    cursor = Math.max(cursor, brk.end);
  }
  if (cursor < dayEnd) slots.push({ startMin: cursor, endMin: dayEnd });
  return slots.filter(s => s.endMin > s.startMin);
}

function advanceInSlots(date, cursorMin, remainingMins, slots) {
  let left = remainingMins;
  for (const slot of slots) {
    if (slot.endMin <= cursorMin) continue;
    const from      = Math.max(slot.startMin, cursorMin);
    const available = slot.endMin - from;
    if (available >= left) {
      const endMin = from + left;
      const d = new Date(date);
      d.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0);
      return { endDate: d, remainingMins: 0 };
    }
    left -= available;
    cursorMin = slot.endMin;
  }
  return { endDate: null, remainingMins: left };
}

function pad2(n) { return String(n).padStart(2,"0"); }

/**
 * Calculate end datetime starting from NOW.
 *
 * @param {number}  estimatedHours  – e.g. 2, 8, 16.5
 * @param {Array}   workingHours    – company workingHours config
 * @param {Array}   holidays        – company holidays
 * @param {Date}    [nowOverride]   – pass a fixed "now" for testing; defaults to new Date()
 * @returns {{ startDateTime, endDate, totalHours, skippedDays, workingDayCount, breakdown } | null}
 */
export function calculateEndDate(estimatedHours, workingHours = [], holidays = [], nowOverride = null) {
  if (!estimatedHours || estimatedHours <= 0 || !workingHours.length) return null;

  const now = nowOverride || new Date();
  const nowMins = toMins(now.getHours(), now.getMinutes());

  let remainingMins   = Math.round(estimatedHours * 60);
  let current         = new Date(now);
  current.setHours(0, 0, 0, 0);   // midnight of today

  let skippedDays     = 0;
  let workingDayCount = 0;
  const breakdown     = [];
  let startDateTime   = null;
  let isFirstDay      = true;
  const MAX           = 365;

  for (let i = 0; i < MAX && remainingMins > 0; i++) {
    const cfg = getDayConfig(current, workingHours);

    if (!cfg || !cfg.isWorking || isHoliday(current, holidays)) {
      skippedDays++;
      isFirstDay = false;
      current.setDate(current.getDate() + 1);
      continue;
    }

    const slots = getProductiveSlots(cfg);
    const { h: sh, m: sm } = parseTime(cfg.startTime);
    const { h: eh, m: em } = parseTime(cfg.endTime);
    const dayStartMins = toMins(sh, sm);
    const dayEndMins   = toMins(eh, em);

    // ── Which minute do we start counting from this day? ──────────────
    let cursorMin;
    if (isFirstDay) {
      if (nowMins >= dayEndMins) {
        // Already past office closing — skip today
        skippedDays++;
        isFirstDay = false;
        current.setDate(current.getDate() + 1);
        continue;
      }
      cursorMin = Math.max(nowMins, dayStartMins);
    } else {
      cursorMin = dayStartMins;
    }
    isFirstDay = false;

    // Clip slots: ignore anything before cursorMin
    const clippedSlots = slots.map(s => ({
      startMin: Math.max(s.startMin, cursorMin),
      endMin:   s.endMin,
    })).filter(s => s.endMin > s.startMin);

    const dayAvailable = clippedSlots.reduce((sum, s) => sum + (s.endMin - s.startMin), 0);
    if (!dayAvailable) {
      current.setDate(current.getDate() + 1);
      continue;
    }

    // Record actual startDateTime
    if (!startDateTime) {
      const firstSlot = clippedSlots[0];
      startDateTime = new Date(current);
      startDateTime.setHours(Math.floor(firstSlot.startMin / 60), firstSlot.startMin % 60, 0, 0);
    }

    const startLabel = `${pad2(Math.floor(cursorMin/60))}:${pad2(cursorMin%60)}`;

    if (remainingMins <= dayAvailable) {
      // Task ends today
      const { endDate } = advanceInSlots(current, cursorMin, remainingMins, slots);
      const endH = endDate?.getHours() ?? Math.floor((cursorMin + remainingMins) / 60);
      const endM = endDate?.getMinutes() ?? (cursorMin + remainingMins) % 60;
      breakdown.push({
        date:      new Date(current),
        dayName:   DAY_NAMES[current.getDay()],
        startTime: startLabel,
        endTime:   `${pad2(endH)}:${pad2(endM)}`,
        hoursUsed: parseFloat((remainingMins / 60).toFixed(2)),
        partial:   remainingMins < dayAvailable,
      });
      workingDayCount++;
      return { startDateTime, endDate, totalHours: estimatedHours, skippedDays, workingDayCount, breakdown };
    }

    // Full available used, continue to next day
    breakdown.push({
      date:      new Date(current),
      dayName:   DAY_NAMES[current.getDay()],
      startTime: startLabel,
      endTime:   cfg.endTime,
      hoursUsed: parseFloat((dayAvailable / 60).toFixed(2)),
      partial:   false,
    });
    remainingMins   -= dayAvailable;
    workingDayCount++;
    current.setDate(current.getDate() + 1);
  }

  return null;
}

/** "Mon, Apr 7 at 11:04 AM" */
export function formatDateTimeLabel(date) {
  if (!date) return "—";
  const d = new Date(date);
  return d.toLocaleDateString("en-US", { weekday:"short", month:"short", day:"numeric" })
       + " at "
       + d.toLocaleTimeString("en-US", { hour:"2-digit", minute:"2-digit" });
}

export function getScheduleSummary(workingHours = []) {
  const on = workingHours.filter(w => w.isWorking);
  if (!on.length) return "No working days configured";
  const fmt = t => {
    const { h, m } = parseTime(t);
    return `${h % 12 || 12}:${pad2(m)} ${h >= 12 ? "PM":"AM"}`;
  };
  const labels = on.map(d => d.day.charAt(0).toUpperCase() + d.day.slice(1,3));
  const first  = on[0];
  const prodMins = on.reduce((sum, d) => {
    return sum + getProductiveSlots(d).reduce((s, sl) => s + (sl.endMin - sl.startMin), 0);
  }, 0);
  const avgHrs = parseFloat((prodMins / on.length / 60).toFixed(1));
  return `${labels.join(", ")}  ·  ${fmt(first.startTime)} – ${fmt(first.endTime)}  ·  ~${avgHrs}h/day`;
}
