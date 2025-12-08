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
                <p><strong>User:</strong> visitor@internet</p>
                <p><strong>Role:</strong> Guest</p>
                <p><strong>Access Level:</strong> Read-Only</p>
                <br>
                <blockquote>"I am a visitor, browsing the portfolio of Volker Janz."</blockquote>
            `);
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
        desc: "Wake up, Neo... (Tokyo Night Edition)",
        fn: (args, sys) => {
            const canvas = document.createElement('canvas');
            Object.assign(canvas.style, {
                position: 'fixed', top: '0', left: '0',
                width: '100vw', height: '100vh', zIndex: '99999',
                background: '#1a1b26', // Theme BG Color
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
                // Fade effect using Theme BG with low opacity
                ctx.fillStyle = 'rgba(26, 27, 38, 0.1)';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Theme Blue Text
                ctx.fillStyle = '#7aa2f7';
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
