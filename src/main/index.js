const { app, Notification } = require('electron');
const { TrayController } = require('./tray');
const { PanelController } = require('./panel');
const { WidgetController } = require('./widget');
const { DataScheduler } = require('./services/DataScheduler');
const { MarketDataService } = require('./services/MarketDataService');
const { MayerMultipleEngine } = require('./services/MayerMultipleEngine');
const { SignalEngine } = require('./services/SignalEngine');
const { AlertService } = require('./services/AlertService');
const { CacheStore } = require('./services/CacheStore');

app.setLoginItemSettings({ openAtLogin: false });
app.on('window-all-closed', () => { /* keep alive */ });

app.whenReady().then(() => {
  const cache = new CacheStore();
  const market = new MarketDataService();
  const alertService = new AlertService({
    notify: ({ title, body }) => new Notification({ title, body }).show(),
  });

  let state = {
    price: cache.get('price'),
    fearGreed: cache.get('fearGreed'),
    historical: cache.get('historical') || [],
  };

  function currentMayer() {
    const { mayerMultiple } = MayerMultipleEngine.computeFromHistoricalPrices(
      state.historical,
      state.price
    );
    return mayerMultiple;
  }

  const panel = new PanelController();
  const widget = new WidgetController();

  const tray = new TrayController({
    onQuit: () => app.quit(),
    onTogglePanel: () => panel.toggle({
      price: state.price,
      fearGreed: state.fearGreed?.value ?? null,
      mayerMultiple: currentMayer(),
    }),
    onToggleWidget: (enabled) => {
      if (enabled) widget.show();
      else widget.hide();
    },
  });

  function broadcast() {
    const mayer = currentMayer();
    const fg = state.fearGreed?.value ?? null;

    tray.update({ price: state.price, fearGreed: fg, mayerMultiple: mayer });
    panel.update({ price: state.price, fearGreed: fg, mayerMultiple: mayer });
    widget.update({ price: state.price, fearGreed: fg, mayerMultiple: mayer });

    const marketState = SignalEngine.classifyMarketState(fg, mayer);
    const { shouldAlert, type } = SignalEngine.shouldAlert(marketState);
    if (shouldAlert) alertService.trigger(type);
  }

  const scheduler = new DataScheduler({
    fetchPrice: () => market.fetchPrice(),
    fetchFearGreed: () => market.fetchFearGreed(),
    fetchHistorical: () => market.fetchHistoricalPrices(),
  });

  scheduler.on('price-updated', ({ price }) => {
    state.price = price;
    cache.set('price', price);
    broadcast();
  });

  scheduler.on('daily-updated', ({ fearGreed, historical }) => {
    if (fearGreed) { state.fearGreed = fearGreed; cache.set('fearGreed', fearGreed); }
    if (historical) { state.historical = historical; cache.set('historical', historical); }
    broadcast();
  });

  // Render cached state immediately on startup
  if (state.price) broadcast();

  scheduler.start();
});
