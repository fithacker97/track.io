// script.js

document.addEventListener('DOMContentLoaded', () => {
    const navButtons = Array.from(document.querySelectorAll('.sidebar-nav .nav-btn, .mobile-bottom-nav .mobile-nav-btn'));
    const mainContent = document.querySelector('.main-area .content');
    const topbar = document.querySelector('.topbar');
    const storageKey = 'trackio.tasks.v2';
    const profileKey = 'trackio.profile.v1';
    const themeKey = 'trackio.theme.v1';
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const themes = ['current', 'light', 'black'];
    const FIRE_ICON = '\u{1F525}';
    const COIN_ICON = '\u{1FA99}';

    let tasks = loadTasks();
    let profile = loadProfile();
    let currentTabTitle = 'Overview';
    let insightsIntervalId = null;

    function applyTheme(themeName) {
        const selected = themes.includes(themeName) ? themeName : 'current';
        document.body.setAttribute('data-theme', selected);
        localStorage.setItem(themeKey, selected);

        if (!themeToggleBtn) return;
        const labelMap = { current: 'Current', light: 'Light', black: 'Black' };
        themeToggleBtn.setAttribute('title', `Theme: ${labelMap[selected]}`);
        themeToggleBtn.setAttribute('aria-label', `Theme: ${labelMap[selected]}`);
    }

    function cycleTheme() {
        const activeTheme = document.body.getAttribute('data-theme') || 'current';
        const currentIndex = themes.indexOf(activeTheme);
        const nextTheme = themes[(currentIndex + 1) % themes.length];
        applyTheme(nextTheme);
    }

    function bindGlobalTools() {
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', cycleTheme);
        }

        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                runLogout();
            });
        }

        if (topbar) {
            topbar.addEventListener('click', (e) => {
                const btn = e.target.closest('[data-topbar-tool]');
                if (!btn) return;
                const tool = btn.getAttribute('data-topbar-tool');
                if (tool === 'theme') cycleTheme();
                if (tool === 'logout') runLogout();
            });
        }
    }

    function runLogout() {
        localStorage.removeItem(storageKey);
        localStorage.removeItem(profileKey);
        alert('You have been logged out.');
        window.location.reload();
    }

    function loadTasks() {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length) {
                    return parsed.map(normalizeTask);
                }
            }
        } catch (e) {
            console.warn('Failed to load tasks:', e);
        }

        return [
            createTask('Morning Workout'),
            createTask('Read 20 Pages'),
            createTask('No Sugar Day')
        ];
    }

    function loadProfile() {
        try {
            const raw = localStorage.getItem(profileKey);
            if (raw) {
                const parsed = JSON.parse(raw);
                return {
                    wallet: Number.isFinite(parsed.wallet) ? parsed.wallet : 0,
                    claimedCheckCount: Number.isFinite(parsed.claimedCheckCount) ? parsed.claimedCheckCount : 0,
                    megaStreak: Number.isFinite(parsed.megaStreak) ? parsed.megaStreak : 0,
                    megaLastMarkAt: parsed.megaLastMarkAt || null,
                    megaLastCountedDay: parsed.megaLastCountedDay || null
                };
            }
        } catch (e) {
            console.warn('Failed to load profile:', e);
        }

        return { wallet: 0, claimedCheckCount: 0, megaStreak: 0, megaLastMarkAt: null, megaLastCountedDay: null };
    }

    function saveProfile() {
        localStorage.setItem(profileKey, JSON.stringify(profile));
    }

    function saveTasks() {
        localStorage.setItem(storageKey, JSON.stringify(tasks));
    }

    function normalizeTask(input) {
        const task = {
            id: input.id || `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name: input.name || 'Untitled Task',
            createdAt: input.createdAt || new Date().toISOString(),
            lastCheckedAt: input.lastCheckedAt || null,
            days: Array.isArray(input.days) ? input.days : []
        };

        // Keep exactly 30 upcoming days in task model.
        task.days = ensureRolling30Days(task.days);
        return task;
    }

    function createTask(name) {
        return {
            id: `task-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
            name,
            createdAt: new Date().toISOString(),
            lastCheckedAt: null,
            days: buildNext30Days()
        };
    }

    function dayKey(dateObj) {
        return `${dateObj.getFullYear()}-${dateObj.getMonth()}-${dateObj.getDate()}`;
    }

    function buildNext30Days() {
        const list = [];
        const start = new Date();
        start.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i += 1) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            list.push({ key: dayKey(d), done: false, checkedAt: null });
        }

        return list;
    }

    function ensureRolling30Days(existingDays) {
        const mapped = new Map();
        existingDays.forEach((d) => {
            if (d && d.key) {
                mapped.set(d.key, {
                    done: !!d.done,
                    checkedAt: d.checkedAt || null
                });
            }
        });

        return buildNext30Days().map((d) => {
            const saved = mapped.get(d.key);
            if (!saved) return d;
            return {
                key: d.key,
                done: saved.done,
                checkedAt: saved.checkedAt
            };
        });
    }

    function keyToDate(key) {
        const [y, m, d] = key.split('-').map(Number);
        return new Date(y, m, d);
    }

    function formatMonth(d) {
        return d.toLocaleDateString('en-US', { month: 'short' });
    }

    function streakInfo(task) {
        if (!task.lastCheckedAt) {
            return { state: 'idle', label: `${FIRE_ICON} 0` };
        }

        const last = new Date(task.lastCheckedAt).getTime();
        const now = Date.now();
        const hoursSince = (now - last) / (1000 * 60 * 60);

        const streakDays = consecutiveDaysFromLastCheck(task);

        if (hoursSince > 24) {
            return { state: 'broken', label: `${FIRE_ICON} Broken` };
        }

        return { state: 'active', label: `${FIRE_ICON} ${streakDays}` };
    }

    function consecutiveDaysFromLastCheck(task) {
        if (!task.lastCheckedAt) return 0;

        const checkedDates = new Set(
            task.days.filter((d) => d.done).map((d) => dayKey(keyToDate(d.key)))
        );

        let count = 0;
        const cursor = new Date(task.lastCheckedAt);
        cursor.setHours(0, 0, 0, 0);

        while (checkedDates.has(dayKey(cursor))) {
            count += 1;
            cursor.setDate(cursor.getDate() - 1);
        }

        return count;
    }

    function renderTasks() {
        tasks = tasks.map((t) => normalizeTask(t));
        saveTasks();

        mainContent.innerHTML = `
            <section class="tasks-panel task-hub-panel">
                <div class="task-hub-header">
                    <button class="task-plus-center" type="button" id="taskAddBtn" aria-label="Add task">+</button>
                </div>

                <form class="task-inline-add hidden" id="taskInlineAdd">
                    <input id="taskNameInput" type="text" maxlength="60" placeholder="Add a task to track" aria-label="Task name" />
                    <button type="submit" class="task-inline-submit">Add</button>
                    <button type="button" id="taskInlineCancel" class="task-inline-cancel">Cancel</button>
                </form>

                <div class="task-hub-list" id="taskHubList"></div>
            </section>
        `;

        const list = document.getElementById('taskHubList');
        tasks.forEach((task) => {
            list.insertAdjacentHTML('beforeend', renderTaskRow(task));
        });

        wireTaskEvents();
    }

    function completedChecksCount() {
        return tasks.reduce((sum, task) => sum + task.days.filter((d) => d.done).length, 0);
    }

    function todayKey() {
        return dayKey(new Date());
    }

    function taskDoneForKey(task, key) {
        const day = task.days.find((d) => d.key === key);
        return !!(day && day.done);
    }

    function allTasksDoneToday() {
        if (tasks.length === 0) return false;
        const key = todayKey();
        return tasks.every((task) => taskDoneForKey(task, key));
    }

    function updateMegaStreakState() {
        const now = new Date();
        const nowMs = now.getTime();
        const today = dayKey(now);
        const lastMs = profile.megaLastMarkAt ? new Date(profile.megaLastMarkAt).getTime() : null;
        const missedWindow = lastMs ? (nowMs - lastMs) > (24 * 60 * 60 * 1000) : false;

        if (allTasksDoneToday()) {
            if (profile.megaLastCountedDay !== today) {
                if (!profile.megaLastMarkAt || missedWindow) {
                    profile.megaStreak = 1;
                } else {
                    profile.megaStreak = Math.max(0, profile.megaStreak) + 1;
                }
                profile.megaLastCountedDay = today;
            }
            profile.megaLastMarkAt = now.toISOString();
        } else if (missedWindow) {
            profile.megaStreak = 0;
            profile.megaLastCountedDay = null;
        }

        saveProfile();
    }

    function renderTopbar(title) {
        if (title) currentTabTitle = title;
        updateMegaStreakState();

        const earned = completedChecksCount();
        const mega = profile.megaStreak || 0;

        if (!topbar) return;
        topbar.innerHTML = `
            <div class="topbar-mobile-brand" aria-hidden="true"><span>T</span></div>
            <div class="topbar-left">
                <h2 class="top-title">${currentTabTitle}</h2>
                <span class="top-sub">Daily consistency system for streaks and reward coins</span>
            </div>
            <div class="topbar-right topbar-metrics">
                <div class="metric-pill metric-streak">
                    <span class="metric-label">Mega Streak</span>
                    <strong>${FIRE_ICON} ${mega}</strong>
                </div>
                <div class="metric-pill metric-coins">
                    <span class="metric-label">Total Coins Earned</span>
                    <strong>${COIN_ICON} ${earned}</strong>
                </div>
                <div class="topbar-mobile-tools">
                    <button class="metric-tool-btn" type="button" data-topbar-tool="theme" aria-label="Change theme">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M12 3V5M12 19V21M5.64 5.64L7.05 7.05M16.95 16.95L18.36 18.36M3 12H5M19 12H21M5.64 18.36L7.05 16.95M16.95 7.05L18.36 5.64" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.6"/>
                        </svg>
                    </button>
                    <button class="metric-tool-btn" type="button" data-topbar-tool="logout" aria-label="Log out">
                        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                            <path d="M14 7V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                            <path d="M10 12h10m0 0-3-3m3 3-3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </button>
                </div>
            </div>
        `;
    }

    function clearInsightsRealtime() {
        if (insightsIntervalId) {
            clearInterval(insightsIntervalId);
            insightsIntervalId = null;
        }
    }

    function unclaimedCoins() {
        const completed = completedChecksCount();
        return Math.max(0, completed - profile.claimedCheckCount);
    }

    function lastNDays(n) {
        const arr = [];
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        for (let i = n - 1; i >= 0; i -= 1) {
            const d = new Date(now);
            d.setDate(now.getDate() - i);
            arr.push(d);
        }
        return arr;
    }

    function formatDayShort(dateObj) {
        return dateObj.toLocaleDateString('en-US', { weekday: 'short' });
    }

    function analyticsSnapshot() {
        const totalTasks = tasks.length;
        const expected = Math.max(1, totalTasks * 30);
        const doneChecks = completedChecksCount();
        const completionRate = Math.round((doneChecks / expected) * 100);
        const todayDoneCount = tasks.filter((task) => taskDoneForKey(task, todayKey())).length;
        const todayRate = totalTasks === 0 ? 0 : Math.round((todayDoneCount / totalTasks) * 100);
        const active = tasks.filter((task) => streakInfo(task).state === 'active').length;
        const broken = tasks.filter((task) => streakInfo(task).state === 'broken').length;
        const idle = Math.max(0, totalTasks - active - broken);

        const doneByDay = new Map();
        tasks.forEach((task) => {
            task.days.forEach((day) => {
                if (!day.done) return;
                const key = day.checkedAt ? dayKey(new Date(day.checkedAt)) : day.key;
                doneByDay.set(key, (doneByDay.get(key) || 0) + 1);
            });
        });

        const daySeries = lastNDays(30).map((d) => {
            const key = dayKey(d);
            const done = doneByDay.get(key) || 0;
            const rate = totalTasks === 0 ? 0 : (done / totalTasks) * 100;
            return { key, done, rate, label: `${d.getMonth() + 1}/${d.getDate()}`, date: d };
        });

        const weekdayBuckets = Array.from({ length: 7 }, (_, i) => ({ idx: i, sum: 0, count: 0 }));
        daySeries.forEach((point) => {
            const idx = point.date.getDay();
            weekdayBuckets[idx].sum += point.rate;
            weekdayBuckets[idx].count += 1;
        });
        const weekdayRates = weekdayBuckets.map((b) => (b.count ? Math.round(b.sum / b.count) : 0));

        const topTasks = tasks
            .map((task) => {
                const done = task.days.filter((d) => d.done).length;
                return {
                    name: task.name,
                    done,
                    rate: Math.round((done / 30) * 100),
                    state: streakInfo(task).state
                };
            })
            .sort((a, b) => b.rate - a.rate)
            .slice(0, 6);

        const consistencyScore = Math.round((completionRate * 0.65) + (todayRate * 0.35));

        return {
            totalTasks,
            doneChecks,
            completionRate,
            todayRate,
            active,
            broken,
            idle,
            daySeries,
            weekdayRates,
            topTasks,
            consistencyScore
        };
    }

    function buildLinePath(values, width, height, pad) {
        const max = Math.max(1, ...values);
        const min = Math.min(0, ...values);
        const innerW = width - pad * 2;
        const innerH = height - pad * 2;
        return values.map((v, i) => {
            const x = pad + (i / Math.max(1, values.length - 1)) * innerW;
            const y = pad + ((max - v) / Math.max(1, max - min)) * innerH;
            return `${x.toFixed(2)},${y.toFixed(2)}`;
        }).join(' ');
    }

    function buildAreaPath(values, width, height, pad) {
        const line = buildLinePath(values, width, height, pad);
        const firstX = pad;
        const lastX = width - pad;
        const baseY = height - pad;
        return `M ${firstX} ${baseY} L ${line.replace(/,/g, ' L ').replace(/\s+/g, ' L ')} L ${lastX} ${baseY} Z`;
    }

    function renderInsights() {
        tasks = tasks.map((t) => normalizeTask(t));
        saveTasks();
        clearInsightsRealtime();

        const data = analyticsSnapshot();
        const calendarYear = new Date().getFullYear();
        const indiaCalendar = buildIndiaCalendar(calendarYear);
        const lineValues = data.daySeries.map((p) => Math.round(p.rate));
        const linePoints = buildLinePath(lineValues, 760, 220, 18);
        const areaPath = buildAreaPath(lineValues, 760, 220, 18);

        const bars = data.weekdayRates.map((rate, idx) => {
            const h = Math.max(6, Math.round((rate / 100) * 120));
            return `
                <div class="insight-bar-wrap">
                    <div class="insight-bar" style="height:${h}px"></div>
                    <span>${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][idx]}</span>
                </div>
            `;
        }).join('');

        const tasksTable = data.topTasks.map((t) => `
            <div class="insight-task-row">
                <span class="insight-task-name">${t.name}</span>
                <span class="insight-task-rate">${t.rate}%</span>
                <span class="insight-task-done">${t.done}/30</span>
            </div>
        `).join('');

        mainContent.innerHTML = `
            <section class="tasks-panel insights-pro-panel">
                <div class="insights-head">
                    <div>
                        <h2>Advanced Analytics</h2>
                        <p>Real-time signals across consistency, progress velocity, and streak health.</p>
                    </div>
                    <div class="insights-live" id="insightsLiveStamp">Live sync: just now</div>
                </div>

                <div class="insight-kpis">
                    <article class="insight-kpi"><span>Consistency Score</span><strong id="liveConsistency">${data.consistencyScore}%</strong></article>
                    <article class="insight-kpi"><span>Completion Rate</span><strong>${data.completionRate}%</strong></article>
                    <article class="insight-kpi"><span>Today Coverage</span><strong>${data.todayRate}%</strong></article>
                    <article class="insight-kpi"><span>Active Streaks</span><strong>${data.active}</strong></article>
                    <article class="insight-kpi"><span>Broken Streaks</span><strong>${data.broken}</strong></article>
                    <article class="insight-kpi"><span>Total Checks</span><strong>${data.doneChecks}</strong></article>
                </div>

                <div class="insight-main-grid">
                    <article class="insight-card insight-line-card">
                        <h3>30-Day Consistency Trend</h3>
                        <svg viewBox="0 0 760 220" class="insight-line-svg" aria-hidden="true">
                            <defs>
                                <linearGradient id="insightArea" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#66dcff" stop-opacity="0.5"></stop>
                                    <stop offset="100%" stop-color="#66dcff" stop-opacity="0.03"></stop>
                                </linearGradient>
                            </defs>
                            <path d="${areaPath}" fill="url(#insightArea)"></path>
                            <polyline points="${linePoints}" fill="none" stroke="#5ed4ff" stroke-width="3"></polyline>
                        </svg>
                    </article>

                    <article class="insight-card insight-week-card">
                        <h3>Weekday Performance</h3>
                        <div class="insight-bars">${bars}</div>
                    </article>
                </div>

                <div class="insight-bottom-grid">
                    <article class="insight-card">
                        <h3>Top Task Progress</h3>
                        <div class="insight-task-table">
                            <div class="insight-task-row head">
                                <span>Task</span>
                                <span>Rate</span>
                                <span>Checks</span>
                            </div>
                            ${tasksTable || '<div class="insight-empty">Add tasks to see ranked analytics.</div>'}
                        </div>
                    </article>

                    <article class="insight-card insight-realtime-card">
                        <h3>Real-Time Focus Pulse</h3>
                        <div class="pulse-row">
                            <span>Current pulse</span>
                            <strong id="pulseValue">${Math.max(35, data.consistencyScore)}</strong>
                        </div>
                        <svg viewBox="0 0 320 90" class="pulse-svg" aria-hidden="true">
                            <polyline id="pulseLine" points="10,65 40,54 70,58 100,44 130,48 160,42 190,46 220,40 250,45 280,41 310,44" fill="none" stroke="#8ae7ff" stroke-width="3"></polyline>
                        </svg>
                        <p>This pulse updates every 2 seconds and reacts to your current completion behavior.</p>
                    </article>
                </div>

                <div class="insight-calendar-grid">
                    <article class="insight-card india-calendar-card">
                        <div class="calendar-head">
                            <h3>India Yearly Festival Calendar ${calendarYear}</h3>
                            <span class="calendar-note">Major holidays and festivals</span>
                        </div>
                        <div class="year-month-grid">
                            ${indiaCalendar.monthCards}
                        </div>
                    </article>

                    <article class="insight-card india-holiday-list-card">
                        <h3>India Holiday List ${calendarYear}</h3>
                        <ul class="holiday-list">
                            ${indiaCalendar.holidayRows}
                        </ul>
                    </article>
                </div>
            </section>
        `;

        let pulse = Math.max(35, data.consistencyScore);
        const series = [65, 54, 58, 44, 48, 42, 46, 40, 45, 41, 44];
        insightsIntervalId = window.setInterval(() => {
            const drift = (Math.random() * 8) - 4;
            pulse = Math.max(18, Math.min(100, Math.round(pulse + drift)));
            const liveConsistency = document.getElementById('liveConsistency');
            const pulseValue = document.getElementById('pulseValue');
            const pulseLine = document.getElementById('pulseLine');
            const stamp = document.getElementById('insightsLiveStamp');

            if (liveConsistency) liveConsistency.textContent = `${pulse}%`;
            if (pulseValue) pulseValue.textContent = `${pulse}`;
            if (stamp) stamp.textContent = `Live sync: ${new Date().toLocaleTimeString()}`;

            series.shift();
            series.push(Math.max(20, Math.min(80, 80 - pulse + Math.round(Math.random() * 8))));
            if (pulseLine) {
                const pts = series.map((v, i) => `${10 + (i * 30)},${v}`).join(' ');
                pulseLine.setAttribute('points', pts);
            }
        }, 2000);
    }

    function renderOverview() {
        tasks = tasks.map((t) => normalizeTask(t));
        saveTasks();

        const totalTasks = tasks.length;
        const totalChecks = completedChecksCount();
        const coinsReady = unclaimedCoins();
        const activeStreaks = tasks.filter((task) => streakInfo(task).state === 'active').length;
        const brokenStreaks = tasks.filter((task) => streakInfo(task).state === 'broken').length;

        mainContent.innerHTML = `
            <section class="tasks-panel overview-panel overview-v2">
                <div class="overview-hero">
                    <p class="overview-kicker">Tracker Overview</p>
                    <h2>Build routines that actually stick</h2>
                    <p class="overview-copy">
                        This app is built for daily consistency. Add any habit or goal, tick each day as completed, and keep your streak alive by checking in within 24 hours.
                        You can see your progress, recover focus fast, and convert activity into reward coins.
                    </p>
                    <div class="overview-stat-strip">
                        <div class="overview-stat-pill"><strong>${totalTasks}</strong><span>Total Tasks</span></div>
                        <div class="overview-stat-pill"><strong>${totalChecks}</strong><span>Total Checks</span></div>
                        <div class="overview-stat-pill"><strong>${activeStreaks}</strong><span>Active Streaks</span></div>
                        <div class="overview-stat-pill"><strong>${brokenStreaks}</strong><span>Broken Streaks</span></div>
                    </div>
                </div>

                <div class="overview-feature-grid">
                    <article class="overview-feature feature-workflow">
                        <h3>How The System Works</h3>
                        <p>
                            Create a task once and Tracker prepares a rolling 30-day checkboard. Every completed day pushes your streak forward.
                            If more than 24 hours pass without a fresh check, the streak breaks and the status updates automatically.
                        </p>
                        <p>
                            The model is simple on purpose: clear daily action, visible progress, and instant feedback so you always know where you stand.
                        </p>
                    </article>

                    <article class="overview-feature feature-premium">
                        <h3>What You Get In Premium</h3>
                        <p>
                            Premium is for users tracking multiple routines seriously. It unlocks unlimited task planning, deeper streak analytics,
                            reminder automations, and richer history views so you can see patterns and improve weak periods.
                        </p>
                        <button class="overview-btn ghost" id="premiumInfoBtn">View Premium</button>
                    </article>

                    <article class="overview-feature feature-coins">
                        <h3>Track Coins And Claiming</h3>
                        <p>
                            You earn <strong>1 Track Coin</strong> for each completed daily checkbox. Coins stay in a claimable pool until you press claim.
                            This keeps rewards transparent and gives you control over when to settle progress into your wallet.
                        </p>
                        <div class="coin-metrics">
                            <div class="coin-box"><span>Wallet</span><strong>${profile.wallet}</strong></div>
                            <div class="coin-box"><span>Ready To Claim</span><strong>${coinsReady}</strong></div>
                        </div>
                        <button class="overview-btn" id="claimCoinsBtn" ${coinsReady === 0 ? 'disabled' : ''}>Claim Coins</button>
                    </article>
                </div>
            </section>
        `;

        const claimBtn = document.getElementById('claimCoinsBtn');
        if (claimBtn) {
            claimBtn.addEventListener('click', () => {
                const ready = unclaimedCoins();
                if (ready <= 0) return;
                profile.wallet += ready;
                profile.claimedCheckCount = completedChecksCount();
                saveProfile();
                renderTopbar('Overview');
                renderOverview();
            });
        }

        const premiumBtn = document.getElementById('premiumInfoBtn');
        if (premiumBtn) {
            premiumBtn.addEventListener('click', () => {
                alert('Premium gives unlimited tasks, deeper analytics, and reminder automation.');
            });
        }
    }

    function renderTaskRow(task) {
        const streak = streakInfo(task);

        return `
            <article class="task-hub-row" data-task-id="${task.id}">
                <div class="task-hub-main">
                    <div class="task-hub-topline">
                        <h3 class="task-hub-name">${task.name}</h3>
                        <span class="task-streak ${streak.state}">${streak.label}</span>
                        <button class="task-delete-btn" type="button" aria-label="Delete task" title="Delete task">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                <path d="M3 6h18m-2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m-6 5v6m4-6v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>
                        </button>
                    </div>

                    <div class="task-days-row">
                        ${task.days.map((d) => {
                            const dt = keyToDate(d.key);
                            return `
                                <label class="day-check-pill" title="${dt.toDateString()}">
                                    <input type="checkbox" class="day-check" data-day-key="${d.key}" ${d.done ? 'checked' : ''}>
                                    <span class="day-pill-core">
                                        <strong>${dt.getDate()}</strong>
                                        <small>${formatMonth(dt)}</small>
                                    </span>
                                </label>
                            `;
                        }).join('')}
                    </div>
                </div>
            </article>
        `;
    }

    function updateStreakMeta(task) {
        const checkedTimes = task.days
            .filter((d) => d.done)
            .map((d) => {
                if (d.checkedAt) return new Date(d.checkedAt).getTime();
                return keyToDate(d.key).getTime();
            });

        if (checkedTimes.length === 0) {
            task.lastCheckedAt = null;
            return;
        }

        task.lastCheckedAt = new Date(Math.max(...checkedTimes)).toISOString();
    }

    function refreshRow(row, task) {
        const streakEl = row.querySelector('.task-streak');

        const streak = streakInfo(task);
        if (streakEl) {
            streakEl.className = `task-streak ${streak.state}`;
            streakEl.textContent = streak.label;
        }
    }

    function wireTaskEvents() {
        const list = document.getElementById('taskHubList');
        const addBtn = document.getElementById('taskAddBtn');
        const inlineForm = document.getElementById('taskInlineAdd');
        const input = document.getElementById('taskNameInput');
        const cancelBtn = document.getElementById('taskInlineCancel');

        if (addBtn && inlineForm && input) {
            addBtn.addEventListener('click', () => {
                inlineForm.classList.toggle('hidden');
                if (!inlineForm.classList.contains('hidden')) input.focus();
            });
        }

        if (cancelBtn && inlineForm && input) {
            cancelBtn.addEventListener('click', () => {
                inlineForm.classList.add('hidden');
                input.value = '';
            });
        }

        if (inlineForm && input && list) {
            inlineForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const name = input.value.trim();
                if (!name) return;

                const task = createTask(name);
                tasks.push(task);
                saveTasks();

                list.insertAdjacentHTML('beforeend', renderTaskRow(task));
                input.value = '';
                inlineForm.classList.add('hidden');
                renderTopbar(currentTabTitle);
            });
        }

        if (list) {
            list.addEventListener('click', (event) => {
                const target = event.target.closest('.task-delete-btn');
                if (!target) return;

                const row = target.closest('.task-hub-row');
                if (!row) return;

                const taskId = row.dataset.taskId;
                if (!confirm('Are you sure you want to delete this task?')) return;

                tasks = tasks.filter((t) => t.id !== taskId);
                saveTasks();
                row.remove();
                renderTopbar(currentTabTitle);
            });

            list.addEventListener('change', (event) => {
                const target = event.target;
                const row = target.closest('.task-hub-row');
                if (!row) return;

                const taskId = row.dataset.taskId;
                const task = tasks.find((t) => t.id === taskId);
                if (!task) return;

                if (target.classList.contains('day-check')) {
                    const key = target.dataset.dayKey;
                    const day = task.days.find((d) => d.key === key);
                    if (day) {
                        day.done = target.checked;
                        day.checkedAt = target.checked ? new Date().toISOString() : null;
                    }
                }

                updateStreakMeta(task);
                refreshRow(row, task);
                saveTasks();
                renderTopbar(currentTabTitle);
            });
        }
    }

    function renderPlaceholder(title) {
        clearInsightsRealtime();
        mainContent.innerHTML = `
            <section class="tasks-panel placeholder-panel">
                <div class="panel-inner">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                        <h3 style="margin:0; color:var(--text-primary)">${title}</h3>
                        <div class="status-badge">Under progress</div>
                    </div>
                    <p style="color:var(--text-secondary); margin-top:10px">This area is being redesigned. Open the Tasks tab to use the daily tracker.</p>
                </div>
            </section>
        `;
    }

    function tabTitle(tabKey) {
        const key = (tabKey || '').toLowerCase();
        if (key === 'overview') return 'Overview';
        if (key === 'tasks') return 'Tasks';
        if (key === 'insights') return 'Insights';
        return 'Overview';
    }

    function renderTab(tabKey, title) {
        renderTopbar(title);

        if ((tabKey || '').toLowerCase() === 'overview') {
            clearInsightsRealtime();
            renderOverview();
            return;
        }

        if ((tabKey || '').toLowerCase() === 'tasks') {
            clearInsightsRealtime();
            renderTasks();
            return;
        }

        if ((tabKey || '').toLowerCase() === 'insights') {
            renderInsights();
            return;
        }

        renderPlaceholder(title);
    }

    function setActive(tabKey) {
        const key = (tabKey || '').toLowerCase();
        navButtons.forEach((b) => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');

            const bKey = (b.dataset.tab || '').toLowerCase();
            if (bKey === key) {
                b.classList.add('active');
                b.setAttribute('aria-pressed', 'true');
            }
        });
    }

    navButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            setActive(tab);
            renderTab(tab, tabTitle(tab));
        });

        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    applyTheme(localStorage.getItem(themeKey) || 'current');
    bindGlobalTools();

    const active = document.querySelector('.sidebar-nav .nav-btn.active');
    if (active) {
        const tab = active.dataset.tab;
        setActive(tab);
        renderTab(tab, tabTitle(tab));
    }
});

