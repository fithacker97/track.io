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

let tasks = [];
const DEFAULT_CHECKBOXES = 30;

function renderTasks() {
    tasksTbody.innerHTML = '';
    tasks.forEach((task, idx) => {
        if (!task.days) task.days = [];
        if (!task.count) task.count = DEFAULT_CHECKBOXES;
        const tr = document.createElement('tr');
        tr.className = 'task-row';
        // Task name cell (left)
        const nameTd = document.createElement('td');
        nameTd.className = 'task-name-cell';
        nameTd.textContent = task.name;
        tr.appendChild(nameTd);
        // Checkbox cells (right)
        const cbTd = document.createElement('td');
        const cbDiv = document.createElement('div');
        cbDiv.className = 'task-checkboxes';
        for (let i = 0; i < task.count; i++) {
            const cb = document.createElement('input');
            cb.type = 'checkbox';
            cb.checked = !!task.days[i];
            cb.title = `Day ${i + 1}`;
            cb.addEventListener('change', () => {
                task.days[i] = cb.checked;
            });
            cbDiv.appendChild(cb);
        }
        // +5 button
        const addBtn = document.createElement('button');
        addBtn.textContent = '+5';
        addBtn.type = 'button';
        addBtn.className = 'add-five-btn';
        addBtn.addEventListener('click', () => {
            task.count += 5;
            renderTasks();
        });
        cbDiv.appendChild(addBtn);
        cbTd.appendChild(cbDiv);
        tr.appendChild(cbTd);
        tasksTbody.appendChild(tr);
    });
}

taskForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = taskInput.value.trim();
    if (name) {
        tasks.push({ name, days: [], count: DEFAULT_CHECKBOXES });
        taskInput.value = '';
        renderTasks();
    }
});

renderTasks();
