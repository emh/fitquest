const STORAGE_KEY = "fitness-quest-v0";
const REROLL_PENALTY = 2;
const REJECT_PENALTY = 3;
const TIMELINE_WINDOW_DAYS = 30;

const QUEST_LIBRARY = [
  { name: "10 Pushups", points: 10 },
  { name: "20 Pushups", points: 16 },
  { name: "Flight of Stairs", points: 12 },
  { name: "Horse Stance", points: 14 },
  { name: "Single Leg Balance", points: 9 },
  { name: "20 KB Swings", points: 18 },
  { name: "50m Sprint", points: 15 },
  { name: "Wall Sit", points: 13 },
  { name: "Jump Rope Burst", points: 11 },
  { name: "Walking Lunges", points: 12 },
  { name: "Plank Hold", points: 10 },
  { name: "Band Pull-Aparts", points: 8 },
];

const BONUS_LIBRARY = [
  { icon: "💪", label: "Strength bonus" },
  { icon: "🏃", label: "Sprint bonus" },
  { icon: "🔥", label: "Streak bonus" },
  { icon: "⚡", label: "Momentum bonus" },
];

const ui = {
  timeline: document.querySelector("#timeline"),
  scoreValue: document.querySelector("#scoreValue"),
  questButton: document.querySelector("#questButton"),
  questModal: document.querySelector("#questModal"),
  questTitle: document.querySelector("#questTitle"),
  acceptButton: document.querySelector("#acceptButton"),
  rejectButton: document.querySelector("#rejectButton"),
  rerollButton: document.querySelector("#rerollButton"),
  feedback: document.querySelector("#feedback"),
};

const state = {
  score: 0,
  events: [],
  activeQuest: null,
  lastRenderedEventId: null,
  hasInitialFocus: false,
};

let feedbackTimer = 0;

initialize();

function initialize() {
  loadState();
  bindEvents();
  render();
  focusLatestOnce();
}

function bindEvents() {
  ui.questButton.addEventListener("click", openQuestFlow);
  ui.acceptButton.addEventListener("click", acceptQuest);
  ui.rejectButton.addEventListener("click", rejectQuest);
  ui.rerollButton.addEventListener("click", rerollQuest);
}

function loadState() {
  const saved = window.localStorage.getItem(STORAGE_KEY);

  if (!saved) {
    const seededState = createSeedState();
    state.score = seededState.score;
    state.events = seededState.events;
    persistState();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.score = sanitizeScore(parsed.score);
    state.events = Array.isArray(parsed.events) ? parsed.events : [];
  } catch (error) {
    const seededState = createSeedState();
    state.score = seededState.score;
    state.events = seededState.events;
    persistState();
  }
}

function persistState() {
  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      score: state.score,
      events: state.events,
    })
  );
}

function createSeedState() {
  const rng = mulberry32(20260319);
  const today = startOfDay(new Date());
  const start = addDays(today, -(TIMELINE_WINDOW_DAYS - 1));
  const events = [];
  let questScore = 0;
  let bonusCounter = 0;

  for (let index = 0; index < TIMELINE_WINDOW_DAYS; index += 1) {
    const day = addDays(start, index);
    const questCount = 3 + Math.floor(rng() * 5);

    for (let questIndex = 0; questIndex < questCount; questIndex += 1) {
      const quest = QUEST_LIBRARY[Math.floor(rng() * QUEST_LIBRARY.length)];
      const questDate = randomTimeForDay(day, rng);
      const event = createQuestEvent(quest, questDate, `seed-quest-${index}-${questIndex}`);

      events.push(event);
      questScore += quest.points;
    }

    if (index > 1 && index < TIMELINE_WINDOW_DAYS - 2 && index % 8 === 3) {
      const bonus = BONUS_LIBRARY[bonusCounter % BONUS_LIBRARY.length];
      const bonusDate = randomTimeForDay(day, rng, 10, 19);

      events.push({
        id: `seed-bonus-${index}`,
        type: "bonus",
        icon: bonus.icon,
        label: bonus.label,
        timestamp: bonusDate.toISOString(),
      });

      bonusCounter += 1;
    }
  }

  events.sort(sortByTimestamp);

  return {
    score: questScore,
    events,
  };
}

function openQuestFlow() {
  if (!state.activeQuest) {
    state.activeQuest = getRandomQuest();
  }

  renderQuestModal();
}

function acceptQuest() {
  if (!state.activeQuest) {
    return;
  }

  const completedAt = new Date();
  const event = createQuestEvent(state.activeQuest, completedAt);

  state.events.push(event);
  state.events.sort(sortByTimestamp);
  state.score += state.activeQuest.points;
  state.lastRenderedEventId = event.id;
  state.activeQuest = null;

  persistState();
  closeQuestModal();
  render();
  showFeedback(`+${event.points} score | ${event.name}`);
  focusEvent(event.id);
}

function rejectQuest() {
  if (!state.activeQuest) {
    return;
  }

  applyPenalty(REJECT_PENALTY);
  const questName = state.activeQuest.name;
  state.activeQuest = null;

  persistState();
  closeQuestModal();
  render();
  showFeedback(`-${REJECT_PENALTY} score | Rejected ${questName}`);
}

function rerollQuest() {
  const previousQuest = state.activeQuest;

  if (!previousQuest) {
    return;
  }

  applyPenalty(REROLL_PENALTY);
  state.activeQuest = getRandomQuest(previousQuest.name);

  persistState();
  render();
  showFeedback(`-${REROLL_PENALTY} score | Rerolled quest`);
}

function applyPenalty(value) {
  state.score = Math.max(0, state.score - value);
}

function render() {
  ui.scoreValue.textContent = state.score.toLocaleString();
  ui.timeline.innerHTML = buildTimelineMarkup();
  state.lastRenderedEventId = null;
  renderQuestModal();
}

function closeQuestModal() {
  ui.questModal.classList.remove("is-open");
  ui.questModal.setAttribute("aria-hidden", "true");
  window.requestAnimationFrame(() => {
    ui.questButton.focus();
  });
}

function renderQuestModal() {
  const isOpen = Boolean(state.activeQuest);

  ui.questModal.classList.toggle("is-open", isOpen);
  ui.questModal.setAttribute("aria-hidden", String(!isOpen));

  if (!isOpen) {
    return;
  }

  const quest = state.activeQuest;
  ui.questTitle.textContent = quest.name;

  window.requestAnimationFrame(() => {
    ui.acceptButton.focus();
  });
}

function buildTimelineMarkup() {
  const rows = [];
  const sortedEvents = [...state.events].sort(sortByTimestamp);
  let currentDayKey = "";
  let currentMonthKey = "";
  const sideLoad = { left: 0, right: 0 };
  let previousQuestSide = "";
  let sameSideRun = 0;

  for (const event of sortedEvents) {
    const eventDate = new Date(event.timestamp);
    const dayKey = getDayKey(eventDate);
    const monthKey = getMonthKey(eventDate);

    if (monthKey !== currentMonthKey) {
      rows.push(renderMonthRow(monthKey));
      currentMonthKey = monthKey;
    }

    if (dayKey !== currentDayKey) {
      rows.push(renderDateRow(formatDayLabel(eventDate)));
      currentDayKey = dayKey;
    }

    if (event.type === "bonus") {
      rows.push(renderBonusRow(event));
      continue;
    }

    const side = chooseQuestSide(event, sideLoad, previousQuestSide, sameSideRun);
    rows.push(renderQuestRow(event, side));
    sideLoad[side] += 1;

    if (side === previousQuestSide) {
      sameSideRun += 1;
    } else {
      previousQuestSide = side;
      sameSideRun = 1;
    }
  }

  return rows.join("");
}

function renderMonthRow(monthLabel) {
  return `
    <div class="timeline-row month-label">
      <div class="timeline-side left"></div>
      <div class="timeline-anchor"></div>
      <div class="timeline-side right">
        <div class="timeline-card">
          <span class="month-copy">${escapeHtml(monthLabel)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderDateRow(dayLabel) {
  return `
    <div class="timeline-row date-label">
      <div class="timeline-side left"></div>
      <div class="timeline-anchor">
        <span class="timeline-dot"></span>
      </div>
      <div class="timeline-side right">
        <div class="timeline-card">
          <span class="date-copy">${escapeHtml(dayLabel)}</span>
        </div>
      </div>
    </div>
  `;
}

function renderQuestRow(event, side) {
  const freshClass = event.id === state.lastRenderedEventId ? "fresh-entry" : "";
  const leftContent =
    side === "left"
      ? `
        <article class="timeline-card quest-chip">
          <strong class="quest-name">${escapeHtml(event.name)}</strong>
        </article>
      `
      : "";
  const rightContent =
    side === "right"
      ? `
        <article class="timeline-card quest-chip">
          <strong class="quest-name">${escapeHtml(event.name)}</strong>
        </article>
      `
      : "";

  return `
    <div class="timeline-row quest-row ${freshClass}" data-event-id="${event.id}">
      <div class="timeline-side left">${leftContent}</div>
      <div class="timeline-anchor">
        <span class="timeline-dot"></span>
      </div>
      <div class="timeline-side right">${rightContent}</div>
    </div>
  `;
}

function renderBonusRow(event) {
  return `
    <div class="timeline-row bonus-row" data-event-id="${event.id}">
      <div class="timeline-side left"></div>
      <div class="timeline-anchor">
        <div class="bonus-marker" aria-label="Bonus event">
          ${escapeHtml(event.icon)}
        </div>
      </div>
      <div class="timeline-side right"></div>
    </div>
  `;
}

function showFeedback(message) {
  window.clearTimeout(feedbackTimer);
  ui.feedback.textContent = message;
  ui.feedback.classList.add("is-visible");

  feedbackTimer = window.setTimeout(() => {
    ui.feedback.classList.remove("is-visible");
  }, 1800);
}

function focusLatestOnce() {
  if (state.hasInitialFocus || !state.events.length) {
    return;
  }

  state.hasInitialFocus = true;

  window.requestAnimationFrame(() => {
    const eventRows = ui.timeline.querySelectorAll("[data-event-id]");
    const latestRow = eventRows[eventRows.length - 1];

    if (latestRow) {
      latestRow.scrollIntoView({ block: "center", behavior: "auto" });
    }
  });
}

function focusEvent(eventId) {
  window.requestAnimationFrame(() => {
    const element = ui.timeline.querySelector(`[data-event-id="${eventId}"]`);

    if (element) {
      element.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  });
}

function createQuestEvent(quest, timestamp, customId) {
  const eventDate = new Date(timestamp);

  return {
    id: customId || createId("quest"),
    type: "quest",
    name: quest.name,
    points: quest.points,
    timestamp: eventDate.toISOString(),
    displayDayLabel: formatDayLabel(eventDate),
  };
}

function getRandomQuest(excludeName = "") {
  const pool = QUEST_LIBRARY.filter((quest) => quest.name !== excludeName);
  const quests = pool.length ? pool : QUEST_LIBRARY;
  const randomQuest = quests[Math.floor(Math.random() * quests.length)];

  return { ...randomQuest };
}

function chooseQuestSide(event, sideLoad, previousQuestSide, sameSideRun) {
  if (sideLoad.left - sideLoad.right >= 2) {
    return "right";
  }

  if (sideLoad.right - sideLoad.left >= 2) {
    return "left";
  }

  const preferredSide = hashString(`${event.id}-${event.name}`) % 2 === 0 ? "left" : "right";

  if (sameSideRun >= 2 && preferredSide === previousQuestSide) {
    return preferredSide === "left" ? "right" : "left";
  }

  return preferredSide;
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function getMonthKey(date) {
  return date.toLocaleDateString(undefined, { month: "long" });
}

function formatDayLabel(date) {
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  return `${weekday} ${date.getDate()}`;
}

function getDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function sanitizeScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0;
}

function sortByTimestamp(left, right) {
  return new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function addDays(date, count) {
  const value = new Date(date);
  value.setDate(value.getDate() + count);
  return value;
}

function randomTimeForDay(day, rng, startHour = 7, endHour = 21) {
  const minutesWindow = (endHour - startHour) * 60;
  const minutesOffset = Math.floor(rng() * minutesWindow);
  const date = new Date(day);

  date.setHours(startHour, 0, 0, 0);
  date.setMinutes(date.getMinutes() + minutesOffset);

  return date;
}

function mulberry32(seed) {
  return function next() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value) {
  let hash = 0;

  for (const character of value) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
