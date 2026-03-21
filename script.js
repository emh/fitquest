const STORAGE_KEY = "fitness-quest-v0";
const TIMELINE_WINDOW_DAYS = 30;
const ROLL_SEQUENCE_LENGTH = 20;
const ROLL_DURATION_MS = 900;
const SCORE_POPUP_MS = 1100;
const REROLL_COST = 2;
const REJECT_COST = 5;
const REEL_FONT_MIN = 84;
const REEL_FONT_MAX = 108;

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
  questControls: document.querySelector("#questControls"),
  acceptButton: document.querySelector("#acceptButton"),
  rejectButton: document.querySelector("#rejectButton"),
  rerollButton: document.querySelector("#rerollButton"),
  feedback: document.querySelector("#feedback"),
};

const state = {
  score: 0,
  events: [],
  pendingQuest: null,
  launchQuestPlan: null,
  lastRenderedEventId: null,
  hasInitialFocus: false,
  isStartingQuest: false,
};

let feedbackTimer = 0;
let fitTextFrame = 0;
let reelAnimation = null;

initialize();

function initialize() {
  loadState();
  bindEvents();
  render();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      scheduleFitText();
      scrollToDocumentBottom("auto");
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
  if (state.pendingQuest || state.isStartingQuest) {
    return;
  }

  state.launchQuestPlan = createQuestLaunchPlan();
  state.isStartingQuest = true;
  render();
  scrollToBottomThen(() => {
    state.isStartingQuest = false;
    state.pendingQuest = state.launchQuestPlan;
    state.launchQuestPlan = null;
    render();
  });
}

function beginQuestRoll(excludeName = "") {
  cancelQuestReel();
  const currentSlotId = state.pendingQuest?.slotId || createId("pending");
  state.pendingQuest = createQuestLaunchPlan(excludeName, currentSlotId);

  render();
  scrollToDocumentBottom("auto");
}

function acceptQuest() {
  if (!state.pendingQuest || state.pendingQuest.isRolling) {
    return;
  }

  const event = createQuestEvent(state.pendingQuest.quest, new Date());

  cancelQuestReel();
  state.events.push(event);
  state.events.sort(sortByTimestamp);
  state.score += event.points;
  state.lastRenderedEventId = event.id;
  state.pendingQuest = null;

  persistState();
  render();
  showFeedback(formatScoreDelta(event.points));
  focusEvent(event.id);
}

function rejectQuest() {
  if (!state.pendingQuest) {
    return;
  }

  cancelQuestReel();
  state.score -= REJECT_COST;
  state.pendingQuest = null;
  persistState();
  render();
  showFeedback(formatScoreDelta(-REJECT_COST));
}

function rerollQuest() {
  if (!state.pendingQuest) {
    return;
  }

  state.score -= REROLL_COST;
  persistState();
  beginQuestRoll(state.pendingQuest.quest?.name || "");
  showFeedback(formatScoreDelta(-REROLL_COST));
}

function render() {
  updateScoreDisplay();
  ui.timeline.innerHTML = buildTimelineMarkup();
  syncQuestControls();
  state.lastRenderedEventId = null;
  scheduleFitText();

  if (state.pendingQuest?.isRolling) {
    playPendingQuestReel(state.pendingQuest.rollId);
  }
}

function updateScoreDisplay() {
  const scoreInner = ui.scoreValue.querySelector(".fit-text-inner");

  if (scoreInner) {
    scoreInner.textContent = state.score.toLocaleString();
  } else {
    ui.scoreValue.textContent = state.score.toLocaleString();
  }
}

function syncQuestControls() {
  const hasPendingQuest = Boolean(state.pendingQuest);
  const isRolling = Boolean(state.pendingQuest?.isRolling);

  ui.questButton.classList.toggle("is-hidden", hasPendingQuest || state.isStartingQuest);
  ui.questButton.disabled = state.isStartingQuest;
  ui.questControls.classList.toggle("is-visible", hasPendingQuest);
  ui.acceptButton.disabled = !hasPendingQuest || isRolling;
  ui.rerollButton.disabled = !hasPendingQuest;
  ui.rejectButton.disabled = !hasPendingQuest;
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

  if (state.pendingQuest) {
    const pendingDate = new Date();
    const pendingDayKey = getDayKey(pendingDate);

    if (pendingDayKey !== currentDayKey) {
      rows.push(renderDateRow(formatDayLabel(pendingDate)));
    }

    rows.push(renderPendingQuestRow(state.pendingQuest));
  } else if (state.isStartingQuest && state.launchQuestPlan) {
    const pendingDate = new Date();
    const pendingDayKey = getDayKey(pendingDate);

    if (pendingDayKey !== currentDayKey) {
      rows.push(renderDateRow(formatDayLabel(pendingDate)));
    }

    rows.push(renderLaunchPlaceholderRow(state.launchQuestPlan));
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
  const baseFont = isBonus ? 76 : 132;

  return `
    <article
      class="stack-row stack-row-event ${isBonus ? "is-bonus" : ""} ${freshClass}"
      data-event-id="${event.id}"
    >
      <strong
        class="fit-text stack-copy stack-copy-event"
        data-fit-text
        data-fit-base="${baseFont}"
      >
        <span class="fit-text-inner">${escapeHtml(normalizeStackCopy(label))}</span>
      </strong>
    </article>
  `;
}

function renderPendingQuestRow(pendingQuest) {
  const slotStyle = `style="height:${pendingQuest.reservedHeight}px; --reel-font-size:${pendingQuest.reelFontSize}px"`;

  if (pendingQuest.isRolling) {
    return `
      <article class="stack-row stack-row-pending" data-pending-slot="${pendingQuest.slotId}" ${slotStyle}>
        <div class="quest-reel">
          <div class="quest-reel-track" data-roll-id="${pendingQuest.rollId}">
            ${pendingQuest.sequence
              .map(
                (quest, index) => `
                  <span class="quest-reel-item" data-roll-index="${index}">
                    ${escapeHtml(normalizeStackCopy(quest.name))}
                  </span>
                `
              )
              .join("")}
          </div>
        </div>
      </article>
    `;
  }

  return `
    <article
      class="stack-row stack-row-event stack-row-pending"
      data-pending-slot="${pendingQuest.slotId}"
      ${slotStyle}
    >
      <strong
        class="fit-text stack-copy stack-copy-event"
        data-fit-text
        data-fit-base="132"
      >
        <span class="fit-text-inner">${escapeHtml(normalizeStackCopy(pendingQuest.quest.name))}</span>
      </strong>
    </article>
  `;
}

function renderLaunchPlaceholderRow(launchQuestPlan) {
  return `
    <article
      class="stack-row stack-row-pending"
      data-launch-slot="${launchQuestPlan.slotId}"
      style="height:${launchQuestPlan.reservedHeight}px"
      aria-hidden="true"
    ></article>
  `;
}

function playPendingQuestReel(rollId) {
  window.requestAnimationFrame(() => {
    const pendingQuest = state.pendingQuest;

    if (!pendingQuest || !pendingQuest.isRolling || pendingQuest.rollId !== rollId) {
      return;
    }

    const slot = ui.timeline.querySelector(`[data-pending-slot="${pendingQuest.slotId}"]`);
    const track = slot?.querySelector(`[data-roll-id="${rollId}"]`);
    const finalItem = track?.querySelector(
      `[data-roll-index="${pendingQuest.sequence.length - 1}"]`
    );

    if (!track || !finalItem) {
      settlePendingQuest(rollId);
      return;
    }

    const endOffset = -Math.max(finalItem.offsetLeft - 2, 0);

    cancelQuestReel();
    reelAnimation = track.animate(
      [
        { transform: "translateX(0px)" },
        { transform: `translateX(${endOffset}px)` },
      ],
      {
        duration: ROLL_DURATION_MS,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    );

    reelAnimation.onfinish = () => {
      reelAnimation = null;
      settlePendingQuest(rollId);
    };
    reelAnimation.oncancel = () => {
      reelAnimation = null;
    };
  });
}

function settlePendingQuest(rollId) {
  if (!state.pendingQuest || state.pendingQuest.rollId !== rollId) {
    return;
  }

  state.pendingQuest = {
    ...state.pendingQuest,
    reservedHeight: state.pendingQuest.finalHeight,
    isRolling: false,
  };

  render();
  scrollToDocumentBottom("auto");
}

function cancelQuestReel() {
  if (!reelAnimation) {
    return;
  }

  reelAnimation.cancel();
  reelAnimation = null;
}

function buildQuestRollSequence(excludeName = "") {
  const sequence = [];

  for (let index = 0; index < ROLL_SEQUENCE_LENGTH - 1; index += 1) {
    sequence.push(getRandomQuest());
  }

  sequence.push(getRandomQuest(excludeName));

  return sequence;
}

function showFeedback(message) {
  window.clearTimeout(feedbackTimer);
  ui.feedback.textContent = message;
  ui.feedback.classList.add("is-visible");

  feedbackTimer = window.setTimeout(() => {
    ui.feedback.classList.remove("is-visible");
  }, SCORE_POPUP_MS);
}

function formatScoreDelta(value) {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value}`;
}

function focusEvent(eventId) {
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      const element = ui.timeline.querySelector(`[data-event-id="${eventId}"]`);

      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      const topClearance = getCssPixelValue("--stack-scroll-margin", 0);
      const bottomClearance = getCssPixelValue("--controls-clearance", 118);
      const visibleTop = topClearance;
      const visibleBottom = window.innerHeight - bottomClearance;
      const maxScrollTop = Math.max(
        document.documentElement.scrollHeight - window.innerHeight,
        0
      );
      let targetTop = null;

      if (rect.bottom > visibleBottom) {
        targetTop = window.scrollY + rect.bottom - visibleBottom;
      } else if (rect.top < visibleTop) {
        targetTop = window.scrollY + rect.top - visibleTop;
      }

      if (targetTop === null) {
        return;
      }

      window.scrollTo({
        top: clamp(targetTop, 0, maxScrollTop),
        behavior: "smooth",
      });
    });
  });
}

function scrollToBottomThen(callback) {
  window.requestAnimationFrame(() => {
    const targetTop = Math.max(
      document.documentElement.scrollHeight - window.innerHeight,
      0
    );
    const startTime = performance.now();
    let settledFrames = 0;

    if (Math.abs(window.scrollY - targetTop) < 2) {
      callback();
      return;
    }

    window.scrollTo({
      top: targetTop,
      behavior: "smooth",
    });

    function waitForBottom() {
      const remaining = Math.abs(window.scrollY - targetTop);

      if (remaining < 2) {
        settledFrames += 1;
        if (settledFrames >= 2) {
          callback();
          return;
        }
      } else {
        settledFrames = 0;
      }

      if (performance.now() - startTime > 1200) {
        callback();
        return;
      }

      window.requestAnimationFrame(waitForBottom);
    }

    window.requestAnimationFrame(waitForBottom);
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

  if (!state.hasInitialFocus) {
    state.hasInitialFocus = true;
    scrollToDocumentBottom("auto");
  }
}

function createQuestLaunchPlan(excludeName = "", slotId = createId("pending")) {
  const sequence = buildQuestRollSequence(excludeName);
  const quest = sequence[sequence.length - 1];
  const finalMetrics = measureQuestDisplayMetrics(quest.name);
  const reelFontSize = getFixedReelFontSize();
  const reelHeight = measureReelSlotHeight(reelFontSize);

  return {
    slotId,
    rollId: createId("roll"),
    sequence,
    quest,
    isRolling: true,
    reservedHeight: reelHeight,
    finalHeight: finalMetrics.height,
    reelFontSize,
  };
}

function measureQuestDisplayMetrics(label) {
  const availableWidth = ui.timeline.clientWidth || ui.timelineView.clientWidth || window.innerWidth;
  const baseFont = 132;
  const text = normalizeStackCopy(label);
  const { naturalWidth, naturalHeight } = measureTextProbe(text, baseFont);

  if (!naturalWidth || !naturalHeight) {
    return {
      height: 120,
      fontSize: 120,
    };
  }

  const scale = Math.max(((availableWidth - 0.5) / naturalWidth) * 0.999, 0.01);
  return {
    height: Math.ceil(naturalHeight * scale),
    fontSize: baseFont * scale,
  };
}

function getFixedReelFontSize() {
  const availableWidth = ui.timeline.clientWidth || ui.timelineView.clientWidth || window.innerWidth;
  return Math.round(clamp(availableWidth * 0.18, REEL_FONT_MIN, REEL_FONT_MAX));
}

function measureReelSlotHeight(reelFontSize) {
  const sample = "QJMWY";
  const { naturalHeight } = measureTextProbe(sample, reelFontSize);

  if (!naturalHeight) {
    return reelFontSize;
  }

  return Math.ceil(naturalHeight + 2);
}

function measureTextProbe(text, fontSize) {
  const probe = document.createElement("span");

  probe.textContent = text;
  probe.className = "stack-copy stack-copy-event";
  probe.style.position = "fixed";
  probe.style.left = "-9999px";
  probe.style.top = "0";
  probe.style.visibility = "hidden";
  probe.style.fontSize = `${fontSize}px`;
  probe.style.whiteSpace = "nowrap";

  document.body.append(probe);
  const naturalWidth = probe.getBoundingClientRect().width;
  const naturalHeight = probe.getBoundingClientRect().height;
  probe.remove();

  return { naturalWidth, naturalHeight };
}

function getCssPixelValue(name, fallback = 0) {
  const value = window.getComputedStyle(document.documentElement).getPropertyValue(name);
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function scrollToDocumentBottom(behavior = "smooth") {
  window.requestAnimationFrame(() => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior,
    });
  });
}

function createQuestEvent(quest, timestamp, customId) {
  return {
    id: customId || createId("quest"),
    type: "quest",
    name: quest.name,
    points: quest.points,
    timestamp: new Date(timestamp).toISOString(),
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

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
