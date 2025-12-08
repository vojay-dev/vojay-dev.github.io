/**
 * CUSTOM COMMANDS
 *
 * Structure:
 * 'command_name': {
 *     desc: "Short description for help menu",
 *     fn: (args, sys) => { ... logic ... }
 * }
 */
const customCommands = {

    'help': {
        desc: "Show this help menu",
        fn: (args, sys) => {
            let html = `<h1>Available Commands</h1>`;
            html += `<p>Type <code>:command</code> to execute.</p>`;
            html += `<table>`;

            // Loop through all commands to build the list dynamically
            for (const [key, cmd] of Object.entries(customCommands)) {
                html += `<tr>
                    <td style="color: var(--cyan); font-weight:bold; padding-right:20px">:${key}</td>
                    <td style="color: var(--fg);">${cmd.desc}</td>
                </tr>`;
            }

            html += `</table>`;
            html += `<br><p>You can also type filenames like <code>:home</code> or <code>:about</code>.</p>`;

            sys.print(html);
        }
    },

    'date': {
        desc: "Display current system time",
        fn: (args, sys) => {
            const now = new Date();
            sys.print(`
                <h1>System Status</h1>
                <ul>
                    <li><strong>Date:</strong> ${now.toLocaleDateString()}</li>
                    <li><strong>Time:</strong> ${now.toLocaleTimeString()}</li>
                    <li><strong>Timezone:</strong> ${Intl.DateTimeFormat().resolvedOptions().timeZone}</li>
                </ul>
            `);
        }
    },

    'socials': {
        desc: "List social media links",
        fn: (args, sys) => {
            let html = `<h1>Social Links</h1><ul>`;

            config.links.forEach(link => {
                html += `<li><i class="${link.icon}"></i> <a href="${link.url}">${link.label}</a></li>`;
            });

            html += `</ul>`;
            sys.print(html);
        }
    },

    'whoami': {
        desc: "Display current user session",
        fn: (args, sys) => {
            sys.print(`
                <h1>User Session</h1>
                <ul>
                <li><strong>User:</strong> visitor@internet</li>
                <li><strong>Role:</strong> Guest</li>
                <li><strong>Access Level:</strong> Read-Only</li>
                </ul>
                <blockquote>"I am a visitor, browsing the portfolio of Volker Janz."</blockquote>
            `);
        }
    },

    'contact': {
        desc: "Send a subspace signal (mail)",
        fn: (args, sys) => {
            sys.print(`<p>Initiating transmission to <strong style="color:var(--green)">volker@janz.sh</strong>...</p>`);

            setTimeout(() => {
                window.location.href = "mailto:volker@janz.sh";
            }, 800);
        }
    },

    'theme': {
        desc: "Toggle color theme",
        fn: (args, sys) => {
            const current = localStorage.getItem('theme') || 'tokyo';
            let next;

            // Cycle: Tokyo -> Gruvbox -> Dracula -> Tokyo
            if (current === 'tokyo') next = 'gruvbox';
            else if (current === 'gruvbox') next = 'dracula';
            else next = 'tokyo';

            window.setTheme(next);
            sys.print(`<p>Switched theme to <strong style="color:var(--magenta)">${next.toUpperCase()}</strong></p>`);
        }
    },

    'clear': {
        desc: "Clear the current buffer",
        fn: (args, sys) => {
            sys.print("");
        }
    },

    'q': {
        desc: "Close the current buffer",
        fn: (args, sys) => {
            sys.closeBuffer();
        }
    },

    'matrix': {
        desc: "Wake up, Neo... (Theme Aware)",
        fn: (args, sys) => {
            const getThemeColor = (varName) => getComputedStyle(document.documentElement).getPropertyValue(varName).trim();

            // Capture current theme colors once at start
            const bgHex = getThemeColor('--bg');
            const fgHex = getThemeColor('--blue'); // Uses main accent color

            const canvas = document.createElement('canvas');
            Object.assign(canvas.style, {
                position: 'fixed', top: '0', left: '0',
                width: '100vw', height: '100vh', zIndex: '99999',
                background: 'var(--bg)', // CSS handles this one fine
                transition: 'opacity 1s'
            });
            document.body.appendChild(canvas);

            const ctx = canvas.getContext('2d');
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;

            const chars = 'アァカサタナハマヤャラワガザダバパイィキシチニヒミリヰギジヂビピウゥクスツヌフムユュルグズブヅプ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
            const fontSize = 16;
            const columns = canvas.width / fontSize;
            const drops = Array(Math.floor(columns)).fill(1);

            let animationId;
            const draw = () => {
                // 1. Draw semi-transparent background to create "trail" effect
                ctx.globalAlpha = 0.1;
                ctx.fillStyle = bgHex;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // 2. Draw Text
                ctx.globalAlpha = 1.0;
                ctx.fillStyle = fgHex;
                ctx.font = fontSize + 'px monospace';

                for(let i = 0; i < drops.length; i++) {
                    const text = chars.charAt(Math.floor(Math.random() * chars.length));
                    ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                    if(drops[i] * fontSize > canvas.height && Math.random() > 0.975) drops[i] = 0;
                    drops[i]++;
                }
                animationId = requestAnimationFrame(draw);
            };
            draw();

            setTimeout(() => {
                canvas.style.opacity = '0';
                setTimeout(() => {
                    cancelAnimationFrame(animationId);
                    document.body.removeChild(canvas);
                }, 1000);
            }, 5000);
        }
    },

};
