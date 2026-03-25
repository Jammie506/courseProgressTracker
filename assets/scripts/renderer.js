// DOM Elements
// Buttons, modals, and containers used in course-level workflows.
const addCourseBtn = document.getElementById('addCourseBtn');
const addCourseModal = document.getElementById('addCourseModal');
const courseNameInput = document.getElementById('courseNameInput');
const createCourseBtn = document.getElementById('createCourseBtn');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');
const courseList = document.getElementById('courseList');
const exportBackupBtn = document.getElementById('exportBackupBtn');
const restoreBackupBtn = document.getElementById('restoreBackupBtn');
const restoreSampleBtn = document.getElementById('restoreSampleBtn');

const welcomeSection = document.getElementById('welcomeSection');
const startLearningBtn = document.getElementById('startLearningBtn');
const courseSection = document.querySelector('.course-section');
const overallProgressSection = document.querySelector('.overall-progress-section');
const welcomeNavBtn = document.getElementById('welcomeNavBtn');
const coursesNavBtn = document.getElementById('coursesNavBtn');
const plannerNavBtn = document.getElementById('plannerNavBtn');
const themeSelect = document.getElementById('themeSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const showPointsToggle = document.getElementById('showPointsToggle');
const displayMenuBtn = document.getElementById('displayMenuBtn');
const displayMenuPanel = document.getElementById('displayMenuPanel');
const backupDropdown = document.querySelector('.backup-dropdown');

const moduleSection = document.getElementById('moduleSection');
const addModuleBtn = document.getElementById('addModuleBtn');
const addModuleModal = document.getElementById('addModuleModal');
const moduleNameInput = document.getElementById('moduleNameInput');
const createModuleBtn = document.getElementById('createModuleBtn');
const cancelModuleBtn = document.getElementById('cancelModuleBtn');
const moduleList = document.getElementById('moduleList');
const addModuleModalTitle = addModuleModal?.querySelector('h3');
const backBtn = document.getElementById('backBtn');
const currentCourseName = document.getElementById('currentCourseName');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const moduleWeightInput = document.getElementById('moduleWeightInput');
const moduleDueDateInput = document.getElementById('moduleDueDateInput');

const plannerSection = document.getElementById('plannerSection');
const timetablePresetSelect = document.getElementById('timetablePresetSelect');
const timetableEditor = document.getElementById('timetableEditor');
const classTagNameInput = document.getElementById('classTagNameInput');
const classTagColorInput = document.getElementById('classTagColorInput');
const classTagCourseSelect = document.getElementById('classTagCourseSelect');
const addClassTagBtn = document.getElementById('addClassTagBtn');
const classTagsList = document.getElementById('classTagsList');
const classTagNamesDatalist = document.getElementById('classTagNamesDatalist');
const importantDateTitleInput = document.getElementById('importantDateTitleInput');
const importantDateInput = document.getElementById('importantDateInput');
const addImportantDateBtn = document.getElementById('addImportantDateBtn');
const importantDatesList = document.getElementById('importantDatesList');

const addTaskModal = document.getElementById('addTaskModal');
const taskNameInput = document.getElementById('taskNameInput');
const taskWeightInput = document.getElementById('taskWeightInput');
const taskDueDateInput = document.getElementById('taskDueDateInput');
const taskModuleName = document.getElementById('taskModuleName');
const createTaskBtn = document.getElementById('createTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');

// In-memory UI state mirrored from persisted data.
let courses = [];
let currentCourseId = null;
let currentModuleId = null;
let editingModuleContext = null;
let editingTaskContext = null;
let expandedModules = new Set(); // Track which modules have expanded tasks
let planner = {
    selectedTemplateId: '',
    templates: [],
    activeSchedule: [],
    importantDates: [],
    classTags: []
};

const RESET_PLANNER_OPTION_VALUE = '__reset-planner-defaults__';

const AUTOSAVE_DEBOUNCE_MS = 1500;
const AUTOSAVE_INTERVAL_MS = 30000;
let autosaveTimer = null;
let autosaveIntervalId = null;
let isDirty = false;
let isAutosaving = false;
let hasPendingAutosave = false;

const themeStorageKey = 'app-theme';
const colorModeStorageKey = 'app-color-mode';
const showPointsStorageKey = 'app-show-points';
const colorSchemeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
const pageHeader = document.querySelector('header');
const floatingModeToggle = document.querySelector('.mode-toggle-floating');

const SCROLL_HIDE_DELTA_PX = 8;
const SCROLL_TOP_SHOW_THRESHOLD_PX = 16;

let showPoints = false;
let isScrollUiHidden = false;
let lastScrollY = window.scrollY;
let isScrollTicking = false;

// Overall Progress Elements
const totalCoursesCount = document.getElementById('totalCoursesCount');
const totalModulesCount = document.getElementById('totalModulesCount');
const completedModulesCount = document.getElementById('completedModulesCount');
const overallProgressFill = document.getElementById('overallProgressFill');
const overallProgressText = document.getElementById('overallProgressText');

// Initialize
// Bootstraps data load and event wiring once the DOM is ready.
document.addEventListener('DOMContentLoaded', () => {
    initializeDisplaySettings();
    loadCourses();
    loadPlanner();
    setupEventListeners();
    setupScrollResponsiveUi();
    setupAutosave();
});

// Registers all UI event handlers in one place.
function setupEventListeners() {
    startLearningBtn.addEventListener('click', showCourses);

    addCourseBtn.addEventListener('click', openAddCourseModal);
    createCourseBtn.addEventListener('click', createCourse);
    cancelCourseBtn.addEventListener('click', closeAddCourseModal);
    courseNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createCourse();
    });

    addModuleBtn.addEventListener('click', openAddModuleModal);
    createModuleBtn.addEventListener('click', createModule);
    cancelModuleBtn.addEventListener('click', closeAddModuleModal);
    moduleNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createModule();
    });

    createTaskBtn.addEventListener('click', createTask);
    cancelTaskBtn.addEventListener('click', closeAddTaskModal);
    taskNameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') createTask();
    });

    backBtn.addEventListener('click', backToCourses);

    exportBackupBtn.addEventListener('click', exportBackupToDesktop);
    restoreBackupBtn.addEventListener('click', restoreFromBackupFile);
    restoreSampleBtn.addEventListener('click', restoreSampleData);

    if (timetablePresetSelect) {
        timetablePresetSelect.addEventListener('change', async (event) => {
            await applyPlannerTemplate(event.target.value);
        });
    }

    if (timetableEditor) {
        timetableEditor.addEventListener('click', (event) => {
            const input = event.target;
            const isPlannerField = input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement;
            if (!isPlannerField) {
                return;
            }

            const linkedCourseId = input.dataset.linkedCourseId;
            const field = input.dataset.field;
            const isClassField = field && field !== 'time';

            if (!linkedCourseId || !isClassField) {
                return;
            }

            if (event.shiftKey) {
                // Allow inline timetable edits for linked classes when requested.
                return;
            }

            event.preventDefault();
            openCourseFromPlanner(linkedCourseId);
        });

        timetableEditor.addEventListener('input', async (event) => {
            const input = event.target;
            const isPlannerField = input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement;
            if (!isPlannerField) {
                return;
            }

            const rowIndex = Number(input.dataset.rowIndex);
            const field = input.dataset.field;
            if (!Number.isFinite(rowIndex) || !field || !planner.activeSchedule[rowIndex]) {
                return;
            }

            planner.activeSchedule[rowIndex][field] = input.value;
            await persistPlanner(false);
        });
    }

    if (addClassTagBtn) {
        addClassTagBtn.addEventListener('click', addClassTag);
    }

    if (classTagNameInput) {
        classTagNameInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                void addClassTag();
            }
        });
    }

    if (classTagsList) {
        classTagsList.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            const removeButton = target.closest('[data-remove-class-tag-id]');
            if (removeButton) {
                const tagId = removeButton.getAttribute('data-remove-class-tag-id');
                if (tagId) {
                    void removeClassTag(tagId);
                }
                return;
            }

            const openButton = target.closest('[data-open-course-id]');
            if (openButton) {
                const courseId = openButton.getAttribute('data-open-course-id');
                if (courseId) {
                    openCourseFromPlanner(courseId);
                }
            }
        });
    }

    if (addImportantDateBtn) {
        addImportantDateBtn.addEventListener('click', addImportantDate);
    }

    if (importantDateTitleInput) {
        importantDateTitleInput.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                void addImportantDate();
            }
        });
    }

    if (importantDatesList) {
        importantDatesList.addEventListener('click', (event) => {
            const target = event.target;
            if (!(target instanceof HTMLElement)) {
                return;
            }

            const removeButton = target.closest('[data-remove-date-id]');
            if (!removeButton) {
                const openCourseButton = target.closest('[data-open-due-course-id]');
                if (openCourseButton) {
                    const courseId = openCourseButton.getAttribute('data-open-due-course-id');
                    if (courseId) {
                        openCourseFromPlanner(courseId);
                    }
                }
                return;
            }

            const dateId = removeButton.getAttribute('data-remove-date-id');
            if (dateId) {
                void removeImportantDate(dateId);
            }
        });
    }

    if (themeSelect) {
        themeSelect.addEventListener('change', (event) => {
            applyTheme(event.target.value);
            closeDisplayMenu();
        });
    }

    if (darkModeToggle) {
        darkModeToggle.addEventListener('change', () => {
            const selectedMode = darkModeToggle.checked ? 'dark' : 'light';
            storeColorModePreference(selectedMode);
            applyColorMode(selectedMode);
        });
    }

    if (showPointsToggle) {
        showPointsToggle.addEventListener('change', () => {
            const shouldShowPoints = showPointsToggle.checked;
            storeShowPointsPreference(shouldShowPoints);
            applyShowPoints(shouldShowPoints);
            closeDisplayMenu();
        });
    }

    colorSchemeMediaQuery.addEventListener('change', () => {
        if (!getStoredColorModePreference()) {
            applyColorMode(null);
        }
    });

    if (displayMenuBtn) {
        displayMenuBtn.addEventListener('click', (event) => {
            event.stopPropagation();
            const shouldOpen = !displayMenuPanel.classList.contains('open');
            if (shouldOpen) {
                openDisplayMenu();
            } else {
                closeDisplayMenu();
            }
        });
    }

    if (displayMenuPanel) {
        displayMenuPanel.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    if (backupDropdown) {
        backupDropdown.addEventListener('click', (event) => {
            event.stopPropagation();
        });
    }

    document.addEventListener('click', () => {
        closeDisplayMenu();
        closeBackupDropdown();
    });

    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeDisplayMenu();
            closeBackupDropdown();
        }
    });
}

// SCROLL UI VISIBILITY
// Hides header/toggle on downward scroll and reveals them on upward scroll.
function setupScrollResponsiveUi() {
    if (!pageHeader && !floatingModeToggle) {
        return;
    }

    window.addEventListener('scroll', handleScrollVisibility, { passive: true });
    updateScrollUiVisibility();
}

function handleScrollVisibility() {
    if (isScrollTicking) {
        return;
    }

    isScrollTicking = true;
    window.requestAnimationFrame(() => {
        updateScrollUiVisibility();
        isScrollTicking = false;
    });
}

function updateScrollUiVisibility() {
    const currentScrollY = window.scrollY;
    const scrollDelta = currentScrollY - lastScrollY;

    if (currentScrollY <= SCROLL_TOP_SHOW_THRESHOLD_PX) {
        setScrollUiHidden(false);
    } else if (Math.abs(scrollDelta) >= SCROLL_HIDE_DELTA_PX) {
        setScrollUiHidden(scrollDelta > 0);
    }

    lastScrollY = currentScrollY;
}

function setScrollUiHidden(shouldHide) {
    if (isScrollUiHidden === shouldHide) {
        return;
    }

    isScrollUiHidden = shouldHide;
    document.body.classList.toggle('scroll-ui-hidden', shouldHide);

    if (shouldHide) {
        closeDisplayMenu();
    }
}

// DISPLAY MENU FUNCTIONS
// Opens the header display options menu.
function openDisplayMenu() {
    if (!displayMenuPanel || !displayMenuBtn) {
        return;
    }
    displayMenuPanel.classList.add('open');
    displayMenuBtn.setAttribute('aria-expanded', 'true');
}

// Closes the header display options menu.
function closeDisplayMenu() {
    if (!displayMenuPanel || !displayMenuBtn) {
        return;
    }
    displayMenuPanel.classList.remove('open');
    displayMenuBtn.setAttribute('aria-expanded', 'false');
}

// Closes the data tools dropdown when focus shifts away from it.
function closeBackupDropdown() {
    if (!backupDropdown) {
        return;
    }
    backupDropdown.removeAttribute('open');
}

// THEME FUNCTIONS
// Loads and applies saved display preferences on app startup.
function initializeDisplaySettings() {
    const savedTheme = localStorage.getItem(themeStorageKey) || 'portfolio';
    applyTheme(savedTheme);
    if (themeSelect) {
        themeSelect.value = savedTheme;
    }

    applyColorMode(getStoredColorModePreference());
    applyShowPoints(getStoredShowPointsPreference());
}

// Applies a named theme and persists preference locally.
function applyTheme(themeName) {
    const normalizedTheme = themeName === 'portfolio' ? 'portfolio' : 'classic';
    document.documentElement.setAttribute('data-theme', normalizedTheme);
    localStorage.setItem(themeStorageKey, normalizedTheme);
}

// Reads persisted color mode choice, returning null when no explicit preference is saved.
function getStoredColorModePreference() {
    try {
        const storedMode = localStorage.getItem(colorModeStorageKey);
        return storedMode === 'light' || storedMode === 'dark' ? storedMode : null;
    } catch (error) {
        return null;
    }
}

// Persists explicit light/dark mode preference.
function storeColorModePreference(mode) {
    try {
        localStorage.setItem(colorModeStorageKey, mode);
    } catch (error) {
        // Ignore storage errors in restricted contexts.
    }
}

// Applies color mode to the document and syncs toggle state. When mode is null, it follows OS preference.
function applyColorMode(mode) {
    const normalizedMode = mode === 'light' || mode === 'dark'
        ? mode
        : colorSchemeMediaQuery.matches
            ? 'dark'
            : 'light';

    document.documentElement.setAttribute('data-color-mode', normalizedMode);

    if (darkModeToggle) {
        darkModeToggle.checked = normalizedMode === 'dark';
    }
}

// Reads persisted points visibility preference; defaults to hidden.
function getStoredShowPointsPreference() {
    try {
        return localStorage.getItem(showPointsStorageKey) === 'true';
    } catch (error) {
        return false;
    }
}

// Persists points visibility choice.
function storeShowPointsPreference(shouldShowPoints) {
    try {
        localStorage.setItem(showPointsStorageKey, shouldShowPoints ? 'true' : 'false');
    } catch (error) {
        // Ignore storage errors in restricted contexts.
    }
}

// Applies points visibility and re-renders affected sections immediately.
function applyShowPoints(shouldShowPoints) {
    showPoints = Boolean(shouldShowPoints);
    document.documentElement.setAttribute('data-show-points', showPoints ? 'true' : 'false');

    if (showPointsToggle) {
        showPointsToggle.checked = showPoints;
        showPointsToggle.parentElement?.setAttribute('aria-checked', showPoints ? 'true' : 'false');
    }

    renderCourses();
    const course = courses.find(c => c.id === currentCourseId);
    if (course && !moduleSection.classList.contains('hidden')) {
        renderModules(course);
        updateProgressBar(course);
    }
    updateOverallProgress();
}

// AUTOSAVE FUNCTIONS
// Enables periodic and event-driven autosave with a debounce to avoid excessive writes.
function setupAutosave() {
    if (!autosaveIntervalId) {
        autosaveIntervalId = setInterval(() => {
            if (isDirty) {
                void flushAutosave('interval');
            }
        }, AUTOSAVE_INTERVAL_MS);
    }

    window.addEventListener('blur', () => {
        void flushAutosave('window-blur');
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            void flushAutosave('document-hidden');
        }
    });

    window.addEventListener('beforeunload', () => {
        void flushAutosave('beforeunload');
    });
}

// Marks local state as needing persistence and starts a debounce timer.
function markDataDirty() {
    isDirty = true;

    if (autosaveTimer) {
        clearTimeout(autosaveTimer);
    }

    autosaveTimer = setTimeout(() => {
        void flushAutosave('debounce');
    }, AUTOSAVE_DEBOUNCE_MS);
}

// Flushes pending changes through the existing save API and serializes concurrent save requests.
async function flushAutosave(reason = 'manual') {
    if (!isDirty) {
        return { success: true, skipped: true, reason };
    }

    if (isAutosaving) {
        hasPendingAutosave = true;
        return { success: true, queued: true, reason };
    }

    isAutosaving = true;

    try {
        const result = await window.electronAPI.saveCourses(courses);
        if (result && result.success) {
            isDirty = false;
            return { success: true, reason };
        }
        return {
            success: false,
            reason,
            error: result && result.error ? result.error : 'Unknown autosave error'
        };
    } catch (error) {
        console.error(`Autosave failed (${reason}):`, error);
        return { success: false, reason, error: error.message };
    } finally {
        isAutosaving = false;
        if (hasPendingAutosave) {
            hasPendingAutosave = false;
            if (isDirty) {
                void flushAutosave('queued');
            }
        }
    }
}

// BACKUP AND RESTORE FUNCTIONS
// Exports the full local store to a user-readable JSON file on Desktop.
async function exportBackupToDesktop() {
    closeBackupDropdown();
    try {
        const result = await window.electronAPI.exportBackupToDesktop();
        if (result && result.success) {
            alert(`Backup exported to Desktop:\n${result.filePath}`);
        } else {
            alert(`Export failed: ${result?.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error exporting backup:', error);
        alert('Error exporting backup. Please try again.');
    }
}

// Restores from a selected backup file with two explicit confirmations.
async function restoreFromBackupFile() {
    closeBackupDropdown();
    const confirmOne = confirm(
        'Are you sure you want to restore from a backup file? This will overwrite your current app data.'
    );
    if (!confirmOne) {
        return;
    }

    const confirmTwo = confirm(
        'Final confirmation: restore will replace current data. Continue?'
    );
    if (!confirmTwo) {
        return;
    }

    try {
        const result = await window.electronAPI.restoreFromBackupFile();
        if (result && result.cancelled) {
            return;
        }

        if (result && result.success) {
            await loadCourses();
            await loadPlanner();
            backToCourses();
            showCourses();
            alert(
                `Restore completed.\n\n` +
                `Restored from: ${result.restoredFrom}\n` +
                `Safety backup saved to Desktop: ${result.safetyBackupPath}`
            );
        } else {
            alert(`Restore failed: ${result?.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error restoring backup:', error);
        alert('Error restoring backup. Please try again.');
    }
}

// Resets app data to bundled sample data with two explicit confirmations.
async function restoreSampleData() {
    closeBackupDropdown();
    const confirmOne = confirm(
        'Are you sure you want to restore sample data? This will overwrite your current app data.'
    );
    if (!confirmOne) {
        return;
    }

    const confirmTwo = confirm(
        'Final confirmation: sample restore will replace current data. Continue?'
    );
    if (!confirmTwo) {
        return;
    }

    try {
        const result = await window.electronAPI.restoreSampleData();
        if (result && result.success) {
            await loadCourses();
            await loadPlanner();
            backToCourses();
            showCourses();
            alert(
                `Sample data restored.\n` +
                `Safety backup saved to Desktop: ${result.safetyBackupPath}`
            );
        } else {
            alert(`Sample restore failed: ${result?.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error restoring sample data:', error);
        alert('Error restoring sample data. Please try again.');
    }
}

// COURSE FUNCTIONS
// Loads persisted courses through the preload API.
async function loadCourses() {
    try {
        courses = await window.electronAPI.loadCourses();
        isDirty = false;
        renderCourses();
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

// Loads planner data and renders planner controls.
async function loadPlanner() {
    try {
        const loadedPlanner = await window.electronAPI.loadPlanner();
        planner = normalizePlannerState(loadedPlanner);
        renderPlanner();
    } catch (error) {
        console.error('Error loading planner:', error);
    }
}

// Persists planner changes and keeps local state in sync with normalized backend data.
async function persistPlanner(shouldRerender = true) {
    try {
        const result = await window.electronAPI.savePlanner(planner);
        if (result && result.success && result.planner) {
            planner = normalizePlannerState(result.planner);
            if (shouldRerender) {
                renderPlanner();
            }
        }
    } catch (error) {
        console.error('Error saving planner:', error);
    }
}

// Resets planner-only data back to bundled defaults while keeping courses unchanged.
async function resetPlannerDefaults() {
    const confirmReset = confirm(
        'Reset planner to defaults? This will replace your timetable, class tags, and important dates.'
    );
    if (!confirmReset) {
        return;
    }

    try {
        const result = await window.electronAPI.resetPlannerDefaults();
        if (result && result.success && result.planner) {
            planner = normalizePlannerState(result.planner);
            renderPlanner();
            alert('Planner reset to defaults.');
        } else {
            alert(`Planner reset failed: ${result?.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Error resetting planner defaults:', error);
        alert('Error resetting planner defaults. Please try again.');
    }
}

// Normalizes planner payloads to avoid UI breakage if data is missing fields.
function normalizePlannerState(payload) {
    const safePlanner = payload && typeof payload === 'object' ? payload : {};
    const templates = Array.isArray(safePlanner.templates) ? safePlanner.templates : [];
    const activeSchedule = Array.isArray(safePlanner.activeSchedule) ? safePlanner.activeSchedule : [];
    const importantDates = Array.isArray(safePlanner.importantDates) ? safePlanner.importantDates : [];

    const normalizedTemplates = templates.map((template, templateIndex) => ({
        id: typeof template?.id === 'string' && template.id.trim() ? template.id : `template-${templateIndex + 1}`,
        name: typeof template?.name === 'string' && template.name.trim() ? template.name : `Group ${templateIndex + 1}`,
        slots: (Array.isArray(template?.slots) ? template.slots : []).map((slot, slotIndex) => normalizePlannerSlot(slot, slotIndex))
    }));

    const selectedTemplateId = typeof safePlanner.selectedTemplateId === 'string' && safePlanner.selectedTemplateId.trim()
        ? safePlanner.selectedTemplateId
        : (normalizedTemplates[0]?.id || 'default');

    return {
        selectedTemplateId,
        templates: normalizedTemplates,
        activeSchedule: activeSchedule.map((slot, slotIndex) => normalizePlannerSlot(slot, slotIndex)),
        importantDates: importantDates.map((entry, entryIndex) => ({
            id: typeof entry?.id === 'string' && entry.id.trim() ? entry.id : `date-${Date.now()}-${entryIndex}`,
            title: typeof entry?.title === 'string' ? entry.title : '',
            date: typeof entry?.date === 'string' ? entry.date : ''
        })),
        classTags: (Array.isArray(safePlanner.classTags) ? safePlanner.classTags : []).map((tag, tagIndex) => ({
            id: typeof tag?.id === 'string' && tag.id.trim() ? tag.id : `tag-${Date.now()}-${tagIndex}`,
            name: typeof tag?.name === 'string' ? tag.name : '',
            color: typeof tag?.color === 'string' ? tag.color : '#468dbd',
            linkedCourseId: typeof tag?.linkedCourseId === 'string' ? tag.linkedCourseId : null
        }))
    };
}

function findClassTagByName(className) {
    const normalizedName = String(className || '').trim().toLowerCase();
    if (!normalizedName) {
        return null;
    }

    const normalizedClassParts = normalizedName
        .split(/[^a-z0-9]+/)
        .filter(Boolean);

    let bestMatch = null;
    let bestScore = 0;

    planner.classTags.forEach(tag => {
        const normalizedTagName = String(tag.name || '').trim().toLowerCase();
        if (!normalizedTagName) {
            return;
        }

        // Exact match wins immediately.
        if (normalizedTagName === normalizedName) {
            bestMatch = tag;
            bestScore = Number.MAX_SAFE_INTEGER;
            return;
        }

        const containsMatch = normalizedName.includes(normalizedTagName) || normalizedTagName.includes(normalizedName);
        if (!containsMatch) {
            return;
        }

        const normalizedTagParts = normalizedTagName
            .split(/[^a-z0-9]+/)
            .filter(Boolean);
        const overlapCount = normalizedTagParts.filter(part => normalizedClassParts.includes(part)).length;

        // Prefer tags with more overlapping terms, then longer names for specificity.
        const matchScore = overlapCount * 100 + normalizedTagName.length;
        if (matchScore > bestScore) {
            bestScore = matchScore;
            bestMatch = tag;
        }
    });

    return bestMatch;
}

function getLinkedCourseIdForClassName(className) {
    const matchedTag = findClassTagByName(className);
    if (!matchedTag || !matchedTag.linkedCourseId) {
        return '';
    }
    return matchedTag.linkedCourseId;
}

function buildPlannerCellAttributes(value) {
    const tag = findClassTagByName(value);
    if (!tag) {
        return 'class="planner-cell-input"';
    }

    const linkedCourseIdAttr = tag.linkedCourseId
        ? ` data-linked-course-id="${escapeHtml(tag.linkedCourseId)}"`
        : '';
    const linkedClass = tag.linkedCourseId ? ' planner-cell-input-linked' : '';

    return `style="--class-color:${escapeHtml(tag.color)};" class="planner-cell-input planner-cell-input-tagged${linkedClass}"${linkedCourseIdAttr}`;
}

function normalizePlannerSlot(slot, slotIndex) {
    const safeSlot = slot && typeof slot === 'object' ? slot : {};
    return {
        time: typeof safeSlot.time === 'string' ? safeSlot.time : `Period ${slotIndex + 1}`,
        mon: typeof safeSlot.mon === 'string' ? safeSlot.mon : '',
        tue: typeof safeSlot.tue === 'string' ? safeSlot.tue : '',
        wed: typeof safeSlot.wed === 'string' ? safeSlot.wed : '',
        thu: typeof safeSlot.thu === 'string' ? safeSlot.thu : '',
        fri: typeof safeSlot.fri === 'string' ? safeSlot.fri : ''
    };
}

// Renders planner controls, timetable editor, and important dates list.
function renderPlanner() {
    if (!timetablePresetSelect || !timetableEditor || !importantDatesList) {
        return;
    }

    const selectedTemplateExists = planner.templates.some(template => template.id === planner.selectedTemplateId);
    if (!selectedTemplateExists && planner.templates[0]) {
        planner.selectedTemplateId = planner.templates[0].id;
    }

    timetablePresetSelect.innerHTML = planner.templates
        .map(template => `<option value="${escapeHtml(template.id)}">${escapeHtml(template.name)}</option>`)
        .join('') + `<option value="${RESET_PLANNER_OPTION_VALUE}">Reset Planner to Defaults...</option>`;

    if (planner.selectedTemplateId) {
        timetablePresetSelect.value = planner.selectedTemplateId;
    }

    const rows = planner.activeSchedule.map((slot, rowIndex) => `
        <tr>
            <td><input class="planner-cell-input" data-row-index="${rowIndex}" data-field="time" value="${escapeHtml(slot.time)}"></td>
            <td><textarea ${buildPlannerCellAttributes(slot.mon)} data-row-index="${rowIndex}" data-field="mon" title="${getLinkedCourseIdForClassName(slot.mon) ? 'Click to open linked class, Shift+click to edit' : 'Class name'}">${escapeHtml(slot.mon)}</textarea></td>
            <td><textarea ${buildPlannerCellAttributes(slot.tue)} data-row-index="${rowIndex}" data-field="tue" title="${getLinkedCourseIdForClassName(slot.tue) ? 'Click to open linked class, Shift+click to edit' : 'Class name'}">${escapeHtml(slot.tue)}</textarea></td>
            <td><textarea ${buildPlannerCellAttributes(slot.wed)} data-row-index="${rowIndex}" data-field="wed" title="${getLinkedCourseIdForClassName(slot.wed) ? 'Click to open linked class, Shift+click to edit' : 'Class name'}">${escapeHtml(slot.wed)}</textarea></td>
            <td><textarea ${buildPlannerCellAttributes(slot.thu)} data-row-index="${rowIndex}" data-field="thu" title="${getLinkedCourseIdForClassName(slot.thu) ? 'Click to open linked class, Shift+click to edit' : 'Class name'}">${escapeHtml(slot.thu)}</textarea></td>
            <td><textarea ${buildPlannerCellAttributes(slot.fri)} data-row-index="${rowIndex}" data-field="fri" title="${getLinkedCourseIdForClassName(slot.fri) ? 'Click to open linked class, Shift+click to edit' : 'Class name'}">${escapeHtml(slot.fri)}</textarea></td>
        </tr>
    `).join('');

    if (classTagNamesDatalist) {
        classTagNamesDatalist.innerHTML = planner.classTags
            .map(tag => `<option value="${escapeHtml(tag.name)}"></option>`)
            .join('');
    }

    if (classTagCourseSelect) {
        classTagCourseSelect.innerHTML = [
            '<option value="">Link to course (optional)</option>',
            ...courses.map(course => `<option value="${escapeHtml(course.id)}">${escapeHtml(course.name)}</option>`)
        ].join('');
    }

    if (classTagsList) {
        classTagsList.innerHTML = planner.classTags.length === 0
            ? '<p class="empty-state">No class tags yet.</p>'
            : planner.classTags.map(tag => {
                const linkedCourse = courses.find(course => course.id === tag.linkedCourseId);
                return `
                    <div class="class-tag-item">
                        <span class="class-tag-chip" style="background:${escapeHtml(tag.color)}22; border-color:${escapeHtml(tag.color)}55; color:${escapeHtml(tag.color)}">${escapeHtml(tag.name)}</span>
                        <div class="class-tag-item-actions">
                            ${linkedCourse ? `<button class="btn btn-secondary" type="button" data-open-course-id="${escapeHtml(linkedCourse.id)}">Open ${escapeHtml(linkedCourse.name)}</button>` : ''}
                            <button class="btn btn-danger" type="button" data-remove-class-tag-id="${escapeHtml(tag.id)}">Remove</button>
                        </div>
                    </div>
                `;
            }).join('');
    }

    timetableEditor.innerHTML = `
        <div class="timetable-scroll">
            <table class="planner-table">
                <thead>
                    <tr>
                        <th>Time</th>
                        <th>Mon</th>
                        <th>Tue</th>
                        <th>Wed</th>
                        <th>Thu</th>
                        <th>Fri</th>
                    </tr>
                </thead>
                <tbody>
                    ${rows}
                </tbody>
            </table>
        </div>
    `;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const workDueDates = getWorkDueDates();
    const sortedDates = [...planner.importantDates, ...workDueDates].sort((a, b) => {
        const dateCompare = (a.date || '').localeCompare(b.date || '');
        if (dateCompare !== 0) {
            return dateCompare;
        }
        return (a.title || '').localeCompare(b.title || '');
    });

    importantDatesList.innerHTML = sortedDates.length === 0
        ? '<p class="empty-state">No important dates yet.</p>'
        : sortedDates.map(entry => {
            const parsed = entry.date ? new Date(`${entry.date}T00:00:00`) : null;
            const isPast = parsed instanceof Date && !Number.isNaN(parsed.valueOf()) && parsed < today;
            return `
                <div class="important-date-item ${isPast ? 'important-date-item-complete' : ''}">
                    <div>
                        <div class="important-date-title">${escapeHtml(entry.title)}</div>
                        <div class="important-date-meta">${escapeHtml(entry.date || 'No date')}</div>
                    </div>
                    <div class="important-date-actions">
                        ${entry.sourceType === 'work-due' && entry.courseId ? `<button class="btn btn-secondary" type="button" data-open-due-course-id="${escapeHtml(entry.courseId)}">Open Class</button>` : ''}
                        ${entry.sourceType !== 'work-due' ? `<button class="btn btn-danger" type="button" data-remove-date-id="${escapeHtml(entry.id)}">Remove</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
}

// Derives due dates from course work so they appear in planner important dates automatically.
function getWorkDueDates() {
    const dueDates = [];

    courses.forEach(course => {
        course.modules.forEach(module => {
            if (module.dueDate) {
                dueDates.push({
                    id: `module-due-${course.id}-${module.id}`,
                    title: `${module.name} Due (${course.name})`,
                    date: module.dueDate,
                    sourceType: 'work-due',
                    courseId: course.id
                });
            }

            const tasks = Array.isArray(module.tasks) ? module.tasks : [];
            tasks.forEach(task => {
                if (task.dueDate) {
                    dueDates.push({
                        id: `task-due-${course.id}-${module.id}-${task.id}`,
                        title: `${task.name} Due (${course.name})`,
                        date: task.dueDate,
                        sourceType: 'work-due',
                        courseId: course.id
                    });
                }
            });
        });
    });

    return dueDates;
}

// Applies a preset timetable for the selected learner group.
async function applyPlannerTemplate(templateId) {
    if (templateId === RESET_PLANNER_OPTION_VALUE) {
        await resetPlannerDefaults();
        return;
    }

    const selectedTemplate = planner.templates.find(template => template.id === templateId);
    if (!selectedTemplate) {
        return;
    }

    planner.selectedTemplateId = selectedTemplate.id;
    planner.activeSchedule = selectedTemplate.slots.map(slot => ({ ...slot }));
    await persistPlanner();
}

// Adds a new important date entry to the planner.
async function addImportantDate() {
    const title = importantDateTitleInput?.value.trim();
    const date = importantDateInput?.value;

    if (!title || !date) {
        alert('Please enter both a title and date for the planner item.');
        return;
    }

    planner.importantDates.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        title,
        date
    });

    if (importantDateTitleInput) {
        importantDateTitleInput.value = '';
    }
    if (importantDateInput) {
        importantDateInput.value = '';
    }

    await persistPlanner();
}

// Removes an important date entry.
async function removeImportantDate(dateId) {
    planner.importantDates = planner.importantDates.filter(entry => entry.id !== dateId);
    await persistPlanner();
}

// Adds a class tag used for timetable color coding and optional course linking.
async function addClassTag() {
    const name = classTagNameInput?.value.trim();
    const color = classTagColorInput?.value || '#468dbd';
    const linkedCourseId = classTagCourseSelect?.value || null;

    if (!name) {
        alert('Please enter a class tag name.');
        return;
    }

    const duplicate = planner.classTags.some(tag => tag.name.trim().toLowerCase() === name.toLowerCase());
    if (duplicate) {
        alert('A class tag with that name already exists.');
        return;
    }

    planner.classTags.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
        name,
        color,
        linkedCourseId
    });

    if (classTagNameInput) {
        classTagNameInput.value = '';
    }
    if (classTagCourseSelect) {
        classTagCourseSelect.value = '';
    }

    await persistPlanner();
}

// Removes an existing class tag.
async function removeClassTag(tagId) {
    planner.classTags = planner.classTags.filter(tag => tag.id !== tagId);
    await persistPlanner();
}

// Opens a linked course from planner tag actions.
function openCourseFromPlanner(courseId) {
    showCourses();
    selectCourse(courseId);
    renderCourses();
}

// Renders all course cards and refreshes overall progress.
function renderCourses() {
    if (courses.length === 0) {
        courseList.innerHTML = '<p class="empty-state">No courses yet. Create one to get started!</p>';
        updateOverallProgress();
        return;
    }

    courseList.innerHTML = courses.map(course => {
        const moduleCount = course.modules.length;
        const completedCount = course.modules.filter(m => m.completed).length;
        const isSelected = currentCourseId === course.id && !moduleSection.classList.contains('hidden');
        return `
            <div class="course-card ${isSelected ? 'course-card-active' : ''}" onclick="handleCourseCardClick(event, '${course.id}')">
                <h3>${escapeHtml(course.name)}</h3>
                <div class="course-info">
                    <span class="course-modules">${completedCount}/${moduleCount} modules</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary" onclick="event.stopPropagation(); selectCourse('${course.id}')">Open</button>
                        <button class="btn btn-danger" onclick="event.stopPropagation(); deleteCourse('${course.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    updateOverallProgress();
}

// Opens the create-course modal and focuses input for quick entry.
function openAddCourseModal() {
    addCourseModal.classList.remove('hidden');
    courseNameInput.focus();
}

// Closes the create-course modal and resets input state.
function closeAddCourseModal() {
    addCourseModal.classList.add('hidden');
    courseNameInput.value = '';
}

// Creates a new course and updates local UI state.
async function createCourse() {
    const courseName = courseNameInput.value.trim();
    if (!courseName) {
        alert('Please enter a course name');
        return;
    }

    const newCourse = await window.electronAPI.addCourse(courseName);
    if (newCourse) {
        courses.push(newCourse);
        markDataDirty();
        renderCourses();
        closeAddCourseModal();
    }
}

// Deletes a course after user confirmation.
async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        const result = await window.electronAPI.deleteCourse(courseId);
        if (result.success) {
            courses = courses.filter(c => c.id !== courseId);
            markDataDirty();
            renderCourses();
        }
    }
}

// Sets active course and shows module management view.
function selectCourse(courseId) {
    currentCourseId = courseId;
    const course = courses.find(c => c.id === courseId);
    if (course) {
        currentCourseName.textContent = course.name;
        renderModules(course);
        moduleSection.classList.remove('hidden');
    }
}

// Makes the entire course card act as an open/close toggle.
function handleCourseCardClick(event, courseId) {
    const clickedElement = event.target;
    if (clickedElement instanceof HTMLElement && clickedElement.closest('button, a, input, select, textarea, label')) {
        return;
    }

    const isAlreadyOpen = currentCourseId === courseId && !moduleSection.classList.contains('hidden');
    if (isAlreadyOpen) {
        backToCourses();
        renderCourses();
        return;
    }

    selectCourse(courseId);
    renderCourses();
}

function handleModuleItemClick(event, moduleId) {
    const clickedElement = event.target;
    if (clickedElement instanceof HTMLElement && clickedElement.closest('button, a, input, select, textarea, label')) {
        return;
    }

    toggleModuleExpand(moduleId);
}

function onEditModuleClick(event, courseId, moduleId) {
    event.preventDefault();
    event.stopPropagation();
    void editModule(courseId, moduleId);
}

function onEditTaskClick(event, courseId, moduleId, taskId) {
    event.preventDefault();
    event.stopPropagation();
    void editTask(courseId, moduleId, taskId);
}

// MODULE FUNCTIONS
// Renders module cards, their progress, and nested tasks.
function renderModules(course) {
    if (course.modules.length === 0) {
        moduleList.innerHTML = '<p class="empty-state">No modules yet. Add one to get started!</p>';
        updateProgressBar(course);
        return;
    }

    moduleList.innerHTML = course.modules.map(module => {
        const weight = module.weight || 1;
        const tasks = module.tasks || [];
        const isExpanded = expandedModules.has(module.id);
        
        // Calculate task progress for this module
        let taskProgress = '';
        if (tasks.length > 0) {
            const completedTasks = tasks.filter(t => t.completed).length;
            const taskPercentage = Math.round((completedTasks / tasks.length) * 100);
            taskProgress = `
                <div class="module-progress-container" style="margin-top: 10px;">
                    <div class="module-progress-info">
                        <span class="module-progress-text">${completedTasks}/${tasks.length} tasks (${taskPercentage}%)</span>
                    </div>
                    <div class="module-progress-bar">
                        <div class="module-progress-fill" style="width: ${taskPercentage}%"></div>
                    </div>
                </div>
            `;
        }

        // Only render the task list when the module is expanded.
        const tasksHtml = tasks.length > 0 && isExpanded ? `
            <div class="tasks-container">
                ${tasks.map(task => {
                    const taskWeight = task.weight || 1;
                    const taskDueDateText = task.dueDate ? ` • Due: ${task.dueDate}` : '';
                    return `
                        <div class="task-item">
                            <input 
                                type="checkbox" 
                                class="task-checkbox"
                                ${task.completed ? 'checked' : ''}
                                onchange="toggleTask('${course.id}', '${module.id}', '${task.id}', this.checked)"
                            >
                            <div class="task-content">
                                <div class="task-name">${escapeHtml(task.name)}</div>
                                <div class="task-weight">${taskWeight} point${taskWeight !== 1 ? 's' : ''}${taskDueDateText}</div>
                            </div>
                            <button class="btn btn-secondary task-edit-due" type="button" onclick="openEditTaskModal('${course.id}', '${module.id}', '${task.id}'); event.stopPropagation();">Edit</button>
                            <button class="btn btn-danger task-delete" onclick="deleteTask('${course.id}', '${module.id}', '${task.id}')">Delete</button>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : '';

        // Show a chevron only for modules that have tasks.
        const chevron = tasks.length > 0 ? `<span class="module-chevron ${isExpanded ? 'expanded' : ''}">▼</span>` : '';

        return `
            <div class="module-wrapper">
                <div class="module-item" onclick="handleModuleItemClick(event, '${module.id}')" style="cursor: ${tasks.length > 0 ? 'pointer' : 'default'};">
                    <input 
                        type="checkbox" 
                        class="module-checkbox"
                        ${module.completed ? 'checked' : ''}
                        onchange="toggleModule('${course.id}', '${module.id}', this.checked)"
                        onclick="event.stopPropagation();"
                    >
                    <div class="module-content">
                        <div class="module-header-row">
                            ${chevron}
                            <div>
                                <div class="module-name">${escapeHtml(module.name)}</div>
                                <div class="module-meta">${showPoints ? `Weight: ${weight} point${weight !== 1 ? 's' : ''} | ` : ''}Tasks: ${tasks.length}${module.dueDate ? ` | Due: ${module.dueDate}` : ''}</div>
                            </div>
                        </div>
                    </div>
                    <div class="module-actions">
                        <button class="btn btn-primary add-task-btn" onclick="openAddTaskModal('${module.id}', '${escapeHtml(module.name).replace(/'/g, "\\'")}'); event.stopPropagation();">+ Task</button>
                        <button class="btn btn-secondary" type="button" onclick="openEditModuleModal('${course.id}', '${module.id}'); event.stopPropagation();">Edit</button>
                        <button class="btn btn-danger" onclick="deleteModule('${course.id}', '${module.id}'); event.stopPropagation();">Delete</button>
                    </div>
                </div>
                ${taskProgress}
                ${tasksHtml}
            </div>
        `;
    }).join('');

    updateProgressBar(course);
}

// Opens the add-module modal.
function openAddModuleModal() {
    editingModuleContext = null;
    if (addModuleModalTitle) {
        addModuleModalTitle.textContent = 'Add New Activity';
    }
    createModuleBtn.textContent = 'Add Activity';
    addModuleModal.classList.remove('hidden');
    moduleNameInput.focus();
}

function openEditModuleModal(courseId, moduleId) {
    const course = courses.find(c => c.id === courseId);
    const module = course?.modules?.find(m => m.id === moduleId);
    if (!course || !module) {
        return;
    }

    editingModuleContext = { courseId, moduleId };
    if (addModuleModalTitle) {
        addModuleModalTitle.textContent = 'Edit Activity';
    }
    createModuleBtn.textContent = 'Save Changes';
    moduleNameInput.value = module.name || '';
    moduleWeightInput.value = String(module.weight || 1);
    if (moduleDueDateInput) {
        moduleDueDateInput.value = module.dueDate || '';
    }

    addModuleModal.classList.remove('hidden');
    moduleNameInput.focus();
}

// Closes add-module modal and resets fields.
function closeAddModuleModal() {
    addModuleModal.classList.add('hidden');
    moduleNameInput.value = '';
    moduleWeightInput.value = '1';
    if (addModuleModalTitle) {
        addModuleModalTitle.textContent = 'Add New Activity';
    }
    createModuleBtn.textContent = 'Add Activity';
    editingModuleContext = null;
    if (moduleDueDateInput) {
        moduleDueDateInput.value = '';
    }
}

// Creates a module for the currently selected course.
async function createModule() {
    const moduleName = moduleNameInput.value.trim();
    const weight = parseInt(moduleWeightInput.value) || 1;
    const dueDate = moduleDueDateInput?.value || null;
    
    if (!moduleName) {
        alert('Please enter a module name');
        return;
    }

    if (editingModuleContext) {
        const { courseId, moduleId } = editingModuleContext;
        const result = await window.electronAPI.updateModule(courseId, moduleId, {
            name: moduleName,
            weight,
            dueDate
        });

        if (result) {
            const course = courses.find(c => c.id === courseId);
            const module = course?.modules?.find(m => m.id === moduleId);
            if (course && module) {
                module.name = moduleName;
                module.weight = weight;
                module.dueDate = dueDate;
                markDataDirty();
                renderModules(course);
                updateOverallProgress();
            }
            closeAddModuleModal();
        } else {
            alert('Could not update activity. Please try again.');
        }
        return;
    }

    const newModule = await window.electronAPI.addModule(currentCourseId, moduleName, weight, dueDate);
    if (newModule) {
        const course = courses.find(c => c.id === currentCourseId);
        if (course) {
            course.modules.push(newModule);
            markDataDirty();
            renderModules(course);
            updateOverallProgress();
            closeAddModuleModal();
        }
    }
}

// Updates the completed state for a single module.
async function toggleModule(courseId, moduleId, completed) {
    const result = await window.electronAPI.updateModule(courseId, moduleId, { completed });
    if (result) {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const module = course.modules.find(m => m.id === moduleId);
            if (module) {
                module.completed = completed;
                markDataDirty();
                updateProgressBar(course);
                updateOverallProgress();
            }
        }
    }
}

// Deletes a module and re-renders the active course.
async function deleteModule(courseId, moduleId) {
    if (confirm('Are you sure you want to delete this module?')) {
        const result = await window.electronAPI.deleteModule(courseId, moduleId);
        if (result.success) {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                course.modules = course.modules.filter(m => m.id !== moduleId);
                markDataDirty();
                renderModules(course);
                updateOverallProgress();
            }
        }
    }
}

// Returns from module detail view to course list view.
function backToCourses() {
    moduleSection.classList.add('hidden');
    currentCourseId = null;
}

// NAVIGATION FUNCTIONS
// Shows the welcome screen and updates nav button styles.
function showWelcome() {
    welcomeSection.classList.remove('hidden');
    courseSection.classList.add('hidden');
    overallProgressSection.classList.add('hidden');
    plannerSection.classList.add('hidden');
    moduleSection.classList.add('hidden');
    
    // Update active button
    welcomeNavBtn.classList.add('nav-btn-active');
    coursesNavBtn.classList.remove('nav-btn-active');
    plannerNavBtn.classList.remove('nav-btn-active');
}

// Shows course/progress screens and updates nav button styles.
function showCourses() {
    welcomeSection.classList.add('hidden');
    courseSection.classList.remove('hidden');
    overallProgressSection.classList.remove('hidden');
    plannerSection.classList.add('hidden');
    
    // Update active button
    welcomeNavBtn.classList.remove('nav-btn-active');
    coursesNavBtn.classList.add('nav-btn-active');
    plannerNavBtn.classList.remove('nav-btn-active');
}

// Shows planner view and updates navigation state.
function showPlanner() {
    welcomeSection.classList.add('hidden');
    courseSection.classList.add('hidden');
    overallProgressSection.classList.add('hidden');
    moduleSection.classList.add('hidden');
    plannerSection.classList.remove('hidden');

    welcomeNavBtn.classList.remove('nav-btn-active');
    coursesNavBtn.classList.remove('nav-btn-active');
    plannerNavBtn.classList.add('nav-btn-active');

    renderPlanner();
}

// PROGRESS BAR
// Computes weighted progress for modules/tasks inside one course.
function updateProgressBar(course) {
    if (course.modules.length === 0) {
        progressFill.style.width = '0%';
        progressText.textContent = '0% Complete';
        return;
    }

    // Calculate weighted progress including tasks
    let totalWeight = 0;
    let completedWeight = 0;
    
    course.modules.forEach(module => {
        const moduleWeight = module.weight || 1;
        const tasks = module.tasks || [];

        if (tasks.length === 0) {
            // No tasks: count module directly
            totalWeight += moduleWeight;
            if (module.completed) {
                completedWeight += moduleWeight;
            }
        } else {
            // Has tasks: weight is distributed among tasks
            const totalTaskWeight = tasks.reduce((sum, t) => sum + (t.weight || 1), 0);
            totalWeight += totalTaskWeight;
            
            tasks.forEach(task => {
                if (task.completed) {
                    completedWeight += (task.weight || 1);
                }
            });
        }
    });

    const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    progressFill.style.width = percentage + '%';
    progressText.textContent = showPoints
        ? `${completedWeight}/${totalWeight} Points Complete (${percentage}%)`
        : `${percentage}% Complete`;
}

// OVERALL PROGRESS
// Computes cross-course stats shown in the dashboard summary.
function updateOverallProgress() {
    let totalWeight = 0;
    let completedWeight = 0;
    let totalModules = 0;
    let completedModules = 0;

    courses.forEach(course => {
        course.modules.forEach(module => {
            totalModules += 1;

            const moduleWeight = module.weight || 1;
            const tasks = module.tasks || [];

            if (tasks.length === 0) {
                totalWeight += moduleWeight;
                if (module.completed) {
                    completedWeight += moduleWeight;
                }
            } else {
                const totalTaskWeight = tasks.reduce((sum, task) => sum + (task.weight || 1), 0);
                totalWeight += totalTaskWeight;
                tasks.forEach(task => {
                    if (task.completed) {
                        completedWeight += (task.weight || 1);
                    }
                });
            }

            if (module.completed) {
                completedModules += 1;
            }
        });
    });

    // Update stats
    totalCoursesCount.textContent = courses.length;
    totalModulesCount.textContent = totalModules;
    completedModulesCount.textContent = completedModules;

    // Update progress bar
    const percentage = totalWeight > 0 ? Math.round((completedWeight / totalWeight) * 100) : 0;
    overallProgressFill.style.width = percentage + '%';
    overallProgressText.textContent = showPoints
        ? `${percentage}% Complete • ${completedWeight}/${totalWeight} Points`
        : `${percentage}% Complete`;
}

// UTILITIES
// Safely escapes user-provided text before injecting into HTML.
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function normalizeDueDateInput(rawValue) {
    const value = String(rawValue || '').trim();
    if (!value) {
        return null;
    }

    // Keep storage format consistent with the native date input used elsewhere.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return undefined;
    }

    return value;
}

function normalizeWeightInput(rawValue, currentWeight) {
    const value = String(rawValue || '').trim();
    if (!value) {
        return currentWeight;
    }

    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 1) {
        return undefined;
    }

    return Math.round(parsed);
}

// Toggle module expansion
// Expands/collapses the task list for a module and re-renders view.
function toggleModuleExpand(moduleId) {
    if (expandedModules.has(moduleId)) {
        expandedModules.delete(moduleId);
    } else {
        expandedModules.add(moduleId);
    }
    // Re-render to show/hide tasks
    const course = courses.find(c => c.id === currentCourseId);
    if (course) {
        renderModules(course);
    }
}

// TASK FUNCTIONS
// Opens add-task modal for a specific module.
function openAddTaskModal(moduleId, moduleName) {
    editingTaskContext = null;
    createTaskBtn.textContent = 'Add Task';
    currentModuleId = moduleId;
    taskModuleName.textContent = moduleName;
    addTaskModal.classList.remove('hidden');
    taskNameInput.focus();
}

function openEditTaskModal(courseId, moduleId, taskId) {
    const course = courses.find(c => c.id === courseId);
    const module = course?.modules?.find(m => m.id === moduleId);
    const task = module?.tasks?.find(t => t.id === taskId);
    if (!course || !module || !task) {
        return;
    }

    editingTaskContext = { courseId, moduleId, taskId };
    currentModuleId = moduleId;
    taskModuleName.textContent = `${module.name} (Editing)`;
    createTaskBtn.textContent = 'Save Changes';
    taskNameInput.value = task.name || '';
    taskWeightInput.value = String(task.weight || 1);
    if (taskDueDateInput) {
        taskDueDateInput.value = task.dueDate || '';
    }

    addTaskModal.classList.remove('hidden');
    taskNameInput.focus();
}

// Closes add-task modal and clears temporary task state.
function closeAddTaskModal() {
    addTaskModal.classList.add('hidden');
    taskNameInput.value = '';
    taskWeightInput.value = '1';
    createTaskBtn.textContent = 'Add Task';
    editingTaskContext = null;
    if (taskDueDateInput) {
        taskDueDateInput.value = '';
    }
    currentModuleId = null;
}

// Creates a task in the currently selected module.
async function createTask() {
    const taskName = taskNameInput.value.trim();
    const weight = parseInt(taskWeightInput.value) || 1;
    const dueDate = taskDueDateInput?.value || null;

    if (!taskName) {
        alert('Please enter a task name');
        return;
    }

    if (editingTaskContext) {
        const { courseId, moduleId, taskId } = editingTaskContext;
        const result = await window.electronAPI.updateTask(courseId, moduleId, taskId, {
            name: taskName,
            weight,
            dueDate
        });

        if (result) {
            const course = courses.find(c => c.id === courseId);
            const module = course?.modules?.find(m => m.id === moduleId);
            const task = module?.tasks?.find(t => t.id === taskId);
            if (course && module && task) {
                task.name = taskName;
                task.weight = weight;
                task.dueDate = dueDate;
                markDataDirty();
                renderModules(course);
                updateOverallProgress();
            }
            closeAddTaskModal();
        } else {
            alert('Could not update task. Please try again.');
        }
        return;
    }

    const newTask = await window.electronAPI.addTask(currentCourseId, currentModuleId, taskName, weight, dueDate);
    if (newTask) {
        const course = courses.find(c => c.id === currentCourseId);
        if (course) {
            const module = course.modules.find(m => m.id === currentModuleId);
            if (module) {
                if (!module.tasks) module.tasks = [];
                module.tasks.push(newTask);
                markDataDirty();
                renderModules(course);
                updateOverallProgress();
                closeAddTaskModal();
            }
        }
    }
}

// Toggles task completion and keeps parent module completion in sync.
async function toggleTask(courseId, moduleId, taskId, completed) {
    const result = await window.electronAPI.updateTask(courseId, moduleId, taskId, { completed });
    if (result) {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const module = course.modules.find(m => m.id === moduleId);
            if (module && module.tasks) {
                const task = module.tasks.find(t => t.id === taskId);
                if (task) {
                    task.completed = completed;
                    
                    // Check if all tasks are completed
                    const allTasksCompleted = module.tasks.every(t => t.completed);
                    
                    // If all tasks are completed, auto-complete the module
                    if (allTasksCompleted && !module.completed) {
                        await window.electronAPI.updateModule(courseId, moduleId, { completed: true });
                        module.completed = true;
                    }
                    // If a task is uncompleted and module was auto-completed, uncheck the module
                    else if (!allTasksCompleted && module.completed) {
                        // Only uncheck if module has tasks (was auto-completed)
                        if (module.tasks.length > 0) {
                            await window.electronAPI.updateModule(courseId, moduleId, { completed: false });
                            module.completed = false;
                        }
                    }

                    markDataDirty();
                    
                    renderModules(course);
                    updateProgressBar(course);
                    updateOverallProgress();
                }
            }
        }
    }
}

// Deletes a task after confirmation and refreshes the module list.
async function deleteTask(courseId, moduleId, taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const result = await window.electronAPI.deleteTask(courseId, moduleId, taskId);
        if (result.success) {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                const module = course.modules.find(m => m.id === moduleId);
                if (module && module.tasks) {
                    module.tasks = module.tasks.filter(t => t.id !== taskId);
                    markDataDirty();
                    renderModules(course);
                    updateOverallProgress();
                }
            }
        }
    }
}

