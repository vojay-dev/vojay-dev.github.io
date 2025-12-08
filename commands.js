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
        desc: "Identify current user session (IP & System)",
        fn: async (args, sys) => {
            sys.print(`<p style="color:var(--comment)">Scanning network nodes... <span class="cursor">|</span></p>`);

            const width = window.screen.width;
            const height = window.screen.height;
            const lang = navigator.language.toUpperCase();
            const platform = navigator.platform;
            const cores = navigator.hardwareConcurrency || "?";

            const ua = navigator.userAgent;
            let os = "Unknown OS";
            if (ua.indexOf("Win") !== -1) os = "Windows";
            if (ua.indexOf("Mac") !== -1) os = "macOS";
            if (ua.indexOf("Linux") !== -1) os = "Linux";
            if (ua.indexOf("Android") !== -1) os = "Android";
            if (ua.indexOf("like Mac") !== -1) os = "iOS";

            let ip = "127.0.0.1";
            let city = "Unknown";
            try {
                // We use a free IP API to get the data
                const res = await fetch('https://ipapi.co/json/');
                const data = await res.json();
                ip = data.ip;
                city = `${data.city}, ${data.country_code}`;
            } catch (e) {
                ip = "Hidden/VPN";
            }

            const html = `
                <h1>Session Established</h1>
                <div style="display: grid; grid-template-columns: 100px 1fr; gap: 10px; background: rgba(0,0,0,0.2); padding: 20px; border: 1px solid var(--line-nr);">

                    <div style="color:var(--blue)">USER</div>
                    <div>visitor@${ip}</div>

                    <div style="color:var(--purple)">LOCATION</div>
                    <div>${city}</div>

                    <div style="color:var(--green)">SYSTEM</div>
                    <div>${os} (${platform})</div>

                    <div style="color:var(--yellow)">DISPLAY</div>
                    <div>${width}x${height}px</div>

                    <div style="color:var(--orange)">HARDWARE</div>
                    <div>${cores} Cores</div>

                    <div style="color:var(--red)">LOCALE</div>
                    <div>${lang}</div>
                </div>
                <br>
                <p style="color:var(--comment)">// Agent: ${ua}</p>
                <p>> Access level: <span style="color:var(--green)">GUEST</span> (Read Only)</p>
            `;

            sys.print(html);
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
        desc: "Cycle through themes",
        fn: (args, sys) => {
            const themes = window.THEMES || ['tokyo', 'gruvbox'];

            const current = localStorage.getItem('theme') || themes[0];
            const currentIndex = themes.indexOf(current);
            const nextIndex = (currentIndex + 1) % themes.length;
            const nextTheme = themes[nextIndex];

            window.setTheme(nextTheme);
            sys.print(`<p>System theme updated: <strong style="color:var(--blue)">${nextTheme.toUpperCase()}</strong></p>`);
        }
    },

    'sl': {
        desc: "Don't mistype ls",
        fn: (args, sys) => {
            const train = document.createElement('pre');
            train.style.position = 'fixed';
            train.style.top = 'calc(50% - 100px)';
            train.style.left = '100vw'; // Start off-screen right
            train.style.zIndex = '10000';
            train.style.color = 'var(--fg)'; // Theme adaptive color
            train.style.fontFamily = 'monospace';
            train.style.fontWeight = 'bold';
            train.style.fontSize = '12px';
            train.style.lineHeight = '12px';
            train.style.pointerEvents = 'none';
            train.style.transition = 'transform 6s linear'; // Speed of the train

            // The ASCII Art
            train.innerText = `
      ====        ________                ___________
  _D _|  |_______/        \\__I_I_____===__|_________|
   |(_)---  |   H\\________/ |   |        =|___ ___|     _________________
   /     |  |   H  |  |     |   |         ||_|   |_|   /                |
  |      |  |   H  |__--------------------| [___] |   =|                |
  | ________|___H__/__|_____/[][]~\\_______|       |   -|                |
  |/ |   |-----------I_____I [][] []  D   |=======|____|________________|_
__/ =| o |=-~~\\  /~\\  /~\\  /~\\ ____Y___________|__|_________________|
 |/-=|___|=O=====O=====O=====O   |_____/~\\___/          |_D__D__D_|  D
  \\_/      \\__/  \\__/  \\__/  \\__/      \\_/               \\_/   \\_/   \\_/
            `;

            document.body.appendChild(train);

            // Trigger Animation
            requestAnimationFrame(() => {
                // Calculate distance: Screen width + Train width
                const distance = window.innerWidth + 600;
                train.style.transform = `translateX(-${distance}px)`;
            });

            // Cleanup after animation (6s)
            setTimeout(() => {
                document.body.removeChild(train);
            }, 6000);
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

};
