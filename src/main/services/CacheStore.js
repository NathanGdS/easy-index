const path = require('path');
const fs = require('fs');

const CACHE_FILE = path.join(
  process.env.APPDATA || process.env.HOME || '.',
  'easy-index',
  'cache.json'
);

class CacheStore {
  constructor(filePath = CACHE_FILE) {
    this._filePath = filePath;
    this._data = this._load();
  }

  _load() {
    try {
      const dir = path.dirname(this._filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      if (!fs.existsSync(this._filePath)) return {};
      return JSON.parse(fs.readFileSync(this._filePath, 'utf8'));
    } catch (_) {
      return {};
    }
  }

  _save() {
    try {
      fs.writeFileSync(this._filePath, JSON.stringify(this._data, null, 2));
    } catch (_) {}
  }

  get(key) {
    return this._data[key] ?? null;
  }

  set(key, value) {
    this._data[key] = value;
    this._save();
  }
}

module.exports = { CacheStore };
