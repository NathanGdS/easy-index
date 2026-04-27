const { BrowserWindow, screen } = require('electron');
const path = require('path');

class WidgetController {
  constructor() {
    this._window = null;
    this._lastData = null;
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

    this._window.webContents.on('did-finish-load', () => {
      if (this._lastData) {
        this._window.webContents.send('data-update', this._lastData);
      }
    });

    this._window.on('closed', () => { this._window = null; });
  }

  hide() {
    if (this._window && !this._window.isDestroyed()) {
      this._window.close();
    }
    this._window = null;
  }

  update(data) {
    this._lastData = data;
    if (this._window && !this._window.isDestroyed()) {
      this._window.webContents.send('data-update', data);
    }
  }

  isVisible() {
    return this._window != null && !this._window.isDestroyed();
  }
}

module.exports = { WidgetController };
