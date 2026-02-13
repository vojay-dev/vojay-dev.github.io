// --- Validation ---
if (typeof config === 'undefined') throw new Error("config.js missing");
if (typeof customCommands === 'undefined') console.warn("commands.js missing");

const THEMES = ['tokyo', 'gruvbox', 'dracula', 'cyberpunk'];
const COLORS = ['var(--blue)', 'var(--purple)', 'var(--yellow)', 'var(--green)', 'var(--red)', 'var(--cyan)', 'var(--orange)', 'var(--magenta)'];
const state = { currentFile: null, openBuffers: [], mode: 'NORMAL' };

window.THEMES = THEMES;

// --- DOM Elements ---
const el = {
    output: document.getElementById('markdown-output'),
    gutter: document.getElementById('gutter'),
    scroll: document.getElementById('scroll-container'),
    tabContainer: document.getElementById('tab-container'),
    cmdInput: document.getElementById('cmd-input'),
    cmdDisplay: document.getElementById('cmd-display'),
    modeSeg: document.getElementById('mode-segment'),
    tree: document.getElementById('nvim-tree'),
    statusFile: document.getElementById('status-filename')
};

// --- Initialization ---
document.title = config.title;
initLightbox();
renderSidebar();
showAlpha();

// --- Core Logic ---

function renderSidebar() {
    const container = document.getElementById('file-list-container');
    const linkContainer = document.getElementById('link-list-container');

    container.innerHTML = config.files.map((file, index) => {
        const color = COLORS[index % COLORS.length];
        return `<div class="file-node" id="node-${file}" onclick="openFile('${file}')"><i class="fab fa-markdown" style="color: ${color}"></i> ${file}.md</div>`;
    }).join('');

    linkContainer.innerHTML = config.links.map(link => `
        <div class="file-node" onclick="window.open('${link.url}')">
            <i class="${link.icon}" style="width:15px; text-align:center;"></i> ${link.label}
        </div>
    `).join('');
}

// --- Toast Logic ---

function showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon based on type
    let icon = 'info-circle';
    if (type === 'error') icon = 'exclamation-triangle';
    else if (type === 'success') icon = 'check-circle';

    toast.innerHTML = `<i class="fas fa-${icon}"></i> ${msg}`;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fade-out 0.3s ease forwards'; // 0.6s duration
        setTimeout(() => toast.remove(), 600); // 600ms wait
    }, 3000);
}

window.showToast = showToast;

// --- Theme Logic ---

function setTheme(themeName) {
    if (!THEMES.includes(themeName)) themeName = THEMES[0];
    const label = document.getElementById('theme-name');

    localStorage.setItem('theme', themeName);

    if (themeName === THEMES[0]) {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeName);
    }

    if (label) {
        THEMES.forEach(t => label.classList.remove(`theme-${t}`));
        label.classList.add(`theme-${themeName}`);
    }
}

const savedTheme = localStorage.getItem('theme') || THEMES[0];
setTheme(savedTheme);

const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
    themeSwitch.addEventListener('click', () => {
        const current = localStorage.getItem('theme') || THEMES[0];
        const currentIndex = THEMES.indexOf(current);
        const nextIndex = (currentIndex + 1) % THEMES.length;
        setTheme(THEMES[nextIndex]);
    });
}

window.setTheme = setTheme;

function parseIcons(markdown) {
    return markdown.replace(/:([a-z0-9- ]+):/g, (match, iconClass) => {
        if (iconClass.includes('fa') || iconClass.includes('brands')) {
            return `<i class="${iconClass}"></i>`;
        }
        return match;
    });
}

function initLightbox() {
    if (!document.getElementById('lightbox')) {
        const lb = document.createElement('div');
        lb.id = 'lightbox';
        lb.onclick = () => {
            lb.classList.remove('active');
            setTimeout(() => lb.style.display = 'none', 300);
        };
        document.body.appendChild(lb);
    }
}

// --- Alpha Dashboard ---

function runAlphaAction(cmd) {
    if (cmd.startsWith(':')) {
        executeCmd(cmd);
    } else {
        openFile(cmd);
    }
}

// Build keyboard shortcut map from config
const alphaKeyMap = {};
if (config.alpha && config.alpha.actions) {
    config.alpha.actions.forEach(a => {
        alphaKeyMap[a.key] = () => runAlphaAction(a.cmd);
    });
}

function showAlpha() {
    const ac = config.alpha || {};
    let dash = document.getElementById('alpha-dashboard');

    if (!dash) {
        dash = document.createElement('div');
        dash.id = 'alpha-dashboard';
        dash.className = 'alpha-dashboard';

        const content = document.createElement('div');
        content.className = 'alpha-content';

        // Animated logo
        const logo = document.createElement('div');
        logo.className = 'alpha-logo';

        const titleText = ac.title || 'vojay';
        const accentText = ac.titleAccent || '';
        const titleColor = ac.titleColor || 'var(--blue)';
        const accentColor = ac.titleAccentColor || 'var(--comment)';
        const chars = (titleText + accentText).split('');
        const titleLen = titleText.length;

        chars.forEach((ch, i) => {
            const span = document.createElement('span');
            span.textContent = ch;
            span.className = 'alpha-char';
            span.style.setProperty('--i', i);
            span.style.setProperty('--char-color', i >= titleLen ? accentColor : titleColor);
            logo.appendChild(span);
        });

        // Blinking cursor
        const cursor = document.createElement('span');
        cursor.className = 'alpha-cursor';
        cursor.textContent = '_';
        cursor.style.setProperty('--i', chars.length);
        logo.appendChild(cursor);

        // Subtitle
        const subtitle = document.createElement('div');
        subtitle.className = 'alpha-subtitle';
        subtitle.textContent = ac.subtitle || '';
        if (ac.subtitleColor) subtitle.style.color = ac.subtitleColor;

        // Action buttons
        const buttons = document.createElement('div');
        buttons.className = 'alpha-buttons';

        (ac.actions || []).forEach((a, i) => {
            const btn = document.createElement('div');
            btn.className = 'alpha-btn';
            btn.style.setProperty('--i', i);
            btn.innerHTML = `<span class="alpha-key">${a.key}</span> <i class="${a.icon}"></i> ${a.label}`;
            btn.addEventListener('click', () => { hideAlpha(); runAlphaAction(a.cmd); });
            buttons.appendChild(btn);
        });

        // Footer
        const footer = document.createElement('div');
        footer.className = 'alpha-footer';
        footer.innerHTML = `<span>${titleText}${accentText}</span> &nbsp; ${config.files.length} files &nbsp; ${Object.keys(customCommands).length} commands`;

        content.appendChild(logo);
        content.appendChild(subtitle);
        content.appendChild(buttons);
        content.appendChild(footer);
        dash.appendChild(content);
        document.body.appendChild(dash);
    }

    dash.style.display = 'flex';
    requestAnimationFrame(() => dash.classList.add('active'));

    state.mode = 'ALPHA';
    el.modeSeg.innerText = 'ALPHA';
    el.modeSeg.className = 'segment mode-alpha';
}

function hideAlpha() {
    const dash = document.getElementById('alpha-dashboard');
    if (!dash) return;
    dash.classList.remove('active');
    setTimeout(() => { dash.style.display = 'none'; }, 300);
    setMode('NORMAL');
}

window.showAlpha = showAlpha;

function attachImageListeners() {
    const images = el.output.querySelectorAll('img');
    const lb = document.getElementById('lightbox');

    images.forEach(img => {
        img.onclick = (e) => {
            e.stopPropagation();
            lb.innerHTML = '';
            const clone = document.createElement('img');
            clone.src = img.src;
            lb.appendChild(clone);
            lb.style.display = 'flex';
            setTimeout(() => lb.classList.add('active'), 10);
        };
    });
}

async function openFile(filename, force = false) {
    if (state.currentFile === filename && !force) return;
    try {
        const res = await fetch(`content/${filename}.md`);
        if (!res.ok) throw new Error("File not found");
        let text = await res.text();
        text = parseIcons(text);

        state.currentFile = filename;
        if (!state.openBuffers.includes(filename)) state.openBuffers.push(filename);

        el.output.innerHTML = marked.parse(text);

        el.output.querySelectorAll('a').forEach(a => {
            if (a.href && a.href.startsWith('http')) {
                a.target = '_blank';
            }
        });

        if (window.Prism) window.Prism.highlightAllUnder(el.output);
        attachImageListeners();
        requestAnimationFrame(updateLineNumbers);
        updateUI();
        el.scroll.scrollTop = 0;
        if (window.innerWidth < 768) toggleTree(false);

    } catch (e) {
        console.error(e);
        el.output.innerHTML = `<h1 style="color:var(--red)">Error 404: ${filename}.md not found</h1>`;
    }
}

function updateLineNumbers() {
    const lineHeight = 24;
    const height = el.output.scrollHeight;
    const lines = Math.ceil(height / lineHeight);

    let gutterHtml = '';
    for (let i = 1; i <= Math.max(lines, 1); i++) {
        gutterHtml += `<div>${i}</div>`;
    }
    el.gutter.innerHTML = gutterHtml;
}

const resizeObserver = new ResizeObserver(() => updateLineNumbers());
resizeObserver.observe(el.output);

function closeBuffer(filename) {
    state.openBuffers = state.openBuffers.filter(f => f !== filename);
    if (state.openBuffers.length === 0) {
        state.currentFile = null;
        el.output.innerHTML = "";
        el.gutter.innerHTML = "";
    } else if (state.currentFile === filename) {
        openFile(state.openBuffers[state.openBuffers.length - 1]);
    }
    updateUI();
}

function updateUI() {
    el.tabContainer.innerHTML = state.openBuffers.map(file => {
        const active = file === state.currentFile ? 'active' : '';
        const fileIndex = config.files.indexOf(file);
        const color = fileIndex > -1 ? COLORS[fileIndex % COLORS.length] : 'var(--blue)';
        return `
            <div class="tab ${active}" onclick="openFile('${file}')">
                <i class="fas fa-file-code" style="color: ${color}"></i> ${file}.md
                <span class="tab-close" onclick="closeBufferEvent(event, '${file}')">&times;</span>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.file-node').forEach(elem => elem.classList.remove('active'));
    if (state.currentFile) document.getElementById(`node-${state.currentFile}`)?.classList.add('active');
    el.statusFile.innerText = state.currentFile ? `${state.currentFile}.md` : '[No Name]';
}

window.closeBufferEvent = (e, filename) => {
    e.stopPropagation();
    closeBuffer(filename);
};

// --- DUCKDB LOGIC ---

window.duckDB = null;
window.duckConn = null;

window.initDuckDB = async function(sys) {
    if (window.duckConn) return;

    sys.print(`<p style="color:var(--yellow)">> Downloading engine...</p>`);

    try {
        const duckdb = await import('https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/+esm');
        const cdn_base = "https://cdn.jsdelivr.net/npm/@duckdb/duckdb-wasm@1.28.0/dist/";

        const bundles = {
            mvp: {
                mainModule: `${cdn_base}duckdb-mvp.wasm`,
                mainWorker: `${cdn_base}duckdb-browser-mvp.worker.js`,
            },
            eh: {
                mainModule: `${cdn_base}duckdb-eh.wasm`,
                mainWorker: `${cdn_base}duckdb-browser-eh.worker.js`,
            },
        };

        const bundle = await duckdb.selectBundle(bundles);
        const workerUrl = URL.createObjectURL(
            new Blob([`importScripts("${bundle.mainWorker}");`], { type: 'text/javascript' })
        );

        const worker = new Worker(workerUrl);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);

        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

        window.duckDB = db;
        window.duckConn = await db.connect();

        sys.print(`<p style="color:var(--blue)">> Ingesting site pages...</p>`);

        // Pages schema
        await window.duckConn.query(`
            CREATE TABLE pages (
                filename VARCHAR,
                word_count INTEGER,
                content VARCHAR
            );
        `);

        // Ingest pages
        const inserts = config.files.map(async (file) => {
            try {
                const res = await fetch(`content/${file}.md`);
                if (!res.ok) return;
                const text = await res.text();

                const safeContent = text.replace(/'/g, "''").replace(/\n/g, " ");
                const wordCount = text.split(/\s+/).length;

                await window.duckConn.query(`
                    INSERT INTO pages VALUES ('${file}.md', ${wordCount}, '${safeContent}');
                `);
            } catch (e) {
                console.warn(`Skipped ${file}`, e);
            }
        });

        await Promise.all(inserts);
        window.showToast("DuckDB ready", "success");
    } catch (e) {
        console.error(e);
        sys.print(`<p style="color:var(--red)">Database error: ${e.message}</p>`);
    }
};




// --- Telescope Fuzzy Finder ---

let telescopeState = null;

function fuzzyMatch(query, text) {
    let qi = 0;
    for (let ti = 0; ti < text.length && qi < query.length; ti++) {
        if (text[ti] === query[qi]) qi++;
    }
    return qi === query.length;
}

function highlightFuzzy(text, query) {
    if (!query) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.toLowerCase().trim();
    let result = '';
    let qi = 0;
    for (let i = 0; i < text.length; i++) {
        if (qi < lowerQuery.length && lowerText[i] === lowerQuery[qi]) {
            result += `<span class="telescope-match">${text[i]}</span>`;
            qi++;
        } else {
            result += text[i];
        }
    }
    return result;
}

function buildTelescopeItems() {
    const items = [];

    config.files.forEach((file, index) => {
        const color = COLORS[index % COLORS.length];
        items.push({
            section: 'Files',
            label: `${file}.md`,
            icon: 'fab fa-markdown',
            iconColor: color,
            desc: '',
            searchText: file,
            action: () => openFile(file)
        });
    });

    for (const [key, cmd] of Object.entries(customCommands)) {
        items.push({
            section: 'Commands',
            label: `:${key}`,
            icon: 'fas fa-terminal',
            iconColor: 'var(--cyan)',
            desc: cmd.desc,
            searchText: `${key} ${cmd.desc}`,
            action: () => executeCmd(`:${key}`)
        });
    }

    config.links.forEach(link => {
        items.push({
            section: 'Links',
            label: link.label,
            icon: link.icon,
            iconColor: 'var(--purple)',
            desc: link.url,
            searchText: `${link.label} ${link.url}`,
            action: () => window.open(link.url, '_blank')
        });
    });

    return items;
}

function openTelescope() {
    if (state.mode === 'TELESCOPE' || state.mode === 'ALPHA') return;

    state.mode = 'TELESCOPE';
    el.modeSeg.innerText = 'TELESCOPE';
    el.modeSeg.className = 'segment mode-telescope';

    const items = buildTelescopeItems();

    let overlay = document.getElementById('telescope-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'telescope-overlay';
        overlay.className = 'telescope-overlay';
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeTelescope();
        });
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = '';

    const panel = document.createElement('div');
    panel.className = 'telescope-panel';

    const header = document.createElement('div');
    header.className = 'telescope-header';

    const icon = document.createElement('span');
    icon.className = 'telescope-icon';
    icon.innerHTML = '<i class="fas fa-search"></i> Telescope';
    header.appendChild(icon);

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'telescope-input';
    input.placeholder = 'Search files, commands, links...';
    input.autocomplete = 'off';
    input.spellcheck = false;
    header.appendChild(input);

    const results = document.createElement('div');
    results.className = 'telescope-results';

    panel.appendChild(header);
    panel.appendChild(results);
    overlay.appendChild(panel);

    let selectedIndex = 0;
    let filteredItems = [...items];

    function render() {
        results.innerHTML = '';
        if (filteredItems.length === 0) {
            results.innerHTML = '<div class="telescope-empty">No results found</div>';
            return;
        }

        let currentSection = '';
        filteredItems.forEach((item, i) => {
            if (item.section !== currentSection) {
                currentSection = item.section;
                const sectionEl = document.createElement('div');
                sectionEl.className = 'telescope-section';
                sectionEl.textContent = currentSection;
                results.appendChild(sectionEl);
            }

            const row = document.createElement('div');
            row.className = 'telescope-row' + (i === selectedIndex ? ' selected' : '');

            const highlighted = input.value ? highlightFuzzy(item.label, input.value) : item.label;
            const descHtml = item.desc ? `<span class="telescope-desc">${item.desc}</span>` : '';
            row.innerHTML = `<i class="${item.icon}" style="color: ${item.iconColor}; width: 18px; text-align: center;"></i>
                <span>${highlighted}</span>${descHtml}`;

            row.addEventListener('click', (e) => {
                e.stopPropagation();
                closeTelescope();
                item.action();
            });
            results.appendChild(row);
        });

        const selectedRow = results.querySelector('.telescope-row.selected');
        if (selectedRow) selectedRow.scrollIntoView({ block: 'nearest' });
    }

    function search(query) {
        query = query.toLowerCase().trim();
        if (!query) {
            filteredItems = [...items];
        } else {
            filteredItems = items.filter(item => fuzzyMatch(query, item.searchText.toLowerCase()));
        }
        selectedIndex = 0;
        render();
    }

    input.addEventListener('input', () => search(input.value));

    telescopeState = {
        get selectedIndex() { return selectedIndex; },
        set selectedIndex(v) { selectedIndex = v; },
        get filteredItems() { return filteredItems; },
        render
    };

    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));

    render();
    setTimeout(() => input.focus(), 50);
}

function closeTelescope() {
    const overlay = document.getElementById('telescope-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 200);
    telescopeState = null;
    setMode('NORMAL');
}

function telescopeNav(delta) {
    if (!telescopeState || telescopeState.filteredItems.length === 0) return;
    telescopeState.selectedIndex = Math.max(0,
        Math.min(telescopeState.filteredItems.length - 1,
            telescopeState.selectedIndex + delta));
    telescopeState.render();
}

function telescopeSelect() {
    if (!telescopeState || telescopeState.filteredItems.length === 0) return;
    const item = telescopeState.filteredItems[telescopeState.selectedIndex];
    closeTelescope();
    item.action();
}

window.openTelescope = openTelescope;

// --- Command Logic ---

function setMode(mode) {
    state.mode = mode;
    el.modeSeg.innerText = mode;
    el.modeSeg.className = mode === 'COMMAND' ? 'segment mode-command' : 'segment mode-normal';
    if (mode === 'COMMAND') {
        el.cmdDisplay.style.display = 'none';
        el.cmdInput.style.display = 'block';
        el.cmdInput.value = ':';
        el.cmdInput.focus();
    } else {
        el.cmdDisplay.style.display = 'block';
        el.cmdInput.style.display = 'none';
        el.scroll.focus();
    }
}

function executeCmd(val) {
    const raw = val.replace(':', '').trim();
    const parts = raw.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    if (typeof gtag === 'function') {
        gtag('event', 'command_execute', { 'command_name': cmd });
    }

    if (config.files.includes(cmd)) {
        openFile(cmd);
    } else if (customCommands && customCommands[cmd]) {
        const sys = {
            openFile: openFile,
            closeBuffer: () => closeBuffer(state.currentFile),
            print: (html) => {
                state.currentFile = null;
                el.output.innerHTML = html;
                requestAnimationFrame(updateLineNumbers);
                el.statusFile.innerText = '[cmd out]';
                document.querySelectorAll('.file-node').forEach(elem => elem.classList.remove('active'));
            },
            // Updated to use Toast
            alert: (msg) => showToast(msg, 'info'),
            error: (msg) => showToast(msg, 'error'),
            success: (msg) => showToast(msg, 'success')
        };
        customCommands[cmd].fn(args, sys);
    } else {
        showToast(`E492: Not an editor command: ${cmd}`, 'error');

        if (typeof gtag === 'function') {
            gtag('event', 'command_error', { 'invalid_input': cmd });
        }
    }

    setMode('NORMAL');
}

function toggleTree(force) {
    el.tree.classList.toggle('open', force);
}

// --- Mobile Command Logic ---

const mobileCmdInput = document.getElementById('mobile-cmd-input');
const mobileCmdBtn = document.getElementById('mobile-cmd-btn');

function triggerMobileCmd() {
    const val = mobileCmdInput.value.toLowerCase();
    if (val.trim() !== '') {
        executeCmd(val);
        mobileCmdInput.value = '';
        mobileCmdInput.blur();
        toggleTree(false);
    }
}

if (mobileCmdInput && mobileCmdBtn) {
    mobileCmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerMobileCmd();
    });

    mobileCmdBtn.addEventListener('click', (e) => {
        e.preventDefault();
        triggerMobileCmd();
    });

    mobileCmdBtn.addEventListener('touchend', (e) => {
        e.preventDefault();
        triggerMobileCmd();
    });
}

// --- Top Bar Clock ---

function updateClock() {
    const clock = document.getElementById('clock-widget');
    if (clock) {
        const now = new Date();
        clock.innerText = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
}
setInterval(updateClock, 1000);
updateClock(); // Run immediately

// --- Event Listeners ---

const gitBranch = document.getElementById('git-branch');
if (gitBranch) {
    gitBranch.addEventListener('click', () => {
        window.open('https://github.com/vojay-dev/vojay-dev.github.io', '_blank');
    });
}

document.addEventListener('keydown', e => {
    // Alpha mode: shortcut keys or dismiss
    if (state.mode === 'ALPHA') {
        e.preventDefault();
        const key = e.key.toLowerCase();
        if (key === ':') { hideAlpha(); setMode('COMMAND'); return; }
        if (alphaKeyMap[key]) { hideAlpha(); alphaKeyMap[key](); return; }
        if (key !== 'shift' && key !== 'control' && key !== 'alt' && key !== 'meta') {
            hideAlpha();
            openFile(config.startPage);
        }
        return;
    }

    // Telescope mode: navigation
    if (state.mode === 'TELESCOPE') {
        if (e.key === 'Escape') { e.preventDefault(); closeTelescope(); return; }
        if (e.key === 'ArrowDown' || (e.ctrlKey && e.key === 'n')) { e.preventDefault(); telescopeNav(1); return; }
        if (e.key === 'ArrowUp' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); telescopeNav(-1); return; }
        if (e.key === 'Enter') { e.preventDefault(); telescopeSelect(); return; }
        return;
    }

    // Command mode
    if (state.mode === 'COMMAND') {
        if (e.key === 'Enter') executeCmd(el.cmdInput.value);
        if (e.key === 'Escape') setMode('NORMAL');
        return;
    }

    // Normal mode — skip if typing in an input
    const active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')) return;

    if (e.key === 'j') el.scroll.scrollBy({ top: 50, behavior: 'smooth' });
    if (e.key === 'k') el.scroll.scrollBy({ top: -50, behavior: 'smooth' });
    if (e.key === ':') { e.preventDefault(); setMode('COMMAND'); }
    if (e.key === '/' || (e.ctrlKey && e.key === 'p')) { e.preventDefault(); openTelescope(); }
});

el.scroll.addEventListener('scroll', () => {
    const pct = Math.round((el.scroll.scrollTop / (el.scroll.scrollHeight - el.scroll.clientHeight)) * 100);
    document.getElementById('status-percent').innerText = isNaN(pct) ? 'TOP' : `${pct}%`;
    el.gutter.scrollTop = el.scroll.scrollTop;
});

window.openFile = openFile;
window.toggleTree = toggleTree;
