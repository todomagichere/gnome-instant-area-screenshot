# Instant Area Screenshot

A small GNOME Shell extension that changes how area selection works in the built-in
screenshot tool (the one you open with <kbd>Print</kbd>):

- **No leftover rectangle.** When the screenshot UI opens, the previous selection is not
  shown. The whole screen is dimmed until you start dragging.
- **Every drag draws a new area.** Normally, pressing inside the previous selection moves it
  (and pressing on its edges resizes it), so you can't select something *inside* the old
  area without first moving it out of the way. With this extension, any drag starts a fresh
  selection.
- **The screenshot is taken on release.** As soon as you let go of the mouse button, the
  screenshot is saved, just as if you had pressed the capture button. It goes to the
  clipboard and to `~/Pictures/Screenshots` as usual.

## Why

I made this for my own desktop, Ubuntu 26.04 LTS with GNOME Shell 50 on Wayland.

The stock area screenshot tool kept getting in the way. It reopens with
the last rectangle already on screen. Whenever the thing I wanted to capture was inside that
rectangle, pressing there moved the old box instead of starting a new one. Every screenshot
meant dragging the box aside or readjusting it, and then clicking the capture button.

I wanted it to be one gesture: drag over what I want, let go, done.

## Behavior details

Everything else works as in stock GNOME:

- A plain click without dragging doesn't take a screenshot.
- The *Screen* and *Window* modes are unchanged.
- Screen recording is unchanged.

## Compatibility

Tested on **GNOME Shell 50** (Ubuntu 26.04, Wayland).

The extension patches internals of GNOME Shell's screenshot UI (`ui/screenshot.js`), which
aren't a public API. A future GNOME release may change that code and break the extension,
which is why `metadata.json` only declares support for version 50.

## Install

```sh
git clone git@github.com:todomagichere/gnome-instant-area-screenshot.git
cd gnome-instant-area-screenshot
./install.sh
```

`install.sh` copies the extension to `~/.local/share/gnome-shell/extensions/` and tries to
enable it.

On **Wayland**, GNOME Shell only picks up new extensions at login. Log out and back in,
then run:

```sh
gnome-extensions enable instant-area-screenshot@todomagichere
```

On X11 you can restart the shell instead: press <kbd>Alt</kbd>+<kbd>F2</kbd>, type `r` and
press <kbd>Enter</kbd>.

### Loading it without logging out (Wayland)

For the **first** install you can load the extension into the running shell from Looking
Glass. Press <kbd>Alt</kbd>+<kbd>F2</kbd>, type `lg`, press <kbd>Enter</kbd>, and run:

```js
const m = Main.extensionManager, u = 'instant-area-screenshot@todomagichere'; const e = m.createExtensionObject(u, Gio.File.new_for_path(GLib.get_home_dir() + '/.local/share/gnome-shell/extensions/' + u), 2); await m.loadExtension(e); e.state + ' ' + e.error
```

A result of `1` means the extension is active. The extension must already be enabled with
`gnome-extensions enable` or listed in `org.gnome.shell enabled-extensions`.

This doesn't work for updates. GNOME Shell caches the module once it has been loaded, so
after changing the code you have to log out and back in.

## Uninstall

```sh
gnome-extensions disable instant-area-screenshot@todomagichere
rm -rf ~/.local/share/gnome-shell/extensions/instant-area-screenshot@todomagichere
```

## How it works

The extension modifies the screenshot UI's area selector instance
(`Main.screenshotUI._areaSelector`). The changes are undone when the extension is disabled.

| Change | Effect |
| --- | --- |
| `_computeCursorType()` always returns the crosshair | No move/resize cursors, so every press starts a new selection |
| `reset()` collapses and hides the selection | The old rectangle isn't shown when the UI opens |
| `drag-started` handler | Shows the selection rectangle and handles again while dragging |
| `stopDrag()` wrapper | Records whether the mouse actually moved |
| `drag-ended` handler | Calls the UI's capture action when a real drag ended in *Selection* + *Screenshot* mode |

## Without the extension

The stock screenshot UI already lets you start a new selection inside the old one if you drag
while holding <kbd>Ctrl</kbd>, or drag with the right mouse button. It just doesn't hide the
previous area or capture automatically.

## License

[GPL-2.0-or-later](LICENSE), the same license as GNOME Shell.
