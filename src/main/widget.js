const { BrowserWindow, screen } = require('electron');
const path = require('path');

class WidgetController {
  constructor() {
    this._window = null;
  }

  show() {
    if (this._window && !this._window.isDestroyed()) return;
    const { workArea } = screen.getPrimaryDisplay();
    this._window = new BrowserWindow({
      width: 220,
      height: 60,
      x: workArea.x + workArea.width - 230,
      y: workArea.y + 10,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    this._window.loadFile(path.join(__dirname, '../../src/renderer/widget.html'));
    this._window.setAlwaysOnTop(true, 'screen-saver');
  }

  hide() {
    if (this._window && !this._window.isDestroyed()) {
      this._window.close();
    }
    this._window = null;
  }

  update(data) {
    if (this._window && !this._window.isDestroyed()) {
      this._window.webContents.send('data-update', data);
    }
  }

  isVisible() {
    return this._window != null && !this._window.isDestroyed();
  }
}

module.exports = { WidgetController };
