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

function parseIcons(markdown) {
    return markdown.replace(/:([a-z0-9- ]+):/g, (match, iconClass) => {
        if(iconClass.includes('fa') || iconClass.includes('brands')) {
            return `<i class="${iconClass}"></i>`;
        }
        return match;
    });
}

async function openFile(filename) {
    if(state.currentFile === filename) return;
    try {
        const res = await fetch(`content/${filename}.md`);
        if(!res.ok) throw new Error("File not found");
        let text = await res.text();
        text = parseIcons(text);

        state.currentFile = filename;
        if(!state.openBuffers.includes(filename)) state.openBuffers.push(filename);

        el.output.innerHTML = marked.parse(text);

        requestAnimationFrame(updateLineNumbers);
        updateUI();
        el.scroll.scrollTop = 0;
        if(window.innerWidth < 768) toggleTree(false);

    } catch(e) {
        console.error(e);
        el.output.innerHTML = `<h1 style="color:var(--red)">Error 404: ${filename}.md not found</h1>`;
    }
}

function updateLineNumbers() {
    const lineHeight = 24;
    const height = el.output.scrollHeight;
    const lines = Math.ceil(height / lineHeight);

    let gutterHtml = '';
    for(let i=1; i<=Math.max(lines, 1); i++) {
        gutterHtml += `<div>${i}</div>`;
    }
    el.gutter.innerHTML = gutterHtml;
}

const resizeObserver = new ResizeObserver(() => updateLineNumbers());
resizeObserver.observe(el.output);

function closeBuffer(filename) {
    state.openBuffers = state.openBuffers.filter(f => f !== filename);
    if(state.openBuffers.length === 0) {
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
    if(state.currentFile) document.getElementById(`node-${state.currentFile}`)?.classList.add('active');
    el.statusFile.innerText = state.currentFile ? `${state.currentFile}.md` : '[No Name]';
}

// Wrapper for HTML onclick event
window.closeBufferEvent = (e, filename) => {
    e.stopPropagation();
    closeBuffer(filename);
};

// --- Command Logic ---

function setMode(mode) {
    state.mode = mode;
    el.modeSeg.innerText = mode;
    el.modeSeg.className = mode === 'COMMAND' ? 'segment mode-command' : 'segment mode-normal';
    if(mode === 'COMMAND') {
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

    // 1. Check if it's a file from config
    if(config.files.includes(cmd)) {
        openFile(cmd);
    }
    // 2. Check Custom Commands
    else if(customCommands && customCommands[cmd]) {
        const sys = {
            openFile: openFile,
            closeBuffer: () => closeBuffer(state.currentFile),
            // Updated print to set content and force line number update
            print: (html) => {
                state.currentFile = null; // Detach from file when printing custom output
                el.output.innerHTML = html;
                requestAnimationFrame(updateLineNumbers);
                el.statusFile.innerText = '[Command Output]';
                // clear active sidebar items
                document.querySelectorAll('.file-node').forEach(elem => elem.classList.remove('active'));
            },
            alert: (msg) => alert(msg) // Keep alert just in case
        };

        // EXECUTE THE FUNCTION (Note the .fn access)
        customCommands[cmd].fn(args, sys);
    }
    // 3. Unknown
    else {
        alert(`E492: Not an editor command: ${cmd}`);
    }

    setMode('NORMAL');
}

function toggleTree(force) {
    el.tree.classList.toggle('open', force);
}

// --- Event Listeners ---

document.addEventListener('keydown', e => {
    if(state.mode === 'COMMAND') {
        if(e.key === 'Enter') executeCmd(el.cmdInput.value);
        if(e.key === 'Escape') setMode('NORMAL');
        return;
    }
    if(e.key === 'j') el.scroll.scrollBy({top:50, behavior:'smooth'});
    if(e.key === 'k') el.scroll.scrollBy({top:-50, behavior:'smooth'});
    if(e.key === ':') { e.preventDefault(); setMode('COMMAND'); }
});

el.scroll.addEventListener('scroll', () => {
    const pct = Math.round((el.scroll.scrollTop / (el.scroll.scrollHeight - el.scroll.clientHeight)) * 100);
    document.getElementById('status-percent').innerText = isNaN(pct) ? 'TOP' : `${pct}%`;
    el.gutter.scrollTop = el.scroll.scrollTop;
});

window.openFile = openFile; // Expose for HTML onclicks
window.toggleTree = toggleTree;
