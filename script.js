// script.js

// Tasks have been removed from the UI for redesign.
// Leave a small stub to avoid runtime errors if the script is still included.
document.addEventListener('DOMContentLoaded', () => {
    console.info('Tab switcher active: sidebar nav will update main content.');

    const navButtons = Array.from(document.querySelectorAll('.sidebar-nav .nav-btn'));
    const mainContent = document.querySelector('.main-area .content');

    function renderPlaceholder(title) {
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
