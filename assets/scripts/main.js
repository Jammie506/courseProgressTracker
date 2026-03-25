const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

// Development toggle used for optional tooling like DevTools.
const isDev = process.env.NODE_ENV === 'development';
const CURRENT_SCHEMA_VERSION = 1;

let mainWindow;
// Store user data in Electron's per-user app data directory.
const dataDir = path.join(app.getPath('userData'), 'data');
const dataFile = path.join(dataDir, 'courses.json');
const backupDataFile = path.join(dataDir, 'courses.backup.json');

function nowIso() {
  return new Date().toISOString();
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function fileTimestamp() {
  return new Date().toISOString().replace(/[:]/g, '-').replace(/\..+$/, '');
}

function toNumberOrDefault(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value) {
  return String(value || '').trim().toLowerCase();
}

function createDefaultTimetableTemplates() {
  const baseTimes = ['09:00-10:00', '10:00-11:00', '11:00-11:15', '11:15-12:15', '12:15-13:15', '13:15-13:45', '13:45-14:45', '14:45-15:35'];

  const buildSlots = (subjectsByPeriod) => baseTimes.map((time, index) => ({
    time,
    mon: subjectsByPeriod[index]?.mon || '',
    tue: subjectsByPeriod[index]?.tue || '',
    wed: subjectsByPeriod[index]?.wed || '',
    thu: subjectsByPeriod[index]?.thu || '',
    fri: subjectsByPeriod[index]?.fri || ''
  }));

  return [
    {
      id: 'default',
      name: 'Default Timetable',
      slots: buildSlots([
        { mon: 'Resource',         tue: 'Resource',         wed: 'IT Skills - G5',  thu: 'Resource',          fri: 'IT Skills - G2' },
        { mon: 'IT Skills - G4',   tue: 'Student Council',  wed: 'IT Skills - G1',  thu: 'IT Skills - G4',    fri: 'IT Skills - G3' },
        { mon: 'Break',            tue: 'Break',            wed: 'Break',           thu: 'Break',             fri: 'Break' },
        { mon: 'Resource',         tue: 'Student Council',  wed: 'IT Skills - G2',  thu: 'IT Skills - G3',    fri: 'Digital Literacy' },
        { mon: 'IT Skills - G5',   tue: 'IT Skills - G1',   wed: 'Resource',        thu: 'IT Skills - G2',    fri: 'Resource' },
        { mon: 'Lunch',            tue: 'Lunch',            wed: 'Lunch',           thu: 'Lunch',             fri: '' },
        { mon: 'IT Skills - G3',   tue: 'Resource',         wed: 'IT Skills - G1',  thu: 'Digital Literacy',  fri: '' },
        { mon: 'IT Skills - G4',   tue: 'IT Skills - G5',   wed: 'Resource',        thu: 'Digital Literacy',  fri: '' }
      ])
    },
    {
      id: 'group-1',
      name: 'Group 1',
      slots: buildSlots([
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' }
      ])
    },
    {
      id: 'group-2',
      name: 'Group 2',
      slots: buildSlots([
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' }
      ])
    },
    {
      id: 'group-3',
      name: 'Group 3',
      slots: buildSlots([
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' }
      ])
    },
    {
      id: 'group-4',
      name: 'Group 4',
      slots: buildSlots([
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' }
      ])
    },
    {
      id: 'group-5',
      name: 'Group 5',
      slots: buildSlots([
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' },
        { mon: '',                 tue: '',                 wed: '',                thu: '',                  fri: '' }
      ])
    }
  ];
}

function clonePlannerSlots(slots) {
  return slots.map(slot => ({
    time: slot.time,
    mon: slot.mon,
    tue: slot.tue,
    wed: slot.wed,
    thu: slot.thu,
    fri: slot.fri
  }));
}

function createDefaultPlanner() {
  const templates = createDefaultTimetableTemplates();
  return {
    selectedTemplateId: templates[0].id,
    templates,
    activeSchedule: clonePlannerSlots(templates[0].slots),
    importantDates: [],
    classTags: [
      { id: 'tag-it-skills', name: 'IT Skills', color: '#468dbd', linkedCourseName: 'IT Skills', linkedCourseId: null },
      { id: 'tag-maths', name: 'Maths', color: '#ff996f', linkedCourseName: 'Maths', linkedCourseId: null },
      { id: 'tag-english', name: 'English', color: '#6bbf85', linkedCourseName: 'English', linkedCourseId: null },
      { id: 'tag-science', name: 'Science', color: '#7d89d8', linkedCourseName: 'Science', linkedCourseId: null },
      { id: 'tag-history', name: 'History', color: '#d08b55', linkedCourseName: 'History', linkedCourseId: null },
      { id: 'tag-art', name: 'Art', color: '#cf78a6', linkedCourseName: 'Art', linkedCourseId: null }
    ]
  };
}

function createDefaultStore() {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastUpdatedAt: nowIso(),
    courses: [],
    progressHistory: [],
    planner: createDefaultPlanner()
  };
}

function normalizePlannerSlot(slot, index) {
  const safeSlot = slot && typeof slot === 'object' ? slot : {};

  return {
    time: typeof safeSlot.time === 'string' ? safeSlot.time : `Period ${index + 1}`,
    mon: typeof safeSlot.mon === 'string' ? safeSlot.mon : '',
    tue: typeof safeSlot.tue === 'string' ? safeSlot.tue : '',
    wed: typeof safeSlot.wed === 'string' ? safeSlot.wed : '',
    thu: typeof safeSlot.thu === 'string' ? safeSlot.thu : '',
    fri: typeof safeSlot.fri === 'string' ? safeSlot.fri : ''
  };
}

function normalizePlannerTemplate(template, index) {
  const safeTemplate = template && typeof template === 'object' ? template : {};
  const slots = Array.isArray(safeTemplate.slots) ? safeTemplate.slots : [];

  return {
    id: typeof safeTemplate.id === 'string' && safeTemplate.id.trim() ? safeTemplate.id : `template-${index + 1}`,
    name: typeof safeTemplate.name === 'string' && safeTemplate.name.trim() ? safeTemplate.name : `Group ${index + 1}`,
    slots: slots.map((slot, slotIndex) => normalizePlannerSlot(slot, slotIndex))
  };
}

function normalizeImportantDate(entry, index) {
  const safeEntry = entry && typeof entry === 'object' ? entry : {};

  return {
    id: typeof safeEntry.id === 'string' && safeEntry.id.trim() ? safeEntry.id : `date-${index + 1}-${createId()}`,
    title: typeof safeEntry.title === 'string' && safeEntry.title.trim() ? safeEntry.title : 'Important Date',
    date: typeof safeEntry.date === 'string' ? safeEntry.date : ''
  };
}

function normalizeClassTag(tag, index) {
  const safeTag = tag && typeof tag === 'object' ? tag : {};
  return {
    id: typeof safeTag.id === 'string' && safeTag.id.trim() ? safeTag.id : `class-tag-${index + 1}-${createId()}`,
    name: typeof safeTag.name === 'string' && safeTag.name.trim() ? safeTag.name : `Class ${index + 1}`,
    color: typeof safeTag.color === 'string' && safeTag.color.trim() ? safeTag.color : '#468dbd',
    linkedCourseName: typeof safeTag.linkedCourseName === 'string' && safeTag.linkedCourseName.trim()
      ? safeTag.linkedCourseName
      : (typeof safeTag.name === 'string' ? safeTag.name : ''),
    linkedCourseId: typeof safeTag.linkedCourseId === 'string' && safeTag.linkedCourseId.trim() ? safeTag.linkedCourseId : null
  };
}

function resolveTagCourseLink(tag, courses) {
  if (!Array.isArray(courses) || courses.length === 0) {
    return null;
  }

  // Keep existing explicit link if it is still valid.
  if (tag.linkedCourseId && courses.some(course => course.id === tag.linkedCourseId)) {
    return tag.linkedCourseId;
  }

  const lookupText = normalizeText(tag.linkedCourseName || tag.name);
  if (!lookupText) {
    return null;
  }

  const exactMatch = courses.find(course => normalizeText(course.name) === lookupText);
  if (exactMatch) {
    return exactMatch.id;
  }

  const containsMatch = courses.find(course => normalizeText(course.name).includes(lookupText));
  if (containsMatch) {
    return containsMatch.id;
  }

  return null;
}

function applyPlannerTagAutoLinks(planner, courses) {
  if (!planner || !Array.isArray(planner.classTags)) {
    return planner;
  }

  planner.classTags = planner.classTags.map(tag => ({
    ...tag,
    linkedCourseId: resolveTagCourseLink(tag, courses)
  }));

  return planner;
}

function normalizePlanner(planner) {
  const defaultPlanner = createDefaultPlanner();
  const safePlanner = planner && typeof planner === 'object' ? planner : {};

  const normalizedTemplates = Array.isArray(safePlanner.templates) && safePlanner.templates.length > 0
    ? safePlanner.templates.map((template, index) => normalizePlannerTemplate(template, index))
    : defaultPlanner.templates;

  const selectedTemplateId = typeof safePlanner.selectedTemplateId === 'string' && safePlanner.selectedTemplateId.trim()
    ? safePlanner.selectedTemplateId
    : normalizedTemplates[0].id;

  const normalizedSchedule = Array.isArray(safePlanner.activeSchedule) && safePlanner.activeSchedule.length > 0
    ? safePlanner.activeSchedule.map((slot, index) => normalizePlannerSlot(slot, index))
    : clonePlannerSlots(normalizedTemplates.find(template => template.id === selectedTemplateId)?.slots || normalizedTemplates[0].slots);

  const importantDates = Array.isArray(safePlanner.importantDates)
    ? safePlanner.importantDates.map((entry, index) => normalizeImportantDate(entry, index))
    : [];

  const classTags = Array.isArray(safePlanner.classTags) && safePlanner.classTags.length > 0
    ? safePlanner.classTags.map((tag, index) => normalizeClassTag(tag, index))
    : defaultPlanner.classTags;

  return {
    selectedTemplateId,
    templates: normalizedTemplates,
    activeSchedule: normalizedSchedule,
    importantDates,
    classTags
  };
}

function normalizeTask(task, index) {
  const safeTask = task && typeof task === 'object' ? task : {};
  const createdAt = typeof safeTask.createdAt === 'string' ? safeTask.createdAt : nowIso();
  const updatedAt = typeof safeTask.updatedAt === 'string' ? safeTask.updatedAt : createdAt;
  const dueDate = typeof safeTask.dueDate === 'string' && safeTask.dueDate.trim() ? safeTask.dueDate : null;

  return {
    id: typeof safeTask.id === 'string' && safeTask.id.trim() ? safeTask.id : `task-${index + 1}-${createId()}`,
    name: typeof safeTask.name === 'string' && safeTask.name.trim() ? safeTask.name : 'Untitled Task',
    completed: Boolean(safeTask.completed),
    weight: toNumberOrDefault(safeTask.weight, 1),
    dueDate,
    createdAt,
    updatedAt
  };
}

function normalizeModule(module, index) {
  const safeModule = module && typeof module === 'object' ? module : {};
  const tasks = Array.isArray(safeModule.tasks) ? safeModule.tasks : [];
  const createdAt = typeof safeModule.createdAt === 'string' ? safeModule.createdAt : nowIso();
  const updatedAt = typeof safeModule.updatedAt === 'string' ? safeModule.updatedAt : createdAt;
  const dueDate = typeof safeModule.dueDate === 'string' && safeModule.dueDate.trim() ? safeModule.dueDate : null;

  return {
    id: typeof safeModule.id === 'string' && safeModule.id.trim() ? safeModule.id : `module-${index + 1}-${createId()}`,
    name: typeof safeModule.name === 'string' && safeModule.name.trim() ? safeModule.name : 'Untitled Module',
    completed: Boolean(safeModule.completed),
    weight: toNumberOrDefault(safeModule.weight, 1),
    dueDate,
    tasks: tasks.map((task, taskIndex) => normalizeTask(task, taskIndex)),
    createdAt,
    updatedAt
  };
}

function normalizeCourse(course, index) {
  const safeCourse = course && typeof course === 'object' ? course : {};
  const modules = Array.isArray(safeCourse.modules) ? safeCourse.modules : [];
  const createdAt = typeof safeCourse.createdAt === 'string' ? safeCourse.createdAt : nowIso();
  const updatedAt = typeof safeCourse.updatedAt === 'string' ? safeCourse.updatedAt : createdAt;

  return {
    id: typeof safeCourse.id === 'string' && safeCourse.id.trim() ? safeCourse.id : `course-${index + 1}-${createId()}`,
    name: typeof safeCourse.name === 'string' && safeCourse.name.trim() ? safeCourse.name : 'Untitled Course',
    modules: modules.map((module, moduleIndex) => normalizeModule(module, moduleIndex)),
    createdAt,
    updatedAt
  };
}

function normalizeProgressEvent(event, index) {
  const safeEvent = event && typeof event === 'object' ? event : {};
  const timestamp = typeof safeEvent.timestamp === 'string' ? safeEvent.timestamp : nowIso();

  return {
    id: typeof safeEvent.id === 'string' && safeEvent.id.trim() ? safeEvent.id : `event-${index + 1}-${createId()}`,
    eventType: typeof safeEvent.eventType === 'string' ? safeEvent.eventType : 'state-change',
    entityType: typeof safeEvent.entityType === 'string' ? safeEvent.entityType : 'unknown',
    entityId: typeof safeEvent.entityId === 'string' ? safeEvent.entityId : '',
    courseId: typeof safeEvent.courseId === 'string' ? safeEvent.courseId : null,
    moduleId: typeof safeEvent.moduleId === 'string' ? safeEvent.moduleId : null,
    oldValue: safeEvent.oldValue,
    newValue: safeEvent.newValue,
    timestamp
  };
}

function migrateAndNormalizeStore(payload) {
  // Legacy format support: older versions stored a raw array of courses.
  const asObject = Array.isArray(payload)
    ? { courses: payload }
    : payload && typeof payload === 'object'
      ? payload
      : {};

  let schemaVersion = toNumberOrDefault(asObject.schemaVersion, 0);
  if (schemaVersion < 1) {
    schemaVersion = 1;
  }

  const courses = Array.isArray(asObject.courses) ? asObject.courses : [];
  const progressHistory = Array.isArray(asObject.progressHistory) ? asObject.progressHistory : [];

  const normalizedCourses = courses.map((course, courseIndex) => normalizeCourse(course, courseIndex));
  const normalizedPlanner = normalizePlanner(asObject.planner);
  applyPlannerTagAutoLinks(normalizedPlanner, normalizedCourses);

  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    lastUpdatedAt: typeof asObject.lastUpdatedAt === 'string' ? asObject.lastUpdatedAt : nowIso(),
    courses: normalizedCourses,
    progressHistory: progressHistory.map((event, eventIndex) => normalizeProgressEvent(event, eventIndex)),
    planner: normalizedPlanner
  };
}

function readAndNormalizeStoreFile(filePath, label) {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return migrateAndNormalizeStore(parsed);
  } catch (error) {
    console.error(`Error reading ${label} store file:`, error);
    return null;
  }
}

function readStoreFromDisk() {
  const primaryStore = readAndNormalizeStoreFile(dataFile, 'primary');
  if (primaryStore) {
    return primaryStore;
  }

  const backupStore = readAndNormalizeStoreFile(backupDataFile, 'backup');
  if (backupStore) {
    try {
      // Promote backup to primary when primary is missing/corrupt.
      writeJsonAtomic(dataFile, backupStore);
      console.log('Recovered primary data file from backup snapshot.');
    } catch (error) {
      console.error('Error restoring primary file from backup:', error);
    }
    return backupStore;
  }

  return createDefaultStore();
}

function writeJsonAtomic(filePath, data) {
  const tempFilePath = `${filePath}.tmp`;
  const json = JSON.stringify(data, null, 2);
  let fileDescriptor;

  try {
    fileDescriptor = fs.openSync(tempFilePath, 'w');
    fs.writeFileSync(fileDescriptor, json, 'utf-8');
    fs.fsyncSync(fileDescriptor);
    fs.closeSync(fileDescriptor);
    fileDescriptor = null;
    fs.renameSync(tempFilePath, filePath);
  } catch (error) {
    if (fileDescriptor !== undefined && fileDescriptor !== null) {
      try {
        fs.closeSync(fileDescriptor);
      } catch (closeError) {
        console.error('Error closing temp file descriptor:', closeError);
      }
    }

    if (fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (unlinkError) {
        console.error('Error cleaning up temp file:', unlinkError);
      }
    }

    throw error;
  }
}

function saveStoreToDisk(store) {
  const normalizedStore = migrateAndNormalizeStore(store);
  normalizedStore.lastUpdatedAt = nowIso();

  const currentPrimaryStore = readAndNormalizeStoreFile(dataFile, 'primary-before-save');
  if (currentPrimaryStore) {
    // Keep at least one local backup snapshot for recovery.
    writeJsonAtomic(backupDataFile, currentPrimaryStore);
  }

  writeJsonAtomic(dataFile, normalizedStore);
  return normalizedStore;
}

function writeStoreCopyToDesktop(prefix, store) {
  const desktopDir = app.getPath('desktop');
  const fileName = `${prefix}-${fileTimestamp()}.json`;
  const filePath = path.join(desktopDir, fileName);
  const normalizedStore = migrateAndNormalizeStore(store);
  normalizedStore.lastUpdatedAt = nowIso();
  writeJsonAtomic(filePath, normalizedStore);
  return filePath;
}

function addProgressEvent(store, event) {
  store.progressHistory.push(normalizeProgressEvent({
    ...event,
    id: createId(),
    timestamp: nowIso()
  }, store.progressHistory.length));
}

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize with sample data if no data file exists yet
if (!fs.existsSync(dataFile)) {
  try {
    const samplePath = path.join(__dirname, '..', 'data', 'sample-courses.json');
    if (fs.existsSync(samplePath)) {
      const sampleData = JSON.parse(fs.readFileSync(samplePath, 'utf-8'));
      const initialStore = migrateAndNormalizeStore(sampleData);
      saveStoreToDisk(initialStore);
      console.log('Initialized with sample courses');
    } else {
      saveStoreToDisk(createDefaultStore());
    }
  } catch (error) {
    console.error('Error initializing sample courses:', error);
    saveStoreToDisk(createDefaultStore());
  }
}

function createWindow() {
  const appIconPath = process.platform === 'win32'
    ? path.join(__dirname, '..', 'images', 'sortedLogo.ico')
    : path.join(__dirname, '..', 'images', 'courseProgressTrack.png');

  // Create the single main application window.
  mainWindow = new BrowserWindow({
    width: 1220,
    height: 860,
    minWidth: 920,
    minHeight: 680,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: appIconPath
  });

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, '../build/index.html')}`;

  // Load local HTML directly for this desktop app.
  mainWindow.loadFile('index.html');

  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    // Clear reference so macOS re-activation can recreate the window.
    mainWindow = null;
  });
}

// App lifecycle: create a window once Electron is initialized.
app.on('ready', createWindow);

app.on('window-all-closed', () => {
  // On macOS, apps commonly stay open until the user quits explicitly.
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // Recreate the window when the dock icon is clicked and none exist.
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers for data management
ipcMain.handle('load-courses', async () => {
  // Return persisted courses, or an empty list if none exist yet.
  try {
    const store = readStoreFromDisk();
    // Persist normalized/migrated data so future loads are fast and consistent.
    saveStoreToDisk(store);
    return store.courses;
  } catch (error) {
    console.error('Error loading courses:', error);
    return [];
  }
});

ipcMain.handle('load-planner', async () => {
  try {
    const store = readStoreFromDisk();
    if (!store.planner) {
      store.planner = createDefaultPlanner();
      saveStoreToDisk(store);
    }
    return store.planner;
  } catch (error) {
    console.error('Error loading planner:', error);
    return createDefaultPlanner();
  }
});

ipcMain.handle('save-planner', async (event, planner) => {
  try {
    const store = readStoreFromDisk();
    store.planner = normalizePlanner(planner);
    const savedStore = saveStoreToDisk(store);
    return { success: true, planner: savedStore.planner };
  } catch (error) {
    console.error('Error saving planner:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('reset-planner-defaults', async () => {
  try {
    const store = readStoreFromDisk();
    store.planner = createDefaultPlanner();
    applyPlannerTagAutoLinks(store.planner, store.courses);
    const savedStore = saveStoreToDisk(store);
    return { success: true, planner: savedStore.planner };
  } catch (error) {
    console.error('Error resetting planner defaults:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('save-courses', async (event, courses) => {
  // Overwrite the full course list from renderer state.
  try {
    const store = readStoreFromDisk();
    store.courses = Array.isArray(courses) ? courses : [];
    saveStoreToDisk(store);
    return { success: true };
  } catch (error) {
    console.error('Error saving courses:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-course', async (event, courseName) => {
  // Create a new course with a timestamp-based ID.
  try {
    const store = readStoreFromDisk();
    const timestamp = nowIso();
    const newCourse = {
      id: createId(),
      name: courseName,
      modules: [],
      createdAt: timestamp,
      updatedAt: timestamp
    };
    store.courses.push(newCourse);
    const savedStore = saveStoreToDisk(store);
    return savedStore.courses.find(c => c.id === newCourse.id) || newCourse;
  } catch (error) {
    console.error('Error adding course:', error);
    return null;
  }
});

ipcMain.handle('delete-course', async (event, courseId) => {
  // Remove a course by ID if it exists.
  try {
    const store = readStoreFromDisk();
    const courseExists = store.courses.some(c => c.id === courseId);
    if (courseExists) {
      store.courses = store.courses.filter(c => c.id !== courseId);
      saveStoreToDisk(store);
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false };
  }
});

ipcMain.handle('add-module', async (event, courseId, moduleName, weight = 1, dueDate = null) => {
  // Add a module to a specific course.
  try {
    const store = readStoreFromDisk();
    const course = store.courses.find(c => c.id === courseId);
    if (course) {
      const timestamp = nowIso();
      const newModule = {
        id: createId(),
        name: moduleName,
        completed: false,
        weight: weight,
        dueDate: typeof dueDate === 'string' && dueDate.trim() ? dueDate : null,
        tasks: [],
        createdAt: timestamp,
        updatedAt: timestamp
      };
      course.modules.push(newModule);
      course.updatedAt = timestamp;
      const savedStore = saveStoreToDisk(store);
      const savedCourse = savedStore.courses.find(c => c.id === courseId);
      if (!savedCourse) {
        return null;
      }
      return savedCourse.modules.find(m => m.id === newModule.id) || newModule;
    }
    return null;
  } catch (error) {
    console.error('Error adding module:', error);
    return null;
  }
});

ipcMain.handle('update-module', async (event, courseId, moduleId, updates) => {
  // Apply partial updates (for example, completed state) to one module.
  try {
    const store = readStoreFromDisk();
    const course = store.courses.find(c => c.id === courseId);
    if (course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module) {
        const previousCompleted = Boolean(module.completed);
        Object.assign(module, updates);
        module.updatedAt = nowIso();
        course.updatedAt = module.updatedAt;

        if (
          updates
          && Object.prototype.hasOwnProperty.call(updates, 'completed')
          && previousCompleted !== Boolean(module.completed)
        ) {
          addProgressEvent(store, {
            eventType: 'completion-toggled',
            entityType: 'module',
            entityId: module.id,
            courseId: course.id,
            moduleId: module.id,
            oldValue: previousCompleted,
            newValue: Boolean(module.completed)
          });
        }

        const savedStore = saveStoreToDisk(store);
        const savedCourse = savedStore.courses.find(c => c.id === courseId);
        if (!savedCourse) {
          return null;
        }
        return savedCourse.modules.find(m => m.id === moduleId) || null;
      }
    }
    return null;
  } catch (error) {
    console.error('Error updating module:', error);
    return null;
  }
});

ipcMain.handle('delete-module', async (event, courseId, moduleId) => {
  // Remove a module from the selected course.
  try {
    const store = readStoreFromDisk();
    const course = store.courses.find(c => c.id === courseId);
    if (course) {
      course.modules = course.modules.filter(m => m.id !== moduleId);
      course.updatedAt = nowIso();
      saveStoreToDisk(store);
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error deleting module:', error);
    return { success: false };
  }
});

ipcMain.handle('add-task', async (event, courseId, moduleId, taskName, weight = 1, dueDate = null) => {
  // Add a task under the specified module.
  try {
    const store = readStoreFromDisk();
    const course = store.courses.find(c => c.id === courseId);
    if (course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module) {
        const timestamp = nowIso();
        if (!module.tasks) module.tasks = [];
        const newTask = {
          id: createId(),
          name: taskName,
          completed: false,
          weight: weight,
          dueDate: typeof dueDate === 'string' && dueDate.trim() ? dueDate : null,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        module.tasks.push(newTask);
        module.updatedAt = timestamp;
        course.updatedAt = timestamp;

        const savedStore = saveStoreToDisk(store);
        const savedCourse = savedStore.courses.find(c => c.id === courseId);
        if (!savedCourse) {
          return null;
        }
        const savedModule = savedCourse.modules.find(m => m.id === moduleId);
        if (!savedModule) {
          return null;
        }
        return savedModule.tasks.find(t => t.id === newTask.id) || newTask;
      }
    }
    return null;
  } catch (error) {
    console.error('Error adding task:', error);
    return null;
  }
});

ipcMain.handle('update-task', async (event, courseId, moduleId, taskId, updates) => {
  // Apply partial updates to a task.
  try {
    const store = readStoreFromDisk();
    const course = store.courses.find(c => c.id === courseId);
    if (course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module && module.tasks) {
        const task = module.tasks.find(t => t.id === taskId);
        if (task) {
          const previousCompleted = Boolean(task.completed);
          Object.assign(task, updates);
          task.updatedAt = nowIso();
          module.updatedAt = task.updatedAt;
          course.updatedAt = task.updatedAt;

          if (
            updates
            && Object.prototype.hasOwnProperty.call(updates, 'completed')
            && previousCompleted !== Boolean(task.completed)
          ) {
            addProgressEvent(store, {
              eventType: 'completion-toggled',
              entityType: 'task',
              entityId: task.id,
              courseId: course.id,
              moduleId: module.id,
              oldValue: previousCompleted,
              newValue: Boolean(task.completed)
            });
          }

          const savedStore = saveStoreToDisk(store);
          const savedCourse = savedStore.courses.find(c => c.id === courseId);
          if (!savedCourse) {
            return null;
          }
          const savedModule = savedCourse.modules.find(m => m.id === moduleId);
          if (!savedModule || !savedModule.tasks) {
            return null;
          }
          return savedModule.tasks.find(t => t.id === taskId) || null;
        }
      }
    }
    return null;
  } catch (error) {
    console.error('Error updating task:', error);
    return null;
  }
});

ipcMain.handle('delete-task', async (event, courseId, moduleId, taskId) => {
  // Remove a task from a module.
  try {
    const store = readStoreFromDisk();
    const course = store.courses.find(c => c.id === courseId);
    if (course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module && module.tasks) {
        module.tasks = module.tasks.filter(t => t.id !== taskId);
        module.updatedAt = nowIso();
        course.updatedAt = module.updatedAt;
        saveStoreToDisk(store);
        return { success: true };
      }
    }
    return { success: false };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false };
  }
});

ipcMain.handle('export-backup-to-desktop', async () => {
  try {
    const store = readStoreFromDisk();
    const filePath = writeStoreCopyToDesktop('course-progress-backup', store);
    return { success: true, filePath };
  } catch (error) {
    console.error('Error exporting backup:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-from-backup-file', async () => {
  try {
    const result = await dialog.showOpenDialog({
      title: 'Select backup file',
      properties: ['openFile'],
      filters: [
        { name: 'JSON Files', extensions: ['json'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    });

    if (result.canceled || !result.filePaths || result.filePaths.length === 0) {
      return { cancelled: true };
    }

    const restorePath = result.filePaths[0];
    const raw = fs.readFileSync(restorePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const restoredStore = migrateAndNormalizeStore(parsed);

    const currentStore = readStoreFromDisk();
    const safetyBackupPath = writeStoreCopyToDesktop('course-progress-pre-restore-backup', currentStore);
    saveStoreToDisk(restoredStore);

    return {
      success: true,
      restoredFrom: restorePath,
      safetyBackupPath
    };
  } catch (error) {
    console.error('Error restoring from backup file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('restore-sample-data', async () => {
  try {
    const samplePath = path.join(__dirname, '..', 'data', 'sample-courses.json');
    if (!fs.existsSync(samplePath)) {
      return { success: false, error: 'Sample data file not found.' };
    }

    const raw = fs.readFileSync(samplePath, 'utf-8');
    const parsed = JSON.parse(raw);
    const sampleStore = migrateAndNormalizeStore(parsed);

    const currentStore = readStoreFromDisk();
    const safetyBackupPath = writeStoreCopyToDesktop('course-progress-pre-sample-restore-backup', currentStore);
    saveStoreToDisk(sampleStore);

    return { success: true, safetyBackupPath };
  } catch (error) {
    console.error('Error restoring sample data:', error);
    return { success: false, error: error.message };
  }
});
