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
            // You can use the config.links array here if you want to be dynamic
            let html = `<h1>Social Uplinks</h1><ul>`;

            // Assuming 'config' is globally available (it is)
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
            sys.print(""); // Prints empty string
        }
    },

    'q': {
        desc: "Close the current buffer",
        fn: (args, sys) => {
            sys.closeBuffer();
        }
    }

};
