// script.js

// Task management - initialize after DOM loaded to ensure elements exist
document.addEventListener('DOMContentLoaded', () => {
    const taskForm = document.getElementById('task-form');
    const taskInput = document.getElementById('task-input');
    const tasksTable = document.getElementById('tasks-table');
    const tasksTbody = document.getElementById('tasks-tbody');
    const addTaskBtn = document.getElementById('add-task-btn');
    const emptyState = document.getElementById('empty-state');
    const emptyAdd = document.getElementById('empty-add');
    const headerTotalTasks = document.getElementById('header-total-tasks');
    const headerTotalChecked = document.getElementById('header-total-checked');
    const headerSearch = document.getElementById('header-search');

    let tasks = [];
    const DEFAULT_CHECKBOXES = 30;

    function renderTasks() {
        const query = (headerSearch && headerSearch.value || '').trim().toLowerCase();
        const visible = tasks.filter(t => t.name.toLowerCase().includes(query));
        tasksTbody.innerHTML = '';

        // empty / filtered state
        if (visible.length === 0) {
            tasksTable.style.display = 'none';
            if (emptyState) emptyState.style.display = 'flex';
        } else {
            tasksTable.style.display = '';
            if (emptyState) emptyState.style.display = 'none';
        }

        visible.forEach((task, idx) => {
            if (!task.days) task.days = [];
            if (!task.count) task.count = DEFAULT_CHECKBOXES;
            const tr = document.createElement('tr');
            tr.className = 'task-row';

            // Task name cell (left)
            const nameTd = document.createElement('td');
            nameTd.className = 'task-name-cell';
            nameTd.textContent = task.name;
            tr.appendChild(nameTd);

            // Checkbox cells (middle)
            const cbTd = document.createElement('td');
            cbTd.className = 'task-checkbox-cell';
            const cbDiv = document.createElement('div');
            cbDiv.className = 'checkbox-grid';
            // render checkboxes horizontally
            for (let i = 0; i < task.count; i++) {
                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.checked = !!task.days[i];
                cb.title = `Day ${i + 1}`;
                cb.addEventListener('change', () => {
                    task.days[i] = cb.checked;
                    // update totals by re-rendering
                    renderTasks();
                });
                cbDiv.appendChild(cb);
            }

            // append compact +5 inside the checkbox area (looks like a pill)
            const addBtn = document.createElement('button');
            addBtn.textContent = '+5';
            addBtn.type = 'button';
            addBtn.className = 'add-five-btn';
            addBtn.setAttribute('aria-label', `Add 5 days to ${task.name}`);
            addBtn.addEventListener('click', () => {
                task.count += 5;
                // ensure the new inputs are visible after render
                renderTasks();
                // focus the newly added area (best-effort)
                requestAnimationFrame(() => {
                    const row = tasksTbody.children[idx];
                    if (row) row.querySelector('.checkbox-grid').scrollLeft = row.querySelector('.checkbox-grid').scrollWidth;
                });
            });

            cbDiv.appendChild(addBtn);
            cbTd.appendChild(cbDiv);
            tr.appendChild(cbTd);

            // Totals cell (right)
            const totalTd = document.createElement('td');
            totalTd.className = 'task-total-cell';
            const checkedCount = task.days.reduce((acc, v) => acc + (v ? 1 : 0), 0);
            const badge = document.createElement('div');
            badge.className = 'badge';
            badge.textContent = `${checkedCount} / ${task.count}`;
            totalTd.appendChild(badge);
            // trigger a small pulse animation on insert
            requestAnimationFrame(() => badge.classList.add('total-pulse'));
            setTimeout(() => badge.classList.remove('total-pulse'), 320);
            tr.appendChild(totalTd);

            // +5 button after totals
            const addBtnTd = document.createElement('td');
            const addBtn = document.createElement('button');
            addBtn.textContent = '+5';
            addBtn.type = 'button';
            addBtn.className = 'add-five-btn';
            addBtn.addEventListener('click', () => {
                task.count += 5;
                renderTasks();
            });
            addBtnTd.appendChild(addBtn);
            tr.appendChild(addBtnTd);

            tasksTbody.appendChild(tr);
        });

        // update header stats
        if (headerTotalTasks) headerTotalTasks.textContent = String(tasks.length);
        if (headerTotalChecked) headerTotalChecked.textContent = String(tasks.reduce((s, t) => s + (t.days ? t.days.filter(Boolean).length : 0), 0));
    }

    if (addTaskBtn && taskForm && taskInput) {
        addTaskBtn.addEventListener('click', () => {
            // show form below the controls
            taskForm.style.display = 'flex';
            taskInput.focus();
            addTaskBtn.style.display = 'none';
        });

        // empty-state add
        if (emptyAdd) emptyAdd.addEventListener('click', () => {
            taskForm.style.display = 'flex';
            taskInput.focus();
            if (addTaskBtn) addTaskBtn.style.display = 'none';
        });

        // search
        if (headerSearch) headerSearch.addEventListener('input', () => renderTasks());

        taskForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = taskInput.value.trim();
            if (name) {
                tasks.push({ name, days: [], count: DEFAULT_CHECKBOXES });
                taskInput.value = '';
                renderTasks();
                taskForm.style.display = 'none';
                addTaskBtn.style.display = 'block';
            }
        });
    } else {
        console.warn('Task form or add button not found in DOM');
    }

    renderTasks();
});
