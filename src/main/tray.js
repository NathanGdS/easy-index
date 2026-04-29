const { Tray, Menu, nativeImage } = require('electron');
const path = require('path');

const FEAR_EMOJIS = [
  { max: 25, emoji: '😨' },  // Extreme Fear
  { max: 45, emoji: '😟' },  // Fear
  { max: 55, emoji: '😐' },  // Neutral
  { max: 75, emoji: '😏' },  // Greed
  { max: 100, emoji: '🤑' }, // Extreme Greed
];

const SIGNAL_BADGES = {
  STRONG_BUY: '🔵',
  OVERHEATED: '🔴',
  FEARFUL: '🟠',
  GREEDY: '🟡',
  NEUTRAL: '⚪',
};

const FEAR_LABELS_T = [
  { max: 25, label: 'Extreme Fear' },
  { max: 45, label: 'Fear' },
  { max: 55, label: 'Neutral' },
  { max: 75, label: 'Greed' },
  { max: 100, label: 'Extreme Greed' },
];
function fearLabelLocal(v) {
  const b = FEAR_LABELS_T.find(b => v <= b.max);
  return b ? b.label : 'Extreme Greed';
}

const MAYER_LABELS_T = [
  { max: 0.8, label: 'Undervalued' },
  { max: 1.0, label: 'Fair Value' },
  { max: 1.5, label: 'Elevated' },
  { max: Infinity, label: 'Overheated' },
];
function mayerLabelLocal(v) {
  const b = MAYER_LABELS_T.find(b => v <= b.max);
  return b ? b.label : 'Overheated';
}

function formatPrice(price) {
  if (price == null) return '₿---';
  if (price >= 1000) return `₿${Math.round(price / 1000)}K`;
  return `₿${Math.round(price)}`;
}

function fearEmoji(value) {
  if (value == null) return '❓';
  const band = FEAR_EMOJIS.find(b => value <= b.max);
  return band ? band.emoji : '🤑';
}

function formatMayer(value) {
  if (value == null) return '×---';
  return `×${value.toFixed(2)}`;
}

function formatTrayLabel(price, fearGreed, mayerMultiple, marketState) {
  const badge = marketState ? SIGNAL_BADGES[marketState] : null;
  const parts = [];
  if (badge) parts.push(badge);
  parts.push(formatPrice(price));
  if (fearGreed != null) parts.push(`${fearEmoji(fearGreed)}${fearGreed}`);
  if (mayerMultiple != null) parts.push(formatMayer(mayerMultiple));
  return parts.join(' ');
}

function formatTooltip(price, fearGreed, mayerMultiple) {
  const priceStr = price != null ? `$${price.toLocaleString('en-US')}` : '---';
  const fgLabel = fearGreed != null ? fearLabelLocal(fearGreed) : null;
  const fgStr = fearGreed != null ? `${fearGreed}${fgLabel ? ` (${fgLabel})` : ''}` : '---';
  const mStr = mayerMultiple != null ? `×${mayerMultiple.toFixed(2)}${mayerLabelLocal(mayerMultiple) ? ` (${mayerLabelLocal(mayerMultiple)})` : ''}` : '---';
  return `Bitcoin: ${priceStr} | Fear & Greed: ${fgStr} | Mayer: ${mStr}`;
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

  update({ price, fearGreed, mayerMultiple, marketState }) {
    this._tray.setTitle(formatTrayLabel(price, fearGreed, mayerMultiple, marketState));
    this._tray.setToolTip(formatTooltip(price, fearGreed, mayerMultiple));
  }

  destroy() {
    this._tray.destroy();
  }
}

module.exports = { TrayController, formatPrice, fearEmoji, formatMayer, formatTrayLabel };
