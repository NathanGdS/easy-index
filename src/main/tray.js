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
  constructor({ onQuit, onTogglePanel, onToggleWidget, startupService }) {
    const iconPath = path.join(__dirname, '../../src/assets/bitcoin.png');
    const icon = nativeImage.createFromPath(iconPath).resize({ width: 16, height: 16 });
    this._tray = new Tray(icon);
    this._onTogglePanel = onTogglePanel;
    this._onQuit = onQuit;
    this._onToggleWidget = onToggleWidget;
    this._widgetEnabled = false;
    this._startupService = startupService || null;

    this._tray.on('click', () => this._onTogglePanel());
    this._buildMenu();
  }

  _buildMenu() {
    const items = [
      {
        label: this._widgetEnabled ? 'Hide Widget' : 'Show Widget',
        click: () => {
          this._widgetEnabled = !this._widgetEnabled;
          this._onToggleWidget(this._widgetEnabled);
          this._buildMenu();
        },
      },
    ];

    if (this._startupService) {
      items.push({
        label: 'Start at login',
        type: 'checkbox',
        checked: this._startupService.isEnabled(),
        click: () => {
          this._startupService.setEnabled(!this._startupService.isEnabled());
          this._buildMenu();
        },
      });
    }

    items.push({ type: 'separator' });
    items.push({ label: 'Quit', click: () => this._onQuit() });

    const menu = Menu.buildFromTemplate(items);
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
