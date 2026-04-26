// Electron mock for Jest (Node environment)
const app = {
  quit: jest.fn(),
  on: jest.fn(),
  whenReady: jest.fn().mockResolvedValue(undefined),
  getPath: jest.fn().mockReturnValue('/tmp'),
  isPackaged: false,
};

const Tray = jest.fn().mockImplementation(() => ({
  setToolTip: jest.fn(),
  setTitle: jest.fn(),
  setContextMenu: jest.fn(),
  on: jest.fn(),
  destroy: jest.fn(),
}));

const Menu = {
  buildFromTemplate: jest.fn().mockReturnValue({}),
};

const BrowserWindow = jest.fn().mockImplementation(() => ({
  loadFile: jest.fn(),
  on: jest.fn(),
  hide: jest.fn(),
  show: jest.fn(),
  close: jest.fn(),
  destroy: jest.fn(),
  isVisible: jest.fn().mockReturnValue(false),
  setAlwaysOnTop: jest.fn(),
  webContents: { send: jest.fn() },
}));

const ipcMain = {
  on: jest.fn(),
  handle: jest.fn(),
};

const Notification = jest.fn().mockImplementation(() => ({
  show: jest.fn(),
}));

const nativeImage = {
  createEmpty: jest.fn().mockReturnValue({}),
  createFromPath: jest.fn().mockReturnValue({}),
};

const screen = {
  getPrimaryDisplay: jest.fn().mockReturnValue({
    workAreaSize: { width: 1920, height: 1080 },
    workArea: { x: 0, y: 0, width: 1920, height: 1080 },
  }),
};

module.exports = {
  app,
  Tray,
  Menu,
  BrowserWindow,
  ipcMain,
  Notification,
  nativeImage,
  screen,
};
