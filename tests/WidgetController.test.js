const { BrowserWindow } = require('electron');
const { WidgetController } = require('../src/main/widget');

describe('WidgetController', () => {
  let widget;

  beforeEach(() => {
    BrowserWindow.mockClear();
    widget = new WidgetController();
  });

  describe('update()', () => {
    it('caches data even when window is not open', () => {
      const data = { price: 50000, fearGreed: 30, mayerMultiple: 1.2 };
      widget.update(data);
      expect(widget._lastData).toEqual(data);
    });

    it('sends data to open window', () => {
      widget.show();
      const mockWin = BrowserWindow.mock.results[0].value;
      const data = { price: 50000 };
      widget.update(data);
      expect(mockWin.webContents.send).toHaveBeenCalledWith('data-update', data);
    });
  });

  describe('show() — did-finish-load replay', () => {
    it('sends cached data when window finishes loading', () => {
      const data = { price: 50000, fearGreed: 30, mayerMultiple: 1.2 };
      widget.update(data);
      widget.show();

      const mockWin = BrowserWindow.mock.results[0].value;
      const call = mockWin.webContents.on.mock.calls.find(([e]) => e === 'did-finish-load');
      expect(call).toBeDefined();
      call[1]();
      expect(mockWin.webContents.send).toHaveBeenCalledWith('data-update', data);
    });

    it('does not send when no cached data', () => {
      widget.show();
      const mockWin = BrowserWindow.mock.results[0].value;
      const call = mockWin.webContents.on.mock.calls.find(([e]) => e === 'did-finish-load');
      call[1]();
      expect(mockWin.webContents.send).not.toHaveBeenCalled();
    });

    it('does not open second window if already visible', () => {
      widget.show();
      widget.show();
      expect(BrowserWindow).toHaveBeenCalledTimes(1);
    });
  });
});
