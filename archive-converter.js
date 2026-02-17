/**
 * JekyllConverter — Converts Jekyll/Liquid markdown to standard markdown
 * compatible with the Marked.js rendering pipeline.
 *
 * Handles: frontmatter stripping, highlight blocks, site.baseurl image paths,
 * target="_blank" attributes, block callouts, raw/endraw blocks.
 */
class JekyllConverter {
    /**
     * Language aliases used in Jekyll highlight blocks.
     */
    static LANG_MAP = {
        'py': 'python',
        'sh': 'bash',
        'js': 'javascript',
    };

    /**
     * Callout class → emoji prefix mapping for block attributes.
     */
    static CALLOUT_MAP = {
        'tip': '💡 **Tip:**',
        'note': '📝 **Note:**',
        'warning': '⚠️ **Warning:**',
        'important': '❗ **Important:**',
    };

    /**
     * Convert Jekyll markdown to standard markdown.
     * @param {string} text - Raw Jekyll markdown content
     * @returns {string} Standard markdown compatible with Marked.js
     */
    static convert(text) {
        let result = text;

        result = JekyllConverter.stripFrontmatter(result);
        result = JekyllConverter.convertHighlightBlocks(result);
        result = JekyllConverter.convertRawBlocks(result);
        result = JekyllConverter.convertImagePaths(result);
        result = JekyllConverter.convertTargetBlank(result);
        result = JekyllConverter.convertCallouts(result);

        return result;
    }

    /**
     * Strip YAML frontmatter delimited by --- at start of file.
     */
    static stripFrontmatter(text) {
        return text.replace(/^---\n[\s\S]*?\n---\n/, '');
    }

    /**
     * Convert {% highlight lang %} ... {% endhighlight %} to fenced code blocks.
     */
    static convertHighlightBlocks(text) {
        return text.replace(
            /\{%\s*highlight\s+(\w+)\s*%\}\n?([\s\S]*?)\{%\s*endhighlight\s*%\}/g,
            (_, lang, code) => {
                const normalizedLang = JekyllConverter.LANG_MAP[lang] || lang;
                const trimmedCode = code.replace(/\n$/, '');
                return '```' + normalizedLang + '\n' + trimmedCode + '\n```';
            }
        );
    }

    /**
     * Strip {% raw %} and {% endraw %} tags, keeping their content.
     */
    static convertRawBlocks(text) {
        return text
            .replace(/\{%\s*raw\s*%\}\n?/g, '')
            .replace(/\{%\s*endraw\s*%\}\n?/g, '');
    }

    /**
     * Replace {{site.baseurl}}/images/ with _backup/images/ for local serving.
     */
    static convertImagePaths(text) {
        return text.replace(/\{\{site\.baseurl\}\}\//g, '_backup/');
    }

    /**
     * Remove {:target="_blank"} link attributes (engine.js handles external links).
     */
    static convertTargetBlank(text) {
        return text.replace(/\{:target="_blank"\}/g, '');
    }

    /**
     * Convert {: .classname } block attributes to styled blockquotes.
     */
    static convertCallouts(text) {
        return text.replace(
            /\{:\s*\.(\w+)\s*\}\n(.+)/g,
            (_, cls, content) => {
                const prefix = JekyllConverter.CALLOUT_MAP[cls] || '';
                return prefix ? `> ${prefix} ${content}` : content;
            }
        );
    }

    /**
     * Extract frontmatter as an object (for metadata access).
     * @param {string} text - Raw Jekyll markdown
     * @returns {object} Parsed frontmatter fields
     */
    static extractFrontmatter(text) {
        const match = text.match(/^---\n([\s\S]*?)\n---/);
        if (!match) return {};

        const meta = {};
        match[1].split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > 0) {
                const key = line.slice(0, idx).trim();
                let val = line.slice(idx + 1).trim();
                // Strip surrounding quotes
                if ((val.startsWith("'") && val.endsWith("'")) ||
                    (val.startsWith('"') && val.endsWith('"'))) {
                    val = val.slice(1, -1);
                }
                meta[key] = val;
            }
        });
        return meta;
    }
}

// Expose globally
window.JekyllConverter = JekyllConverter;
