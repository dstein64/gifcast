gifcast
=======

*gifcast* is a web page that converts
[asciinema](https://github.com/asciinema/asciinema) casts to animated GIFs.

The code runs fully in the browser. That is, there are no server-side calls
to process the cast and/or convert to animated GIF. The implementation is in
JavaScript.

How To Use
----------

*gifcast* expects the asciinema cast to have a `.cast` extension. See below for
instructions on recording an asciinema cast.

To convert an asciinema cast to an animated GIF, navigate to index.html, and load
the cast. The time to process increases with the screen size and duration of the
cast.

*gifcast* is available at
<https://dstein64.github.io/gifcast/>.

### Recording a Cast

Recording requires the `asciinema` program, which runs independently of *gifcast*.

To record an asciinema cast, launch a new recording (`asciinema rec`) to record
your session. Upon terminating your session (`Ctrl-D`), choose to save the cast
to disk, using a `.cast` extension.

License
-------

The source code has an [MIT License](https://en.wikipedia.org/wiki/MIT_License).

See [LICENSE](LICENSE).

Acknowledgments
---------------

*gifcast* depends on code from:

1. [xterm.js](https://github.com/xtermjs/xterm.js)
2. [omggif](https://github.com/deanm/omggif)
