// *************************************************
// * Utils
// *************************************************

const base64 = function(buffer) {
    const bytes = new Uint8Array(buffer);
    const chars = [];
    for (let i = 0; i < bytes.byteLength; ++i) {
        chars[i] = String.fromCharCode(bytes[i]);
    }
    return btoa(chars.join(''));
};

// has_font takes a font name and returns true if the font is available to the browser.
// The function signature is not immediately clear from the line of code that follows
// this comment, as the function is constructed as a closure returned by calling an
// anonymous function.
//   has_font signature:
//     boolean has_font(string name);
const has_font = function() {
    // First check if document.fonts.check is available and works as expected.
    // As of 2020/08/04, document.fonts.check does not work on Firefox:
    //   https://bugzilla.mozilla.org/show_bug.cgi?id=1252821
    let fonts_api_available = false;
    try {
        const fake_status = document.fonts.check('12px font_name_that_does_not_exist');
        const monospace_status = document.fonts.check('12px monospace');
        fonts_api_available = !fake_status && monospace_status;
    } catch {}

    // If document.fonts.check is not viable (or returns false, per comment below),
    // use an approach that checks for font availability by 1) creating a <span>
    // with the specified font, using a generic font as a fallback, and seeing if
    // the width or height differs from a <span> constructed with the generic font.

    // Generic fonts from: https://www.w3.org/TR/CSS2/fonts.html#generic-font-families
    const generic_fonts = ['serif', 'sans-serif', 'cursive', 'fantasy', 'monospace'];
    const string = 'The quick brown fox jumps over the lazy dog';
    const body = document.body;
    const span = document.createElement('span');
    span.style.fontSize = '72px';
    span.innerHTML = string;
    const width_lookup = {};
    const height_lookup = {};
    for (const generic_font of generic_fonts) {
        span.style.fontFamily = generic_font;
        body.appendChild(span);
        width_lookup[generic_font] = span.offsetWidth;
        height_lookup[generic_font] = span.offsetHeight;
        body.removeChild(span);
    }

    function closure(font) {
        if (generic_fonts.includes(font))
            return true;
        // As of 2020/08/04, document.fonts.check('12px courier') returns false
        // on Chrome on Ubuntu, even when the font is available. Only rely on this
        // approach when the API worked as expected above, and check() returns true.
        if (fonts_api_available && document.fonts.check('12px ' + font))
            return true;
        for (const generic_font of generic_fonts) {
            span.style.fontFamily = font + ', ' + generic_font;
            body.appendChild(span);
            const matched = span.offsetWidth !== width_lookup[generic_font]
                || span.offsetHeight !== height_lookup[generic_font];
            body.removeChild(span);
            if (matched) return true;
        }
        return false;
    }

    return closure;
}();

// *************************************************
// * Core
// *************************************************

// Multiple of size to determine padding in pixels.
const PADDING_FACTOR = 0.5;

const BASE_PALETTE = [
    0x000000, 0x800000, 0x008000, 0x808000, 0x000080, 0x800080, 0x008080, 0xc0c0c0,
    0x808080, 0xff0000, 0x00ff00, 0xffff00, 0x0000ff, 0xff00ff, 0x00ffff, 0xffffff,
    0x000000, 0x00005f, 0x000087, 0x0000af, 0x0000d7, 0x0000ff, 0x005f00, 0x005f5f,
    0x005f87, 0x005faf, 0x005fd7, 0x005fff, 0x008700, 0x00875f, 0x008787, 0x0087af,
    0x0087d7, 0x0087ff, 0x00af00, 0x00af5f, 0x00af87, 0x00afaf, 0x00afd7, 0x00afff,
    0x00d700, 0x00d75f, 0x00d787, 0x00d7af, 0x00d7d7, 0x00d7ff, 0x00ff00, 0x00ff5f,
    0x00ff87, 0x00ffaf, 0x00ffd7, 0x00ffff, 0x5f0000, 0x5f005f, 0x5f0087, 0x5f00af,
    0x5f00d7, 0x5f00ff, 0x5f5f00, 0x5f5f5f, 0x5f5f87, 0x5f5faf, 0x5f5fd7, 0x5f5fff,
    0x5f8700, 0x5f875f, 0x5f8787, 0x5f87af, 0x5f87d7, 0x5f87ff, 0x5faf00, 0x5faf5f,
    0x5faf87, 0x5fafaf, 0x5fafd7, 0x5fafff, 0x5fd700, 0x5fd75f, 0x5fd787, 0x5fd7af,
    0x5fd7d7, 0x5fd7ff, 0x5fff00, 0x5fff5f, 0x5fff87, 0x5fffaf, 0x5fffd7, 0x5fffff,
    0x870000, 0x87005f, 0x870087, 0x8700af, 0x8700d7, 0x8700ff, 0x875f00, 0x875f5f,
    0x875f87, 0x875faf, 0x875fd7, 0x875fff, 0x878700, 0x87875f, 0x878787, 0x8787af,
    0x8787d7, 0x8787ff, 0x87af00, 0x87af5f, 0x87af87, 0x87afaf, 0x87afd7, 0x87afff,
    0x87d700, 0x87d75f, 0x87d787, 0x87d7af, 0x87d7d7, 0x87d7ff, 0x87ff00, 0x87ff5f,
    0x87ff87, 0x87ffaf, 0x87ffd7, 0x87ffff, 0xaf0000, 0xaf005f, 0xaf0087, 0xaf00af,
    0xaf00d7, 0xaf00ff, 0xaf5f00, 0xaf5f5f, 0xaf5f87, 0xaf5faf, 0xaf5fd7, 0xaf5fff,
    0xaf8700, 0xaf875f, 0xaf8787, 0xaf87af, 0xaf87d7, 0xaf87ff, 0xafaf00, 0xafaf5f,
    0xafaf87, 0xafafaf, 0xafafd7, 0xafafff, 0xafd700, 0xafd75f, 0xafd787, 0xafd7af,
    0xafd7d7, 0xafd7ff, 0xafff00, 0xafff5f, 0xafff87, 0xafffaf, 0xafffd7, 0xafffff,
    0xd70000, 0xd7005f, 0xd70087, 0xd700af, 0xd700d7, 0xd700ff, 0xd75f00, 0xd75f5f,
    0xd75f87, 0xd75faf, 0xd75fd7, 0xd75fff, 0xd78700, 0xd7875f, 0xd78787, 0xd787af,
    0xd787d7, 0xd787ff, 0xd7af00, 0xd7af5f, 0xd7af87, 0xd7afaf, 0xd7afd7, 0xd7afff,
    0xd7d700, 0xd7d75f, 0xd7d787, 0xd7d7af, 0xd7d7d7, 0xd7d7ff, 0xd7ff00, 0xd7ff5f,
    0xd7ff87, 0xd7ffaf, 0xd7ffd7, 0xd7ffff, 0xff0000, 0xff005f, 0xff0087, 0xff00af,
    0xff00d7, 0xff00ff, 0xff5f00, 0xff5f5f, 0xff5f87, 0xff5faf, 0xff5fd7, 0xff5fff,
    0xff8700, 0xff875f, 0xff8787, 0xff87af, 0xff87d7, 0xff87ff, 0xffaf00, 0xffaf5f,
    0xffaf87, 0xffafaf, 0xffafd7, 0xffafff, 0xffd700, 0xffd75f, 0xffd787, 0xffd7af,
    0xffd7d7, 0xffd7ff, 0xffff00, 0xffff5f, 0xffff87, 0xffffaf, 0xffffd7, 0xffffff,
    0x080808, 0x121212, 0x1c1c1c, 0x262626, 0x303030, 0x3a3a3a, 0x444444, 0x4e4e4e,
    0x585858, 0x626262, 0x6c6c6c, 0x767676, 0x808080, 0x8a8a8a, 0x949494, 0x9e9e9e,
    0xa8a8a8, 0xb2b2b2, 0xbcbcbc, 0xc6c6c6, 0xd0d0d0, 0xdadada, 0xe4e4e4, 0xeeeeee,
];

// Some themes are from VS code, with the VS-specific themes excluded.
// These include:
//   abyss, dark, high contrast, kimbie dark, light, monokai, monokai dimmed,
//   quiet light, red, solarized dark, solarized light, tomorrow night blue
// Data are from the corresponding JSON files
// * E.g., https://github.com/microsoft/vscode/blob/master/extensions/
//                 theme-abyss/themes/abyss-color-theme.json
// * ANSI colors are from the 'terminal.*' settings.
// * background is from 'editor.background'
// * foreground is from 'editor.foreground' when available
//   otherwise #333333 for light themes, #CCCCCC for dark themes,
//   and #FFFFFF for high contrast themes
// * cursor is from 'editorCursor.foreground' when available
//   otherwise use the same value used for foreground
// * cursorAccent is the same value used for background
// * selection is from 'editor.selectionBackground' when available
//   (excluding alpha channel)
//   otherwise #000040 for light themes, #FFFF40 for dark themes,
//   and #FFFF80 for high contrast themes
// Some themes are contributions from pull requests:
//  gruvbox dark, gruvbox light (PR #5)
const THEMES = {
    abyss: {
              black: '#111111',          red: '#ff9da4',       green: '#d1f1a9',       yellow: '#ffeead',
               blue: '#bbdaff',       purple: '#ebbbff',        cyan: '#99ffff',        white: '#cccccc',
        brightBlack: '#333333',    brightRed: '#ff7882', brightGreen: '#b8f171', brightYellow: '#ffe580',
         brightBlue: '#80baff', brightPurple: '#d778ff',  brightCyan: '#78ffff',  brightWhite: '#ffffff',
         background: '#000c18',   foreground: '#6688cc',      cursor: '#ddbb88', cursorAccent: '#000c18',
          selection: '#770811',
    },
    dark: {
         background: '#1e1e1e',   foreground: '#d4d4d4',      cursor: '#d4d4d4', cursorAccent: '#1e1e1e',
          selection: '#ffff40',
    },
    gruvbox_dark: {
              black: '#282828',          red: '#cc241d',       green: '#98971a',       yellow: '#d79921',
               blue: '#458588',       purple: '#b16286',        cyan: '#689d6a',        white: '#a89984',
        brightBlack: '#928374',    brightRed: '#fb4934', brightGreen: '#b8bb26', brightYellow: '#fabd2f',
         brightBlue: '#83a598', brightPurple: '#d3869b',  brightCyan: '#8ec07c',  brightWhite: '#ebdbb2',
         background: '#282828',   foreground: '#ebdbb2',      cursor: '#ebdbb2', cursorAccent: '#002451',
          selection: '#003f8e',
    },
    gruvbox_light: {
              black: '#fbf1c7',          red: '#cc241d',       green: '#98971a',       yellow: '#d79921',
               blue: '#458588',       purple: '#b16286',        cyan: '#689d6a',        white: '#a89984',
        brightBlack: '#928374',    brightRed: '#fb4934', brightGreen: '#b8bb26', brightYellow: '#fabd2f',
         brightBlue: '#83a598', brightPurple: '#d3869b',  brightCyan: '#8ec07c',  brightWhite: '#ebdbb2',
         background: '#fbf1c7',   foreground: '#3c3836',      cursor: '#002451', cursorAccent: '#ebdbb2',
          selection: '#a89984',
    },
    high_contrast: {
         background: '#000000',   foreground: '#ffffff',      cursor: '#ffffff', cursorAccent: '#000000',
          selection: '#ffff80',
    },
    kimbie_dark: {
         background: '#221a0f',   foreground: '#d3af86',      cursor: '#d3af86', cursorAccent: '#221a0f',
          selection: '#84613d',
    },
    light: {
         background: '#ffffff',   foreground: '#000000',      cursor: '#000000', cursorAccent: '#ffffff',
          selection: '#000040',
    },
    monokai: {
              black: '#333333',          red: '#c4265e',       green: '#86b42b',       yellow: '#b3b42b',
               blue: '#6a7ec8',       purple: '#8c6bc8',        cyan: '#56adbc',        white: '#e3e3dd',
        brightBlack: '#666666',    brightRed: '#f92672', brightGreen: '#a6e22e', brightYellow: '#e2e22e',
         brightBlue: '#819aff', brightPurple: '#ae81ff',  brightCyan: '#66d9ef',  brightWhite: '#f8f8f2',
         background: '#272822',   foreground: '#f8f8f2',      cursor: '#f8f8f0', cursorAccent: '#272822',
          selection: '#878b91',
    },
    monokai_dimmed: {
              white: '#ffffff',
         background: '#1e1e1e',   foreground: '#c5c8c6',      cursor: '#c07020', cursorAccent: '#1e1e1e',
          selection: '#676b71',
    },
    quiet_light: {
         background: '#f5f5f5',   foreground: '#333333',      cursor: '#54494b', cursorAccent: '#f5f5f5',
          selection: '#c9d0d9',
    },
    red: {
         background: '#390000',   foreground: '#f8f8f8',      cursor: '#970000', cursorAccent: '#390000',
          selection: '#750000',
    },
    solarized_dark: {
              black: '#073642',          red: '#dc322f',       green: '#859900',       yellow: '#b58900',
               blue: '#268bd2',       purple: '#d33682',        cyan: '#2aa198',        white: '#eee8d5',
        brightBlack: '#586e75',    brightRed: '#cb4b16', brightGreen: '#586e75', brightYellow: '#657b83',
         brightBlue: '#839496', brightPurple: '#6c71c4',  brightCyan: '#93a1a1',  brightWhite: '#fdf6e3',
         background: '#002b36',   foreground: '#cccccc',      cursor: '#d30102', cursorAccent: '#002b36',
          selection: '#274642',
    },
    solarized_light: {
              black: '#073642',          red: '#dc322f',       green: '#859900',       yellow: '#b58900',
               blue: '#268bd2',       purple: '#d33682',        cyan: '#2aa198',        white: '#eee8d5',
        brightBlack: '#586e75',    brightRed: '#cb4b16', brightGreen: '#586e75', brightYellow: '#657b83',
         brightBlue: '#839496', brightPurple: '#6c71c4',  brightCyan: '#93a1a1',  brightWhite: '#eee8d5',
         background: '#fdf6e3',   foreground: '#333333',      cursor: '#657b83', cursorAccent: '#fdf6e3',
          selection: '#eee8d5',
    },
    tomorrow_night_blue: {
              black: '#111111',          red: '#ff9da4',       green: '#d1f1a9',       yellow: '#ffeead',
               blue: '#bbdaff',       purple: '#ebbbff',        cyan: '#99ffff',        white: '#cccccc',
        brightBlack: '#333333',    brightRed: '#ff7882', brightGreen: '#b8f171', brightYellow: '#ffe580',
         brightBlue: '#80baff', brightPurple: '#d778ff',  brightCyan: '#78ffff',  brightWhite: '#ffffff',
         background: '#002451',   foreground: '#ffffff',      cursor: '#ffffff', cursorAccent: '#002451',
          selection: '#003f8e',
    },
};

const FONT_CANDIDATES = function() {
    // WARN: Checking for font availability (with either document.fonts.check or using
    //   the DOM) is slow on some browsers/platforms (e.g., around 30ms per font when
    //   experimenting on Chrome on Linux for the first call, and negligible latency
    //   for subsequent calls with the same font). Keep this list small to reduce the
    //   latency.
    // The list of monospace fonts was primarily constructed by checking which fonts from
    //   https://en.wikipedia.org/wiki/List_of_typefaces#Monospace
    // are available on Ubuntu, Windows, or Mac.
    // Fonts listed on Wikipedia:
    //   andale mono, arial monospaced, bitstream vera, consolas, courier, courier new,
    //   dejavu sans mono, droid sans mono, everson mono, fira mono, fira code, fixed,
    //   fixedsys, hyperfont, ibm plex mono, inconsolata, letter gothic, liberation mono,
    //   lucida console, lucida sans typewriter, lucida typewriter, menlo, micr, monaco,
    //   monospace, ms gothic, ms mincho, nimbus mono l, ocr-a, ocr-b, pragmatapro,
    //   prestige, prestige elite, profont, proggy clean, proggy square, proggy small,
    //   proggy tiny, roboto mono, simhei, simsun, source code pro, terminal, ubuntu mono,
    //   vera sans mono
    let set = new Set();
    let ubuntu_fonts = [
        'courier new', 'dejavu sans mono', 'liberation mono', 'monospace', 'ms gothic',
        'simhei', 'simsun', 'ubuntu mono'
    ];
    ubuntu_fonts.forEach(set.add, set);
    let windows_fonts = [
        'consolas', 'courier', 'courier new', 'lucida console', 'lucida sans typewriter',
        'monospace', 'ms gothic simsun'
    ];
    windows_fonts.forEach(set.add, set);
    let mac_fonts = [
        'andale mono', 'courier', 'courier new', 'dejavu sans mono', 'menlo', 'monaco',
        'monospace'
    ];
    mac_fonts.forEach(set.add, set);
    // Also add two monospace fonts from /system/fonts on Android. Specifying these makes
    // them available from Firefox for Android, but not Chrome for Android.
    let android_fonts = ['cutive mono', 'droid sans mono'];
    android_fonts.forEach(set.add, set);
    // Lastly, make sure that the generic 'monospace' font is available.
    set.add('monospace');
    let fonts = Array.from(set);
    fonts.sort();
    return fonts;
}();

// Converts a color string (e.g., 003f8e) to its corresponding integer.
const int = function(string) {
    const r = parseInt(string.substring(1, 3), 16);
    const g = parseInt(string.substring(3, 5), 16);
    const b = parseInt(string.substring(5, 7), 16);
    return (r << 16) + (g << 8) + b;
};

// Calculates the squared distance between two hex colors.
const distance2 = function(color1, color2) {
    const r1 = color1 >> 16;
    const g1 = (color1 & 0x00ff00) >> 8;
    const b1 = color1 & 0x0000ff;
    const r2 = color2 >> 16;
    const g2 = (color2 & 0x00ff00) >> 8;
    const b2 = color2 & 0x0000ff;
    return Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
};

// Returns the index of the color in haystack that is closest to needle.
// 'exclude' is an optional argument specifying a Set() of indices to skip in the haystack.
const closest = function(needle, haystack, exclude) {
    let min = Infinity;
    let idx = -1;
    for (let i = 0; i < haystack.length; ++i) {
        if (exclude && exclude.has(idx)) continue;
        const candidate = haystack[i];
        const dist = distance2(needle, candidate);
        if (dist >= min) continue;
        min = dist;
        idx = i;
    }
    return idx;
};

// Returns a palette that contains the required set of colors. Required colors are
// included in the palette by replacing close colors in the BASE_PALETTE.
const get_palette = function(required) {
    const palette = [...BASE_PALETTE];
    const req = Array.from(new Set(required)).slice(0, palette.length);
    const exclude = new Set();
    for (const color of req) {
        let idx = closest(color, palette, exclude);
        exclude.add(idx);
        palette[idx] = color;
    }
    return palette;
};

// Given a set of pixels, quantize each to the index of the nearest
// pixel in the specified palette.
const quantize = function(pixels, palette) {
    const color_code = {};
    for (let i = 0; i < palette.length; ++i) {
        color_code[palette[i]] = i;
    }
    const colors = Array.from(new Set(pixels));
    for (let i = 0; i < colors.length; ++i) {
        const color = colors[i];
        if (color in color_code) continue;
        // Find the closest color
        color_code[color] = closest(color, BASE_PALETTE);
    }
    const indexed_pixels = [];
    for (let i = 0; i < pixels.length; ++i) {
        indexed_pixels[i] = color_code[pixels[i]];
    }
    return indexed_pixels;
};

const header_palette_theme = function(header_palette) {
    let colors = header_palette.split(':');
    if (colors.length === 8)
        colors = colors.concat(colors);
    const theme = {
        black: colors[0],
        red: colors[1],
        green: colors[2],
        yellow: colors[3],
        blue: colors[4],
        purple: colors[5],
        cyan: colors[6],
        white: colors[7],
        brightBlack: colors[8],
        brightRed: colors[9],
        brightGreen: colors[10],
        brightYellow: colors[11],
        brightBlue: colors[12],
        brightPurple: colors[13],
        brightCyan: colors[14],
        brightWhite: colors[15],
    };
    return theme;
};

// Extract frames from the asciinema cast file events.
const extract_frames = function(events) {
    const frames = [{time: 0.0, data: ''}];
    for (let i = 0; i < events.length; ++i) {
        const [time, type, data] = events[i];
        if (type !== 'o') continue;
        frames.push({
            time: time,
            data: data,
        });
    }
    // Add a delay field.
    for (let i = 1; i < frames.length; ++i) {
        frames[i - 1].delay = frames[i].time - frames[i - 1].time;
    }
    frames[frames.length - 1].delay = 0.0;
    return frames;
};

// Merge frames that are less than a hundredth of a second.
// The reasons for this are 1) to satisfy GIF specs, 2) speed
// processing time, and 3) allow for more accurate playback
// speed (it seems that times less than .01 second playback
// for longer than they're supposed to, probably due to GIF
// specs).
const merge_frames = function(frames) {
    if (frames.length === 0) return frames;
    frames.reverse();
    const merged = [];
    while (frames.length > 0) {
        merged.push(frames.pop());
        while (merged[merged.length - 1].delay < .01 && frames.length > 0) {
            const short = merged[merged.length - 1];
            const addition = frames.pop();
            short.data += addition.data;
            short.delay += addition.delay;
        }
    }
    return merged;
};

// Parse a cast file. Return an object with a header and a list of events.
// Includes error-checking.
const parse_cast = function(cast) {
    const lines = cast.split(/\r?\n/);
    if (lines.length === 0) throw Error('Invalid file.');
    let header = null;
    try {
        header = JSON.parse(lines[0]);  // throws a SyntaxError
    } catch(e) {
        throw Error('Error parsing JSON.');
    }
    if (header.version !== 2) throw Error('gifcast only supports asciinema cast version 2.');
    const events = [];
    for (let i = 1; i < lines.length; ++i) {
        const line = lines[i];
        if (!line) continue;
        try {
            events.push(JSON.parse(line));
        } catch(e) {
            throw Error('Error parsing JSON.');
        }
    }
    const output = {header: header, events: events};
    return output;
};

// asciicast file format (version 2) is specified at:
//   https://github.com/asciinema/asciinema/blob/develop/doc/asciicast-v2.md

const TermRunner = function(parent, options, cast) {
    // Callback before term running
    this.oninit = function() {};

    // Callback for each step of term running
    this.onstep = function(state) {};

    // Callback after successful term running
    this.onsuccess = function() {};

    // Callback after failed term running
    this.onerror = function(message) {};

    const run = () => {
        let header, events;
        try {
            ({header, events} = parse_cast(cast));
        } catch(e) {
            this.onerror(e.message);
            return;
        }

        let frames = merge_frames(extract_frames(events));

        // Writing text to the xterm.js terminal is asynchronous.
        // To workaround this, iteration is conducted with the
        // onRender callback. Each time the terminal is rendered,
        // the GIF is updated, and another frame (more text) is pushed
        // for processing. Iteration starts with the initial onRender
        // that is called when the terminal is opened.

        const theme = JSON.parse(JSON.stringify(THEMES[options.theme] || {}));

        if (options.theme === 'none' && 'theme' in header) {
            // It appears that there is no way to set cursor, cursorAccent, and selection
            // in the asciicast file format (version 2).
            const header_theme = header.theme;
            if ('fg' in header_theme) theme.foreground = header_theme.fg;
            if ('bg' in header_theme) theme.background = header_theme.bg;
            if ('palette' in header_theme)
                Object.assign(theme, header_palette_theme(header_theme.palette));
        }

        // xtermjs scales the canvas depending on devicePixelRatio. Adjust for this so
        // that the generated GIF size is independent of devicePixelRatio.
        const font_size = options.size / window.devicePixelRatio;  // non-integer values seems to work

        const cols = header.width;
        const rows = header.height;
        const config = {
            cols: cols,
            rows: rows,
            cursorBlink: false,
            allowTransparency: false,
            theme: theme,
            fontSize: font_size,
            minimumContrastRatio: options.contrast_gain,
            fontFamily: options.font + ', monospace',
        };
        // Cursor can possibly be 'none', which is not a valid setting for xtermjs.
        if (['bar', 'block', 'underline'].includes(options.cursor)) {
            config.cursorStyle = options.cursor;
            config.cursorInactiveStyle = options.cursor;
        }
        const term = new Terminal(config);
        term.loadAddon(new CanvasAddon.CanvasAddon());

        // 'idx' is the index of the frame being processed. Frames are written to
        // the terminal at the end of process(), except for the initial frame, which
        // is written at the beginning to start the process.
        let idx = 0;
        const process = () => {
            // Don't process if there is more buffered data to write.
            if (term._core._writeBuffer._writeBuffer.length > 0) {
                term.write('');  // trigger another rendering
                return;
            }
            const text_canvas = parent.getElementsByClassName('xterm-text-layer')[0];
            const cursor_canvas = parent.getElementsByClassName('xterm-cursor-layer')[0];
            if (text_canvas.height !== cursor_canvas.height
                    || text_canvas.width !== cursor_canvas.width) {
                // The code assumes that the text canvas and cursor canvas are the same size.
                this.onerror('Canvas size mismatch.');
                return;
            }

            const padding = Math.ceil(PADDING_FACTOR * options.size);

            const px_per_row = text_canvas.height / rows;
            const px_per_col = text_canvas.width / cols;

            const shaved_rows = rows - options.shave.top - options.shave.bottom;
            if (shaved_rows <= 0) {
                let msg = 'Not enough rows.';
                if (options.shave.top > 0 || options.shave.bottom > 0)
                    msg += ' Try to decrease the shave quantities.';
                this.onerror(msg);
                return;
            }
            const shaved_cols = cols - options.shave.left - options.shave.right;
            if (shaved_cols <= 0) {
                let msg = 'Not enough columns.';
                if (options.shave.left > 0 || options.shave.right > 0)
                    msg += ' Try to decrease the shave quantities.';
                this.onerror(msg);
                return;
            }

            const width = shaved_cols * px_per_col;
            const height = shaved_rows * px_per_row;

            const canvas = parent.ownerDocument.createElement('canvas');
            const padded_width = width + 2 * padding;
            const padded_height = height + 2 * padding;

            canvas.width = padded_width;
            canvas.height = padded_height;
            const context = canvas.getContext('2d');
            context.fillStyle = theme.background;
            context.fillRect(0, 0, padded_width, padded_height);

            const source_x = options.shave.left * px_per_col;
            const source_y = options.shave.top * px_per_row;
            context.drawImage(
                text_canvas,
                source_x, source_y, width, height,
                padding, padding, width, height);
            if (options.cursor !== 'none') {
                context.drawImage(
                    cursor_canvas,
                    source_x, source_y, width, height,
                    padding, padding, width, height);
            }
            const state = {
                idx: idx,
                delay: frames[idx].delay,
                num_frames: frames.length,
                canvas: canvas,
                config: config
            }
            this.onstep(state);

            if (idx >= frames.length - 1) {
                this.onsuccess();
                setTimeout(function() {
                    term.dispose();
                });
                return;
            }

            term.write(frames[++idx].data);
        };

        term.onRender(process);
        term.open(parent);
        // Set <textarea readonly> so that a screen keyboard doesn't pop-up on mobile devices.
        const textareas = parent.getElementsByTagName('textarea');
        for (let i = 0; i < textareas.length; ++i) {
            textareas[i].readOnly = true;
        }
        // Have to focus to get the cursor to show up (even a blurred cursor won't show up without
        // this).
        term.focus();
        term.write(frames[0].data);
    };

    this.run = function() {
        // Utilize the event loop message queue with setTimeout to process oninit first.
        setTimeout(this.oninit);
        setTimeout(run);
    };
};

const GifRenderer = function(parent, options, cast) {
    // Callback before running
    this.oninit = function() {};

    // Callback for each progress update
    this.onprogress = function(percent) {};

    // Callback after successful GIF generated
    this.onsuccess = function(data_url) {};

    // Callback after failure
    this.onerror = function(message) {};

    const run = () => {
        const term_runner = new TermRunner(parent, options, cast);
        const bytes = [];
        // This is initialized later, when we have the actual dimensions available.
        let gif = null;
        // This is initialized later, when we have the colors. If a theme was already
        // selected, we'd know the colors here. But when theme=none, it's possible for
        // colors to be specified in the cast header, which hasn't been parsed yet.
        let palette = null;

        term_runner.oninit = this.oninit;
        term_runner.onstep = (state) => {
            const context = state.canvas.getContext('2d');
            const width = state.canvas.width;
            const height = state.canvas.height;
            const data = context.getImageData(0, 0, width, height).data;
            const pixels = [];
            for (let i = 0; i < width * height; ++i) {
                const r = data[i * 4];
                const g = data[i * 4 + 1];
                const b = data[i * 4 + 2];
                const color = (r << 16) + (g << 8) + b;
                pixels[i] = color;
            }
            if (palette === null) {
                const required = [];
                for (const value of Object.values(state.config.theme)) {
                    required.push(int(value));
                }
                palette = get_palette(required);
            }
            const indexed_pixels = quantize(pixels, palette);
            let delay = state.delay;
            if (gif === null) {
                // Set 'loop' to 0 to continuously loop. Set 'loop' to
                // undefined to not loop. Set 'loop' to N to loop N times.
                let gopts_loop;
                if (typeof options.play_count === 'number'
                        && !Number.isFinite(options.play_count))
                    gopts_loop = 0
                else if (options.play_count === 1)
                    gopts_loop = undefined;
                else if (options.play_count > 1)
                    gopts_loop = options.play_count - 1;
                else
                    throw Error('Invalid play count.');
                const gopts = {palette: palette, loop: gopts_loop};
                gif = new GifWriter(bytes, width, height, gopts);
            }
            let gif_delay = delay * 100;  // convert seconds to milliseconds
            if (Number.isFinite(options.idle_limit_min)) {
                // convert milliseconds to centiseconds
                gif_delay = Math.max(gif_delay, options.idle_limit_min / 10);
            }
            if (Number.isFinite(options.idle_limit_max)) {
                // convert milliseconds to centiseconds
                gif_delay = Math.min(gif_delay, options.idle_limit_max / 10);
            }
            const opts = {delay: gif_delay};
            gif.addFrame(0, 0, width, height, indexed_pixels, opts);
            const percent = 100.0 * (state.idx + 1) / state.num_frames;
            this.onprogress(percent);
        };
        term_runner.onsuccess = () => {
            const b64 = base64(bytes);
            const data_url = 'data:image/gif;base64,' + b64;
            this.onsuccess(data_url);
        };
        term_runner.onerror = this.onerror;
        term_runner.run(cast);
    };

    this.run = function() {
        // Utilize the event loop message queue with setTimeout to process oninit first.
        setTimeout(this.oninit);
        setTimeout(run);
    };
};

const PngRenderer = function(parent, options, cast) {
    // Callback before running
    this.oninit = function() {};

    // Callback for each progress update
    this.onprogress = function(percent) {};

    // Callback after successful PNG generated
    this.onsuccess = function(data_url, width, height) {};

    // Callback after failure
    this.onerror = function(message) {};

    const run = () => {
        const term_runner = new TermRunner(parent, options, cast);
        term_runner.oninit = this.oninit;
        let last_state = null;
        term_runner.onstep = (state) => {
            last_state = state;
            const percent = 100.0 * (state.idx + 1) / state.num_frames;
            this.onprogress(percent);
        };
        term_runner.onsuccess = () => {
            const width = last_state.canvas.width;
            const height = last_state.canvas.height;
            const data_url = last_state.canvas.toDataURL('image/png');
            this.onsuccess(data_url, width, height);
        };
        term_runner.onerror = this.onerror;
        term_runner.run(cast);
    };

    this.run = function() {
        // Utilize the event loop message queue with setTimeout to process oninit first.
        setTimeout(this.oninit);
        setTimeout(run);
    };
};

// *************************************************
// * DOM Manipulation
// *************************************************

// Creates a DOM element, attached to the document, for running a terminal.
// This should be removed with remove_terminal_element().
const create_terminal_element = function() {
    const terminal = document.createElement('div');
    document.body.appendChild(terminal);
    // The following settings make the terminal invisible and not
    // affect the layout of the page. 'display: none' does not work
    // since the terminal does not get rendered.
    terminal.style.position = 'fixed';
    terminal.style.bottom = '0';
    terminal.style.right = '0';
    terminal.style.opacity = '0';
    terminal.style.zIndex = '-1';
    return terminal;
};

const remove_terminal_element = function(terminal) {
    terminal.parentElement.removeChild(terminal);
};

const get_options = function() {
    const size = Number.parseInt(document.getElementById('size').value);
    const contrast_gain = Number.parseInt(
        document.getElementById('contrast_gain').value);
    const cursor = document.getElementById('cursor').value;
    let font = document.getElementById('font').value;
    if (!font) {
        font = 'monospace';
    }
    const idle_limit_min = Number.parseInt(document.getElementById('idle_limit_min').value);
    const idle_limit_max = Number.parseInt(document.getElementById('idle_limit_max').value);
    const play_count = Number.parseInt(document.getElementById('play_count').value);
    const shave = {};
    for (const pos of ['top', 'left', 'bottom', 'right']) {
        shave[pos] = Number.parseInt(document.getElementById('shave_' + pos).value);
    }
    const theme = document.getElementById('theme').value;
    const options = {
        size: size,
        contrast_gain: contrast_gain,
        cursor: cursor,
        font: font,
        idle_limit_min: idle_limit_min,
        idle_limit_max: idle_limit_max,
        play_count: play_count,
        shave: shave,
        theme: theme,
    };
    return options;
};

// Using a <fieldset> provides a way to enable and disable all form inputs
// and buttons together.
const enable_fieldset = function(enabled) {
    if (enabled === undefined) enabled = true;
    document.getElementById('fieldset').disabled = !enabled;
};

const enable_render_button = function(enabled) {
    if (enabled === undefined) enabled = true;
    document.getElementById('render_button').disabled = !enabled;
};

// Used for updating progress, with a specification for the delay in
// milliseconds (to prevent rapid updates).
const ProgressSetter = function(delay = 200) {
    let last_set_time = null;
    this.set = (percent) => {
        const time = new Date().getTime();
        if (percent !== 100.0 || last_set_time !== null) {
            const diff = time - last_set_time;
            if (diff < delay) return;
        }
        const string = percent.toFixed(1);
        document.getElementById('progress').value = string;
        const progress_text = string + '%';
        document.getElementById('progress_text').innerText = progress_text;
        last_set_time = time;
    }
};

const show_loading = function() {
    const loading = document.getElementById('loading');
    loading.style.visibility = 'visible';
    loading.scrollIntoView();
};

const hide_loading = function() {
    document.getElementById('loading').style.visibility = null;
};

const ImgModal = function(parent) {
    const SRC = 'data:,';
    const ESC_KEY = 'Escape';
    const HIDDEN_STYLE = 'none';
    const SHOWN_STYLE = 'initial';

    const doc = parent.ownerDocument;
    const span = doc.createElement('span');
    span.id = 'close';
    span.innerHTML = '&times;';
    parent.appendChild(span);
    const div = doc.createElement('div');
    div.id = 'modal_inner';
    parent.appendChild(div);
    const img = doc.createElement('img');
    img.id = 'img';
    div.appendChild(img);

    this.show = function(src) {
        img.src = src;
        parent.style.display = SHOWN_STYLE;
    };

    this.hide = function() {
        img.src = SRC;
        parent.style.display = HIDDEN_STYLE;
    };

    span.onclick = () => {
        this.hide();
    };

    parent.onclick = () => {
        this.hide();
    };

    img.onclick = function(event) {
        // Prevent the click from being passed to the modal element.
        event.stopPropagation();
    };

    doc.addEventListener('keyup', (event) => {
        if (event.key === ESC_KEY && parent.style.display === SHOWN_STYLE) {
            this.hide();
        }
    });
};

const modal = new ImgModal(document.getElementById('modal'));

// A cache is used in order to prevent the rendering logic from running when an
// image was created and we can reuse it.
const Cache = function() {
    let valid = false;
    let data = null;

    this.valid = function() {
        return valid;
    };

    this.invalidate = function() {
        valid = false;
    };

    this.set = function(value) {
        valid = true;
        data = value;
    };

    this.get = function() {
        return valid ? data : null;
    };
};

const cache = new Cache();

// Set callback to invalidate state when any option is changed.
document.getElementById('options').onchange = function(e) {
    cache.invalidate();
};

// Populate the font dropdown menu and font examples.
FONT_CANDIDATES.forEach((font) => {
    const font_dropdown = document.getElementById('font');
    const font_examples = document.getElementById('font_examples');
    const num_candidates = FONT_CANDIDATES.length;
    // Checking for font availability can be slow. Use an asynchronous callback
    // for each font so that the UI is not blocked. The ordering is maintained
    // since Javascript event loop events are processed in FIFO order.
    setTimeout(() => {
        if (has_font(font)) {
            // Add a dropdown option.
            const option = document.createElement('option');
            option.text = font;
            if (font === 'monospace')
                option.selected = true;
            font_dropdown.appendChild(option);
            // Add an example.
            const row = document.createElement('tr');
            const key = document.createElement('td');
            key.innerText = font;
            const val = document.createElement('td');
            val.style.fontFamily = font;
            val.innerText = 'The quick brown fox jumps over the lazy dog';
            row.appendChild(key);
            row.appendChild(val);
            row.appendChild(val);
            font_examples.getElementsByTagName('tbody')[0].appendChild(row);
        }
        // Enable dropdown after processing the last candidate.
        if (num_candidates > 0 && font === FONT_CANDIDATES[num_candidates - 1]) {
            font_dropdown.removeChild(document.getElementById('initial_font'));
            font_dropdown.disabled = false;
        }
    }, 0);
});

// Populate the theme dropdown menu.
{
    const theme_element = document.getElementById('theme');
    const themes = Object.keys(THEMES);
    themes.push('none');
    const value_and_text = [];
    for (let i = 0; i < themes.length; ++i) {
        value_and_text.push({
            value: themes[i],
            text: themes[i].replace(/_/g, ' ')
        });
    }
    value_and_text.sort((a, b) => {
        return a.text.localeCompare(b.text);
    });
    for (let i = 0; i < value_and_text.length; ++i) {
        const {value, text} = value_and_text[i];
        const option = document.createElement('option');
        option.value = value;
        option.text = text;
        if (value === 'none')
            option.selected = true;
        theme_element.appendChild(option);
    }
}

// Populate the theme preview grid.
{
    const preview_cast = function(name, light) {
        const lines = [
            '{"version": 2, "width": 24, "height": 9}',
            `[0.00, "o", "\\u001b[m\\u001b[3${light ? 8 : 7}m// ${name}\\u001b[m\\r\\n"]`,
            '[0.00, "o", "\\u001b[m\\r\\n"]',
            '[0.00, "o", "\\u001b[m\\u001b[35m#include \\u001b[m\\u001b[31m<stdio.h>\\u001b[m\\r\\n"]',
            '[0.00, "o", "\\u001b[m\\r\\n"]',
            '[0.00, "o", "\\u001b[m\\u001b[32mint\\u001b[m main(\\u001b[32mvoid\\u001b[m) {\\r\\n"]',
            '[0.00, "o", "\\u001b[m  printf(\\u001b[31m\\"hello \\"\\u001b[m);\\r\\n"]',
            '[0.00, "o", "\\u001b[m  printf(\\u001b[31m\\"world\\u001b[m\\u001b[35m\\\\n"]',
            '[0.00, "o", "\\u001b[m\\u001b[31m\\"\\u001b[m);\\r\\n"]',
            '[0.00, "o", "\\u001b[m  \\u001b[33mreturn\\u001b[m \\u001b[31m0\\u001b[m;\\r\\n"]',
            '[0.00, "o", "\\u001b[m}"]'
        ]
        return lines.join('\n');
    };
    let generated = false;
    document.getElementById('theme_grid_link').ontoggle = function(e) {
        if (e.target.open && !generated) {
            generated = true;
            const theme_grid = document.getElementById('theme_grid');
            const themes = Object.keys(THEMES);
            const generate_preview = (idx) => {
                if (idx >= themes.length) return;
                const theme = themes[idx];
                const text = theme.replace(/_/g, ' ');
                const options = {
                    size: 40,
                    contrast_gain: 1,
                    theme: theme,
                    font_family: 'monospace',
                    cursor: 'block',
                    shave: {top: 0, left: 0, bottom: 0, right: 0},
                };
                const terminal = create_terminal_element();
                const cast = preview_cast(text, text.endsWith('light'));
                const png_renderer = new PngRenderer(terminal, options, cast);
                png_renderer.onsuccess = function(data_url, width, height) {
                    remove_terminal_element(terminal);
                    const img = document.createElement('img');
                    img.src = data_url;
                    img.style.width = (width / 2).toString();
                    theme_grid.appendChild(img);
                    generate_preview(idx + 1);
                };
                png_renderer.onerror = function(message) {
                    remove_terminal_element(terminal);
                    document.getElementById('theme_grid_link').open = false;
                    alert(message);
                    generated = false;
                };
                png_renderer.run();
            };
            generate_preview(0);
        }
    };
}

document.getElementById('file_selector').onchange = function(e) {
    const files = e.currentTarget.files;
    const enabled = FileReader && files && files.length > 0;
    enable_render_button(enabled);
};

document.getElementById('render_button').onclick = function(e) {
    if (cache.valid()) {
        modal.show(cache.get());
        return false;
    }

    // Ensure an input element has a non-negative integer.
    const validateInt = function(element, min=0, value=0) {
        let x = Number.parseFloat(element.value);
        // Convert to integer.
        if (Number.isFinite(x) && !Number.isInteger(x)) {
            x = Math.round(x);
        }
        // Convert empty or invalid to specified value.
        if (!Number.isFinite(x)) {
            x = value;
        }
        // Convert negative to specified value.
        if (x < 0) {
            x = value;
        }
        element.value = x.toString();
    }

    // Ensure that idle limits are valid.
    validateInt(document.getElementById('idle_limit_min'), 0, '');
    validateInt(document.getElementById('idle_limit_max'), 0, '');
    const min = document.getElementById('idle_limit_min').value;
    const max = document.getElementById('idle_limit_max').value;
    if (min !== '' && max !== '') {
        // Make sure that min is not greater than max.
        document.getElementById('idle_limit_min').value = Math.min(min, max);
    }
    // Ensure that play_count option is valid.
    validateInt(document.getElementById('play_count'), 1, '');
    // Ensure that shave inputs are valid.
    for (const pos of ['top', 'left', 'bottom', 'right']) {
        validateInt(document.getElementById('shave_' + pos), 0, 0);
    }
    const file_selector = document.getElementById('file_selector');
    const files = file_selector.files;
    if (!FileReader || !files || !files.length) {
        alert('Error loading file.');
        return false;
    }
    const reader = new FileReader();
    reader.onload = function() {
        const progress_setter = new ProgressSetter();
        const options = get_options();
        const terminal = create_terminal_element();
        const gif_renderer = new GifRenderer(terminal, options, reader.result);
        gif_renderer.oninit = function() {
            show_loading();
            progress_setter.set(0.0);
            enable_fieldset(false);
        };
        gif_renderer.onprogress = function(percent) {
            progress_setter.set(percent);
        };
        gif_renderer.onsuccess = function(data_url) {
            remove_terminal_element(terminal);
            hide_loading();
            enable_fieldset();
            modal.show(data_url);
            cache.set(data_url);
        };
        gif_renderer.onerror = function(message) {
            remove_terminal_element(terminal);
            alert(message);
            hide_loading();
            enable_fieldset();
        };
        gif_renderer.run();
    };
    reader.readAsText(files[0]);
    return false;
};

// Force a page reload when gifcast is loaded from cache. This prevents an issue on
// Firefox, where clicking the back button to return to gifcast results in no file
// selected with the render button enabled if a file was selected earlier.
window.addEventListener('pageshow', (e) => {
    if (e.persisted)
        window.location.reload();
});
