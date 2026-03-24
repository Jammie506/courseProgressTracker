const { app, BrowserWindow, Menu, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Development toggle used for optional tooling like DevTools.
const isDev = process.env.NODE_ENV === 'development';

let mainWindow;
// Store user data in Electron's per-user app data directory.
const dataDir = path.join(app.getPath('userData'), 'data');
const dataFile = path.join(dataDir, 'courses.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize with sample data if no data file exists yet
if (!fs.existsSync(dataFile)) {
  try {
    const samplePath = path.join(__dirname, '..', 'data', 'sample-courses.json');
    if (fs.existsSync(samplePath)) {
      const sampleData = fs.readFileSync(samplePath, 'utf-8');
      fs.writeFileSync(dataFile, sampleData);
      console.log('Initialized with sample courses');
    }
  } catch (error) {
    console.error('Error initializing sample courses:', error);
  }
}

function createWindow() {
  // Create the single main application window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '..', 'images', 'courseProgressTrack.png')
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
    if (fs.existsSync(dataFile)) {
      const data = fs.readFileSync(dataFile, 'utf-8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error loading courses:', error);
    return [];
  }
});

ipcMain.handle('save-courses', async (event, courses) => {
  // Overwrite the full course list from renderer state.
  try {
    fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
    return { success: true };
  } catch (error) {
    console.error('Error saving courses:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('add-course', async (event, courseName) => {
  // Create a new course with a timestamp-based ID.
  try {
    let courses = [];
    if (fs.existsSync(dataFile)) {
      courses = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    const newCourse = {
      id: Date.now().toString(),
      name: courseName,
      modules: [],
      createdAt: new Date().toISOString()
    };
    courses.push(newCourse);
    fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
    return newCourse;
  } catch (error) {
    console.error('Error adding course:', error);
    return null;
  }
});

ipcMain.handle('delete-course', async (event, courseId) => {
  // Remove a course by ID if it exists.
  try {
    let courses = [];
    if (fs.existsSync(dataFile)) {
      courses = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    const courseExists = courses.some(c => c.id === courseId);
    if (courseExists) {
      courses = courses.filter(c => c.id !== courseId);
      fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error deleting course:', error);
    return { success: false };
  }
});

ipcMain.handle('add-module', async (event, courseId, moduleName, weight = 1) => {
  // Add a module to a specific course.
  try {
    let courses = [];
    if (fs.existsSync(dataFile)) {
      courses = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const newModule = {
        id: Date.now().toString(),
        name: moduleName,
        completed: false,
        weight: weight,
        tasks: []
      };
      course.modules.push(newModule);
      fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
      return newModule;
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
    let courses = [];
    if (fs.existsSync(dataFile)) {
      courses = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module) {
        Object.assign(module, updates);
        fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
        return module;
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
    let courses = [];
    if (fs.existsSync(dataFile)) {
      courses = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    const course = courses.find(c => c.id === courseId);
    if (course) {
      course.modules = course.modules.filter(m => m.id !== moduleId);
      fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
      return { success: true };
    }
    return { success: false };
  } catch (error) {
    console.error('Error deleting module:', error);
    return { success: false };
  }
});

ipcMain.handle('add-task', async (event, courseId, moduleId, taskName, weight = 1) => {
  // Add a task under the specified module.
  try {
    let courses = [];
    if (fs.existsSync(dataFile)) {
      courses = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module) {
        if (!module.tasks) module.tasks = [];
        const newTask = {
          id: Date.now().toString(),
          name: taskName,
          completed: false,
          weight: weight
        };
        module.tasks.push(newTask);
        fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
        return newTask;
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
    let courses = [];
    if (fs.existsSync(dataFile)) {
      courses = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module && module.tasks) {
        const task = module.tasks.find(t => t.id === taskId);
        if (task) {
          Object.assign(task, updates);
          fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
          return task;
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
    let courses = [];
    if (fs.existsSync(dataFile)) {
      courses = JSON.parse(fs.readFileSync(dataFile, 'utf-8'));
    }
    const course = courses.find(c => c.id === courseId);
    if (course) {
      const module = course.modules.find(m => m.id === moduleId);
      if (module && module.tasks) {
        module.tasks = module.tasks.filter(t => t.id !== taskId);
        fs.writeFileSync(dataFile, JSON.stringify(courses, null, 2));
        return { success: true };
      }
    }
    return { success: false };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { success: false };
  }
});
