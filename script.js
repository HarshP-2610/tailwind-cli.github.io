document.addEventListener('DOMContentLoaded', () => {
    // ─── DOM REFS ───
    const daysList      = document.getElementById('daysList');
    const donutCircle   = document.getElementById('donutCircle');
    const pctText       = document.getElementById('pctText');
    const statDone      = document.getElementById('statDone');
    const statLeft      = document.getElementById('statLeft');
    const statBal       = document.getElementById('statBal');
    const statProfit    = document.getElementById('statProfit');
    const statStreak    = document.getElementById('statStreak');
    const barDone       = document.getElementById('barDone');
    const barLeft       = document.getElementById('barLeft');
    const barBal        = document.getElementById('barBal');
    const barProfit     = document.getElementById('barProfit');
    const barStreak     = document.getElementById('barStreak');
    const badgeCount    = document.getElementById('badgeCount');
    const resetBtn      = document.getElementById('resetBtn');

    const DAYS = 30;
    const START = 100;
    const STORAGE_KEY = 'xauusd_v4';

    // ─── DATA ───
    let data = load();

    function load() {
        let d = JSON.parse(localStorage.getItem(STORAGE_KEY));
        if (d && d.length === DAYS) return d;
        // Try older versions
        for (const k of ['xauusd_journal_v3','xauusd_journal_v2','xauusd_journal']) {
            const old = JSON.parse(localStorage.getItem(k));
            if (old && old.length > 0) return old;
        }
        return init();
    }

    function init() {
        const arr = [];
        for (let i = 1; i <= DAYS; i++) {
            arr.push({ day: i, balance: i === 1 ? START : '', completed: false, notes: '', difProfit: '' });
        }
        return arr;
    }

    // Ensure migrated data has difProfit field
    data.forEach(d => { if (d.difProfit === undefined) d.difProfit = ''; });

    function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }

    // ─── CALCULATIONS ───
    function lot(b) {
        b = parseFloat(b);
        if (isNaN(b) || b < 100) return '0.01';
        if (b < 150) return '0.01';
        if (b < 250) return '0.02';
        if (b < 350) return '0.03';
        if (b < 500) return '0.04';
        if (b < 700) return '0.05';
        if (b < 1000) return '0.07';
        return '0.08';
    }

    function f(n) { return parseFloat(n).toFixed(2); }

    // ─── ANALYTICS ───
    function updateAnalytics() {
        const done = data.filter(d => d.completed).length;
        const left = DAYS - done;
        const pct = Math.round((done / DAYS) * 100);

        // Find latest & highest balance
        let latest = START;
        for (let i = data.length - 1; i >= 0; i--) {
            const b = parseFloat(data[i].balance);
            if (!isNaN(b) && b > 0) { latest = b; break; }
        }
        const profit = latest - START;

        // Streak calculation
        let streak = 0;
        for (let i = 0; i < data.length; i++) {
            if (data[i].completed) streak++;
            else break;
        }

        // Update DOM
        pctText.textContent       = pct + '%';
        donutCircle.setAttribute('stroke-dasharray', `${pct} ${100 - pct}`);
        statDone.textContent      = done;
        statLeft.textContent      = left;
        statBal.textContent       = '$' + f(latest);
        statProfit.textContent    = (profit >= 0 ? '+$' : '-$') + f(Math.abs(profit));
        statStreak.textContent    = streak;
        badgeCount.textContent    = done + ' / ' + DAYS;

        // Mini bars (width %)
        barDone.style.width   = (done / DAYS * 100) + '%';
        barLeft.style.width   = (left / DAYS * 100) + '%';
        barBal.style.width    = Math.min(latest / 1000 * 100, 100) + '%';
        barProfit.style.width = Math.min(Math.max(profit, 0) / 500 * 100, 100) + '%';
        barStreak.style.width = (streak / DAYS * 100) + '%';
    }

    // ─── RENDER ───
    function render() {
        daysList.innerHTML = '';

        data.forEach((row, i) => {
            const wrap = document.createElement('div');
            wrap.className = 'day-wrap';
            wrap.style.animationDelay = (i % 15) * 0.03 + 's';

            const bal     = parseFloat(row.balance);
            const hasBal  = !isNaN(bal);
            const dif     = parseFloat(row.difProfit);
            const hasDif  = !isNaN(dif);
            // If difProfit is given, use it; otherwise use 8% of balance
            const target  = hasBal ? (hasDif ? f(dif) : f(bal * 0.08)) : '0.00';
            const expect  = hasBal ? (hasDif ? f(bal + dif) : f(bal * 1.08)) : '0.00';
            const lotVal  = hasBal ? lot(bal)        : '0.01';
            const preview = hasBal ? '$' + f(bal)    : '—';
            const profitLabel = hasDif ? 'Dif Profit' : 'Profit +8%';

            const card = document.createElement('div');
            card.className = 'day-card' + (row.completed ? ' done' : '');

            card.innerHTML = `
                <div class="dc-top" data-i="${i}">
                    <span class="dc-day">DAY ${row.day}</span>
                    <div class="dc-right">
                        <span class="dc-bal-preview">${preview}</span>
                        <svg class="dc-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </div>
                </div>
                <div class="dc-body">
                    <div class="dc-fields">
                        <div class="dc-field full">
                            <span class="dc-label">Balance</span>
                            <div class="bal-wrap">
                                <span class="sym">$</span>
                                <input type="number" step="0.01" class="bal-in" data-i="${i}" value="${row.balance}" placeholder="0.00">
                            </div>
                        </div>
                        <div class="dc-field full">
                            <span class="dc-label">Dif Profit <span style="opacity:.5;font-size:.5rem">(leave empty for 8%)</span></span>
                            <div class="bal-wrap dif-wrap">
                                <span class="sym">$</span>
                                <input type="number" step="0.01" class="dif-in" data-i="${i}" value="${row.difProfit}" placeholder="Auto 8%">
                            </div>
                        </div>
                        <div class="dc-field">
                            <div class="stat-pill green">
                                <span class="dc-label">${profitLabel}</span>
                                <span class="sv">+$${target}</span>
                            </div>
                        </div>
                        <div class="dc-field">
                            <div class="stat-pill">
                                <span class="dc-label">Expected</span>
                                <span class="sv">$${expect}</span>
                            </div>
                        </div>
                        <div class="dc-field full">
                            <div class="lot-pill">
                                <span class="dc-label">Lot Size</span>
                                <span class="lv">${lotVal}</span>
                            </div>
                        </div>
                        <div class="dc-field full" style="display:flex;align-items:center;gap:12px">
                            <label class="tog">
                                <input type="checkbox" class="cb" data-i="${i}" ${row.completed ? 'checked' : ''}>
                                <span class="tog-track"></span>
                            </label>
                            <span class="dc-label" style="margin:0">Mark Completed</span>
                        </div>
                        <div class="dc-field full">
                            <input type="text" class="note-in" data-i="${i}" value="${row.notes}" placeholder="Trade notes...">
                        </div>
                    </div>
                </div>
            `;

            wrap.appendChild(card);
            daysList.appendChild(wrap);
        });

        bindEvents();
        updateAnalytics();
    }

    // ─── EVENTS ───
    function bindEvents() {
        // Toggle expand/collapse
        document.querySelectorAll('.dc-top').forEach(el => {
            el.addEventListener('click', e => {
                // Don't toggle if clicking inside toggle switch
                if (e.target.closest('.tog')) return;
                const card = el.closest('.day-card');
                card.classList.toggle('open');
            });
        });

        // Helper: calculate expected balance for a given day index
        function expectedForDay(i) {
            const b = parseFloat(data[i].balance);
            if (isNaN(b)) return null;
            const d = parseFloat(data[i].difProfit);
            return !isNaN(d) ? b + d : b * 1.08;
        }

        // Balance
        document.querySelectorAll('.bal-in').forEach(el => {
            el.addEventListener('change', e => {
                const i = parseInt(e.target.dataset.i);
                data[i].balance = e.target.value;
                if (data[i].completed && i < DAYS - 1) {
                    const exp = expectedForDay(i);
                    if (exp !== null) data[i + 1].balance = f(exp);
                }
                save();
                render();
            });
        });

        // Dif Profit
        document.querySelectorAll('.dif-in').forEach(el => {
            el.addEventListener('change', e => {
                const i = parseInt(e.target.dataset.i);
                data[i].difProfit = e.target.value;
                if (data[i].completed && i < DAYS - 1) {
                    const exp = expectedForDay(i);
                    if (exp !== null) data[i + 1].balance = f(exp);
                }
                save();
                render();
            });
        });

        // Checkboxes
        document.querySelectorAll('.cb').forEach(el => {
            el.addEventListener('change', e => {
                e.stopPropagation();
                const i  = parseInt(e.target.dataset.i);
                const on = e.target.checked;
                data[i].completed = on;
                if (i < DAYS - 1) {
                    if (on) {
                        const exp = expectedForDay(i);
                        if (exp !== null) data[i + 1].balance = f(exp);
                    } else {
                        data[i + 1].balance = '';
                    }
                }
                save();
                render();
            });
        });

        // Notes
        document.querySelectorAll('.note-in').forEach(el => {
            el.addEventListener('change', e => {
                data[parseInt(e.target.dataset.i)].notes = e.target.value;
                save();
            });
        });
    }

    // ─── RESET ───
    resetBtn.addEventListener('click', () => {
        if (!confirm('Reset all challenge data? This cannot be undone.')) return;
        ['xauusd_v4','xauusd_journal_v3','xauusd_journal_v2','xauusd_journal']
            .forEach(k => localStorage.removeItem(k));
        data = init();
        save();
        render();
    });

    // ─── BOOT ───
    render();
});
