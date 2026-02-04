// script.js

// Tasks have been removed from the UI for redesign.
// Leave a small stub to avoid runtime errors if the script is still included.
document.addEventListener('DOMContentLoaded', () => {
    console.info('Tab switcher active: sidebar nav will update main content.');

    const navButtons = Array.from(document.querySelectorAll('.sidebar-nav .nav-btn'));
    const mainContent = document.querySelector('.main-area .content');

    function renderPlaceholder(title) {
        // Special case: Insights - render dummy charts
        if ((title || '').toLowerCase() === 'insights') {
            mainContent.innerHTML = `
                <section class="tasks-panel placeholder-panel">
                    <div class="panel-inner">
                        <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                            <h3 style="margin:0; color:var(--text-primary)">Insights</h3>
                            <div class="status-badge">Under progress</div>
                        </div>
                        <p style="color:var(--text-secondary); margin-top:10px">A quick preview of metrics and trends.</p>

                        <div class="insights-grid">
                            <div class="chart-card">
                                <div class="chart-title">Weekly Completions</div>
                                <svg class="chart-svg" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                                    <!-- simple bar chart: 7 bars -->
                                    ${[5,12,9,15,8,18,14].map((v,i)=>{
                                        const bw=10; const x= i*bw + 6; const h = (v/20)*34; const y=36-h; return `<rect x="${x}" y="${y}" width="6" height="${h}" rx="1" fill="url(#barGrad)"/>`;
                                    }).join('')}
                                    <defs>
                                        <linearGradient id="barGrad" x1="0" x2="0" y1="0" y2="1">
                                    <div class="chart-card">
                                        <div class="chart-title">Quick Stats</div>
                                        <div class="insight-stats">
                                            <div class="stat-block"><div class="value">24</div><div class="label">Active Tasks</div></div>
                                            <div class="stat-block"><div class="value">154</div><div class="label">Completions</div></div>
                                            <div class="stat-block"><div class="value">6d</div><div class="label">Avg Streak</div></div>
                                        </div>
                                        <div class="top-tasks">
                                            <div class="chart-title" style="margin-top:12px">Top Tasks</div>
                                            ${[
                                                {name:'Read 20 pages',pct:82},
                                                {name:'Exercise',pct:68},
                                                {name:'Meditate',pct:44},
                                                {name:'Write Journal',pct:30}
                                            ].map(t=>`<div class="task-progress"><div class="name">${t.name}</div><div class="bar"><i style="width:${t.pct}%"></i></div><div style="width:36px;text-align:right;color:var(--text-secondary);font-weight:700">${t.pct}%</div></div>`).join('')}
                                        </div>
                                    </div>
                                </div>

                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:16px; margin-top:16px">
                                    <div class="chart-card">
                                        <div class="chart-title">Recent Activity</div>
                                        <div class="activity-list">
                                            <div class="activity-item"><div class="activity-dot"></div><div><div class="message">Completed <strong>Exercise</strong></div><div style="color:var(--text-secondary);font-size:0.85rem">2 hours ago</div></div></div>
                                            <div class="activity-item"><div class="activity-dot" style="background:#5B3BE6"></div><div><div class="message">Added new task <strong>Read 20 pages</strong></div><div style="color:var(--text-secondary);font-size:0.85rem">Yesterday</div></div></div>
                                            <div class="activity-item"><div class="activity-dot" style="background:#F59E0B"></div><div><div class="message">Missed <strong>Meditate</strong></div><div style="color:var(--text-secondary);font-size:0.85rem">3 days ago</div></div></div>
                                        </div>
                                    </div>

                                    <div class="chart-card">
                                        <div class="chart-title">Activity Heatmap</div>
                                        <div class="heatmap">
                                            ${[0,1,2,3,4,2,1].map(v=>`<div class="cell heat-${v}"><i></i></div>`).join('')}
                                        </div>
                                    </div>
                                </div>
                                <div class="chart-title">30-Day Streak</div>
                                <svg class="chart-svg" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
                                    <!-- simple area/line chart -->
                                    <polyline fill="none" stroke="#7C5CFF" stroke-width="1.6" points="0,28 6,24 12,20 18,18 24,16 30,18 36,14 42,12 48,10 54,12 60,8 66,6 72,8 78,7 84,6 90,4 96,6 100,5" />
                                    <polyline fill="rgba(124,92,255,0.08)" stroke="none" points="0,28 6,24 12,20 18,18 24,16 30,18 36,14 42,12 48,10 54,12 60,8 66,6 72,8 78,7 84,6 90,4 96,6 100,5 100,40 0,40" />
                                </svg>
                            </div>

                            <div class="chart-card">
                                <div class="chart-title">Completion Rate</div>
                                <div style="display:flex; align-items:center; gap:12px">
                                    <svg width="80" height="80" viewBox="0 0 36 36" aria-hidden="true">
                                        <path d="M18 2.0845
                                          a 15.9155 15.9155 0 0 1 0 31.831
                                          a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e6eef8" stroke-width="2"/>
                                        <path d="M18 2.0845
                                          a 15.9155 15.9155 0 0 1 0 31.831"
                                          fill="none" stroke="#7C5CFF" stroke-width="2" stroke-dasharray="75 100" stroke-linecap="round" transform="rotate(-90 18 18)"/>
                                        <text x="18" y="20" font-size="6" text-anchor="middle" fill="white" font-weight="700">72%</text>
                                    </svg>
                                    <div>
                                        <div style="font-weight:800; color:var(--text-primary);">72% overall</div>
                                        <div style="color:var(--text-secondary); font-size:0.9rem">Completed checks vs expected</div>
                                    </div>
                                </div>
                            </div>

                            <div class="chart-card">
                                <div class="chart-title">Quick Stats</div>
                                <div class="insight-stats">
                                    <div class="stat-block"><div class="value">24</div><div class="label">Active Tasks</div></div>
                                    <div class="stat-block"><div class="value">154</div><div class="label">Completions</div></div>
                                    <div class="stat-block"><div class="value">6d</div><div class="label">Avg Streak</div></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            `;
            return;
        }

        mainContent.innerHTML = `
            <section class="tasks-panel placeholder-panel">
                <div class="panel-inner">
                    <div style="display:flex; align-items:center; justify-content:space-between; gap:12px;">
                        <h3 style="margin:0; color:var(--text-primary)">${title}</h3>
                        <div class="status-badge">Under progress</div>
                    </div>
                    <p style="color:var(--text-secondary); margin-top:10px">This area is being redesigned. We'll add the full ${title} experience soon.</p>
                </div>
            </section>
        `;
    }

    function setActive(btn) {
        navButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tab = btn.dataset.tab || btn.textContent.trim();
            setActive(btn);
            // Show the tab name and 'Under progress' badge
            const title = btn.textContent.trim();
            renderPlaceholder(title);
        });
        // keyboard accessibility (Enter/Space)
        btn.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                btn.click();
            }
        });
    });

    // initialize with the active button
    const active = document.querySelector('.sidebar-nav .nav-btn.active');
    if (active) renderPlaceholder(active.textContent.trim());
});
