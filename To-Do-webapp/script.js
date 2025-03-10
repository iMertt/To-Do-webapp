document.addEventListener('DOMContentLoaded', function() {
  
    const taskInput = document.getElementById('task-input');
    const addButton = document.getElementById('add-button');
    const taskList = document.getElementById('task-list');
    const tasksCounter = document.getElementById('tasks-counter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const datePicker = document.getElementById('date-picker');
    const prioritySelect = document.getElementById('priority-select');
    const categorySelect = document.getElementById('category-select');
    
 
    if (datePicker) {
        flatpickr(datePicker, {
            dateFormat: "d.m.Y",
            minDate: "today",
            altInput: true,
            altFormat: "d F Y",
            placeholder: "Select date"
        });
    }
    

    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentCategory = 'all';
    let editingTaskId = null;
    
  
    renderTasks();
    updateTasksCounter();
    
    
    function addOrUpdateTask() {
        const taskText = taskInput.value.trim();
        if (taskText === '') return;
        
        const dueDate = datePicker && datePicker.value ? new Date(datePicker._flatpickr.selectedDates[0]) : null;
        const priority = prioritySelect ? prioritySelect.value : '0';
        const category = categorySelect ? categorySelect.value : '';
        
        if (editingTaskId) {
           
            tasks = tasks.map(task => {
                if (task.id === editingTaskId) {
                    return {
                        ...task,
                        text: taskText,
                        dueDate: dueDate,
                        priority: priority,
                        category: category,
                        updatedAt: new Date()
                    };
                }
                return task;
            });
            
            editingTaskId = null;
            addButton.innerHTML = '<i class="fas fa-plus"></i>';
        } else {
          
            const newTask = {
                id: Date.now(),
                text: taskText,
                completed: false,
                dueDate: dueDate,
                priority: priority,
                category: category,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            
            tasks.push(newTask);
        }
        
        saveTasks();
        renderTasks();
        updateTasksCounter();
        
      
        taskInput.value = '';
        if (datePicker) datePicker._flatpickr.clear();
        if (prioritySelect) prioritySelect.value = '0';
        if (categorySelect) categorySelect.value = '';
        
        taskInput.focus();
    }
    
  
    function editTask(id) {
        const task = tasks.find(task => task.id === id);
        if (!task) return;
        
       
        taskInput.value = task.text;
        
        if (datePicker && task.dueDate) {
            datePicker._flatpickr.setDate(new Date(task.dueDate));
        } else if (datePicker) {
            datePicker._flatpickr.clear();
        }
        
        if (prioritySelect) prioritySelect.value = task.priority || '0';
        if (categorySelect) categorySelect.value = task.category || '';
        
       
        editingTaskId = id;
        addButton.innerHTML = '<i class="fas fa-save"></i>';
        
        taskInput.focus();
    }
    
   
    function deleteTask(id) {
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateTasksCounter();
    }
    
   
    function toggleTaskStatus(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed, updatedAt: new Date() };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateTasksCounter();
    }
    
   
    function clearCompletedTasks() {
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateTasksCounter();
    }
    
  
    function filterTasks(filter) {
        currentFilter = filter;
        
        filterButtons.forEach(btn => {
            if (btn.getAttribute('data-filter') === filter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        renderTasks();
    }
    
   
    function filterByCategory(category) {
        currentCategory = category;
        
        if (categoryButtons) {
            categoryButtons.forEach(btn => {
                if (btn.getAttribute('data-category') === category) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
        }
        
        renderTasks();
    }
    
  
    function formatDate(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const dateOptions = { day: 'numeric', month: 'short' };
        
        if (date < today) {
            return `<span class="overdue">${date.toLocaleDateString('en-US', dateOptions)}</span>`;
        } else if (date.getTime() === today.getTime()) {
            return `<span class="due-today">Today</span>`;
        } else if (date.getTime() === tomorrow.getTime()) {
            return `<span class="due-tomorrow">Tomorrow</span>`;
        } else {
            return date.toLocaleDateString('en-US', dateOptions);
        }
    }
    
   
    function renderTasks() {
        let filteredTasks = tasks;
        
        
        if (currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        } else if (currentFilter === 'today') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const tomorrow = new Date(today);
            tomorrow.setDate(tomorrow.getDate() + 1);
            
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= today && dueDate < tomorrow;
            });
        } else if (currentFilter === 'upcoming') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            filteredTasks = filteredTasks.filter(task => {
                if (!task.dueDate) return false;
                const dueDate = new Date(task.dueDate);
                return dueDate >= today;
            });
        }
        
       
        if (currentCategory !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === currentCategory);
        }
        
       
        filteredTasks.sort((a, b) => {
           
            if (a.completed !== b.completed) {
                return a.completed ? 1 : -1;
            }
            
          
            if (a.dueDate && !b.dueDate) return -1;
            if (!a.dueDate && b.dueDate) return 1;
            if (a.dueDate && b.dueDate) {
                const dateA = new Date(a.dueDate);
                const dateB = new Date(b.dueDate);
                if (dateA < dateB) return -1;
                if (dateA > dateB) return 1;
            }
            
         
            if (a.priority !== b.priority) {
                return b.priority - a.priority;
            }
            
 
            return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
      
        taskList.innerHTML = '';
        
        if (filteredTasks.length === 0) {
            taskList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <p>No tasks found</p>
                </div>
            `;
            return;
        }
        
        filteredTasks.forEach(task => {
            const taskItem = document.createElement('div');
            taskItem.classList.add('task-item');
            if (task.completed) {
                taskItem.classList.add('completed');
            }
            
           
            let priorityIndicator = '';
            if (task.priority && task.priority !== '0') {
                priorityIndicator = `<div class="priority-indicator priority-${task.priority}"></div>`;
            }
            
          
            let categoryTag = '';
            if (task.category) {
                categoryTag = `<span class="category-tag category-${task.category}">${task.category}</span>`;
            }
            
        
            let dateDisplay = '';
            if (task.dueDate) {
                dateDisplay = `
                    <div class="task-date">
                        <i class="far fa-calendar-alt"></i> ${formatDate(task.dueDate)}
                    </div>
                `;
            }
            
            taskItem.innerHTML = `
                ${priorityIndicator}
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''}>
                <div class="task-content">
                    <span class="task-text">${task.text}</span>
                    <div class="task-meta">
                        ${dateDisplay}
                        ${task.category ? `
                            <div class="task-category">
                                <i class="fas fa-tag"></i> ${task.category}
                            </div>
                        ` : ''}
                    </div>
                </div>
                <div class="task-actions">
                    <button class="edit-btn"><i class="fas fa-edit"></i></button>
                    <button class="delete-btn"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            const checkbox = taskItem.querySelector('.task-checkbox');
            checkbox.addEventListener('change', () => toggleTaskStatus(task.id));
            
            const editBtn = taskItem.querySelector('.edit-btn');
            editBtn.addEventListener('click', () => editTask(task.id));
            
            const deleteBtn = taskItem.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
            
            taskList.appendChild(taskItem);
        });
    }
    

    function updateTasksCounter() {
        const remainingTasks = tasks.filter(task => !task.completed).length;
        tasksCounter.textContent = `${remainingTasks} tasks left`;
    }
    
 
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
 
    addButton.addEventListener('click', addOrUpdateTask);
    
    taskInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addOrUpdateTask();
        }
    });
    
    clearCompletedBtn.addEventListener('click', clearCompletedTasks);
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const filter = btn.getAttribute('data-filter');
            filterTasks(filter);
        });
    });
    
    if (categoryButtons) {
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const category = btn.getAttribute('data-category');
                filterByCategory(category);
            });
        });
    }
    

    const addNewCategory = function() {
        const newCategory = prompt('New category name:');
        if (!newCategory || newCategory.trim() === '') return;
     
        const categoryFilters = document.querySelector('.category-filters');
        if (!categoryFilters) return;
        
     
        const newCategoryBtn = document.createElement('button');
        newCategoryBtn.classList.add('category-btn');
        newCategoryBtn.setAttribute('data-category', newCategory.toLowerCase());
        newCategoryBtn.textContent = newCategory;
        
     
        categoryFilters.appendChild(newCategoryBtn);
        
     
        newCategoryBtn.addEventListener('click', () => {
            filterByCategory(newCategory.toLowerCase());
        });
        
      
        if (categorySelect) {
            const option = document.createElement('option');
            option.value = newCategory.toLowerCase();
            option.textContent = newCategory;
            categorySelect.appendChild(option);
        }
    };
    
  
    const addCategoryBtn = document.getElementById('add-category-btn');
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', addNewCategory);
    }
    
    const exportTasks = function() {
        const tasksJSON = JSON.stringify(tasks, null, 2);
        const blob = new Blob([tasksJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gorevler.json';
        document.body.appendChild(a);
        a.click();
        
   
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };
    

    const importTasks = function(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                if (Array.isArray(importedTasks)) {
                    if (confirm('Do you want to delete existing tasks and import new ones?')) {
                        tasks = importedTasks;
                    } else {
                        const maxId = Math.max(...tasks.map(task => task.id), 0);
                        const adjustedImportedTasks = importedTasks.map((task, index) => ({
                            ...task,
                            id: maxId + index + 1
                        }));
                        tasks = [...tasks, ...adjustedImportedTasks];
                    }
                    
                    saveTasks();
                    renderTasks();
                    updateTasksCounter();
                    alert('Tasks successfully imported!');
                } else {
                    alert('Invalid task file!');
                }
            } catch (error) {
                console.error('Import error:', error);
                alert('An error occurred while importing the file!');
            }
        };
        reader.readAsText(file);
    };
    
    let pomodoroTimer = null;
    let pomodoroMinutes = 25;
    let pomodoroSeconds = 0;
    let isPomodoroPaused = true;
    
    function startPomodoro() {
        if (pomodoroTimer) {
            clearInterval(pomodoroTimer);
        }
        
        isPomodoroPaused = false;
        const pomodoroDisplay = document.getElementById('pomodoro-display');
        
        pomodoroTimer = setInterval(() => {
            if (pomodoroSeconds === 0) {
                if (pomodoroMinutes === 0) {
                    clearInterval(pomodoroTimer);
                    isPomodoroPaused = true;
                    
                    if (Notification.permission === 'granted') {
                        new Notification('Pomodoro Completed!', {
                            body: 'You can take a short break now.',
                            icon: 'favicon.ico'
                        });
                    }
                    
                    const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-alarm-digital-clock-beep-989.mp3');
                    audio.play();
                    
                    return;
                }
                pomodoroMinutes--;
                pomodoroSeconds = 59;
            } else {
                pomodoroSeconds--;
            }
            
            if (pomodoroDisplay) {
                pomodoroDisplay.textContent = `${pomodoroMinutes.toString().padStart(2, '0')}:${pomodoroSeconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    function pausePomodoro() {
        if (pomodoroTimer) {
            clearInterval(pomodoroTimer);
            isPomodoroPaused = true;
        }
    }
    
    function resetPomodoro() {
        if (pomodoroTimer) {
            clearInterval(pomodoroTimer);
        }
        
        pomodoroMinutes = 25;
        pomodoroSeconds = 0;
        isPomodoroPaused = true;
        
        const pomodoroDisplay = document.getElementById('pomodoro-display');
        if (pomodoroDisplay) {
            pomodoroDisplay.textContent = '25:00';
        }
    }
    
    function requestNotificationPermission() {
        if (Notification && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
    }
    
    function checkTaskReminders() {
        if (Notification.permission !== 'granted') return;
        
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        
        const todayEnd = new Date(todayStart);
        todayEnd.setDate(todayEnd.getDate() + 1);
        
        const todayTasks = tasks.filter(task => {
            if (!task.completed && task.dueDate) {
                const dueDate = new Date(task.dueDate);
                return dueDate >= todayStart && dueDate < todayEnd;
            }
            return false;
        });
        
        if (todayTasks.length > 0) {
            new Notification('Tasks Due Today', {
                body: `You have ${todayTasks.length} tasks due today.`,
                icon: 'favicon.ico'
            });
        }
    }
    
    const exportBtn = document.getElementById('export-tasks-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportTasks);
    }
    
    const importInput = document.getElementById('import-tasks-input');
    if (importInput) {
        importInput.addEventListener('change', importTasks);
    }
    
    const importBtn = document.getElementById('import-tasks-btn');
    if (importBtn) {
        importBtn.addEventListener('click', () => {
            if (importInput) {
                importInput.click();
            }
        });
    }
    
    const startPomodoroBtn = document.getElementById('start-pomodoro-btn');
    if (startPomodoroBtn) {
        startPomodoroBtn.addEventListener('click', () => {
            if (isPomodoroPaused) {
                startPomodoro();
                startPomodoroBtn.innerHTML = '<i class="fas fa-pause"></i>';
            } else {
                pausePomodoro();
                startPomodoroBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
    }
    
    const resetPomodoroBtn = document.getElementById('reset-pomodoro-btn');
    if (resetPomodoroBtn) {
        resetPomodoroBtn.addEventListener('click', () => {
            resetPomodoro();
            if (startPomodoroBtn) {
                startPomodoroBtn.innerHTML = '<i class="fas fa-play"></i>';
            }
        });
    }
    
    requestNotificationPermission();
    checkTaskReminders();
    
    setInterval(checkTaskReminders, 3600000);
});
