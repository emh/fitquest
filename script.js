const STORAGE_KEY = "fitness-quest-v3";
const PREVIOUS_STORAGE_KEY = "fitness-quest-v2";
const LEGACY_STORAGE_KEYS = ["fitness-quest-v0", "fitness-quest-v1"];
const SERVICE_WORKER_URL = "./service-worker.js";
const ROLL_SEQUENCE_LENGTH = 20;
const ROLL_DURATION_MS = 900;
const SCORE_POPUP_MS = 1100;
const REROLL_COST = 2;
const REJECT_COST = 5;
const QUEST_POINTS = 10;
const ACTIVE_CONTROLS_CLEARANCE = 118;
const IOS_INPUT_MIN_FONT_SIZE = 16;
const REEL_FONT_MIN = 84;
const REEL_FONT_MAX = 108;
const VIEW_TIMELINE = "timeline";
const VIEW_SETTINGS = "settings";
const VIEW_LIBRARY = "library";
const VIEW_EXERCISE_EDITOR = "exercise-editor";
const VIEW_LOCATIONS = "locations";
const VIEW_LOCATION_EDITOR = "location-editor";
const VIEW_FONT_SETTINGS = "font-settings";
const VIEW_THEME_SETTINGS = "theme-settings";
const DEFAULT_LOCATION_ID = "location-default";
const DEFAULT_FONT_PREFERENCE = "climate-crisis";
const DEFAULT_THEME_PREFERENCE = "system";
const LIGHT_THEME_COLOR = "#de2c23";
const DARK_THEME_COLOR = "#000000";
const EVENT_TYPE_COMPLETE = "quest-complete";
const EVENT_TYPE_REROLL = "quest-reroll";
const EVENT_TYPE_REJECT = "quest-reject";
const EVENT_TYPE_BONUS = "bonus";
const SETTINGS_ACTION_EXPORT = "export-data";
const SETTINGS_ACTION_IMPORT = "import-data";
const EXPORT_FORMAT = "fitquest-backup";
const EXPORT_VERSION = 2;
const SETTINGS_ICON_SVG = `
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
    <path d="M12.22 2h-.44a2 2 0 0 0-1.94 1.57l-.26 1.24a1 1 0 0 1-.64.73c-.56.22-1.09.53-1.57.9a1 1 0 0 1-.9.15l-1.2-.48a2 2 0 0 0-2.33.73l-.25.38a2 2 0 0 0 .24 2.45l.96.98a1 1 0 0 1 .25 1.03 8.3 8.3 0 0 0 0 1.82 1 1 0 0 1-.25 1.03l-.96.98a2 2 0 0 0-.24 2.45l.25.38a2 2 0 0 0 2.33.73l1.2-.48a1 1 0 0 1 .9.15c.48.37 1.01.68 1.57.9a1 1 0 0 1 .64.73l.26 1.24a2 2 0 0 0 1.94 1.57h.44a2 2 0 0 0 1.94-1.57l.26-1.24a1 1 0 0 1 .64-.73c.56-.22 1.09-.53 1.57-.9a1 1 0 0 1 .9-.15l1.2.48a2 2 0 0 0 2.33-.73l.25-.38a2 2 0 0 0-.24-2.45l-.96-.98a1 1 0 0 1-.25-1.03 8.3 8.3 0 0 0 0-1.82 1 1 0 0 1 .25-1.03l.96-.98a2 2 0 0 0 .24-2.45l-.25-.38a2 2 0 0 0-2.33-.73l-1.2.48a1 1 0 0 1-.9-.15 7.97 7.97 0 0 0-1.57-.9 1 1 0 0 1-.64-.73l-.26-1.24A2 2 0 0 0 12.22 2z"></path>
    <circle cx="12" cy="12" r="3"></circle>
  </svg>
`;
const BACK_ICON_SVG = `
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
`;

const DEFAULT_QUEST_LIBRARY = [
  { id: "quest-15-pushups", name: "15 pushups", active: true },
  { id: "quest-25-air-squats", name: "25 air squats", active: true },
  { id: "quest-10-burpees", name: "10 burpees", active: true },
  {
    id: "quest-25-kettlebell-swings-24kg",
    name: "25 kettlebell swings (24kg)",
    active: true,
    equipmentId: "equipment-24kg-kettlebell",
  },
  {
    id: "quest-10-kettlebell-snatches-24kg",
    name: "10 kettlebell snatches (24kg)",
    active: true,
    equipmentId: "equipment-24kg-kettlebell",
  },
  {
    id: "quest-10-kettlebell-goblet-squats-24kg",
    name: "10 kettlebell goblet squats (24kg)",
    active: true,
    equipmentId: "equipment-24kg-kettlebell",
  },
  {
    id: "quest-50-alternating-mace-360-6kg",
    name: "50 alternating mace 360 (6kg)",
    active: true,
    equipmentId: "equipment-6kg-steel-mace",
  },
  {
    id: "quest-10-banded-pullups-blue",
    name: "10 banded pullups (blue)",
    active: true,
    equipmentId: "equipment-blue-pull-up-band",
  },
  { id: "quest-10-ring-rows", name: "10 ring rows", active: true, equipmentId: "equipment-rings" },
  {
    id: "quest-1min-heavy-bag",
    name: "1min heavy bag",
    active: true,
    equipmentId: "equipment-heavy-bag",
  },
  { id: "quest-1min-horse-stance", name: "1min horse stance", active: true },
  { id: "quest-30-30s-iso-lunges", name: "30/30s iso lunges", active: true },
  {
    id: "quest-1min-passive-bar-hang",
    name: "1min passive bar hang",
    active: true,
    equipmentId: "equipment-bar",
  },
  { id: "quest-1min-plank", name: "1min plank", active: true },
  { id: "quest-30-30s-side-plank", name: "30/30s side plank", active: true },
  {
    id: "quest-10-10-kb-single-leg-deadlift-24kg",
    name: "10/10 kb single leg deadlift (24kg)",
    active: true,
    equipmentId: "equipment-24kg-kettlebell",
  },
  {
    id: "quest-10-10-kb-bulgarian-split-squat-24kg",
    name: "10/10 kb bulgarian split squat (24kg)",
    active: true,
    equipmentId: "equipment-24kg-kettlebell",
  },
  { id: "quest-1min-deep-squat", name: "1min deep squat", active: true },
  { id: "quest-5-ab-wheel", name: "5 ab wheel", active: true, equipmentId: "equipment-ab-wheel" },
  {
    id: "quest-10-10-hand-gripper-l1",
    name: "10/10 hand gripper (L1)",
    active: true,
    equipmentId: "equipment-l1-hand-gripper",
  },
];

const DEFAULT_EQUIPMENT_LIBRARY = [
  { id: "equipment-24kg-kettlebell", name: "24kg kettlebell" },
  { id: "equipment-6kg-steel-mace", name: "6kg steel mace" },
  { id: "equipment-blue-pull-up-band", name: "blue pull-up band" },
  { id: "equipment-rings", name: "rings" },
  { id: "equipment-heavy-bag", name: "heavy bag" },
  { id: "equipment-bar", name: "bar" },
  { id: "equipment-ab-wheel", name: "ab wheel" },
  { id: "equipment-l1-hand-gripper", name: "L1 hand gripper" },
];

const EQUIPMENT_INFERENCE_RULES = [
  { id: "equipment-kettlebell", name: "kettlebell", pattern: /\b(kb|kettlebell)\b/i },
  { id: "equipment-steel-mace", name: "steel mace", pattern: /\bmace\b/i },
  { id: "equipment-pull-up-band", name: "pull-up band", pattern: /banded pullups|\bband\b/i },
  { id: "equipment-rings", name: "rings", pattern: /\bring rows?\b/i },
  { id: "equipment-heavy-bag", name: "heavy bag", pattern: /\bheavy bag\b/i },
  { id: "equipment-bar", name: "bar", pattern: /\bbar hang\b/i },
  { id: "equipment-ab-wheel", name: "ab wheel", pattern: /\bab wheel\b/i },
  { id: "equipment-hand-gripper", name: "hand gripper", pattern: /\bhand gripper\b/i },
  { id: "equipment-jump-rope", name: "jump rope", pattern: /\bjump rope\b/i },
  { id: "equipment-dumbbell", name: "dumbbell", pattern: /\bdumbbell\b/i },
  { id: "equipment-foam-roller", name: "foam roller", pattern: /\bfoam roll/i },
  { id: "equipment-steel-club", name: "steel club", pattern: /\bsteel club\b/i },
  { id: "equipment-heavy-rope", name: "heavy rope", pattern: /\bheavy rope\b/i },
  { id: "equipment-medicine-ball", name: "medicine ball", pattern: /\bmed(?:icine)? ball\b/i },
  { id: "equipment-slackboard", name: "slackboard", pattern: /\bslack board\b|\bslackboard\b/i },
];

const FONT_OPTIONS = [
  {
    id: "climate-crisis",
    label: "Climate Crisis",
    cssFamily: '"Climate Crisis", "Arial Black", sans-serif',
    loadFamily: '"Climate Crisis"',
    weight: 400,
  },
  {
    id: "erica-one",
    label: "Erica One",
    cssFamily: '"Erica One", "Arial Black", sans-serif',
    loadFamily: '"Erica One"',
    weight: 400,
  },
  {
    id: "bitcount-prop-double",
    label: "Bitcount Prop Double",
    cssFamily: '"Bitcount Prop Double", "Arial Black", sans-serif',
    loadFamily: '"Bitcount Prop Double"',
    weight: 400,
  },
  {
    id: "dynapuff",
    label: "DynaPuff",
    cssFamily: '"DynaPuff", "Arial Black", sans-serif',
    loadFamily: '"DynaPuff"',
    weight: 700,
  },
  {
    id: "saira-stencil-one",
    label: "Saira Stencil One",
    cssFamily: '"Saira Stencil One", "Arial Black", sans-serif',
    loadFamily: '"Saira Stencil One"',
    weight: 400,
  },
];

const THEME_OPTIONS = [
  { id: "light", label: "Light", detail: "Current light theme" },
  { id: "dark", label: "Dark", detail: "White text on black" },
  { id: "system", label: "System", detail: "Follow device default" },
];

const FONT_OPTIONS_BY_ID = Object.fromEntries(FONT_OPTIONS.map((option) => [option.id, option]));
const THEME_OPTIONS_BY_ID = Object.fromEntries(THEME_OPTIONS.map((option) => [option.id, option]));
const systemThemeMedia = window.matchMedia?.("(prefers-color-scheme: dark)") || null;

const ui = {
  body: document.body,
  root: document.documentElement,
  stackHeader: document.querySelector(".stack-header"),
  stackTitle: document.querySelector(".stack-title"),
  titleNode: document.querySelector(".stack-copy-title"),
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
  editQuestButton: document.querySelector("#editQuestButton"),
  deleteQuestButton: document.querySelector("#deleteQuestButton"),
  libraryCancelButton: document.querySelector("#libraryCancelButton"),
  libraryCreateControls: document.querySelector("#libraryCreateControls"),
  saveQuestButton: document.querySelector("#saveQuestButton"),
  cancelCreateButton: document.querySelector("#cancelCreateButton"),
  locationPicker: document.querySelector("#locationPicker"),
  locationPickerButton: document.querySelector("#locationPickerButton"),
  locationPickerLabel: document.querySelector("#locationPickerLabel"),
  feedback: document.querySelector("#feedback"),
  importFileInput: document.querySelector("#importFileInput"),
  themeColorMeta: document.querySelector('meta[name="theme-color"]'),
};

const state = {
  score: 0,
  events: [],
  questLibrary: cloneQuestLibrary(DEFAULT_QUEST_LIBRARY),
  equipmentLibrary: cloneEquipmentLibrary(DEFAULT_EQUIPMENT_LIBRARY),
  locations: createDefaultLocations(DEFAULT_EQUIPMENT_LIBRARY),
  selectedLocationId: DEFAULT_LOCATION_ID,
  view: VIEW_TIMELINE,
  pendingQuest: null,
  launchQuestPlan: null,
  lastRenderedEventId: null,
  hasInitialFocus: false,
  isStartingQuest: false,
  librarySelectedQuestId: null,
  libraryDraftQuest: null,
  locationSelectedId: null,
  locationDraft: null,
  fontPreference: DEFAULT_FONT_PREFERENCE,
  themePreference: DEFAULT_THEME_PREFERENCE,
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
let shouldReloadForServiceWorkerUpdate = false;
let hasReloadedForServiceWorker = false;
let locationPickerAnimationTimer = 0;
let isLocationPickerAnimating = false;

initialize();

function initialize() {
  clearLegacyStorage();
  loadState();
  applyDisplayPreferences();
  bindEvents();
  render();
  registerServiceWorker();

  if (document.fonts?.ready) {
    document.fonts.ready.then(() => {
      runAfterLayout(() => {
        if (state.view === VIEW_TIMELINE) {
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
  ui.libraryButton.addEventListener("click", handleHeaderActionClick);
  ui.acceptButton.addEventListener("click", acceptQuest);
  ui.rejectButton.addEventListener("click", rejectQuest);
  ui.rerollButton.addEventListener("click", rerollQuest);
  ui.toggleQuestButton.addEventListener("click", toggleSelectedQuestActive);
  ui.editQuestButton?.addEventListener("click", editSelectedItem);
  ui.deleteQuestButton.addEventListener("click", deleteSelectedQuest);
  ui.libraryCancelButton.addEventListener("click", clearLibrarySelection);
  ui.saveQuestButton.addEventListener("click", saveCurrentDraft);
  ui.cancelCreateButton.addEventListener("click", cancelCurrentDraft);
  ui.locationPicker?.addEventListener("click", handleLocationPickerClick);
  ui.timeline.addEventListener("click", handleTimelineClick);
  ui.timeline.addEventListener("input", handleTimelineInput);
  ui.timeline.addEventListener("keydown", handleTimelineKeydown);
  ui.importFileInput?.addEventListener("change", handleImportFileSelection);
  window.addEventListener("resize", scheduleFitText, { passive: true });

  if (!systemThemeMedia) {
    return;
  }

  const handleThemeChange = () => {
    if (state.themePreference === DEFAULT_THEME_PREFERENCE) {
      applyThemePreference();
    }
  };

  if (typeof systemThemeMedia.addEventListener === "function") {
    systemThemeMedia.addEventListener("change", handleThemeChange);
  } else if (typeof systemThemeMedia.addListener === "function") {
    systemThemeMedia.addListener(handleThemeChange);
  }
}

function loadState() {
  const saved = readStorageItem(STORAGE_KEY);

  if (saved) {
    try {
      applyLoadedState(JSON.parse(saved));
      return;
    } catch (error) {
      resetState();
      persistState();
      return;
    }
  }

  const previousSaved = readStorageItem(PREVIOUS_STORAGE_KEY);

  if (previousSaved) {
    try {
      applyLoadedState(JSON.parse(previousSaved));
      if (persistState()) {
        removeStorageItem(PREVIOUS_STORAGE_KEY);
      }
      return;
    } catch (error) {
      resetState();
      persistState();
      return;
    }
  }

  resetState();
  persistState();
}

function resetState() {
  state.score = 0;
  state.events = [];
  state.questLibrary = cloneQuestLibrary(DEFAULT_QUEST_LIBRARY);
  state.equipmentLibrary = cloneEquipmentLibrary(DEFAULT_EQUIPMENT_LIBRARY);
  state.locations = createDefaultLocations(DEFAULT_EQUIPMENT_LIBRARY);
  state.selectedLocationId = DEFAULT_LOCATION_ID;
  state.fontPreference = DEFAULT_FONT_PREFERENCE;
  state.themePreference = DEFAULT_THEME_PREFERENCE;
}

function persistState() {
  return writeStorageItem(
    STORAGE_KEY,
    JSON.stringify({
      score: state.score,
      events: state.events,
      questLibrary: state.questLibrary,
      equipmentLibrary: state.equipmentLibrary,
      locations: state.locations,
      selectedLocationId: state.selectedLocationId,
      fontPreference: state.fontPreference,
      themePreference: state.themePreference,
    })
  );
}

function applyLoadedState(parsed) {
  const importedData = sanitizeAppData(parsed);

  state.events = importedData.events;
  state.questLibrary = importedData.questLibrary;
  state.equipmentLibrary = importedData.equipmentLibrary;
  state.locations = importedData.locations;
  state.selectedLocationId = importedData.selectedLocationId;
  state.score = importedData.score;
  state.fontPreference = sanitizeFontPreference(parsed?.fontPreference);
  state.themePreference = sanitizeThemePreference(parsed?.themePreference);
}

function handlePrimaryButtonClick() {
  if (state.view === VIEW_LIBRARY) {
    startLibraryDraft();
    return;
  }

  if (state.view === VIEW_LOCATIONS) {
    startLocationDraft();
    return;
  }

  if (state.view === VIEW_TIMELINE) {
    openQuestFlow();
  }
}

function handleHeaderActionClick() {
  if (state.view === VIEW_TIMELINE) {
    openSettingsView();
    return;
  }

  navigateBackFromAuxiliaryView();
}

function openSettingsView() {
  if (state.pendingQuest || state.isStartingQuest) {
    return;
  }

  stopLibraryDraftViewportSync();
  clearEditorState();
  state.view = VIEW_SETTINGS;
  render();
  runAfterLayout(() => {
    scrollToDocumentTop("auto");
  });
}

function closeAuxiliaryView() {
  stopLibraryDraftViewportSync();
  clearEditorState();
  state.view = VIEW_TIMELINE;
  render();
  runAfterLayout(() => {
    scrollToDocumentBottom("auto");
  });
}

function navigateBackFromAuxiliaryView() {
  if (state.view === VIEW_EXERCISE_EDITOR) {
    stopLibraryDraftViewportSync();
    clearLibraryEditorState();
    state.view = VIEW_LIBRARY;
    render();
    runAfterLayout(() => {
      scrollToDocumentTop("auto");
    });
    return;
  }

  if (state.view === VIEW_LOCATION_EDITOR) {
    stopLibraryDraftViewportSync();
    clearLocationEditorState();
    state.view = VIEW_LOCATIONS;
    render();
    runAfterLayout(() => {
      scrollToDocumentTop("auto");
    });
    return;
  }

  if (state.view === VIEW_LIBRARY) {
    stopLibraryDraftViewportSync();
    clearLibraryEditorState();
    state.view = VIEW_SETTINGS;
    render();
    runAfterLayout(() => {
      scrollToDocumentTop("auto");
    });
    return;
  }

  if (
    state.view === VIEW_LOCATIONS ||
    state.view === VIEW_FONT_SETTINGS ||
    state.view === VIEW_THEME_SETTINGS
  ) {
    if (state.view === VIEW_LOCATIONS) {
      clearLocationEditorState();
    }
    state.view = VIEW_SETTINGS;
    render();
    runAfterLayout(() => {
      scrollToDocumentTop("auto");
    });
    return;
  }

  closeAuxiliaryView();
}

function openSettingsSubscreen(view) {
  if (state.view !== VIEW_SETTINGS) {
    return;
  }

  if (![VIEW_LIBRARY, VIEW_LOCATIONS, VIEW_FONT_SETTINGS, VIEW_THEME_SETTINGS].includes(view)) {
    return;
  }

  stopLibraryDraftViewportSync();
  clearEditorState();
  state.view = view;
  render();
  runAfterLayout(() => {
    scrollToDocumentTop("auto");
  });
}

function openQuestFlow() {
  if (state.view !== VIEW_TIMELINE || state.pendingQuest || state.isStartingQuest) {
    return;
  }

  if (!getActiveQuestLibrary().length) {
    showFeedback("NO ACTIVE QUESTS");
    return;
  }

  if (!getAvailableQuestLibrary().length) {
    showFeedback("NO QUESTS HERE");
    render();
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

  const event = createQuestCompletionEvent(state.pendingQuest.quest, getAppendEventTimestamp());

  cancelQuestReel();
  const scoreDelta = appendEvent(event);
  state.pendingQuest = null;

  persistState();
  renderTimelinePinnedToBottom();
  showFeedback(formatScoreDelta(scoreDelta));
}

function rejectQuest() {
  if (!state.pendingQuest) {
    return;
  }

  const penaltyEvent = createQuestPenaltyEvent(
    EVENT_TYPE_REJECT,
    state.pendingQuest.quest,
    REJECT_COST,
    getAppendEventTimestamp()
  );

  cancelQuestReel();
  const scoreDelta = appendEvent(penaltyEvent);
  state.pendingQuest = null;
  persistState();
  renderTimelinePinnedToBottom();
  showFeedback(formatScoreDelta(scoreDelta));
}

function rerollQuest() {
  if (!state.pendingQuest) {
    return;
  }

  const penaltyEvent = createQuestPenaltyEvent(
    EVENT_TYPE_REROLL,
    state.pendingQuest.quest,
    REROLL_COST,
    getAppendEventTimestamp()
  );
  const scoreDelta = appendEvent(penaltyEvent);
  persistState();
  beginQuestRoll(state.pendingQuest.quest?.name || "");
  showFeedback(formatScoreDelta(scoreDelta));
}

function startLibraryDraft() {
  if (state.view !== VIEW_LIBRARY || state.libraryDraftQuest || getSelectedLibraryQuest()) {
    return;
  }

  state.libraryDraftQuest = {
    id: createId("library-quest"),
    name: "new quest",
    active: true,
    equipmentId: null,
    equipmentName: "",
    mode: "create",
  };
  state.librarySelectedQuestId = null;
  state.view = VIEW_EXERCISE_EDITOR;
  render();
  focusLibraryDraftInput();
}

function saveLibraryDraft() {
  if (!state.libraryDraftQuest || state.view !== VIEW_EXERCISE_EDITOR) {
    return;
  }

  const draft = state.libraryDraftQuest;
  const equipmentId = resolveDraftEquipmentId(draft.equipmentName);
  const quest = sanitizeQuest({
    id: draft.id,
    name: sanitizeQuestName(draft.name) || "new quest",
    active: draft.active !== false,
    equipmentId,
  });

  stopLibraryDraftViewportSync();
  if (draft.mode === "edit") {
    state.questLibrary = state.questLibrary.map((item) => (item.id === quest.id ? quest : item));
  } else {
    state.questLibrary.push(quest);
  }

  syncEquipmentLibraryFromQuestLibrary();
  state.libraryDraftQuest = null;
  state.librarySelectedQuestId = quest.id;
  persistState();
  state.view = VIEW_LIBRARY;
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
  state.view = VIEW_LIBRARY;
  render();
}

function saveCurrentDraft() {
  if (state.view === VIEW_LOCATION_EDITOR) {
    saveLocationDraft();
    return;
  }

  saveLibraryDraft();
}

function cancelCurrentDraft() {
  if (state.view === VIEW_LOCATION_EDITOR) {
    cancelLocationDraft();
    return;
  }

  cancelLibraryDraft();
}

function clearLibrarySelection() {
  if (state.view === VIEW_LOCATIONS) {
    clearLocationSelection();
    return;
  }

  if (!state.librarySelectedQuestId) {
    return;
  }

  state.librarySelectedQuestId = null;
  renderPreservingScrollPosition();
}

function editSelectedItem() {
  if (state.view === VIEW_LOCATIONS) {
    editSelectedLocation();
    return;
  }

  editSelectedQuest();
}

function editSelectedQuest() {
  const quest = getSelectedLibraryQuest();

  if (!quest || state.view !== VIEW_LIBRARY) {
    return;
  }

  state.libraryDraftQuest = {
    ...quest,
    equipmentName: getEquipmentNameById(quest.equipmentId),
    mode: "edit",
  };
  state.view = VIEW_EXERCISE_EDITOR;
  render();
  focusLibraryDraftInput();
}

function startLocationDraft() {
  if (state.view !== VIEW_LOCATIONS || state.locationDraft || getSelectedLocation()) {
    return;
  }

  state.locationDraft = {
    id: createId("location"),
    name: "new location",
    equipmentIds: [],
    mode: "create",
  };
  state.locationSelectedId = null;
  state.view = VIEW_LOCATION_EDITOR;
  render();
  focusLibraryDraftInput();
}

function editSelectedLocation() {
  const location = getSelectedLocation();

  if (!location || state.view !== VIEW_LOCATIONS) {
    return;
  }

  state.locationDraft = {
    ...location,
    equipmentIds: [...location.equipmentIds],
    mode: "edit",
  };
  state.view = VIEW_LOCATION_EDITOR;
  render();
  focusLibraryDraftInput();
}

function saveLocationDraft() {
  if (!state.locationDraft || state.view !== VIEW_LOCATION_EDITOR) {
    return;
  }

  const draft = state.locationDraft;
  const location = {
    id: draft.id,
    name: sanitizeLocationName(draft.name) || "new location",
    equipmentIds: [...new Set(draft.equipmentIds)].filter((equipmentId) =>
      getEquipmentIdSet().has(equipmentId)
    ),
  };

  stopLibraryDraftViewportSync();

  if (draft.mode === "edit") {
    state.locations = state.locations.map((item) => (item.id === location.id ? location : item));
  } else {
    state.locations.push(location);
  }

  state.locationDraft = null;
  state.locationSelectedId = location.id;
  state.selectedLocationId = sanitizeSelectedLocationId(state.selectedLocationId, state.locations);
  persistState();
  state.view = VIEW_LOCATIONS;
  render();
  runAfterLayout(() => {
    revealLocation(location.id, "auto");
  });
}

function cancelLocationDraft() {
  if (!state.locationDraft) {
    return;
  }

  stopLibraryDraftViewportSync();
  state.locationDraft = null;
  state.view = VIEW_LOCATIONS;
  render();
}

function clearLocationSelection() {
  if (!state.locationSelectedId) {
    return;
  }

  state.locationSelectedId = null;
  renderPreservingScrollPosition();
}

function deleteSelectedLocation() {
  const location = getSelectedLocation();

  if (!location || state.locations.length <= 1) {
    return;
  }

  state.locations = state.locations.filter((item) => item.id !== location.id);
  state.locationSelectedId = null;
  state.selectedLocationId = sanitizeSelectedLocationId(state.selectedLocationId, state.locations);
  persistState();
  renderPreservingScrollPosition();
  showFeedback("DELETED");
}

function toggleDraftLocationEquipment(equipmentId) {
  const draft = state.locationDraft;
  const safeEquipmentId = sanitizeId(equipmentId);

  if (!draft || !getEquipmentIdSet().has(safeEquipmentId)) {
    return;
  }

  if (draft.equipmentIds.includes(safeEquipmentId)) {
    draft.equipmentIds = draft.equipmentIds.filter((item) => item !== safeEquipmentId);
  } else {
    draft.equipmentIds = [...draft.equipmentIds, safeEquipmentId];
  }

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
  if (state.view === VIEW_LOCATIONS) {
    deleteSelectedLocation();
    return;
  }

  const quest = getSelectedLibraryQuest();

  if (!quest) {
    return;
  }

  state.questLibrary = state.questLibrary.filter((item) => item.id !== quest.id);
  syncEquipmentLibraryFromQuestLibrary();
  state.librarySelectedQuestId = null;
  persistState();
  renderPreservingScrollPosition();
  showFeedback("DELETED");
}

function handleTimelineClick(event) {
  const welcomePrimaryButton = event.target.closest("[data-welcome-primary]");
  const welcomeLibraryButton = event.target.closest("[data-welcome-library]");
  const settingsRowButton = event.target.closest("[data-settings-target]");
  const settingsActionButton = event.target.closest("[data-settings-action]");
  const fontOptionButton = event.target.closest("[data-font-option]");
  const themeOptionButton = event.target.closest("[data-theme-option]");

  if (welcomePrimaryButton) {
    handlePrimaryButtonClick();
    return;
  }

  if (welcomeLibraryButton) {
    openSettingsView();
    return;
  }

  if (settingsRowButton && state.view === VIEW_SETTINGS) {
    openSettingsSubscreen(settingsRowButton.dataset.settingsTarget);
    return;
  }

  if (settingsActionButton && state.view === VIEW_SETTINGS) {
    handleSettingsAction(settingsActionButton.dataset.settingsAction);
    return;
  }

  if (fontOptionButton && state.view === VIEW_FONT_SETTINGS) {
    selectFontPreference(fontOptionButton.dataset.fontOption);
    return;
  }

  if (themeOptionButton && state.view === VIEW_THEME_SETTINGS) {
    selectThemePreference(themeOptionButton.dataset.themeOption);
    return;
  }

  if (state.view === VIEW_EXERCISE_EDITOR) {
    const equipmentSuggestion = event.target.closest("[data-equipment-suggestion-id]");

    if (!equipmentSuggestion || !state.libraryDraftQuest) {
      return;
    }

    state.libraryDraftQuest.equipmentName = getEquipmentNameById(
      equipmentSuggestion.dataset.equipmentSuggestionId
    );
    renderPreservingScrollPosition();
    runAfterLayout(() => {
      focusExerciseEquipmentInput();
    });
    return;
  }

  if (state.view === VIEW_LOCATIONS) {
    const locationRow = event.target.closest("[data-location-id]");

    if (!locationRow) {
      return;
    }

    state.locationSelectedId = locationRow.dataset.locationId;
    renderPreservingScrollPosition();
    return;
  }

  if (state.view === VIEW_LOCATION_EDITOR) {
    const equipmentRow = event.target.closest("[data-location-equipment-id]");

    if (!equipmentRow) {
      return;
    }

    toggleDraftLocationEquipment(equipmentRow.dataset.locationEquipmentId);
    return;
  }

  if (state.view !== VIEW_LIBRARY || state.libraryDraftQuest) {
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
  if (state.view === VIEW_EXERCISE_EDITOR) {
    const nameInput = event.target.closest("[data-exercise-name-input]");
    const equipmentInput = event.target.closest("[data-exercise-equipment-input]");

    if (!state.libraryDraftQuest || (!nameInput && !equipmentInput)) {
      return;
    }

    if (nameInput) {
      state.libraryDraftQuest.name = nameInput.value;
      fitEditableQuestInput(nameInput);
    }

    if (equipmentInput) {
      state.libraryDraftQuest.equipmentName = equipmentInput.value;
      fitEditableQuestInput(equipmentInput);
      syncEquipmentSuggestions();
    }
    return;
  }

  if (state.view === VIEW_LOCATION_EDITOR) {
    const input = event.target.closest("[data-location-name-input]");

    if (!input || !state.locationDraft) {
      return;
    }

    state.locationDraft.name = input.value;
    fitEditableQuestInput(input);
  }
}

function handleTimelineKeydown(event) {
  if (state.view !== VIEW_EXERCISE_EDITOR && state.view !== VIEW_LOCATION_EDITOR) {
    return;
  }

  const input = event.target.closest(
    "[data-exercise-name-input], [data-exercise-equipment-input], [data-location-name-input]"
  );

  if (!input) {
    return;
  }

  if (event.key === "Enter") {
    event.preventDefault();
    saveCurrentDraft();
  }

  if (event.key === "Escape") {
    event.preventDefault();
    cancelCurrentDraft();
  }
}

function render() {
  syncViewChrome();
  updateHeader();
  updateScoreDisplay();
  ui.timeline.setAttribute("aria-label", getViewAriaLabel());
  ui.timeline.innerHTML = buildCurrentViewMarkup();
  syncControls();
  syncLocationPicker();
  state.lastRenderedEventId = null;
  scheduleFitText();

  if (state.view === VIEW_TIMELINE && state.pendingQuest?.isRolling) {
    playPendingQuestReel(state.pendingQuest.rollId);
  }
}

function syncViewChrome() {
  ui.body.classList.toggle("is-library-view", state.view !== VIEW_TIMELINE);
  ui.body.dataset.view = state.view;
}

function updateHeader() {
  if (ui.titleNode) {
    ui.titleNode.setAttribute("aria-label", getViewTitle());
  }

  if (ui.titleInner) {
    ui.titleInner.textContent = getViewTitle();
  }

  if (ui.libraryButtonIcon) {
    ui.libraryButtonIcon.innerHTML =
      state.view === VIEW_TIMELINE ? SETTINGS_ICON_SVG : BACK_ICON_SVG;
  }

  ui.libraryButton.disabled =
    state.view === VIEW_TIMELINE && (state.pendingQuest || state.isStartingQuest);
  ui.libraryButton.setAttribute("aria-label", getHeaderButtonLabel());
}

function updateScoreDisplay() {
  const hasVisibleScore = state.view === VIEW_TIMELINE && state.score > 0;
  const scoreInner = ui.scoreValue.querySelector(".fit-text-inner");

  if (scoreInner) {
    scoreInner.textContent = state.score.toLocaleString();
  } else {
    ui.scoreValue.textContent = state.score.toLocaleString();
  }

  ui.scoreWrap.classList.toggle("is-hidden", !hasVisibleScore);
}

function syncControls() {
  const isTimelineView = state.view === VIEW_TIMELINE;
  const isLibraryView = state.view === VIEW_LIBRARY;
  const isLocationsView = state.view === VIEW_LOCATIONS;
  const isExerciseEditorView = state.view === VIEW_EXERCISE_EDITOR;
  const isLocationEditorView = state.view === VIEW_LOCATION_EDITOR;
  const hasPendingQuest = Boolean(state.pendingQuest);
  const isRolling = Boolean(state.pendingQuest?.isRolling);
  const selectedQuest = getSelectedLibraryQuest();
  const selectedLocation = getSelectedLocation();
  const hasLibraryDraft = Boolean(state.libraryDraftQuest) && isExerciseEditorView;
  const hasLocationDraft = Boolean(state.locationDraft) && isLocationEditorView;
  const hasLibrarySelection = Boolean(selectedQuest) && !hasLibraryDraft;
  const hasLocationSelection = Boolean(selectedLocation) && !hasLocationDraft;
  const hasSelectionControls =
    (isLibraryView && hasLibrarySelection) || (isLocationsView && hasLocationSelection);
  const hasEditorControls = hasLibraryDraft || hasLocationDraft;
  const hasBottomControls =
    (isTimelineView && hasPendingQuest) || hasSelectionControls || hasEditorControls;

  setControlsClearance(hasBottomControls ? ACTIVE_CONTROLS_CLEARANCE : 0);

  const shouldShowQuestButton =
    (isTimelineView && !hasPendingQuest && !state.isStartingQuest) ||
    (isLibraryView && !hasLibrarySelection) ||
    (isLocationsView && !hasLocationSelection);

  setQuestFabClearance(shouldShowQuestButton ? ACTIVE_CONTROLS_CLEARANCE : 0);

  ui.questButton.classList.toggle(
    "is-hidden",
    !shouldShowQuestButton
  );
  ui.questButton.disabled = state.isStartingQuest || (!isTimelineView && !isLibraryView && !isLocationsView);
  ui.questButton.setAttribute(
    "aria-label",
    isLocationsView
      ? "Add a new location"
      : isLibraryView
        ? "Add a new quest to the library"
        : "Start a new quest"
  );

  ui.questControls.classList.toggle("is-visible", isTimelineView && hasPendingQuest);
  ui.acceptButton.disabled = !hasPendingQuest || isRolling;
  ui.rerollButton.disabled = !hasPendingQuest;
  ui.rejectButton.disabled = !hasPendingQuest;

  ui.librarySelectionControls.classList.toggle("is-visible", hasSelectionControls);
  ui.libraryCreateControls.classList.toggle("is-visible", hasEditorControls);

  ui.toggleQuestButton.classList.toggle("is-hidden", !isLibraryView);
  ui.editQuestButton?.classList.toggle("is-hidden", !hasSelectionControls);
  ui.deleteQuestButton.classList.toggle("is-hidden", !hasSelectionControls);

  if (isLocationsView) {
    ui.editQuestButton?.setAttribute("aria-label", "Edit location");
    ui.deleteQuestButton.setAttribute("aria-label", "Delete location");
    ui.deleteQuestButton.disabled = !selectedLocation || state.locations.length <= 1;
    ui.libraryCancelButton.setAttribute("aria-label", "Deselect location");
  } else {
    ui.editQuestButton?.setAttribute("aria-label", "Edit quest");
    ui.deleteQuestButton.setAttribute("aria-label", "Delete quest");
    ui.deleteQuestButton.disabled = !selectedQuest;
    ui.libraryCancelButton.setAttribute("aria-label", "Deselect quest");
  }

  ui.saveQuestButton.setAttribute(
    "aria-label",
    isLocationEditorView ? "Save location" : "Save quest"
  );
  ui.cancelCreateButton.setAttribute(
    "aria-label",
    isLocationEditorView ? "Cancel location changes" : "Cancel quest changes"
  );

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

function syncLocationPicker() {
  if (!ui.locationPicker || !ui.locationPickerButton || !ui.locationPickerLabel) {
    return;
  }

  const shouldShow =
    state.view === VIEW_TIMELINE &&
    !state.pendingQuest &&
    !state.isStartingQuest &&
    state.locations.length > 1;
  const currentLocation = getCurrentLocation();

  if (!shouldShow) {
    cancelLocationPickerAnimation();
  }

  ui.locationPicker.classList.toggle("is-visible", shouldShow);
  ui.locationPickerButton.disabled = !shouldShow;
  setLocationFooterClearance(shouldShow ? ui.locationPicker.getBoundingClientRect().height : 0);

  if (!isLocationPickerAnimating) {
    ui.locationPickerLabel.textContent = currentLocation?.name || "Default";
  }
}

function handleLocationPickerClick(event) {
  if (!event.target.closest("#locationPickerButton")) {
    return;
  }

  event.preventDefault();

  if (
    state.view !== VIEW_TIMELINE ||
    state.pendingQuest ||
    state.locations.length <= 1 ||
    isLocationPickerAnimating
  ) {
    return;
  }

  cycleCurrentLocation();
}

function cycleCurrentLocation() {
  const currentLocation = getCurrentLocation();
  const nextLocation = getNextLocation(currentLocation?.id);

  if (!currentLocation || !nextLocation || currentLocation.id === nextLocation.id) {
    return;
  }

  animateLocationPickerTransition(currentLocation, nextLocation);
}

function getNextLocation(locationId) {
  const currentIndex = state.locations.findIndex((location) => location.id === locationId);

  if (currentIndex < 0) {
    return state.locations[0] || null;
  }

  return state.locations[(currentIndex + 1) % state.locations.length] || null;
}

function animateLocationPickerTransition(currentLocation, nextLocation) {
  if (!ui.locationPicker || !ui.locationPickerLabel) {
    selectCurrentLocation(nextLocation.id);
    return;
  }

  window.clearTimeout(locationPickerAnimationTimer);
  isLocationPickerAnimating = true;
  ui.locationPicker.classList.add("is-switching");
  ui.locationPickerLabel.innerHTML = `
    <span class="location-picker-slide location-picker-slide-current">
      ${escapeHtml(currentLocation.name)}
    </span>
    <span class="location-picker-slide location-picker-slide-next">
      ${escapeHtml(nextLocation.name)}
    </span>
  `;

  locationPickerAnimationTimer = window.setTimeout(() => {
    locationPickerAnimationTimer = 0;
    isLocationPickerAnimating = false;
    ui.locationPicker.classList.remove("is-switching");
    selectCurrentLocation(nextLocation.id);
  }, 260);
}

function cancelLocationPickerAnimation() {
  window.clearTimeout(locationPickerAnimationTimer);
  locationPickerAnimationTimer = 0;
  isLocationPickerAnimating = false;

  if (ui.locationPicker) {
    ui.locationPicker.classList.remove("is-switching");
  }
}

function selectCurrentLocation(locationId) {
  const safeLocationId = sanitizeId(locationId);

  if (!state.locations.some((location) => location.id === safeLocationId)) {
    return;
  }

  state.selectedLocationId = safeLocationId;
  persistState();
  syncLocationPicker();
}

function getViewTitle() {
  switch (state.view) {
    case VIEW_SETTINGS:
      return "SETTINGS";
    case VIEW_LIBRARY:
      return "QUEST LIBRARY";
    case VIEW_EXERCISE_EDITOR:
      return state.libraryDraftQuest?.mode === "edit" ? "EDIT QUEST" : "NEW QUEST";
    case VIEW_LOCATIONS:
      return "LOCATIONS";
    case VIEW_LOCATION_EDITOR:
      return state.locationDraft?.mode === "edit" ? "EDIT LOCATION" : "NEW LOCATION";
    case VIEW_FONT_SETTINGS:
      return "FONT";
    case VIEW_THEME_SETTINGS:
      return "THEME";
    default:
      return "FITNESS QUEST";
  }
}

function getViewAriaLabel() {
  switch (state.view) {
    case VIEW_SETTINGS:
      return "Settings";
    case VIEW_LIBRARY:
      return "Quest library";
    case VIEW_EXERCISE_EDITOR:
      return "Quest editor";
    case VIEW_LOCATIONS:
      return "Locations";
    case VIEW_LOCATION_EDITOR:
      return "Location editor";
    case VIEW_FONT_SETTINGS:
      return "Font settings";
    case VIEW_THEME_SETTINGS:
      return "Theme settings";
    default:
      return "Fitness Quest activity timeline";
  }
}

function getHeaderButtonLabel() {
  if (state.view === VIEW_TIMELINE) {
    return "Open settings";
  }

  if (state.view === VIEW_SETTINGS) {
    return "Back to main screen";
  }

  if (state.view === VIEW_EXERCISE_EDITOR) {
    return "Back to quest library";
  }

  if (state.view === VIEW_LOCATION_EDITOR) {
    return "Back to locations";
  }

  return "Back to settings";
}

function buildCurrentViewMarkup() {
  switch (state.view) {
    case VIEW_SETTINGS:
      return buildSettingsMarkup();
    case VIEW_LIBRARY:
      return buildLibraryMarkup();
    case VIEW_EXERCISE_EDITOR:
      return buildExerciseEditorMarkup();
    case VIEW_LOCATIONS:
      return buildLocationsMarkup();
    case VIEW_LOCATION_EDITOR:
      return buildLocationEditorMarkup();
    case VIEW_FONT_SETTINGS:
      return buildFontSettingsMarkup();
    case VIEW_THEME_SETTINGS:
      return buildThemeSettingsMarkup();
    default:
      return buildTimelineMarkup();
  }
}

function buildTimelineMarkup() {
  const rows = [];
  const sortedEvents = [...state.events].sort(sortByTimestamp);
  let currentDayKey = "";
  const isEmptyTimeline =
    !sortedEvents.length && !state.pendingQuest && !(state.isStartingQuest && state.launchQuestPlan);

  if (isEmptyTimeline) {
    rows.push(renderWelcomeMessage());
  }

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

function renderWelcomeMessage() {
  return `
    <section class="timeline-welcome" aria-label="Welcome message">
      <p
        class="fit-text stack-copy timeline-welcome-line"
        data-fit-text
        data-fit-base="52"
      >
        <span class="fit-text-inner">WELCOME TO FITNESS QUEST</span>
      </p>
      <div class="timeline-welcome-cta">
        <p
          class="fit-text stack-copy timeline-welcome-line timeline-welcome-cta-copy"
          data-fit-text
          data-fit-base="42"
        >
          <span class="fit-text-inner">CLICK</span>
        </p>
        <button
          class="quest-fab timeline-welcome-button"
          type="button"
          data-welcome-primary
          aria-label="Start your first exercise quest"
        >
          <span class="quest-action-icon" aria-hidden="true">
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
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
          </span>
        </button>
      </div>
      <p
        class="fit-text stack-copy timeline-welcome-line"
        data-fit-text
        data-fit-base="46"
      >
        <span class="fit-text-inner">FOR YOUR FIRST</span>
      </p>
      <p
        class="fit-text stack-copy timeline-welcome-line"
        data-fit-text
        data-fit-base="46"
      >
        <span class="fit-text-inner">EXERCISE QUEST NOW</span>
      </p>
      <div class="timeline-welcome-cta timeline-welcome-cta-library">
        <p
          class="fit-text stack-copy timeline-welcome-line timeline-welcome-cta-copy timeline-welcome-cta-copy-start"
          data-fit-text
          data-fit-base="34"
          data-fit-height="52"
        >
          <span class="fit-text-inner">CLICK</span>
        </p>
        <button
          class="header-action timeline-welcome-menu-button"
          type="button"
          data-welcome-library
          aria-label="Open settings"
        >
          <span class="header-action-icon" aria-hidden="true">
            ${SETTINGS_ICON_SVG}
          </span>
        </button>
        <p
          class="fit-text stack-copy timeline-welcome-line timeline-welcome-cta-copy timeline-welcome-cta-copy-end"
          data-fit-text
          data-fit-base="34"
          data-fit-height="52"
        >
          <span class="fit-text-inner">TO OPEN</span>
        </p>
      </div>
      <p
        class="fit-text stack-copy timeline-welcome-line"
        data-fit-text
        data-fit-base="38"
      >
        <span class="fit-text-inner">YOUR SETTINGS MENU</span>
      </p>
    </section>
  `;
}

function buildSettingsMarkup() {
  return [
    renderSettingsRow({
      label: "Quest Library",
      attributeName: "data-settings-target",
      attributeValue: VIEW_LIBRARY,
    }),
    renderSettingsRow({
      label: "Locations",
      attributeName: "data-settings-target",
      attributeValue: VIEW_LOCATIONS,
    }),
    renderSettingsRow({
      label: "Export Data",
      attributeName: "data-settings-action",
      attributeValue: SETTINGS_ACTION_EXPORT,
    }),
    renderSettingsRow({
      label: "Import Data",
      attributeName: "data-settings-action",
      attributeValue: SETTINGS_ACTION_IMPORT,
    }),
    renderSettingsRow({
      label: "Font",
      attributeName: "data-settings-target",
      attributeValue: VIEW_FONT_SETTINGS,
    }),
    renderSettingsRow({
      label: "Theme",
      attributeName: "data-settings-target",
      attributeValue: VIEW_THEME_SETTINGS,
    }),
  ].join("");
}

function buildLibraryMarkup() {
  return getSortedQuestLibrary().map((quest) => renderLibraryQuestRow(quest)).join("");
}

function buildExerciseEditorMarkup() {
  const draft = state.libraryDraftQuest;

  if (!draft) {
    return "";
  }

  return `
    <section class="editor-form" aria-label="Quest editor">
      ${renderEditorInputRow({
        label: "Name",
        value: draft.name,
        placeholder: "new quest",
        inputAttribute: "data-exercise-name-input",
        autocomplete: "off",
        enterkeyhint: "done",
        isFocusRow: true,
      })}
      <div class="equipment-picker">
        ${renderEditorInputRow({
          label: "Equipment",
          value: draft.equipmentName || "",
          placeholder: "none",
          inputAttribute: "data-exercise-equipment-input",
          autocomplete: "off",
          enterkeyhint: "done",
        })}
        <div class="equipment-suggestions" data-equipment-suggestions>
          ${renderEquipmentSuggestions(draft.equipmentName || "")}
        </div>
      </div>
    </section>
  `;
}

function renderEquipmentSuggestions(value) {
  const query = getNameKey(value);
  const matches = getSortedEquipmentLibrary().filter((equipment) => {
    if (!query) {
      return true;
    }

    return getNameKey(equipment.name).includes(query);
  });

  return matches
    .map(
      (equipment) => `
        <button
          class="equipment-suggestion"
          type="button"
          data-equipment-suggestion-id="${escapeAttribute(equipment.id)}"
        >
          <span
            class="fit-text stack-copy stack-copy-event"
            data-fit-text
            data-fit-base="86"
          >
            <span class="fit-text-inner">${escapeHtml(normalizeStackCopy(equipment.name))}</span>
          </span>
        </button>
      `
    )
    .join("");
}

function buildLocationsMarkup() {
  return state.locations.map((location) => renderLocationRow(location)).join("");
}

function buildLocationEditorMarkup() {
  const draft = state.locationDraft;

  if (!draft) {
    return "";
  }

  const equipmentRows = getSortedEquipmentLibrary()
    .map((equipment) => renderLocationEquipmentRow(equipment, draft.equipmentIds.includes(equipment.id)))
    .join("");

  return `
    <section class="editor-form" aria-label="Location editor">
      ${renderEditorInputRow({
        label: "Name",
        value: draft.name,
        placeholder: "new location",
        inputAttribute: "data-location-name-input",
        autocomplete: "off",
        enterkeyhint: "done",
        isFocusRow: true,
      })}
      <p
        class="fit-text stack-copy stack-copy-date editor-label editor-section-label"
        data-fit-text
        data-fit-base="44"
      >
        <span class="fit-text-inner">EQUIPMENT</span>
      </p>
      ${equipmentRows}
    </section>
  `;
}

function renderEditorInputRow({
  label,
  value,
  placeholder,
  inputAttribute,
  autocomplete = "off",
  enterkeyhint = "done",
  isFocusRow = false,
}) {
  return `
    <article class="stack-row stack-row-event stack-row-editor ${isFocusRow ? "stack-row-editor-focus" : ""}" ${
      isFocusRow ? "data-editor-focus-row" : ""
    }>
      <label class="quest-editor-shell">
        <span
          class="fit-text stack-copy stack-copy-date editor-label"
          data-fit-text
          data-fit-base="50"
        >
          <span class="fit-text-inner">${escapeHtml(normalizeStackCopy(label))}</span>
        </span>
        <input
          class="quest-editor-input"
          data-fit-input
          data-fit-base="104"
          data-fit-max-text="${escapeAttribute(value || placeholder)}"
          ${inputAttribute}
          type="text"
          value="${escapeAttribute(value)}"
          placeholder="${escapeAttribute(placeholder)}"
          autocapitalize="words"
          autocomplete="${escapeAttribute(autocomplete)}"
          spellcheck="false"
          enterkeyhint="${escapeAttribute(enterkeyhint)}"
        />
      </label>
    </article>
  `;
}

function buildFontSettingsMarkup() {
  return FONT_OPTIONS.map((option) =>
    renderSettingsRow({
      label: option.label,
      attributeName: "data-font-option",
      attributeValue: option.id,
      isSelected: option.id === state.fontPreference,
      labelFontFamily: option.cssFamily,
      labelFontWeight: option.weight,
      preserveCase: true,
      rowClassName: "stack-row-font-option",
    })
  ).join("");
}

function buildThemeSettingsMarkup() {
  return THEME_OPTIONS.map((option) =>
    renderSettingsRow({
      label: option.label,
      attributeName: "data-theme-option",
      attributeValue: option.id,
      isSelected: option.id === state.themePreference,
    })
  ).join("");
}

function handleSettingsAction(action) {
  if (action === SETTINGS_ACTION_EXPORT) {
    exportAppData();
    return;
  }

  if (action === SETTINGS_ACTION_IMPORT) {
    promptImportData();
  }
}

function renderSettingsRow({
  label,
  attributeName,
  attributeValue,
  isSelected = false,
  labelFontFamily = "",
  labelFontWeight = "",
  preserveCase = false,
  rowClassName = "",
}) {
  const classes = ["stack-row", "stack-row-event", "stack-row-settings"];
  const labelText = preserveCase ? label : normalizeStackCopy(label);
  const labelStyles = [];

  if (isSelected) {
    classes.push("is-selected");
  }

  if (rowClassName) {
    classes.push(rowClassName);
  }

  if (labelFontFamily) {
    labelStyles.push(`font-family:${labelFontFamily}`);
  }

  if (labelFontWeight) {
    labelStyles.push(`font-weight:${labelFontWeight}`);
  }

  return `
    <article class="${classes.join(" ")}">
      <button
        class="settings-row-button"
        type="button"
        ${attributeName}="${escapeAttribute(attributeValue)}"
        aria-label="${escapeAttribute(label)}"
      >
        <strong
          class="fit-text stack-copy stack-copy-event"
          data-fit-text
          data-fit-base="124"
          ${labelStyles.length ? `style="${escapeAttribute(labelStyles.join(";"))}"` : ""}
        >
          <span class="fit-text-inner">${escapeHtml(labelText)}</span>
        </strong>
      </button>
    </article>
  `;
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
  const isBonus = event.type === EVENT_TYPE_BONUS;
  const isPenalty = isQuestPenaltyEvent(event);
  const freshClass = event.id === state.lastRenderedEventId ? "fresh-entry" : "";
  const label = getEventDisplayLabel(event);
  const baseFont = getEventDisplayBaseFont(event);
  const typeClass = isBonus
    ? "is-bonus"
    : event.type === EVENT_TYPE_REROLL
      ? "is-reroll"
      : event.type === EVENT_TYPE_REJECT
        ? "is-reject"
        : "";

  return `
    <article
      class="stack-row stack-row-event ${typeClass} ${isPenalty ? "is-penalty" : ""} ${freshClass}"
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
    <article class="${classes.join(" ")}" data-library-quest-id="${escapeAttribute(quest.id)}">
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

function renderLocationRow(location) {
  const classes = ["stack-row", "stack-row-event", "stack-row-library"];

  if (state.locationSelectedId === location.id) {
    classes.push("is-selected");
  }

  return `
    <article class="${classes.join(" ")}" data-location-id="${escapeAttribute(location.id)}">
      <strong
        class="fit-text stack-copy stack-copy-event"
        data-fit-text
        data-fit-base="132"
      >
        <span class="fit-text-inner">${escapeHtml(normalizeStackCopy(location.name))}</span>
      </strong>
    </article>
  `;
}

function renderLocationEquipmentRow(equipment, isAvailable) {
  const classes = ["stack-row", "stack-row-event", "stack-row-library", "stack-row-equipment"];

  if (!isAvailable) {
    classes.push("is-inactive");
  }

  return `
    <article
      class="${classes.join(" ")}"
      data-location-equipment-id="${escapeAttribute(equipment.id)}"
      aria-label="${escapeAttribute(`${equipment.name} ${isAvailable ? "available" : "unavailable"}`)}"
    >
      <strong
        class="fit-text stack-copy stack-copy-event"
        data-fit-text
        data-fit-base="112"
      >
        <span class="fit-text-inner">${escapeHtml(normalizeStackCopy(equipment.name))}</span>
      </strong>
    </article>
  `;
}

async function handleImportFileSelection(event) {
  const input = event.currentTarget;
  const file = input?.files?.[0];

  if (!file) {
    return;
  }

  try {
    const rawText = await readFileAsText(file);
    const importedData = parseImportedAppData(rawText);
    const shouldImport = window.confirm(
      "Importing will replace your current quest library and daily log. Continue?"
    );

    if (!shouldImport) {
      return;
    }

    applyImportedAppData(importedData);
    showFeedback("IMPORTED");
  } catch (error) {
    showFeedback("IMPORT FAILED");
  } finally {
    input.value = "";
  }
}

function promptImportData() {
  if (!ui.importFileInput) {
    showFeedback("IMPORT BLOCKED");
    return;
  }

  ui.importFileInput.value = "";
  ui.importFileInput.click();
}

function exportAppData() {
  const exportedAt = new Date();
  const payload = {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: exportedAt.toISOString(),
    score: sanitizeScore(state.score),
    questLibrary: cloneQuestLibrary(state.questLibrary),
    equipmentLibrary: cloneEquipmentLibrary(state.equipmentLibrary),
    locations: cloneLocations(state.locations),
    selectedLocationId: state.selectedLocationId,
    dailyLog: [...state.events].sort(sortByTimestamp).map(serializeExportEvent),
  };
  const fileName = `fitquest-export-${formatDateForFilename(exportedAt)}.json`;

  downloadJsonFile(fileName, payload);
  showFeedback("EXPORTED");
}

function parseImportedAppData(rawText) {
  const parsed = JSON.parse(rawText);
  const importedData = sanitizeImportedAppData(parsed);

  if (!importedData) {
    throw new Error("Invalid import payload");
  }

  return importedData;
}

function sanitizeImportedAppData(payload) {
  return sanitizeAppData(payload);
}

function applyImportedAppData(importedData) {
  stopLibraryDraftViewportSync();
  clearLibraryEditorState();
  state.events = importedData.events;
  state.questLibrary = importedData.questLibrary;
  state.equipmentLibrary = importedData.equipmentLibrary;
  state.locations = importedData.locations;
  state.selectedLocationId = importedData.selectedLocationId;
  state.score = importedData.score;
  state.pendingQuest = null;
  persistState();
  render();
  runAfterLayout(() => {
    scrollToDocumentTop("auto");
  });
}

function readFileAsText(file) {
  if (typeof file?.text === "function") {
    return file.text();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read file"));
    reader.readAsText(file);
  });
}

function downloadJsonFile(fileName, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => {
    window.URL.revokeObjectURL(url);
  }, 0);
}

function serializeExportEvent(event) {
  if (event.type === EVENT_TYPE_BONUS) {
    return {
      id: event.id,
      type: event.type,
      icon: event.icon,
      label: event.label,
      points: getEventPointValue(event),
      timestamp: event.timestamp,
    };
  }

  return {
    id: event.id,
    type: event.type,
    questId: event.questId,
    questName: event.questName,
    points: getEventPointValue(event),
    penaltyCost: Number.isFinite(event.penaltyCost) ? event.penaltyCost : undefined,
    timestamp: event.timestamp,
  };
}

function formatDateForFilename(date) {
  const year = String(date.getFullYear());
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

function revealLocation(locationId, behavior = "smooth") {
  const locationRow = ui.timeline.querySelector(`[data-location-id="${locationId}"]`);

  if (!locationRow) {
    return;
  }

  focusElementInSafeBand(locationRow, behavior);
}

function focusLibraryDraftInput() {
  const input = ui.timeline.querySelector(
    "[data-exercise-name-input], [data-location-name-input]"
  );

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

function focusExerciseEquipmentInput() {
  const input = ui.timeline.querySelector("[data-exercise-equipment-input]");

  if (!input) {
    return;
  }

  fitEditableQuestInput(input);

  try {
    input.focus({ preventScroll: true });
  } catch (error) {
    input.focus();
  }
}

function syncEquipmentSuggestions() {
  const suggestions = ui.timeline.querySelector("[data-equipment-suggestions]");

  if (!suggestions || !state.libraryDraftQuest) {
    return;
  }

  suggestions.innerHTML = renderEquipmentSuggestions(state.libraryDraftQuest.equipmentName || "");
  scheduleFitText();
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
        const draftRow = ui.timeline.querySelector("[data-editor-focus-row]");

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

function setControlsClearance(value) {
  document.documentElement.style.setProperty(
    "--controls-clearance",
    `${Math.max(0, Math.ceil(value))}px`
  );
}

function setQuestFabClearance(value) {
  document.documentElement.style.setProperty(
    "--quest-fab-clearance",
    `${Math.max(0, Math.ceil(value))}px`
  );
}

function setLocationFooterClearance(value) {
  document.documentElement.style.setProperty(
    "--location-footer-clearance",
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
    const targetTop = getPinnedBottomScrollTop();
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
  const valign = node.dataset.fitValign || "top";
  const scaledWidth = naturalWidth * scale;
  const scaledHeight = naturalHeight * scale;
  const offsetX = align === "center" ? Math.max((availableWidth - scaledWidth) / 2, 0) : 0;
  const offsetY =
    maxHeight > 0 && valign === "center" ? Math.max((maxHeight - scaledHeight) / 2, 0) : 0;

  node.dataset.fitReady = "true";
  node.style.height = `${Math.ceil(maxHeight > 0 && valign === "center" ? maxHeight : scaledHeight)}px`;
  inner.style.fontSize = `${baseFont}px`;
  inner.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
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
  const scoreHeight = Math.ceil(ui.scoreWrap.getBoundingClientRect().height);
  const currentTimelineOffset = getCssPixelValue("--timeline-content-offset", 0);
  const contentHeight = Math.max(ui.timeline.scrollHeight - currentTimelineOffset, 0);
  const scoreClearance = scoreHeight > 0 ? scoreHeight + 44 : 0;
  const shouldOffsetTimeline =
    state.view === VIEW_TIMELINE &&
    scoreClearance > 0 &&
    contentHeight + scoreClearance <= ui.timelineView.clientHeight;

  root.style.setProperty("--stack-header-height", `${headerHeight}px`);
  root.style.setProperty("--score-top", `${headerHeight + 20}px`);
  root.style.setProperty(
    "--stack-scroll-margin",
    `${headerHeight + (scoreHeight > 0 ? scoreHeight + 44 : 24)}px`
  );
  root.style.setProperty(
    "--timeline-content-offset",
    `${shouldOffsetTimeline ? scoreClearance : 0}px`
  );

  if (!state.hasInitialFocus && state.view === VIEW_TIMELINE) {
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

function getPinnedBottomScrollTop() {
  const fabClearance = getCssPixelValue("--quest-fab-clearance", 0);
  return Math.max(getMaxScrollTop() - fabClearance, 0);
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
  scrollContainerTo(getPinnedBottomScrollTop(), behavior);
}

function scrollToDocumentTop(behavior = "smooth") {
  scrollContainerTo(0, behavior);
}

function pinTimelineToBottom() {
  const scroller = getScrollContainer();

  if (!scroller) {
    return;
  }

  scroller.scrollTop = getPinnedBottomScrollTop();
}

function createQuestCompletionEvent(quest, timestamp, customId) {
  return createQuestActivityEvent(
    EVENT_TYPE_COMPLETE,
    quest,
    QUEST_POINTS,
    timestamp,
    customId
  );
}

function createQuestPenaltyEvent(type, quest, penaltyCost, timestamp, customId) {
  const safePenaltyCost = Math.max(0, Math.round(Number(penaltyCost) || 0));
  const deductedPoints = Math.min(state.score, safePenaltyCost);

  return createQuestActivityEvent(type, quest, -deductedPoints, timestamp, customId, {
    penaltyCost: safePenaltyCost,
  });
}

function createQuestActivityEvent(type, quest, points, timestamp, customId, extraData = {}) {
  const questName = sanitizeQuestName(quest?.name || quest?.questName);

  if (!questName) {
    return null;
  }

  return {
    id: customId || createId("quest"),
    type,
    questId: sanitizeQuestName(quest?.id || quest?.questId) || createQuestReferenceId(questName),
    questName,
    points: Math.round(Number(points) || 0),
    timestamp: new Date(timestamp).toISOString(),
    ...extraData,
  };
}

function appendEvent(event) {
  if (!event) {
    return 0;
  }

  const scoreDelta = getEventPointValue(event);
  state.events.push(event);
  state.events.sort(sortByTimestamp);
  state.score = sanitizeScore(state.score + scoreDelta);
  state.lastRenderedEventId = event.id;
  return scoreDelta;
}

function getAppendEventTimestamp() {
  const now = Date.now();
  const latestTimestamp = state.events.reduce((latest, event) => {
    const time = new Date(event.timestamp).getTime();
    return Number.isFinite(time) ? Math.max(latest, time) : latest;
  }, 0);

  return new Date(latestTimestamp >= now ? latestTimestamp + 1000 : now);
}

function getRandomQuest(excludeName = "") {
  const activeLibrary = getAvailableQuestLibrary();
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

function getSelectedLocation() {
  return state.locations.find((location) => location.id === state.locationSelectedId) || null;
}

function getCurrentLocation() {
  const location = state.locations.find((item) => item.id === state.selectedLocationId);
  return location || state.locations[0] || null;
}

function clearLibraryEditorState() {
  state.librarySelectedQuestId = null;
  state.libraryDraftQuest = null;
}

function clearLocationEditorState() {
  state.locationSelectedId = null;
  state.locationDraft = null;
}

function clearEditorState() {
  clearLibraryEditorState();
  clearLocationEditorState();
}

function getSortedQuestLibrary(library = state.questLibrary) {
  return [...library].sort(compareQuestLibrary);
}

function getActiveQuestLibrary(library = state.questLibrary) {
  return library.filter((quest) => quest.active !== false && sanitizeQuestName(quest.name));
}

function getAvailableQuestLibrary(library = state.questLibrary) {
  const activeLibrary = getActiveQuestLibrary(library);
  const currentLocation = getCurrentLocation();

  if (!currentLocation) {
    return activeLibrary;
  }

  const locationEquipmentIds = new Set(currentLocation.equipmentIds);
  return activeLibrary.filter(
    (quest) => !quest.equipmentId || locationEquipmentIds.has(quest.equipmentId)
  );
}

function cloneQuestLibrary(questLibrary) {
  return questLibrary.map((quest) => ({ ...quest }));
}

function cloneEquipmentLibrary(equipmentLibrary) {
  return equipmentLibrary.map((equipment) => ({ ...equipment }));
}

function cloneLocations(locations) {
  return locations.map((location) => ({
    ...location,
    equipmentIds: Array.isArray(location.equipmentIds) ? [...location.equipmentIds] : [],
  }));
}

function createDefaultLocations(equipmentLibrary = DEFAULT_EQUIPMENT_LIBRARY) {
  return [
    {
      id: DEFAULT_LOCATION_ID,
      name: "Default",
      equipmentIds: equipmentLibrary.map((equipment) => equipment.id),
    },
  ];
}

function getSortedEquipmentLibrary(library = state.equipmentLibrary) {
  return [...library].sort(compareEquipmentLibrary);
}

function getEquipmentIdSet(library = state.equipmentLibrary) {
  return new Set(library.map((equipment) => equipment.id));
}

function getEquipmentNameById(equipmentId) {
  return state.equipmentLibrary.find((equipment) => equipment.id === equipmentId)?.name || "";
}

function resolveDraftEquipmentId(value) {
  const name = sanitizeEquipmentName(value);

  if (!name) {
    return null;
  }

  const existingEquipment = state.equipmentLibrary.find(
    (equipment) => getNameKey(equipment.name) === getNameKey(name)
  );

  if (existingEquipment) {
    return existingEquipment.id;
  }

  const usedEquipmentIds = new Set(state.equipmentLibrary.map((equipment) => equipment.id));
  const id = getUniqueId(createEquipmentReferenceId(name), usedEquipmentIds);
  const equipment = { id, name };

  state.equipmentLibrary = [...state.equipmentLibrary, equipment].sort(compareEquipmentLibrary);
  addEquipmentToCurrentLocation(id);
  return id;
}

function addEquipmentToCurrentLocation(equipmentId) {
  const currentLocation = getCurrentLocation();

  if (!currentLocation) {
    return;
  }

  state.locations = state.locations.map((location) => {
    if (location.id !== currentLocation.id || location.equipmentIds.includes(equipmentId)) {
      return location;
    }

    return {
      ...location,
      equipmentIds: [...location.equipmentIds, equipmentId],
    };
  });
}

function syncEquipmentLibraryFromQuestLibrary() {
  const usedEquipmentIds = new Set(
    state.questLibrary.map((quest) => quest.equipmentId).filter(Boolean)
  );

  state.equipmentLibrary = state.equipmentLibrary
    .filter((equipment) => usedEquipmentIds.has(equipment.id))
    .sort(compareEquipmentLibrary);
  state.locations = sanitizeLocations(state.locations, state.equipmentLibrary);
  state.selectedLocationId = sanitizeSelectedLocationId(state.selectedLocationId, state.locations);
}

function getCurrentFontOption() {
  return FONT_OPTIONS_BY_ID[state.fontPreference] || FONT_OPTIONS_BY_ID[DEFAULT_FONT_PREFERENCE];
}

function getCurrentThemeOption() {
  return THEME_OPTIONS_BY_ID[state.themePreference] || THEME_OPTIONS_BY_ID[DEFAULT_THEME_PREFERENCE];
}

function getResolvedThemePreference() {
  if (state.themePreference !== DEFAULT_THEME_PREFERENCE) {
    return state.themePreference;
  }

  return systemThemeMedia?.matches ? "dark" : "light";
}

function applyDisplayPreferences() {
  applyFontPreference();
  applyThemePreference();
}

function applyFontPreference() {
  const font = getCurrentFontOption();

  ui.root.style.setProperty("--display-font-family", font.cssFamily);
  ui.root.style.setProperty("--display-font-weight", String(font.weight));

  if (document.fonts?.load) {
    document.fonts
      .load(`${font.weight} 32px ${font.loadFamily}`)
      .then(() => {
        scheduleFitText();
      })
      .catch(() => {});
  }
}

function applyThemePreference() {
  const resolvedTheme = getResolvedThemePreference();

  ui.root.dataset.theme = resolvedTheme;
  ui.root.style.colorScheme = resolvedTheme;

  if (ui.themeColorMeta) {
    ui.themeColorMeta.setAttribute(
      "content",
      resolvedTheme === "dark" ? DARK_THEME_COLOR : LIGHT_THEME_COLOR
    );
  }
}

function selectFontPreference(value) {
  const nextPreference = sanitizeFontPreference(value);

  if (nextPreference === state.fontPreference) {
    return;
  }

  state.fontPreference = nextPreference;
  persistState();
  applyFontPreference();
  renderPreservingScrollPosition();
}

function selectThemePreference(value) {
  const nextPreference = sanitizeThemePreference(value);

  if (nextPreference === state.themePreference) {
    return;
  }

  state.themePreference = nextPreference;
  persistState();
  applyThemePreference();
  renderPreservingScrollPosition();
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function createQuestReferenceId(name) {
  const slug = sanitizeQuestName(name)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `quest-ref-${slug}` : createId("quest-ref");
}

function createEquipmentReferenceId(name) {
  const slug = sanitizeEquipmentName(name)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `equipment-${slug}` : createId("equipment");
}

function createLocationReferenceId(name) {
  const slug = sanitizeLocationName(name)
    .toLocaleLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return slug ? `location-${slug}` : createId("location");
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

function sanitizeEquipmentName(value) {
  return sanitizeQuestName(value);
}

function sanitizeLocationName(value) {
  return sanitizeQuestName(value);
}

function sanitizeId(value) {
  return sanitizeQuestName(value);
}

function getNameKey(value) {
  return sanitizeQuestName(value).toLocaleLowerCase();
}

function getUniqueId(baseId, usedIds) {
  const safeBaseId = sanitizeId(baseId) || createId("item");
  let id = safeBaseId;
  let suffix = 2;

  while (usedIds.has(id)) {
    id = `${safeBaseId}-${suffix}`;
    suffix += 1;
  }

  return id;
}

function getDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function sanitizeScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? Math.max(0, Math.round(score)) : 0;
}

function sanitizeFontPreference(value) {
  return FONT_OPTIONS_BY_ID[value] ? value : DEFAULT_FONT_PREFERENCE;
}

function sanitizeThemePreference(value) {
  return THEME_OPTIONS_BY_ID[value] ? value : DEFAULT_THEME_PREFERENCE;
}

function sanitizeEvents(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((event, index) => sanitizeEvent(event, index))
    .filter(Boolean)
    .sort(sortByTimestamp);
}

function sanitizeAppData(payload) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const rawEvents = Array.isArray(payload.events)
    ? payload.events
    : Array.isArray(payload.dailyLog)
      ? payload.dailyLog
      : null;

  if (!Array.isArray(payload.questLibrary) || !rawEvents) {
    return null;
  }

  const events = sanitizeEvents(rawEvents);
  const { questLibrary, equipmentLibrary } = sanitizeQuestAndEquipmentLibraries(
    payload.questLibrary,
    payload.equipmentLibrary
  );
  const locations = sanitizeLocations(payload.locations, equipmentLibrary);
  const selectedLocationId = sanitizeSelectedLocationId(payload.selectedLocationId, locations);

  return {
    events,
    questLibrary,
    equipmentLibrary,
    locations,
    selectedLocationId,
    score: hasNumericValue(payload.score)
      ? deriveScore(payload.score, rawEvents, events)
      : sanitizeScore(getEventPointTotal(events)),
  };
}

function sanitizeQuestAndEquipmentLibraries(rawQuestLibrary, rawEquipmentLibrary) {
  if (!Array.isArray(rawQuestLibrary)) {
    return {
      questLibrary: cloneQuestLibrary(DEFAULT_QUEST_LIBRARY),
      equipmentLibrary: cloneEquipmentLibrary(DEFAULT_EQUIPMENT_LIBRARY),
    };
  }

  const equipmentLibrary = sanitizeEquipmentLibrary(rawEquipmentLibrary);
  const equipmentById = new Map(equipmentLibrary.map((equipment) => [equipment.id, equipment]));
  const equipmentByName = new Map(
    equipmentLibrary.map((equipment) => [getNameKey(equipment.name), equipment])
  );
  const usedEquipmentIds = new Set(equipmentLibrary.map((equipment) => equipment.id));
  const shouldInferEquipment = equipmentLibrary.length === 0;
  const questLibrary = rawQuestLibrary
    .map((quest, index) => {
      const name = sanitizeQuestName(quest?.name);

      if (!name) {
        return null;
      }

      let equipmentId = null;
      const rawEquipmentId = sanitizeId(quest?.equipmentId);
      const rawEquipmentName = sanitizeEquipmentName(
        quest?.equipmentName || quest?.equipment?.name || ""
      );

      if (rawEquipmentId && equipmentById.has(rawEquipmentId)) {
        equipmentId = rawEquipmentId;
      } else if (rawEquipmentName) {
        equipmentId = ensureEquipmentItem({
          equipmentLibrary,
          equipmentById,
          equipmentByName,
          usedEquipmentIds,
          name: rawEquipmentName,
          preferredId: rawEquipmentId,
        });
      } else if (shouldInferEquipment) {
        const inferredEquipment = inferEquipmentForQuestName(name);

        if (inferredEquipment) {
          equipmentId = ensureEquipmentItem({
            equipmentLibrary,
            equipmentById,
            equipmentByName,
            usedEquipmentIds,
            name: inferredEquipment.name,
            preferredId: inferredEquipment.id,
          });
        }
      }

      return sanitizeQuest(
        {
          id: sanitizeQuestName(quest?.id) || `quest-library-${index}-${name.toLowerCase()}`,
          name,
          active: quest?.active !== false,
          equipmentId,
        },
        index,
        new Set(equipmentLibrary.map((equipment) => equipment.id))
      );
    })
    .filter(Boolean);

  if (!questLibrary.length && rawQuestLibrary.length) {
    return {
      questLibrary: cloneQuestLibrary(DEFAULT_QUEST_LIBRARY),
      equipmentLibrary: cloneEquipmentLibrary(DEFAULT_EQUIPMENT_LIBRARY),
    };
  }

  const usedQuestEquipmentIds = new Set(
    questLibrary.map((quest) => quest.equipmentId).filter(Boolean)
  );
  const syncedEquipmentLibrary = equipmentLibrary
    .filter((equipment) => usedQuestEquipmentIds.has(equipment.id))
    .sort(compareEquipmentLibrary);

  return {
    questLibrary,
    equipmentLibrary: syncedEquipmentLibrary,
  };
}

function sanitizeQuestLibrary(value) {
  return sanitizeQuestAndEquipmentLibraries(value, state.equipmentLibrary).questLibrary;
}

function sanitizeQuest(quest, index = 0, validEquipmentIds = getEquipmentIdSet()) {
  const name = sanitizeQuestName(quest?.name);

  if (!name) {
    return null;
  }

  const equipmentId = sanitizeId(quest?.equipmentId);

  return {
    id: sanitizeQuestName(quest?.id) || `quest-library-${index}-${name.toLowerCase()}`,
    name,
    active: quest?.active !== false,
    equipmentId: equipmentId && validEquipmentIds.has(equipmentId) ? equipmentId : null,
  };
}

function sanitizeEquipmentLibrary(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const equipmentLibrary = [];
  const equipmentById = new Map();
  const equipmentByName = new Map();
  const usedEquipmentIds = new Set();

  for (const item of value) {
    const name = sanitizeEquipmentName(item?.name);

    if (!name) {
      continue;
    }

    ensureEquipmentItem({
      equipmentLibrary,
      equipmentById,
      equipmentByName,
      usedEquipmentIds,
      name,
      preferredId: sanitizeId(item?.id),
    });
  }

  return equipmentLibrary.sort(compareEquipmentLibrary);
}

function sanitizeLocations(value, equipmentLibrary = state.equipmentLibrary) {
  const validEquipmentIds = new Set(equipmentLibrary.map((equipment) => equipment.id));

  if (!Array.isArray(value)) {
    return createDefaultLocations(equipmentLibrary);
  }

  const usedLocationIds = new Set();
  const locations = value
    .map((location, index) => {
      const name = sanitizeLocationName(location?.name) || `Location ${index + 1}`;
      const id = getUniqueId(
        sanitizeId(location?.id) || createLocationReferenceId(name),
        usedLocationIds
      );
      const equipmentIds = Array.isArray(location?.equipmentIds)
        ? [...new Set(location.equipmentIds.map(sanitizeId))].filter((equipmentId) =>
            validEquipmentIds.has(equipmentId)
          )
        : [];

      usedLocationIds.add(id);

      return {
        id,
        name,
        equipmentIds,
      };
    })
    .filter((location) => sanitizeLocationName(location.name));

  return locations.length ? locations : createDefaultLocations(equipmentLibrary);
}

function sanitizeSelectedLocationId(value, locations = state.locations) {
  const selectedLocationId = sanitizeId(value);

  if (locations.some((location) => location.id === selectedLocationId)) {
    return selectedLocationId;
  }

  return locations[0]?.id || DEFAULT_LOCATION_ID;
}

function ensureEquipmentItem({
  equipmentLibrary,
  equipmentById,
  equipmentByName,
  usedEquipmentIds,
  name,
  preferredId = "",
}) {
  const safeName = sanitizeEquipmentName(name);
  const nameKey = getNameKey(safeName);
  const existingByName = equipmentByName.get(nameKey);

  if (existingByName) {
    return existingByName.id;
  }

  const baseId = sanitizeId(preferredId) || createEquipmentReferenceId(safeName);
  const id = getUniqueId(baseId, usedEquipmentIds);
  const equipment = { id, name: safeName };

  equipmentLibrary.push(equipment);
  equipmentById.set(id, equipment);
  equipmentByName.set(nameKey, equipment);
  usedEquipmentIds.add(id);
  return id;
}

function inferEquipmentForQuestName(name) {
  const rule = EQUIPMENT_INFERENCE_RULES.find((item) => item.pattern.test(name));

  if (!rule) {
    return null;
  }

  const qualifier = getEquipmentQualifierForQuest(name, rule);
  const equipmentName = qualifier ? `${qualifier} ${rule.name}` : rule.name;

  return {
    id: createEquipmentReferenceId(equipmentName),
    name: equipmentName,
  };
}

function getEquipmentQualifierForQuest(name, rule) {
  const weight = extractEquipmentWeight(name);

  if (weight) {
    return weight;
  }

  if (rule.id === "equipment-pull-up-band") {
    return extractParentheticalEquipmentQualifier(name).toLocaleLowerCase();
  }

  if (rule.id === "equipment-hand-gripper") {
    return extractEquipmentLevel(name);
  }

  return "";
}

function extractEquipmentWeight(value) {
  const match = String(value).match(
    /\b(\d+(?:\.\d+)?)\s*(kg|kgs|kilogram|kilograms|lb|lbs|pound|pounds)\b/i
  );

  if (!match) {
    return "";
  }

  const amount = match[1];
  const unit = /^(kg|kgs|kilogram|kilograms)$/i.test(match[2]) ? "kg" : "lb";
  return `${amount}${unit}`;
}

function extractEquipmentLevel(value) {
  const match = String(value).match(/\bL\d+\b/i);
  return match ? match[0].toLocaleUpperCase() : "";
}

function extractParentheticalEquipmentQualifier(value) {
  const match = String(value).match(/\(([^)]+)\)/);
  const qualifier = sanitizeEquipmentName(match?.[1]);

  if (!qualifier || extractEquipmentWeight(qualifier)) {
    return "";
  }

  return qualifier;
}

function sanitizeEvent(event, index) {
  const timestamp = new Date(event?.timestamp || Date.now());
  const type = sanitizeEventType(event?.type);

  if (!Number.isFinite(timestamp.getTime())) {
    return null;
  }

  if (type === EVENT_TYPE_BONUS) {
    const label = sanitizeQuestName(event?.label);

    if (!label) {
      return null;
    }

    return {
      id: sanitizeQuestName(event?.id) || `bonus-${index}`,
      type: EVENT_TYPE_BONUS,
      icon: String(event?.icon ?? ""),
      label,
      points: sanitizeSignedPoints(event?.points),
      timestamp: timestamp.toISOString(),
    };
  }

  const questName = sanitizeQuestName(event?.questName || event?.name || event?.quest?.name);

  if (!questName) {
    return null;
  }

  const questId =
    sanitizeQuestName(event?.questId || event?.quest?.id) || createQuestReferenceId(questName);
  const penaltyCost = sanitizePenaltyCost(event?.penaltyCost, type);
  const points =
    type === EVENT_TYPE_COMPLETE
      ? sanitizePositivePoints(event?.points, QUEST_POINTS)
      : type === EVENT_TYPE_REROLL || type === EVENT_TYPE_REJECT
        ? sanitizePenaltyPoints(event?.points, penaltyCost)
        : 0;

  return {
    id: sanitizeQuestName(event?.id) || `quest-${index}`,
    type,
    questId,
    questName,
    points,
    penaltyCost:
      type === EVENT_TYPE_REROLL || type === EVENT_TYPE_REJECT ? penaltyCost : undefined,
    timestamp: timestamp.toISOString(),
  };
}

function deriveScore(rawScore, rawEvents, normalizedEvents) {
  const normalizedEventTotal = getEventPointTotal(normalizedEvents);

  if (!hasNumericValue(rawScore)) {
    return sanitizeScore(normalizedEventTotal);
  }

  const currentScore = sanitizeScore(rawScore);
  const rawEventTotal = getEventPointTotal(rawEvents);
  // Preserve score adjustments from older saves that predate explicit penalty log events.
  const legacyAdjustment = currentScore - rawEventTotal;

  return sanitizeScore(normalizedEventTotal + legacyAdjustment);
}

function getEventPointTotal(events) {
  if (!Array.isArray(events)) {
    return 0;
  }

  return events.reduce((total, event, index) => {
    const normalizedEvent = sanitizeEvent(event, index);
    return total + (normalizedEvent ? getEventPointValue(normalizedEvent) : 0);
  }, 0);
}

function sanitizeEventType(value) {
  switch (String(value || "").trim().toLocaleLowerCase()) {
    case "quest":
    case EVENT_TYPE_COMPLETE:
      return EVENT_TYPE_COMPLETE;
    case "reroll":
    case EVENT_TYPE_REROLL:
      return EVENT_TYPE_REROLL;
    case "reject":
    case EVENT_TYPE_REJECT:
      return EVENT_TYPE_REJECT;
    case EVENT_TYPE_BONUS:
      return EVENT_TYPE_BONUS;
    default:
      return EVENT_TYPE_COMPLETE;
  }
}

function sanitizePositivePoints(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed)) : fallback;
}

function sanitizePenaltyPoints(value, fallback) {
  const parsed = Number(value);

  if (Number.isFinite(parsed)) {
    return -Math.abs(Math.round(parsed));
  }

  return -Math.abs(Math.round(fallback || 0));
}

function sanitizeSignedPoints(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}

function sanitizePenaltyCost(value, type) {
  const parsed = Number(value);

  if (Number.isFinite(parsed)) {
    return Math.max(0, Math.round(parsed));
  }

  return type === EVENT_TYPE_REROLL ? REROLL_COST : REJECT_COST;
}

function getEventPointValue(event) {
  const points = Number(event?.points);

  if (Number.isFinite(points)) {
    return Math.round(points);
  }

  if (event?.type === EVENT_TYPE_COMPLETE) {
    return QUEST_POINTS;
  }

  return 0;
}

function isQuestPenaltyEvent(event) {
  return event?.type === EVENT_TYPE_REROLL || event?.type === EVENT_TYPE_REJECT;
}

function getEventDisplayLabel(event) {
  if (event?.type === EVENT_TYPE_BONUS) {
    return event.label;
  }

  if (event?.type === EVENT_TYPE_REROLL || event?.type === EVENT_TYPE_REJECT) {
    const prefix = event.type === EVENT_TYPE_REROLL ? "Reroll" : "Reject";
    return `${prefix} ${formatScoreDelta(getEventPointValue(event))} / ${event.questName}`;
  }

  return event?.questName || "";
}

function getEventDisplayBaseFont(event) {
  return event?.type === EVENT_TYPE_COMPLETE ? 132 : 76;
}

function hasNumericValue(value) {
  return Number.isFinite(Number(value));
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

function compareEquipmentLibrary(left, right) {
  const primary = sanitizeEquipmentName(left.name).localeCompare(
    sanitizeEquipmentName(right.name),
    undefined,
    { sensitivity: "base" }
  );

  if (primary !== 0) {
    return primary;
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

function removeStorageItem(key) {
  if (!storageAvailable) {
    return false;
  }

  try {
    window.localStorage.removeItem(key);
    return true;
  } catch (error) {
    storageAvailable = false;
    return false;
  }
}

function clearLegacyStorage() {
  for (const key of LEGACY_STORAGE_KEYS) {
    removeStorageItem(key);
  }
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) {
    return;
  }

  const isLocalhost =
    window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  if (!window.isSecureContext && !isLocalhost) {
    return;
  }

  shouldReloadForServiceWorkerUpdate = Boolean(navigator.serviceWorker.controller);

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!shouldReloadForServiceWorkerUpdate || hasReloadedForServiceWorker) {
      return;
    }

    hasReloadedForServiceWorker = true;
    window.location.reload();
  });

  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register(SERVICE_WORKER_URL, {
        scope: "./",
      });

      const refreshServiceWorker = () => {
        registration.update().catch(() => {});
      };

      refreshServiceWorker();
      window.addEventListener("online", refreshServiceWorker);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") {
          refreshServiceWorker();
        }
      });
    } catch (error) {
      // Ignore service worker registration failures and continue without install support.
    }
  });
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
