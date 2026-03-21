const STORAGE_KEY = "fitness-quest-v0";
const TIMELINE_WINDOW_DAYS = 30;
const ROLL_SEQUENCE_LENGTH = 20;
const ROLL_DURATION_MS = 900;
const SCORE_POPUP_MS = 1100;
const REROLL_COST = 2;
const REJECT_COST = 5;
const QUEST_POINTS = 10;
const IOS_INPUT_MIN_FONT_SIZE = 16;
const REEL_FONT_MIN = 84;
const REEL_FONT_MAX = 108;

const DEFAULT_QUEST_LIBRARY = [
  { id: "quest-10-pushups", name: "10 Pushups", active: true },
  { id: "quest-20-pushups", name: "20 Pushups", active: true },
  { id: "quest-flight-of-stairs", name: "Flight of Stairs", active: true },
  { id: "quest-horse-stance", name: "Horse Stance", active: true },
  { id: "quest-single-leg-balance", name: "Single Leg Balance", active: true },
  { id: "quest-20-kb-swings", name: "20 KB Swings", active: true },
  { id: "quest-50m-sprint", name: "50m Sprint", active: true },
  { id: "quest-wall-sit", name: "Wall Sit", active: true },
  { id: "quest-jump-rope-burst", name: "Jump Rope Burst", active: true },
  { id: "quest-walking-lunges", name: "Walking Lunges", active: true },
  { id: "quest-plank-hold", name: "Plank Hold", active: true },
  { id: "quest-band-pull-aparts", name: "Band Pull-Aparts", active: true },
];

const BONUS_LIBRARY = [
  { icon: "??", label: "Strength bonus" },
  { icon: "??", label: "Sprint bonus" },
  { icon: "??", label: "Streak bonus" },
  { icon: "??", label: "Momentum bonus" },
];

const ui = {
  body: document.body,
  stackHeader: document.querySelector(".stack-header"),
  stackTitle: document.querySelector(".stack-title"),
  titleInner: document.querySelector(".stack-copy-title .fit-text-inner"),
  timeline: document.querySelector("#timeline"),
  timelineView: document.querySelector(".timeline-view"),
  scoreValue: document.querySelector("#scoreValue"),
  scoreWrap: document.querySelector(".score-wrap"),
  libraryButton: document.querySelector("#libraryButton"),
  libraryButtonIcon: document.querySelector("#libraryButtonIcon"),
  questButton: document.querySelector("#questButton"),
  questControls: document.querySelector("#questControls"),
  acceptButton: document.querySelector("#acceptButton"),
  rejectButton: document.querySelector("#rejectButton"),
  rerollButton: document.querySelector("#rerollButton"),
  librarySelectionControls: document.querySelector("#librarySelectionControls"),
  toggleQuestButton: document.querySelector("#toggleQuestButton"),
  toggleQuestLabel: document.querySelector("#toggleQuestLabel"),
  deleteQuestButton: document.querySelector("#deleteQuestButton"),
  libraryCancelButton: document.querySelector("#libraryCancelButton"),
  libraryCreateControls: document.querySelector("#libraryCreateControls"),
  saveQuestButton: document.querySelector("#saveQuestButton"),
  cancelCreateButton: document.querySelector("#cancelCreateButton"),
  feedback: document.querySelector("#feedback"),
};

const state = {
  score: 0,
  events: [],
  questLibrary: cloneQuestLibrary(DEFAULT_QUEST_LIBRARY),
  view: "timeline",
  pendingQuest: null,
  launchQuestPlan: null,
  lastRenderedEventId: null,
  hasInitialFocus: false,
  isStartingQuest: false,
  librarySelectedQuestId: null,
  libraryDraftQuest: null,
};

let feedbackTimer = 0;
let fitTextFrame = 0;
let reelAnimation = null;
let reelFallbackTimer = 0;
let reelFallbackCleanup = null;
let draftViewportTimer = 0;
let clearDraftViewportObserver = null;
let afterLayoutCallbacks = [];
let storageAvailable = true;

initialize();

function initialize() {
  loadState();
  bindEvents();
  render();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      runAfterLayout(() => {
        if (state.view === "timeline") {
          scrollToDocumentBottom("auto");
        }
      });
    });
  }
}

function runAfterLayout(callback) {
  afterLayoutCallbacks.push(callback);
  scheduleFitText();
}

function bindEvents() {
  ui.questButton.addEventListener("click", handlePrimaryButtonClick);
  ui.libraryButton.addEventListener("click", toggleLibraryView);
  ui.acceptButton.addEventListener("click", acceptQuest);
  ui.rejectButton.addEventListener("click", rejectQuest);
  ui.rerollButton.addEventListener("click", rerollQuest);
  ui.toggleQuestButton.addEventListener("click", toggleSelectedQuestActive);
  ui.deleteQuestButton.addEventListener("click", deleteSelectedQuest);
  ui.libraryCancelButton.addEventListener("click", clearLibrarySelection);
  ui.saveQuestButton.addEventListener("click", saveLibraryDraft);
  ui.cancelCreateButton.addEventListener("click", cancelLibraryDraft);
  ui.timeline.addEventListener("click", handleTimelineClick);
  ui.timeline.addEventListener("input", handleTimelineInput);
  ui.timeline.addEventListener("keydown", handleTimelineKeydown);
  window.addEventListener("resize", scheduleFitText, { passive: true });
}

function loadState() {
  const saved = readStorageItem(STORAGE_KEY);

  if (!saved) {
    const seededState = createSeedState(DEFAULT_QUEST_LIBRARY);
    state.score = seededState.score;
    state.events = seededState.events;
    state.questLibrary = cloneQuestLibrary(DEFAULT_QUEST_LIBRARY);
    persistState();
    return;
  }

  try {
    const parsed = JSON.parse(saved);
    state.events = sanitizeEvents(parsed.events);
    state.questLibrary = sanitizeQuestLibrary(parsed.questLibrary);
    state.score = deriveScore(parsed.score, parsed.events, state.events);
  } catch (error) {
    const seededState = createSeedState(DEFAULT_QUEST_LIBRARY);
    state.score = seededState.score;
    state.events = seededState.events;
    state.questLibrary = cloneQuestLibrary(DEFAULT_QUEST_LIBRARY);
    persistState();
  }
}

function persistState() {
  writeStorageItem(
    STORAGE_KEY,
    JSON.stringify({
      score: state.score,
      events: state.events,
      questLibrary: state.questLibrary,
    })
  );
}

function createSeedState(questLibrary) {
  const rng = mulberry32(20260319);
  const today = startOfDay(new Date());
  const seedEnd = addDays(today, -1);
  const start = addDays(seedEnd, -(TIMELINE_WINDOW_DAYS - 1));
  const events = [];
  let questScore = 0;
  let bonusCounter = 0;
  const activeLibrary = getActiveQuestLibrary(questLibrary);

  for (let index = 0; index < TIMELINE_WINDOW_DAYS; index += 1) {
    const day = addDays(start, index);
    const questCount = 3 + Math.floor(rng() * 5);

    for (let questIndex = 0; questIndex < questCount; questIndex += 1) {
      const quest =
        activeLibrary[Math.floor(rng() * activeLibrary.length)] || DEFAULT_QUEST_LIBRARY[0];
      const questDate = randomTimeForDay(day, rng);
      const event = createQuestEvent(quest, questDate, `seed-quest-${index}-${questIndex}`);

      events.push(event);
      questScore += QUEST_POINTS;
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

function handlePrimaryButtonClick() {
  if (state.view === "library") {
    startLibraryDraft();
    return;
  }

  openQuestFlow();
}

function toggleLibraryView() {
  if (state.view === "library") {
    closeLibraryView();
    return;
  }

  if (state.pendingQuest || state.isStartingQuest) {
    return;
  }

  state.view = "library";
  state.librarySelectedQuestId = null;
  state.libraryDraftQuest = null;
  render();
  runAfterLayout(() => {
    scrollToDocumentTop("auto");
  });
}

function closeLibraryView() {
  stopLibraryDraftViewportSync();
  state.view = "timeline";
  state.librarySelectedQuestId = null;
  state.libraryDraftQuest = null;
  render();
  runAfterLayout(() => {
    scrollToDocumentBottom("auto");
  });
}

function openQuestFlow() {
  if (state.view !== "timeline" || state.pendingQuest || state.isStartingQuest) {
    return;
  }

  if (!getActiveQuestLibrary().length) {
    showFeedback("NO ACTIVE QUESTS");
    return;
  }

  const launchPlan = createQuestLaunchPlan();

  if (!launchPlan) {
    showFeedback("NO ACTIVE QUESTS");
    return;
  }

  state.launchQuestPlan = null;
  state.isStartingQuest = false;
  state.pendingQuest = launchPlan;
  renderTimelinePinnedToBottom();
}

function beginQuestRoll(excludeName = "") {
  cancelQuestReel();
  const currentSlotId = state.pendingQuest?.slotId || createId("pending");
  const launchPlan = createQuestLaunchPlan(excludeName, currentSlotId);

  if (!launchPlan) {
    return;
  }

  state.pendingQuest = launchPlan;
  renderTimelinePinnedToBottom();
}

function acceptQuest() {
  if (!state.pendingQuest || state.pendingQuest.isRolling) {
    return;
  }

  const event = createQuestEvent(state.pendingQuest.quest, getAppendEventTimestamp());

  cancelQuestReel();
  state.events.push(event);
  state.events.sort(sortByTimestamp);
  state.score += event.points;
  state.lastRenderedEventId = event.id;
  state.pendingQuest = null;

  persistState();
  renderTimelinePinnedToBottom();
  showFeedback(formatScoreDelta(event.points));
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

function startLibraryDraft() {
  if (state.view !== "library" || state.libraryDraftQuest || getSelectedLibraryQuest()) {
    return;
  }

  state.libraryDraftQuest = {
    id: createId("library-quest"),
    name: "new quest",
    active: true,
  };
  state.librarySelectedQuestId = null;
  render();
  focusLibraryDraftInput();
}

function saveLibraryDraft() {
  if (!state.libraryDraftQuest) {
    return;
  }

  const quest = {
    ...state.libraryDraftQuest,
    name: sanitizeQuestName(state.libraryDraftQuest.name) || "new quest",
    active: true,
  };

  stopLibraryDraftViewportSync();
  state.questLibrary.push(quest);
  state.libraryDraftQuest = null;
  state.librarySelectedQuestId = quest.id;
  persistState();
  render();
  runAfterLayout(() => {
    revealLibraryQuest(quest.id, "auto");
  });
}

function cancelLibraryDraft() {
  if (!state.libraryDraftQuest) {
    return;
  }

  stopLibraryDraftViewportSync();
  state.libraryDraftQuest = null;
  render();
}

function clearLibrarySelection() {
  if (!state.librarySelectedQuestId) {
    return;
  }

  state.librarySelectedQuestId = null;
  renderPreservingScrollPosition();
}

function toggleSelectedQuestActive() {
  const quest = getSelectedLibraryQuest();

  if (!quest) {
    return;
  }

  quest.active = !quest.active;
  persistState();
  renderPreservingScrollPosition();
}

function deleteSelectedQuest() {
  const quest = getSelectedLibraryQuest();

  if (!quest) {
    return;
  }

  state.questLibrary = state.questLibrary.filter((item) => item.id !== quest.id);
  state.librarySelectedQuestId = null;
  persistState();
  renderPreservingScrollPosition();
  showFeedback("DELETED");
}

function handleTimelineClick(event) {
  if (state.view !== "library" || state.libraryDraftQuest) {
    return;
  }

  const questRow = event.target.closest("[data-library-quest-id]");

  if (!questRow) {
    return;
  }

  state.librarySelectedQuestId = questRow.dataset.libraryQuestId;
  renderPreservingScrollPosition();
}

function handleTimelineInput(event) {
  if (state.view !== "library") {
    return;
  }

  const input = event.target.closest("[data-library-draft-input]");

  if (!input || !state.libraryDraftQuest) {
    return;
  }

  state.libraryDraftQuest.name = input.value;
  fitEditableQuestInput(input);
}

function handleTimelineKeydown(event) {
  if (state.view !== "library") {
    return;
  }

  const input = event.target.closest("[data-library-draft-input]");

  if (!input) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    saveLibraryDraft();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    cancelLibraryDraft();
  }
}

function render() {
  syncViewChrome();
  updateHeader();
  updateScoreDisplay();
  ui.timeline.setAttribute(
    "aria-label",
    state.view === "library" ? "Quest library" : "Fitness Quest activity timeline"
  );
  ui.timeline.innerHTML = state.view === "library" ? buildLibraryMarkup() : buildTimelineMarkup();
  syncControls();
  state.lastRenderedEventId = null;
  scheduleFitText();

  if (state.view === "timeline" && state.pendingQuest?.isRolling) {
    playPendingQuestReel(state.pendingQuest.rollId);
  }
}

function syncViewChrome() {
  ui.body.classList.toggle("is-library-view", state.view === "library");
}

function updateHeader() {
  if (ui.titleInner) {
    ui.titleInner.textContent = state.view === "library" ? "QUEST LIBRARY" : "FITNESS QUEST";
  }

  if (ui.libraryButtonIcon) {
    ui.libraryButtonIcon.innerHTML =
      state.view === "library"
        ? `
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="m15 18-6-6 6-6"></path>
            </svg>
          `
        : `
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <line x1="4" x2="20" y1="12" y2="12"></line>
              <line x1="4" x2="20" y1="6" y2="6"></line>
              <line x1="4" x2="20" y1="18" y2="18"></line>
            </svg>
          `;
  }

  ui.libraryButton.disabled = state.view === "timeline" && (state.pendingQuest || state.isStartingQuest);
  ui.libraryButton.setAttribute(
    "aria-label",
    state.view === "library" ? "Back to timeline" : "Open quest library"
  );
}

function updateScoreDisplay() {
  const scoreInner = ui.scoreValue.querySelector(".fit-text-inner");

  if (scoreInner) {
    scoreInner.textContent = state.score.toLocaleString();
  } else {
    ui.scoreValue.textContent = state.score.toLocaleString();
  }
}

function syncControls() {
  const isLibraryView = state.view === "library";
  const hasPendingQuest = Boolean(state.pendingQuest);
  const isRolling = Boolean(state.pendingQuest?.isRolling);
  const selectedQuest = getSelectedLibraryQuest();
  const hasLibraryDraft = Boolean(state.libraryDraftQuest);
  const hasLibrarySelection = Boolean(selectedQuest) && !hasLibraryDraft;

  ui.questButton.classList.toggle(
    "is-hidden",
    isLibraryView ? hasLibraryDraft || hasLibrarySelection : hasPendingQuest || state.isStartingQuest
  );
  ui.questButton.disabled = state.isStartingQuest;
  ui.questButton.setAttribute(
    "aria-label",
    isLibraryView ? "Add a new quest to the library" : "Start a new quest"
  );

  ui.questControls.classList.toggle("is-visible", !isLibraryView && hasPendingQuest);
  ui.acceptButton.disabled = !hasPendingQuest || isRolling;
  ui.rerollButton.disabled = !hasPendingQuest;
  ui.rejectButton.disabled = !hasPendingQuest;

  ui.librarySelectionControls.classList.toggle("is-visible", isLibraryView && hasLibrarySelection);
  ui.libraryCreateControls.classList.toggle("is-visible", isLibraryView && hasLibraryDraft);

  if (selectedQuest) {
    const isActive = selectedQuest.active !== false;
    ui.toggleQuestLabel.textContent = isActive ? "ON" : "OFF";
    ui.toggleQuestButton.classList.toggle("is-inactive", !isActive);
    ui.toggleQuestButton.setAttribute(
      "aria-label",
      isActive ? "Set quest inactive" : "Set quest active"
    );
  } else {
    ui.toggleQuestLabel.textContent = "ON";
    ui.toggleQuestButton.classList.remove("is-inactive");
    ui.toggleQuestButton.setAttribute("aria-label", "Set quest inactive");
  }
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

function buildLibraryMarkup() {
  const rows = getSortedQuestLibrary().map((quest) => renderLibraryQuestRow(quest));

  if (state.libraryDraftQuest) {
    rows.push(renderLibraryDraftRow(state.libraryDraftQuest));
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

function renderLibraryQuestRow(quest) {
  const classes = ["stack-row", "stack-row-event", "stack-row-library"];

  if (state.librarySelectedQuestId === quest.id) {
    classes.push("is-selected");
  }

  if (quest.active === false) {
    classes.push("is-inactive");
  }

  return `
    <article class="${classes.join(" ")}" data-library-quest-id="${quest.id}">
      <strong
        class="fit-text stack-copy stack-copy-event"
        data-fit-text
        data-fit-base="132"
      >
        <span class="fit-text-inner">${escapeHtml(normalizeStackCopy(quest.name))}</span>
      </strong>
    </article>
  `;
}

function renderLibraryDraftRow(quest) {
  return `
    <article class="stack-row stack-row-event stack-row-library stack-row-library-draft is-selected">
      <label class="quest-editor-shell" aria-label="New quest">
        <input
          class="quest-editor-input"
          data-fit-input
          data-fit-base="132"
          data-fit-max-text="${escapeAttribute(quest.name || "new quest")}"
          data-library-draft-input
          type="text"
          value="${escapeAttribute(quest.name)}"
          placeholder="new quest"
          autocapitalize="words"
          autocomplete="off"
          spellcheck="false"
          enterkeyhint="done"
        />
      </label>
    </article>
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
    if (typeof track.animate === "function") {
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
      return;
    }

    track.style.transition = `transform ${ROLL_DURATION_MS}ms cubic-bezier(0.16, 1, 0.3, 1)`;
    track.style.transform = "translateX(0px)";

    const finishFallbackAnimation = () => {
      if (!track.isConnected) {
        reelFallbackCleanup = null;
        return;
      }

      track.style.transition = "";
      reelFallbackCleanup = null;
      settlePendingQuest(rollId);
    };

    reelFallbackCleanup = () => {
      if (reelFallbackTimer) {
        window.clearTimeout(reelFallbackTimer);
        reelFallbackTimer = 0;
      }

      if (track.isConnected) {
        track.style.transition = "";
      }

      reelFallbackCleanup = null;
    };

    reelFallbackTimer = window.setTimeout(() => {
      reelFallbackTimer = 0;
      finishFallbackAnimation();
    }, ROLL_DURATION_MS + 40);

    window.requestAnimationFrame(() => {
      track.style.transform = `translateX(${endOffset}px)`;
    });
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

  renderTimelinePinnedToBottom();
}

function cancelQuestReel() {
  if (reelFallbackCleanup) {
    reelFallbackCleanup();
  }

  if (!reelAnimation) {
    return;
  }

  reelAnimation.cancel();
  reelAnimation = null;
}

function buildQuestRollSequence(excludeName = "") {
  const sequence = [];

  for (let index = 0; index < ROLL_SEQUENCE_LENGTH - 1; index += 1) {
    const quest = getRandomQuest();

    if (quest) {
      sequence.push(quest);
    }
  }

  const finalQuest = getRandomQuest(excludeName);

  if (finalQuest) {
    sequence.push(finalQuest);
  }

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

function renderTimelinePinnedToBottom() {
  render();
  pinTimelineToBottom();
  runAfterLayout(() => {
    pinTimelineToBottom();
  });
}

function renderPreservingScrollPosition() {
  const scroller = getScrollContainer();
  const currentTop = scroller?.scrollTop ?? 0;

  render();

  if (!scroller) {
    return;
  }

  scrollContainerTo(currentTop, "auto");
  runAfterLayout(() => {
    scrollContainerTo(currentTop, "auto");
  });
}

function revealLibraryQuest(questId, behavior = "smooth") {
  const questRow = ui.timeline.querySelector(`[data-library-quest-id="${questId}"]`);

  if (!questRow) {
    return;
  }

  focusElementInSafeBand(questRow, behavior);
}

function focusLibraryDraftInput() {
  const input = ui.timeline.querySelector("[data-library-draft-input]");

  if (!input) {
    return;
  }

  fitEditableQuestInput(input);

  try {
    input.focus({ preventScroll: true });
  } catch (error) {
    input.focus();
  }

  if (typeof input.setSelectionRange === "function") {
    try {
      input.setSelectionRange(0, input.value.length);
    } catch (error) {
      // Ignore selection failures on browsers that restrict programmatic ranges.
    }
  } else if (typeof input.select === "function") {
    input.select();
  }

  startLibraryDraftViewportSync();
}

function focusElementInSafeBand(element, behavior = "smooth") {
  const scroller = getScrollContainer();
  const bounds = getElementScrollBounds(element);

  if (!scroller || !bounds) {
    return;
  }

  const topClearance = getCssPixelValue("--stack-scroll-margin", 0);
  const bottomClearance = getCssPixelValue("--controls-clearance", 118);
  const currentScrollTop = scroller.scrollTop;
  const visibleTop = currentScrollTop + topClearance;
  const visibleBottom = currentScrollTop + scroller.clientHeight - bottomClearance;
  let targetTop = null;

  if (bounds.bottom > visibleBottom) {
    targetTop = bounds.bottom - (scroller.clientHeight - bottomClearance);
  } else if (bounds.top < visibleTop) {
    targetTop = bounds.top - topClearance;
  }

  if (targetTop === null) {
    return;
  }

  scrollContainerTo(targetTop, behavior);
}

function scrollElementToTopSafeBand(element, behavior = "smooth") {
  const bounds = getElementScrollBounds(element);

  if (!bounds) {
    return;
  }

  const topClearance = getCssPixelValue("--stack-header-height", 0) + 6;
  const targetTop = bounds.top - topClearance;

  scrollContainerTo(targetTop, behavior);
}

function startLibraryDraftViewportSync() {
  stopLibraryDraftViewportSync();

  const viewport = window.visualViewport;
  const initialHeight = viewport?.height || window.innerHeight;

  function revealDraft(behavior = "auto") {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const draftRow = ui.timeline.querySelector(".stack-row-library-draft");

        if (draftRow) {
          scrollElementToTopSafeBand(draftRow, behavior);
        }
      });
    });
  }

  function handleViewportChange() {
    const currentHeight = viewport?.height || window.innerHeight;
    syncLibraryDraftViewportClearance();

    if (!viewport || currentHeight < initialHeight - 80) {
      revealDraft();
    }
  }

  syncLibraryDraftViewportClearance();

  if (viewport) {
    viewport.addEventListener("resize", handleViewportChange);
    viewport.addEventListener("scroll", handleViewportChange);
    clearDraftViewportObserver = () => {
      viewport.removeEventListener("resize", handleViewportChange);
      viewport.removeEventListener("scroll", handleViewportChange);
      clearDraftViewportObserver = null;
    };
  }

  draftViewportTimer = window.setTimeout(() => {
    syncLibraryDraftViewportClearance();
    revealDraft("smooth");
  }, viewport ? 700 : 220);
}

function stopLibraryDraftViewportSync() {
  window.clearTimeout(draftViewportTimer);
  draftViewportTimer = 0;

  if (clearDraftViewportObserver) {
    clearDraftViewportObserver();
  }

  setDraftKeyboardClearance(0);
  setControlsKeyboardOffset(0);
}

function syncLibraryDraftViewportClearance() {
  const viewport = window.visualViewport;

  if (!viewport) {
    setDraftKeyboardClearance(0);
    setControlsKeyboardOffset(0);
    return 0;
  }

  const keyboardInset = Math.max(
    window.innerHeight - viewport.height - viewport.offsetTop,
    0
  );
  const extraClearance = keyboardInset > 0 ? keyboardInset + 20 : 0;
  const controlsOffset = keyboardInset > 0 ? keyboardInset + 12 : 0;

  setDraftKeyboardClearance(extraClearance);
  setControlsKeyboardOffset(controlsOffset);
  return extraClearance;
}

function setDraftKeyboardClearance(value) {
  document.documentElement.style.setProperty(
    "--draft-keyboard-clearance",
    `${Math.max(0, Math.ceil(value))}px`
  );
}

function setControlsKeyboardOffset(value) {
  document.documentElement.style.setProperty(
    "--controls-keyboard-offset",
    `${Math.max(0, Math.ceil(value))}px`
  );
}

function scrollToBottomThen(callback) {
  const scroller = getScrollContainer();

  if (!scroller) {
    callback();
    return;
  }

  window.requestAnimationFrame(() => {
    const targetTop = getMaxScrollTop();
    const startTime = performance.now();
    let settledFrames = 0;

    if (Math.abs(scroller.scrollTop - targetTop) < 2) {
      callback();
      return;
    }

    scrollContainerTo(targetTop, "smooth");

    function waitForBottom() {
      const remaining = Math.abs(scroller.scrollTop - targetTop);

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

  const inputs = document.querySelectorAll("[data-fit-input]");

  for (const input of inputs) {
    fitEditableQuestInput(input);
  }

  syncFixedLayout();

  const callbacks = afterLayoutCallbacks;
  afterLayoutCallbacks = [];

  for (const callback of callbacks) {
    callback();
  }
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
  const offsetX = align === "center" ? Math.max((availableWidth - scaledWidth) / 2, 0) : 0;

  node.dataset.fitReady = "true";
  node.style.height = `${Math.ceil(naturalHeight * scale)}px`;
  inner.style.fontSize = `${baseFont}px`;
  inner.style.transform = `translate(${offsetX}px, 0) scale(${scale})`;
}

function fitEditableQuestInput(input) {
  const availableWidth = input.clientWidth;

  if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
    return;
  }

  const displayText = normalizeStackCopy(input.value || input.placeholder || "NEW QUEST");
  const maxText = normalizeStackCopy(
    input.dataset.fitMaxText || input.placeholder || displayText
  );
  const baseFont = Number(input.dataset.fitBase || 132);
  const { naturalWidth, naturalHeight } = measureTextProbe(displayText, baseFont);
  const { naturalWidth: maxNaturalWidth } = measureTextProbe(maxText, baseFont);

  if (!naturalWidth || !naturalHeight || !maxNaturalWidth) {
    return;
  }

  const safeWidth = Math.max(availableWidth - 0.5, 1);
  const scale = Math.max((safeWidth / naturalWidth) * 0.999, 0.01);
  const maxScale = Math.max((safeWidth / maxNaturalWidth) * 0.999, 0.01);
  const fontSize = clamp(baseFont * scale, IOS_INPUT_MIN_FONT_SIZE, baseFont * maxScale);
  const height = Math.ceil(naturalHeight * (fontSize / baseFont));

  input.style.fontSize = `${fontSize}px`;
  input.style.height = `${height}px`;
}

function syncFixedLayout() {
  const root = document.documentElement;

  if (!ui.stackHeader || !ui.stackTitle || !ui.scoreWrap || !ui.timelineView) {
    return;
  }

  const headerHeight = Math.ceil(ui.stackHeader.getBoundingClientRect().height);
  const titleHeight = Math.ceil(ui.stackTitle.getBoundingClientRect().height);
  const scoreHeight = Math.ceil(ui.scoreWrap.getBoundingClientRect().height);

  root.style.setProperty("--header-action-size", `${titleHeight}px`);
  root.style.setProperty("--stack-header-height", `${headerHeight}px`);
  root.style.setProperty("--score-top", `${headerHeight + 20}px`);
  root.style.setProperty("--stack-scroll-margin", `${headerHeight + scoreHeight + 44}px`);

  if (!state.hasInitialFocus && state.view === "timeline") {
    state.hasInitialFocus = true;
    scrollToDocumentBottom("auto");
  }
}

function createQuestLaunchPlan(excludeName = "", slotId = createId("pending")) {
  const sequence = buildQuestRollSequence(excludeName);
  const quest = sequence[sequence.length - 1];

  if (!quest) {
    return null;
  }

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

function getScrollContainer() {
  return ui.timelineView;
}

function getMaxScrollTop() {
  const scroller = getScrollContainer();
  return scroller ? Math.max(scroller.scrollHeight - scroller.clientHeight, 0) : 0;
}

function getElementScrollBounds(element) {
  const scroller = getScrollContainer();

  if (!scroller || !element) {
    return null;
  }

  const scrollerRect = scroller.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const top = scroller.scrollTop + elementRect.top - scrollerRect.top;

  return {
    top,
    bottom: top + elementRect.height,
  };
}

function scrollContainerTo(top, behavior = "smooth") {
  const scroller = getScrollContainer();

  if (!scroller) {
    return;
  }

  const targetTop = clamp(top, 0, getMaxScrollTop());

  if (typeof scroller.scrollTo === "function") {
    try {
      scroller.scrollTo({
        top: targetTop,
        behavior,
      });
      return;
    } catch (error) {
      // Older Safari versions may reject element scroll options objects.
    }
  }

  scroller.scrollTop = targetTop;
}

function scrollToDocumentBottom(behavior = "smooth") {
  scrollContainerTo(getMaxScrollTop(), behavior);
}

function scrollToDocumentTop(behavior = "smooth") {
  scrollContainerTo(0, behavior);
}

function pinTimelineToBottom() {
  const scroller = getScrollContainer();

  if (!scroller) {
    return;
  }

  scroller.scrollTop = getMaxScrollTop();
}

function createQuestEvent(quest, timestamp, customId) {
  return {
    id: customId || createId("quest"),
    type: "quest",
    name: quest.name,
    points: QUEST_POINTS,
    timestamp: new Date(timestamp).toISOString(),
  };
}

function getAppendEventTimestamp() {
  const latestTimestamp = state.events.reduce((latest, event) => {
    const time = new Date(event.timestamp).getTime();
    return Number.isFinite(time) ? Math.max(latest, time) : latest;
  }, Date.now());

  return new Date(latestTimestamp + 1000);
}

function getRandomQuest(excludeName = "") {
  const activeLibrary = getActiveQuestLibrary();
  const filteredLibrary = activeLibrary.filter((quest) => quest.name !== excludeName);
  const pool = filteredLibrary.length ? filteredLibrary : activeLibrary;
  const randomQuest = pool[Math.floor(Math.random() * pool.length)];

  if (!randomQuest) {
    return null;
  }

  return { ...randomQuest };
}

function getSelectedLibraryQuest() {
  return state.questLibrary.find((quest) => quest.id === state.librarySelectedQuestId) || null;
}

function getSortedQuestLibrary(library = state.questLibrary) {
  return [...library].sort(compareQuestLibrary);
}

function getActiveQuestLibrary(library = state.questLibrary) {
  return library.filter((quest) => quest.active !== false && sanitizeQuestName(quest.name));
}

function cloneQuestLibrary(questLibrary) {
  return questLibrary.map((quest) => ({ ...quest }));
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

function sanitizeQuestName(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function getDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function sanitizeScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0;
}

function sanitizeEvents(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((event, index) => sanitizeEvent(event, index))
    .filter(Boolean);
}

function sanitizeQuestLibrary(value) {
  if (!Array.isArray(value) || !value.length) {
    return cloneQuestLibrary(DEFAULT_QUEST_LIBRARY);
  }

  const library = value
    .map((quest, index) => {
      const name = sanitizeQuestName(quest?.name);

      if (!name) {
        return null;
      }

      return {
        id: sanitizeQuestName(quest?.id) || `quest-library-${index}-${name.toLowerCase()}`,
        name,
        active: quest?.active !== false,
      };
    })
    .filter(Boolean);

  return library.length ? library : cloneQuestLibrary(DEFAULT_QUEST_LIBRARY);
}

function sanitizeEvent(event, index) {
  const timestamp = new Date(event?.timestamp || Date.now());

  if (!Number.isFinite(timestamp.getTime())) {
    return null;
  }

  if (event?.type === "bonus") {
    const label = sanitizeQuestName(event?.label);

    if (!label) {
      return null;
    }

    return {
      id: sanitizeQuestName(event?.id) || `bonus-${index}`,
      type: "bonus",
      icon: String(event?.icon ?? ""),
      label,
      timestamp: timestamp.toISOString(),
    };
  }

  const name = sanitizeQuestName(event?.name);

  if (!name) {
    return null;
  }

  return {
    id: sanitizeQuestName(event?.id) || `quest-${index}`,
    type: "quest",
    name,
    points: QUEST_POINTS,
    timestamp: timestamp.toISOString(),
  };
}

function deriveScore(rawScore, rawEvents, normalizedEvents) {
  const currentScore = sanitizeScore(rawScore);
  const rawQuestTotal = getQuestEventPointTotal(rawEvents);
  const normalizedQuestTotal = getQuestEventPointTotal(normalizedEvents);
  const nonQuestAdjustment = currentScore - rawQuestTotal;

  return Math.max(0, Math.round(normalizedQuestTotal + nonQuestAdjustment));
}

function getQuestEventPointTotal(events) {
  if (!Array.isArray(events)) {
    return 0;
  }

  return events.reduce((total, event) => {
    if (event?.type !== "quest") {
      return total;
    }

    const points = Number(event?.points);
    return total + (Number.isFinite(points) ? Math.max(0, Math.round(points)) : QUEST_POINTS);
  }, 0);
}

function compareQuestLibrary(left, right) {
  const leftKey = getQuestLibrarySortKey(left.name);
  const rightKey = getQuestLibrarySortKey(right.name);
  const primary = leftKey.localeCompare(rightKey, undefined, {
    sensitivity: "base",
  });

  if (primary !== 0) {
    return primary;
  }

  const leftName = sanitizeQuestName(left.name);
  const rightName = sanitizeQuestName(right.name);
  const secondary = leftName.localeCompare(rightName, undefined, {
    sensitivity: "base",
  });

  if (secondary !== 0) {
    return secondary;
  }

  return String(left.id).localeCompare(String(right.id), undefined, {
    sensitivity: "base",
  });
}

function getQuestLibrarySortKey(name) {
  const unitPattern =
    "(?:m|meter|meters|rep|reps|set|sets|s|sec|secs|second|seconds|min|minute|minutes|ft|feet)";
  let value = sanitizeQuestName(name).toLocaleLowerCase();

  while (value) {
    const trimmed = value.replace(/^[^a-z0-9]+/i, "");
    const stripped = trimmed.replace(
      new RegExp(`^\\d+(?:\\.\\d+)?\\s*(?:${unitPattern})?(?=\\b|$)\\s*`, "i"),
      ""
    );

    if (stripped === value || stripped === trimmed) {
      value = trimmed;
      break;
    }

    value = stripped;
  }

  return value || sanitizeQuestName(name).toLocaleLowerCase();
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

function readStorageItem(key) {
  if (!storageAvailable) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch (error) {
    storageAvailable = false;
    return null;
  }
}

function writeStorageItem(key, value) {
  if (!storageAvailable) {
    return false;
  }

  try {
    window.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    storageAvailable = false;
    return false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
