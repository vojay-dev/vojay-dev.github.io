// --- Validation ---

if (typeof config === 'undefined') throw new Error("config.js missing");
if (typeof customCommands === 'undefined') console.warn("commands.js missing");

const colors = ['var(--blue)', 'var(--purple)', 'var(--yellow)', 'var(--green)', 'var(--red)', 'var(--cyan)', 'var(--orange)', 'var(--magenta)'];
const state = { currentFile: null, openBuffers: [], mode: 'NORMAL' };

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
openFile(config.startPage);

// --- Core Logic ---

function renderSidebar() {
    const container = document.getElementById('file-list-container');
    const linkContainer = document.getElementById('link-list-container');

    container.innerHTML = config.files.map((file, index) => {
        const color = colors[index % colors.length];
        return `<div class="file-node" id="node-${file}" onclick="openFile('${file}')"><i class="fab fa-markdown" style="color: ${color}"></i> ${file}.md</div>`;
    }).join('');

    linkContainer.innerHTML = config.links.map(link => `
        <div class="file-node" onclick="window.open('${link.url}')">
            <i class="${link.icon}" style="width:15px; text-align:center;"></i> ${link.label}
        </div>
    `).join('');
}

// --- Theme Logic ---

function setTheme(themeName) {
    const label = document.getElementById('theme-name');

    if (themeName === 'gruvbox') {
        document.documentElement.setAttribute('data-theme', 'gruvbox');
        localStorage.setItem('theme', 'gruvbox');
        if (label) label.innerText = "GRUVBOX";
    } else {
        document.documentElement.removeAttribute('data-theme');
        localStorage.setItem('theme', 'tokyo');
        if (label) label.innerText = "TOKYO";
    }
}

const savedTheme = localStorage.getItem('theme') || 'tokyo';
setTheme(savedTheme);

const themeSwitch = document.getElementById('theme-switch');
if (themeSwitch) {
    themeSwitch.addEventListener('click', () => {
        const current = localStorage.getItem('theme') || 'tokyo';
        const next = current === 'tokyo' ? 'gruvbox' : 'tokyo';
        setTheme(next);
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

async function openFile(filename) {
    if (state.currentFile === filename) return;
    try {
        const res = await fetch(`content/${filename}.md`);
        if (!res.ok) throw new Error("File not found");
        let text = await res.text();
        text = parseIcons(text);

        state.currentFile = filename;
        if (!state.openBuffers.includes(filename)) state.openBuffers.push(filename);

        el.output.innerHTML = marked.parse(text);

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
        const color = fileIndex > -1 ? colors[fileIndex % colors.length] : 'var(--blue)';
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
                el.statusFile.innerText = '[Command Output]';
                document.querySelectorAll('.file-node').forEach(elem => elem.classList.remove('active'));
            },
            alert: (msg) => alert(msg)
        };
        customCommands[cmd].fn(args, sys);
    } else {
        alert(`E492: Not an editor command: ${cmd}`);
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

// --- Event Listeners ---

document.addEventListener('keydown', e => {
    if (state.mode === 'COMMAND') {
        if (e.key === 'Enter') executeCmd(el.cmdInput.value);
        if (e.key === 'Escape') setMode('NORMAL');
        return;
    }
    if (e.key === 'j') el.scroll.scrollBy({ top: 50, behavior: 'smooth' });
    if (e.key === 'k') el.scroll.scrollBy({ top: -50, behavior: 'smooth' });
    if (e.key === ':') { e.preventDefault(); setMode('COMMAND'); }
});

el.scroll.addEventListener('scroll', () => {
    const pct = Math.round((el.scroll.scrollTop / (el.scroll.scrollHeight - el.scroll.clientHeight)) * 100);
    document.getElementById('status-percent').innerText = isNaN(pct) ? 'TOP' : `${pct}%`;
    el.gutter.scrollTop = el.scroll.scrollTop;
});

window.openFile = openFile;
window.toggleTree = toggleTree;
