gifcast
=======

*gifcast* is a web page that converts
[asciinema](https://github.com/asciinema/asciinema) casts to animated GIFs.

The code runs fully in the browser. That is, there are no server-side calls
to process the cast and/or convert to animated GIF. The implementation is in
JavaScript.

How To Use
----------

To convert an asciinema cast to an animated GIF, navigate to index.html,
load the cast, and click *Render*. The time to process increases with the
size and duration of the cast.

The page is available at
<https://dstein64.github.io/gifcast/>.

Screenshots
-----------

### Selection/Instructions

![Select](screenshots/select.png)

### Rendered

![Rendered](screenshots/rendered.png)

License
-------

The source code has an [MIT License](https://en.wikipedia.org/wiki/MIT_License).

See [LICENSE](LICENSE).

Acknowledgments
---------------

*gifcast* depends on code from:

1. [xterm.js](https://github.com/xtermjs/xterm.js)
2. [omggif](https://github.com/deanm/omggif)
