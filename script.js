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
const tasksTable = document.getElementById('tasks-table');
const tasksTbody = document.getElementById('tasks-tbody');
const dateHeader = document.getElementById('date-header');

let tasks = [];

// Show today's date in header
const today = new Date();
const todayDayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
dateHeader.textContent = `${today.toLocaleDateString()} (Day ${todayDayOfYear})`;

function renderTasks() {
    tasksTbody.innerHTML = '';
    tasks.forEach((task, idx) => {
        const tr = document.createElement('tr');
        tr.className = 'task-row';
        // Task name cell
        const nameTd = document.createElement('td');
        nameTd.className = 'task-name-cell';
        nameTd.textContent = task.name;
        tr.appendChild(nameTd);
        // Checkbox cell for today only
        const cbTd = document.createElement('td');
        cbTd.className = 'task-checkbox-cell';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.checked = !!task.days[todayDayOfYear];
        cb.title = `Done for ${today.toLocaleDateString()}`;
        cb.addEventListener('change', () => {
            task.days[todayDayOfYear] = cb.checked;
        });
        cbTd.appendChild(cb);
        tr.appendChild(cbTd);
        tasksTbody.appendChild(tr);
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
