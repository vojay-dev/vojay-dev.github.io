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
    }
};
