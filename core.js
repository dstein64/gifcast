const base64 = function(buffer) {
    const bytes = new Uint8Array(buffer);
    const chars = [];
    for (let i = 0; i < bytes.byteLength; ++i) {
        chars[i] = String.fromCharCode(bytes[i]);
    }
    return btoa(chars.join(''));
};

// Amount of padding in pixels around terminal.
const PADDING = 10;

// TODO: Use a separate palette for each frame, based on the colors in the frame.
//       This will still require quantization to reduce the number of colors to
//       256 or less (as required for GIF), perhaps using k-means color quantization.
const PALETTE = [
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

const COLOR_CODE = {};
for (let i = 0; i < PALETTE.length; ++i) {
    COLOR_CODE[PALETTE[i]] = i;
}

// Default theme for xterm.js. Overridden with values from cast file.
// Does not include background, foreground, cursor, cursorAccent, nor
// selection. These are either set automatically in the code, or not set.
const THEME = {
    black: '#000000',
    red: '#800000',
    green: '#008000',
    yellow: '#808000',
    blue: '#000080',
    purple: '#800080',
    cyan: '#008080',
    white: '#c0c0c0',
    brightBlack: '#808080',
    brightRed: '#ff0000',
    brightGreen: '#00ff00',
    brightYellow: '#ffff00',
    brightBlue: '#0000ff',
    brightPurple: '#ff00ff',
    brightCyan: '#00ffff',
    brightWhite: '#ffffff',
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

// Given a set of pixels, quantize each to the index of the nearest
// pixel in the global PALETTE.
const quantize = function(pixels) {
    const palette = Array.from(new Set(pixels));
    const color_code = {};
    for (let i = 0; i < palette.length; ++i) {
        const color = palette[i];
        if (color in COLOR_CODE) {
            color_code[color] = COLOR_CODE[color];
            continue;
        }
        // Find the closest color
        let min = Infinity;
        let idx = 0;
        for (let j = 0; j < PALETTE.length; ++j) {
            const candidate = PALETTE[j];
            const dist = distance2(color, candidate);
            if (dist >= min) continue;
            min = dist;
            idx = j;
        }
        color_code[color] = idx;
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

const enable_file_selector = function() {
    document.getElementById('file_selector').disabled = false;
};

const disable_file_selector = function() {
    document.getElementById('file_selector').disabled = true;
};

const set_progress = function(percent) {
    // Use floor so 100% won't show prematurely.
    document.getElementById('progress').value = Math.floor(percent);
};

const show_loading = function() {
    document.getElementById('loading').style.display = 'initial';
};

const hide_loading = function() {
    document.getElementById('loading').style.display = 'none';
};

const set_rendered_image = function(src) {
    document.getElementById('rendered').src = src;
};

// DOM manipulations before rendering (e.g., show loading bar)
const init_render = function() {
    set_rendered_image('');
    show_loading();
    set_progress(0.0);
    disable_file_selector();
};

// DOM manipulations after successful rendering (e.g., hide loading bar)
const end_render_success = function(img_src) {
    set_rendered_image(img_src);
    hide_loading();
    enable_file_selector();
};

// Alert and DOM manipulations after failed rendering
const end_render_fail = function(message) {
    alert(message);
    hide_loading();
    enable_file_selector();
};

// asciicast file format (version 2) is specified at:
//   https://github.com/asciinema/asciinema/blob/develop/doc/asciicast-v2.md

const render = function(cast) {
    init_render();
    const lines = cast.split(/\r?\n/);
    if (lines.length === 0) {
        end_render_fail('Error loading file');
        return;
    }
    const header = JSON.parse(lines[0]);
    if (header.version !== 2) {
        end_render_fail('Error loading file');
        return;
    }

    let frames = [{time: 0.0, data: ''}];
    for (let i = 1; i < lines.length; ++i) {
        const line = lines[i];
        if (!line) continue;
        let time, type, data;
        [time, type, data] = JSON.parse(line);
        if (type !== 'o') continue;
        frames[i] = {
            time: time,
            data: data,
        };
    }

    // Add a delay field.
    for (let i = 1; i < frames.length; ++i) {
        frames[i - 1].delay = frames[i].time - frames[i - 1].time;
    }
    frames[frames.length - 1].delay = 0.0;

    const bytes = [];
    const gif = new GifWriter(bytes, 1, 1, {palette: PALETTE, loop: 0});  // loop forever

    // Writing text to the xterm.js terminal is asynchronous.
    // To workaround this, iteration is conducted with the
    // onRender callback. Each time the terminal is rendered,
    // the GIF is updated, and another frame (more text) is pushed
    // for processing. Iteration starts with the initial onRender
    // that is called when the terminal is opened.

    const theme = JSON.parse(JSON.stringify(THEME));
    if ('theme' in header) {
        const header_theme = header.theme;
        if ('fg' in header_theme) theme.foreground = header_theme.fg;
        if ('bg' in header_theme) theme.background = header_theme.bg;
        if ('palette' in header_theme)
            Object.assign(theme, header_palette_theme(header_theme.palette))
    }

    theme.background = theme.background || theme.black;
    theme.foreground = theme.foreground || theme.brightWhite;
    theme.cursor = theme.cursor || theme.white;
    theme.cursorAccent = theme.cursorAccent || theme.white;
    theme.selection = theme.selection || theme.white;

    // xtermjs scales the canvas depending on devicePixelRatio. Adjust for this so
    // that the generated GIF size is independent of devicePixelRatio.
    const fontSize = 30 / window.devicePixelRatio;  // non-integer values seems to work

    const config = {
        cols: header.width,
        rows: header.height,
        cursorStyle: 'block',
        cursorBlink: false,
        allowTransparency: false,
        theme: theme,
        fontSize: fontSize,
    };
    const term = new Terminal(config);

    console.log(frames.length);

    let idx = 0;  // index of frame being processed
    // index of the last frame added to the GIF (some frames skipped)
    // (not necessarily idx - 1, since some frames are skipped)
    let gif_idx = -1;
    const process = function() {
        term.focus();  // to make cursor visible
        const text_canvas = document.getElementsByClassName('xterm-text-layer')[0];
        const cursor_canvas = document.getElementsByClassName('xterm-cursor-layer')[0];

        const canvas = document.createElement('canvas');
        const width = text_canvas.width + 2 * PADDING;
        const height = text_canvas.height + 2 * PADDING;

        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext('2d');
        context.fillStyle = theme.background;
        context.fillRect(0, 0, width, height);

        context.drawImage(
            text_canvas, PADDING, PADDING, text_canvas.width, text_canvas.height);
        context.drawImage(
            cursor_canvas, PADDING, PADDING, cursor_canvas.width, cursor_canvas.height);

        const data = context.getImageData(0, 0, width, height).data;
        const pixels = [];
        for (let i = 0; i < width * height; ++i) {
            const r = data[i * 4];
            const g = data[i * 4 + 1];
            const b = data[i * 4 + 2];
            const color = (r << 16) + (g << 8) + b;
            pixels[i] = color;
        }
        const indexed_pixels = quantize(pixels);

        let delay = frames[idx].delay;
        const time = frames[idx].time;

        // Add time from frames that were skipped in the GIF
        if (gif_idx >= 0) {
            delay += time - (frames[gif_idx].time + frames[gif_idx].delay);
        }

        // Only add frames to GIF when:
        //   1) frame will show for more than a hundredth of a second
        //   2) it's the final frame
        if (delay >= .01 || idx >= frames.length) {
            // omggif expects centi-seconds
            const gif_delay = delay * 100;
            const opts = {delay: gif_delay};
            gif.addFrame(0, 0, width, height, indexed_pixels, opts);
            gif_idx = idx;
        }

        percent = 100.0 * (idx + 1) / (frames.length + 1);
        set_progress(percent);

        if (idx >= frames.length - 1) {
            // TODO: Put GIF in an overlay
            const b64 = base64(bytes);
            const src = 'data:image/gif;base64,' + b64;
            end_render_success(src);
            setTimeout(function() {
                term.dispose();
            });
            return;
        }

        let frame = frames[++idx];
        term.write(frame.data);
    };

    term.onRender(process);
    term.open(document.getElementById('terminal'));
};

document.getElementById('file_selector').onchange = function(e) {
    const files = e.currentTarget.files;
    if (!FileReader || !files || !files.length) {
        return;
    }
    const reader = new FileReader();
    reader.onload = function() {
        render(reader.result);
    };
    reader.readAsText(files[0]);
};
