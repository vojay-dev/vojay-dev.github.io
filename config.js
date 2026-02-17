const config = {
    title: "root@vjanz:~",
    startPage: "home",

    files: [
        "home",
        "about",
        "photos",
        "archive"
    ],

    links: [
        { label: "LinkedIn",  url: "https://linkedin.com/in/vjanz",      icon: "fab fa-linkedin" },
        { label: "GitHub",    url: "https://github.com/vojay-dev",       icon: "fab fa-github" },
        { label: "Medium",    url: "https://medium.com/@vojay",          icon: "fab fa-medium" },
        { label: "X",         url: "https://twitter.com/vojaydev",       icon: "fab fa-x-twitter" },
        { label: "Instagram", url: "https://instagram.com/vojay.io",     icon: "fab fa-instagram" }
    ],

    alpha: {
        title: "vojay",
        titleColor: "var(--blue)",
        titleAccent: ".io",
        titleAccentColor: "var(--comment)",
        subtitle: "Developer Advocate and Data Engineer",
        subtitleColor: "var(--comment)",
        actions: [
            { key: 'h', icon: 'fas fa-home',     label: 'Home',   cmd: 'home' },
            { key: 'a', icon: 'fas fa-user',     label: 'About',  cmd: 'about' },
            { key: 'p', icon: 'fas fa-camera',   label: 'Photos', cmd: 'photos' },
            { key: '?', icon: 'fas fa-terminal', label: 'Help',   cmd: ':help' },
            { key: 's', icon: 'fas fa-database', label: 'SQL',    cmd: ':sql' },
            { key: 'g', icon: 'fas fa-gamepad',  label: 'Snake',  cmd: ':snake' },
        ]
    },

    meta: {
        description: "Developer Advocate & Data Engineer",
        ogImage: "images/og-image.png",
        favicon: "images/favicon.ico",
        favicon32: "images/favicon-32x32.png",
    },

    analytics: {
        enabled: true,
        googleId: 'G-Y1D1YZJQ7T'
    },

    repo: {
        url: 'https://github.com/vojay-dev/vojay-dev.github.io',
        branch: 'main'
    },

    contact: {
        email: 'volker@janz.sh'
    },

    blog: {
        enabled: true,
        manifestPath: 'posts/posts.json',
        postsDir: 'posts'
    },

    themes: ['tokyo', 'gruvbox', 'dracula', 'cyberpunk', 'latte'],
    defaultTheme: 'tokyo',
};
