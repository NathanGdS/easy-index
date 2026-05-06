const { BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const { MVRVZScoreEngine } = require('./services/MVRVZScoreEngine');

const FEAR_LABELS = [
  { max: 25, label: 'Extreme Fear' },
  { max: 45, label: 'Fear' },
  { max: 55, label: 'Neutral' },
  { max: 75, label: 'Greed' },
  { max: 100, label: 'Extreme Greed' },
];

const MAYER_LABELS = [
  { max: 0.8, label: 'Undervalued' },
  { max: 1.0, label: 'Fair Value' },
  { max: 1.5, label: 'Elevated' },
  { max: Infinity, label: 'Overheated' },
];

function fearLabel(value) {
  const band = FEAR_LABELS.find(b => value <= b.max);
  return band ? band.label : 'Extreme Greed';
}

function mayerLabel(value) {
  const band = MAYER_LABELS.find(b => value <= b.max);
  return band ? band.label : 'Overheated';
}

class PanelController {
  constructor() {
    this._window = null;
  }

  toggle(data) {
    if (this._window && !this._window.isDestroyed()) {
      this._window.close();
      this._window = null;
      return;
    }
    this._open(data);
  }

  update(data) {
    if (this._window && !this._window.isDestroyed()) {
      this._window.webContents.send('data-update', this._enrichData(data));
    }
  }

  _enrichData({ price, fearGreed, mayerMultiple, marketState = null, mvrvZScore = null }) {
    let mvrvLabel;
    let mvrvColor;
    if (mvrvZScore == null || Number.isNaN(mvrvZScore)) {
      mvrvLabel = '—';
      mvrvColor = 'gray';
    } else {
      const zone = MVRVZScoreEngine.classifyZone(mvrvZScore);
      mvrvLabel = zone.label;
      mvrvColor = zone.color;
    }
    return {
      price,
      fearGreed,
      fearGreedLabel: fearGreed != null ? fearLabel(fearGreed) : null,
      mayerMultiple,
      mayerLabel: mayerMultiple != null ? mayerLabel(mayerMultiple) : null,
      marketState,
      mvrvZScore,
      mvrvLabel,
      mvrvColor,
    };
  }

  _open(data) {
    const { workAreaSize } = screen.getPrimaryDisplay();
    this._window = new BrowserWindow({
      width: 300,
      height: 260,
      x: workAreaSize.width - 310,
      y: workAreaSize.height - 270,
      frame: false,
      resizable: false,
      alwaysOnTop: true,
      skipTaskbar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      },
    });

    this._window.loadFile(path.join(__dirname, '../../src/renderer/panel.html'));
    this._window.on('ready-to-show', () => {
      this._window.webContents.send('data-update', this._enrichData(data));
    });

    this._window.on('blur', () => {
      if (this._window && !this._window.isDestroyed()) {
        this._window.close();
        this._window = null;
      }
    });
  }
}

module.exports = { PanelController, fearLabel, mayerLabel };
