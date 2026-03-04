const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  loadCourses: () => ipcRenderer.invoke('load-courses'),
  saveCourses: (courses) => ipcRenderer.invoke('save-courses', courses),
  addCourse: (courseName) => ipcRenderer.invoke('add-course', courseName),
  addModule: (courseId, moduleName, weight) => ipcRenderer.invoke('add-module', courseId, moduleName, weight),
  updateModule: (courseId, moduleId, updates) => ipcRenderer.invoke('update-module', courseId, moduleId, updates),
  deleteModule: (courseId, moduleId) => ipcRenderer.invoke('delete-module', courseId, moduleId),
  deleteCourse: (courseId) => ipcRenderer.invoke('delete-course', courseId),
  addTask: (courseId, moduleId, taskName, weight) => ipcRenderer.invoke('add-task', courseId, moduleId, taskName, weight),
  updateTask: (courseId, moduleId, taskId, updates) => ipcRenderer.invoke('update-task', courseId, moduleId, taskId, updates),
  deleteTask: (courseId, moduleId, taskId) => ipcRenderer.invoke('delete-task', courseId, moduleId, taskId)
});
