// DOM Elements
const addCourseBtn = document.getElementById('addCourseBtn');
const addCourseModal = document.getElementById('addCourseModal');
const courseNameInput = document.getElementById('courseNameInput');
const createCourseBtn = document.getElementById('createCourseBtn');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');
const courseList = document.getElementById('courseList');

const welcomeSection = document.getElementById('welcomeSection');
const startLearningBtn = document.getElementById('startLearningBtn');
const courseSection = document.querySelector('.course-section');
const overallProgressSection = document.querySelector('.overall-progress-section');
const welcomeNavBtn = document.getElementById('welcomeNavBtn');
const coursesNavBtn = document.getElementById('coursesNavBtn');

const moduleSection = document.getElementById('moduleSection');
const addModuleBtn = document.getElementById('addModuleBtn');
const addModuleModal = document.getElementById('addModuleModal');
const moduleNameInput = document.getElementById('moduleNameInput');
const createModuleBtn = document.getElementById('createModuleBtn');
const cancelModuleBtn = document.getElementById('cancelModuleBtn');
const moduleList = document.getElementById('moduleList');
const backBtn = document.getElementById('backBtn');
const currentCourseName = document.getElementById('currentCourseName');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const moduleWeightInput = document.getElementById('moduleWeightInput');

const addTaskModal = document.getElementById('addTaskModal');
const taskNameInput = document.getElementById('taskNameInput');
const taskWeightInput = document.getElementById('taskWeightInput');
const taskModuleName = document.getElementById('taskModuleName');
const createTaskBtn = document.getElementById('createTaskBtn');
const cancelTaskBtn = document.getElementById('cancelTaskBtn');

let courses = [];
let currentCourseId = null;
let currentModuleId = null;
let expandedModules = new Set(); // Track which modules have expanded tasks

// Overall Progress Elements
const totalCoursesCount = document.getElementById('totalCoursesCount');
const totalModulesCount = document.getElementById('totalModulesCount');
const completedModulesCount = document.getElementById('completedModulesCount');
const overallProgressFill = document.getElementById('overallProgressFill');
const overallProgressText = document.getElementById('overallProgressText');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadCourses();
    setupEventListeners();
});

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
}

// COURSE FUNCTIONS
async function loadCourses() {
    try {
        courses = await window.electronAPI.loadCourses();
        renderCourses();
    } catch (error) {
        console.error('Error loading courses:', error);
    }
}

function renderCourses() {
    if (courses.length === 0) {
        courseList.innerHTML = '<p class="empty-state">No courses yet. Create one to get started!</p>';
        updateOverallProgress();
        return;
    }

    courseList.innerHTML = courses.map(course => {
        const moduleCount = course.modules.length;
        const completedCount = course.modules.filter(m => m.completed).length;
        return `
            <div class="course-card">
                <h3>${escapeHtml(course.name)}</h3>
                <div class="course-info">
                    <span class="course-modules">${completedCount}/${moduleCount} modules</span>
                    <div style="display: flex; gap: 8px;">
                        <button class="btn btn-primary" onclick="selectCourse('${course.id}')">Open</button>
                        <button class="btn btn-danger" onclick="deleteCourse('${course.id}')">Delete</button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    
    updateOverallProgress();
}

function openAddCourseModal() {
    addCourseModal.classList.remove('hidden');
    courseNameInput.focus();
}

function closeAddCourseModal() {
    addCourseModal.classList.add('hidden');
    courseNameInput.value = '';
}

async function createCourse() {
    const courseName = courseNameInput.value.trim();
    if (!courseName) {
        alert('Please enter a course name');
        return;
    }

    const newCourse = await window.electronAPI.addCourse(courseName);
    if (newCourse) {
        courses.push(newCourse);
        renderCourses();
        closeAddCourseModal();
    }
}

async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        const result = await window.electronAPI.deleteCourse(courseId);
        if (result.success) {
            courses = courses.filter(c => c.id !== courseId);
            renderCourses();
        }
    }
}

function selectCourse(courseId) {
    currentCourseId = courseId;
    const course = courses.find(c => c.id === courseId);
    if (course) {
        currentCourseName.textContent = course.name;
        renderModules(course);
        moduleSection.classList.remove('hidden');
        window.scrollTo(0, 0);
    }
}

// MODULE FUNCTIONS
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

        const tasksHtml = tasks.length > 0 && isExpanded ? `
            <div class="tasks-container">
                ${tasks.map(task => {
                    const taskWeight = task.weight || 1;
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
                                <div class="task-weight">${taskWeight} point${taskWeight !== 1 ? 's' : ''}</div>
                            </div>
                            <button class="btn btn-danger task-delete" onclick="deleteTask('${course.id}', '${module.id}', '${task.id}')">Delete</button>
                        </div>
                    `;
                }).join('')}
            </div>
        ` : '';

        const chevron = tasks.length > 0 ? `<span class="module-chevron ${isExpanded ? 'expanded' : ''}">▼</span>` : '';

        return `
            <div class="module-wrapper">
                <div class="module-item" onclick="toggleModuleExpand('${module.id}')" style="cursor: ${tasks.length > 0 ? 'pointer' : 'default'};">
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
                                <div class="module-meta">Weight: ${weight} point${weight !== 1 ? 's' : ''} | Tasks: ${tasks.length}</div>
                            </div>
                        </div>
                    </div>
                    <div class="module-actions">
                        <button class="btn btn-primary add-task-btn" onclick="openAddTaskModal('${module.id}', '${escapeHtml(module.name).replace(/'/g, "\\'")}'); event.stopPropagation();">+ Task</button>
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

function openAddModuleModal() {
    addModuleModal.classList.remove('hidden');
    moduleNameInput.focus();
}

function closeAddModuleModal() {
    addModuleModal.classList.add('hidden');
    moduleNameInput.value = '';
    moduleWeightInput.value = '1';
}

async function createModule() {
    const moduleName = moduleNameInput.value.trim();
    const weight = parseInt(moduleWeightInput.value) || 1;
    
    if (!moduleName) {
        alert('Please enter a module name');
        return;
    }

    const newModule = await window.electronAPI.addModule(currentCourseId, moduleName, weight);
    if (newModule) {
        const course = courses.find(c => c.id === currentCourseId);
        if (course) {
            course.modules.push(newModule);
            renderModules(course);
            updateOverallProgress();
            closeAddModuleModal();
        }
    }
}

async function toggleModule(courseId, moduleId, completed) {
    const result = await window.electronAPI.updateModule(courseId, moduleId, { completed });
    if (result) {
        const course = courses.find(c => c.id === courseId);
        if (course) {
            const module = course.modules.find(m => m.id === moduleId);
            if (module) {
                module.completed = completed;
                updateProgressBar(course);
                updateOverallProgress();
            }
        }
    }
}

async function deleteModule(courseId, moduleId) {
    if (confirm('Are you sure you want to delete this module?')) {
        const result = await window.electronAPI.deleteModule(courseId, moduleId);
        if (result.success) {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                course.modules = course.modules.filter(m => m.id !== moduleId);
                renderModules(course);
                updateOverallProgress();
            }
        }
    }
}

function backToCourses() {
    moduleSection.classList.add('hidden');
    currentCourseId = null;
}

// NAVIGATION FUNCTIONS
function showWelcome() {
    welcomeSection.classList.remove('hidden');
    courseSection.classList.add('hidden');
    overallProgressSection.classList.add('hidden');
    
    // Update active button
    welcomeNavBtn.classList.add('nav-btn-active');
    coursesNavBtn.classList.remove('nav-btn-active');
}

function showCourses() {
    welcomeSection.classList.add('hidden');
    courseSection.classList.remove('hidden');
    overallProgressSection.classList.remove('hidden');
    
    // Update active button
    welcomeNavBtn.classList.remove('nav-btn-active');
    coursesNavBtn.classList.add('nav-btn-active');
}

// PROGRESS BAR
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
    progressText.textContent = `${completedWeight}/${totalWeight} Points Complete (${percentage}%)`;
}

// OVERALL PROGRESS
function updateOverallProgress() {
    let totalWeight = 0;
    let completedWeight = 0;
    let totalModules = 0;
    let completedModules = 0;

    courses.forEach(course => {
        course.modules.forEach(module => {
            const weight = module.weight || 1;
            totalWeight += weight;
            totalModules += 1;
            
            if (module.completed) {
                completedWeight += weight;
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
    overallProgressText.textContent = `${percentage}% Complete • ${completedWeight}/${totalWeight} Points`;
}

// UTILITIES
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Toggle module expansion
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
function openAddTaskModal(moduleId, moduleName) {
    currentModuleId = moduleId;
    taskModuleName.textContent = moduleName;
    addTaskModal.classList.remove('hidden');
    taskNameInput.focus();
}

function closeAddTaskModal() {
    addTaskModal.classList.add('hidden');
    taskNameInput.value = '';
    taskWeightInput.value = '1';
    currentModuleId = null;
}

async function createTask() {
    const taskName = taskNameInput.value.trim();
    const weight = parseInt(taskWeightInput.value) || 1;

    if (!taskName) {
        alert('Please enter a task name');
        return;
    }

    const newTask = await window.electronAPI.addTask(currentCourseId, currentModuleId, taskName, weight);
    if (newTask) {
        const course = courses.find(c => c.id === currentCourseId);
        if (course) {
            const module = course.modules.find(m => m.id === currentModuleId);
            if (module) {
                if (!module.tasks) module.tasks = [];
                module.tasks.push(newTask);
                renderModules(course);
                closeAddTaskModal();
            }
        }
    }
}

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
                    
                    renderModules(course);
                    updateProgressBar(course);
                }
            }
        }
    }
}

async function deleteTask(courseId, moduleId, taskId) {
    if (confirm('Are you sure you want to delete this task?')) {
        const result = await window.electronAPI.deleteTask(courseId, moduleId, taskId);
        if (result.success) {
            const course = courses.find(c => c.id === courseId);
            if (course) {
                const module = course.modules.find(m => m.id === moduleId);
                if (module && module.tasks) {
                    module.tasks = module.tasks.filter(t => t.id !== taskId);
                    renderModules(course);
                }
            }
        }
    }
}
