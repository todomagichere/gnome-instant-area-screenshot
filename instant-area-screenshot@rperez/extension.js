import Clutter from 'gi://Clutter';
import GLib from 'gi://GLib';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';

export default class InstantAreaScreenshotExtension extends Extension {
    enable() {
        const ui = Main.screenshotUI;
        const selector = ui._areaSelector;

        // Never move or resize the previous selection: any press starts a new one.
        selector._computeCursorType = () => Clutter.CursorType.CROSSHAIR;

        // A plain click (no drag) keeps the stock behaviour and doesn't capture.
        const origStopDrag = Object.getPrototypeOf(selector).stopDrag;
        selector.stopDrag = function () {
            this._instantWasDrag = Boolean(this._dragButton) &&
                (this._lastX !== this._startX || this._lastY !== this._startY);
            origStopDrag.call(this);
        };

        // Don't show the previous selection when the UI opens: dim the whole
        // screen until a new selection is dragged.
        const handles = [
            selector._topLeftHandle, selector._topRightHandle,
            selector._bottomLeftHandle, selector._bottomRightHandle,
        ];
        const origReset = Object.getPrototypeOf(selector).reset;
        selector.reset = function () {
            origReset.call(this);
            this._areaIndicator.setSelectionRect(0, 0, 0, 0);
            this._areaIndicator._selectionRect.hide();
            handles.forEach(h => h.hide());
        };
        selector.reset();

        this._dragStartedId = selector.connect('drag-started', () => {
            selector._areaIndicator._selectionRect.show();
            handles.forEach(h => h.show());
        });

        this._dragEndedId = selector.connect('drag-ended', () => {
            if (!selector._instantWasDrag ||
                !ui._selectionButton.checked || !ui._shotButton.checked)
                return;

            this._idleId = GLib.idle_add(GLib.PRIORITY_DEFAULT, () => {
                this._idleId = 0;
                ui._onCaptureButtonClicked().catch(logError);
                return GLib.SOURCE_REMOVE;
            });
        });
    }

    disable() {
        const selector = Main.screenshotUI._areaSelector;

        if (this._idleId) {
            GLib.source_remove(this._idleId);
            this._idleId = 0;
        }
        selector.disconnect(this._dragStartedId);
        selector.disconnect(this._dragEndedId);
        delete selector.reset;
        selector._areaIndicator._selectionRect.show();
        [
            selector._topLeftHandle, selector._topRightHandle,
            selector._bottomLeftHandle, selector._bottomRightHandle,
        ].forEach(h => h.show());
        selector._updateSelectionRect();
        delete selector._computeCursorType;
        delete selector.stopDrag;
        delete selector._instantWasDrag;
    }
}
