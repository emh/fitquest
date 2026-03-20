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
  stackHeader: document.querySelector(".stack-header"),
  timeline: document.querySelector("#timeline"),
  timelineView: document.querySelector(".timeline-view"),
  scoreValue: document.querySelector("#scoreValue"),
  scoreWrap: document.querySelector(".score-wrap"),
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
let fitTextFrame = 0;

initialize();

function initialize() {
  loadState();
  bindEvents();
  render();
  focusLatestOnce();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      scheduleFitText();
    });
  }
}

function bindEvents() {
  ui.questButton.addEventListener("click", openQuestFlow);
  ui.acceptButton.addEventListener("click", acceptQuest);
  ui.rejectButton.addEventListener("click", rejectQuest);
  ui.rerollButton.addEventListener("click", rerollQuest);
  window.addEventListener("resize", scheduleFitText, { passive: true });
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
  const scoreInner = ui.scoreValue.querySelector(".fit-text-inner");

  if (scoreInner) {
    scoreInner.textContent = state.score.toLocaleString();
  } else {
    ui.scoreValue.textContent = state.score.toLocaleString();
  }

  ui.timeline.innerHTML = buildTimelineMarkup();
  state.lastRenderedEventId = null;
  renderQuestModal();
  scheduleFitText();
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

  for (const event of sortedEvents) {
    const eventDate = new Date(event.timestamp);
    const dayKey = getDayKey(eventDate);

    if (dayKey !== currentDayKey) {
      rows.push(renderDateRow(formatDayLabel(eventDate)));
      currentDayKey = dayKey;
    }

    rows.push(renderEventRow(event));
  }

  return rows.join("");
}

function renderDateRow(dayLabel) {
  return `
    <section class="stack-row stack-row-date" aria-label="${escapeHtml(dayLabel)}">
      <p
        class="fit-text stack-copy stack-copy-date"
        data-fit-text
        data-fit-base="86"
      >
        <span class="fit-text-inner">${escapeHtml(dayLabel)}</span>
      </p>
    </section>
  `;
}

function renderEventRow(event) {
  const isBonus = event.type === "bonus";
  const freshClass = event.id === state.lastRenderedEventId ? "fresh-entry" : "";
  const label = isBonus ? event.label : event.name;
  const maxFont = isBonus ? 76 : 132;

  return `
    <article
      class="stack-row stack-row-event ${isBonus ? "is-bonus" : ""} ${freshClass}"
      data-event-id="${event.id}"
    >
      <strong
        class="fit-text stack-copy stack-copy-event"
        data-fit-text
        data-fit-base="${maxFont}"
      >
        <span class="fit-text-inner">${escapeHtml(normalizeStackCopy(label))}</span>
      </strong>
    </article>
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

function scheduleFitText() {
  window.cancelAnimationFrame(fitTextFrame);
  fitTextFrame = window.requestAnimationFrame(() => {
    fitTextFrame = 0;
    fitAllText();
  });
}

function fitAllText() {
  const nodes = document.querySelectorAll("[data-fit-text]");

  for (const node of nodes) {
    fitTextNode(node);
  }

  syncFixedLayout();
}

function fitTextNode(node) {
  const inner = node.querySelector(".fit-text-inner");

  if (!inner) {
    return;
  }

  node.dataset.fitReady = "false";
  node.style.height = "";
  inner.style.position = "";
  inner.style.left = "";
  inner.style.top = "";
  inner.style.transform = "";
  inner.style.fontSize = "";

  const availableWidth = node.clientWidth;

  if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
    return;
  }

  const text = inner.textContent.trim();

  if (!text) {
    return;
  }

  const baseFont = Number(node.dataset.fitBase || 96);
  inner.style.fontSize = `${baseFont}px`;

  const naturalWidth = inner.getBoundingClientRect().width;
  const naturalHeight = inner.getBoundingClientRect().height;

  if (!naturalWidth || !naturalHeight) {
    return;
  }

  const safeWidth = Math.max(availableWidth - 0.5, 1);
  let scale = safeWidth / naturalWidth;
  const maxHeight = Number(node.dataset.fitHeight || 0);

  if (maxHeight > 0) {
    scale = Math.min(scale, maxHeight / naturalHeight);
  }

  scale = Math.max(scale * 0.999, 0.01);

  const align = node.dataset.fitAlign || "left";
  const scaledWidth = naturalWidth * scale;
  const offsetX =
    align === "center" ? Math.max((availableWidth - scaledWidth) / 2, 0) : 0;

  node.dataset.fitReady = "true";
  node.style.height = `${Math.ceil(naturalHeight * scale)}px`;
  inner.style.fontSize = `${baseFont}px`;
  inner.style.transform = `translate(${offsetX}px, 0) scale(${scale})`;
}

function syncFixedLayout() {
  const root = document.documentElement;

  if (!ui.stackHeader || !ui.scoreWrap || !ui.timelineView) {
    return;
  }

  const headerHeight = Math.ceil(ui.stackHeader.getBoundingClientRect().height);
  const scoreHeight = Math.ceil(ui.scoreWrap.getBoundingClientRect().height);

  root.style.setProperty("--stack-header-height", `${headerHeight}px`);
  root.style.setProperty("--score-top", `${headerHeight + 20}px`);
  root.style.setProperty("--stack-scroll-margin", `${headerHeight + scoreHeight + 44}px`);
}

function createQuestEvent(quest, timestamp, customId) {
  const eventDate = new Date(timestamp);

  return {
    id: customId || createId("quest"),
    type: "quest",
    name: quest.name,
    points: quest.points,
    timestamp: eventDate.toISOString(),
  };
}

function getRandomQuest(excludeName = "") {
  const pool = QUEST_LIBRARY.filter((quest) => quest.name !== excludeName);
  const quests = pool.length ? pool : QUEST_LIBRARY;
  const randomQuest = quests[Math.floor(Math.random() * quests.length)];

  return { ...randomQuest };
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function formatDayLabel(date) {
  const weekday = date.toLocaleDateString(undefined, { weekday: "long" });
  const month = date.toLocaleDateString(undefined, { month: "long" });
  return normalizeStackCopy(`${weekday} ${month} ${date.getDate()}`);
}

function normalizeStackCopy(value) {
  return String(value).replace(/\s+/g, " ").trim().toLocaleUpperCase();
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
