const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

const FEAR_EMOJIS = [
  { max: 25, emoji: '😨' },  // Extreme Fear
  { max: 45, emoji: '😟' },  // Fear
  { max: 55, emoji: '😐' },  // Neutral
  { max: 75, emoji: '😏' },  // Greed
  { max: 100, emoji: '🤑' }, // Extreme Greed
];

function formatPrice(price) {
  if (price == null) return '₿ ---';
  if (price >= 1000) return `₿ ${Math.round(price / 1000)}K`;
  return `₿ ${Math.round(price)}`;
}

function fearEmoji(value) {
  if (value == null) return '❓';
  const band = FEAR_EMOJIS.find(b => value <= b.max);
  return band ? band.emoji : '🤑';
}

function formatMayer(value) {
  if (value == null) return 'M ---';
  return `M ${value.toFixed(2)}`;
}

class TrayController {
  constructor({ onQuit, onTogglePanel, onToggleWidget }) {
    const icon = nativeImage.createEmpty();
    this._tray = new Tray(icon);
    this._onTogglePanel = onTogglePanel;
    this._onQuit = onQuit;
    this._onToggleWidget = onToggleWidget;
    this._widgetEnabled = false;

    this._tray.on('click', () => this._onTogglePanel());
    this._buildMenu();
  }

  _buildMenu() {
    const menu = Menu.buildFromTemplate([
      {
        label: this._widgetEnabled ? 'Hide Widget' : 'Show Widget',
        click: () => {
          this._widgetEnabled = !this._widgetEnabled;
          this._onToggleWidget(this._widgetEnabled);
          this._buildMenu();
        },
      },
      { type: 'separator' },
      { label: 'Quit', click: () => this._onQuit() },
    ]);
    this._tray.setContextMenu(menu);
  }

  update({ price, fearGreed, mayerMultiple }) {
    const parts = [formatPrice(price)];
    if (fearGreed != null) parts.push(`${fearEmoji(fearGreed)} ${fearGreed}`);
    if (mayerMultiple != null) parts.push(formatMayer(mayerMultiple));
    this._tray.setTitle(parts.join(' | '));
    this._tray.setToolTip(parts.join(' | '));
  }

  destroy() {
    this._tray.destroy();
  }
}

module.exports = { TrayController, formatPrice, fearEmoji, formatMayer };
