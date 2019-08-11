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

To convert an asciinema cast to an animated GIF, navigate to index.html, load
the cast, select a size, and click *Render*.

*gifcast* is available at
<https://dstein64.github.io/gifcast/>.

### Recording a Cast

Recording requires the `asciinema` program, which runs independently of *gifcast*.

To record an asciinema cast, launch a new recording for your session, and terminate
the session with `Ctrl-D`.

```sh
$ asciinema rec PATH/FILENAME.cast
```

Example
-------

The animated GIF below was generated with *gifcast*.

<img src="https://github.com/dstein64/gifcast/blob/master/example.gif?raw=true" width="800"/>

License
-------

The source code has an [MIT License](https://en.wikipedia.org/wiki/MIT_License).

See [LICENSE](LICENSE).

Acknowledgments
---------------

*gifcast* depends on code from:

1. [xterm.js](https://github.com/xtermjs/xterm.js)
2. [omggif](https://github.com/deanm/omggif)
