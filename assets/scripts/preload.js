const { contextBridge, ipcRenderer } = require('electron');

// Expose a safe, explicit API surface from the preload context to the renderer.
// Each method forwards to a corresponding IPC handler in the main process.
contextBridge.exposeInMainWorld('electronAPI', {
  // Course persistence and top-level CRUD.
  loadCourses: () => ipcRenderer.invoke('load-courses'),
  saveCourses: (courses) => ipcRenderer.invoke('save-courses', courses),
  addCourse: (courseName) => ipcRenderer.invoke('add-course', courseName),

  // Module CRUD and state updates.
  addModule: (courseId, moduleName, weight) => ipcRenderer.invoke('add-module', courseId, moduleName, weight),
  updateModule: (courseId, moduleId, updates) => ipcRenderer.invoke('update-module', courseId, moduleId, updates),
  deleteModule: (courseId, moduleId) => ipcRenderer.invoke('delete-module', courseId, moduleId),
  deleteCourse: (courseId) => ipcRenderer.invoke('delete-course', courseId),

  // Task CRUD and state updates.
  addTask: (courseId, moduleId, taskName, weight) => ipcRenderer.invoke('add-task', courseId, moduleId, taskName, weight),
  updateTask: (courseId, moduleId, taskId, updates) => ipcRenderer.invoke('update-task', courseId, moduleId, taskId, updates),
  deleteTask: (courseId, moduleId, taskId) => ipcRenderer.invoke('delete-task', courseId, moduleId, taskId),

  // Backup and restore tools.
  exportBackupToDesktop: () => ipcRenderer.invoke('export-backup-to-desktop'),
  restoreFromBackupFile: () => ipcRenderer.invoke('restore-from-backup-file'),
  restoreSampleData: () => ipcRenderer.invoke('restore-sample-data')
});
