// script.js
// Generate days for the current year
const daysGrid = document.getElementById('days-grid');
const year = new Date().getFullYear();
const daysInYear = (y) => ((y % 4 === 0 && y % 100 !== 0) || (y % 400 === 0)) ? 366 : 365;

function createYearGrid() {
    daysGrid.innerHTML = '';
    for (let d = 1; d <= daysInYear(year); d++) {
        const cell = document.createElement('div');
        cell.className = 'day-cell';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.dataset.day = d;
        checkbox.title = `Day ${d}`;
        cell.appendChild(checkbox);
        daysGrid.appendChild(cell);
    }
}

createYearGrid();

// Task management
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const tasksList = document.getElementById('tasks-list');

let tasks = [];

function renderTasks() {
    tasksList.innerHTML = '';
    tasks.forEach((task, idx) => {
        const li = document.createElement('li');
        li.className = 'task-item';
        const label = document.createElement('span');
        label.className = 'task-label';
        label.textContent = task.name;
        li.appendChild(label);
        // Daily checkboxes for this task
        const checkboxes = document.createElement('div');
        checkboxes.className = 'task-checkboxes';
        for (let d = 1; d <= daysInYear(year); d++) {
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!task.days[d];
            cb.title = `Day ${d}`;
            cb.addEventListener('change', () => {
                task.days[d] = cb.checked;
            });
            checkboxes.appendChild(cb);
            if (d > 7) break; // Only show first 7 days for demo, remove for full year
        }
        li.appendChild(checkboxes);
        tasksList.appendChild(li);
    });
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = taskInput.value.trim();
    if (name) {
        tasks.push({ name, days: {} });
        taskInput.value = '';
        renderTasks();
    }
});

renderTasks();
