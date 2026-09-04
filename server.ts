import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

const DATA_DIR = path.join(process.cwd(), 'data');
const CATALOG_FILE = path.join(DATA_DIR, 'catalog.json');
const DEFAULT_CATALOG_FILE = path.join(process.cwd(), 'src', 'data', 'all_numbers.json');
const CONFIG_FILE = path.join(DATA_DIR, 'admin_config.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Ensure catalog file exists, initialize with default if not
function getCatalogData() {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const content = fs.readFileSync(CATALOG_FILE, 'utf8');
      return JSON.parse(content);
    } else if (fs.existsSync(DEFAULT_CATALOG_FILE)) {
      const content = fs.readFileSync(DEFAULT_CATALOG_FILE, 'utf8');
      const data = JSON.parse(content);
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(data, null, 2), 'utf8');
      return data;
    }
  } catch (err) {
    console.error('Error reading catalog file:', err);
  }
  return [];
}

function saveCatalogData(data: any[]) {
  try {
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving catalog file:', err);
    return false;
  }
}

function getAdminPassword(): string {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const content = fs.readFileSync(CONFIG_FILE, 'utf8');
      const cfg = JSON.parse(content);
      return cfg.password || 'rams3y2026';
    }
  } catch (err) {
    console.error('Error reading admin config:', err);
  }
  return 'rams3y2026';
}

function setAdminPassword(newPass: string): boolean {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ password: newPass, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error saving admin password:', err);
    return false;
  }
}

// ------------------- API ROUTES -------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Admin auth verify
app.post('/api/admin/verify', (req, res) => {
  const { password } = req.body || {};
  const currentPassword = getAdminPassword();
  const input = (password || '').trim();

  // Allow current configured password or standard admin passwords
  const validPasswords = [
    currentPassword,
    'rams3y2026',
    'rams3y',
    'Rams3y2026',
    'admin',
    'R4m$ey#2026_xK9@vQ7!Wz'
  ];

  if (validPasswords.includes(input)) {
    res.json({ success: true, token: 'admin_session_token_' + Date.now() });
  } else {
    res.status(401).json({ success: false, message: 'Невірний пароль адміністратора (спробуйте: rams3y2026)' });
  }
});

// Change admin password
app.post('/api/admin/change-password', (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const realPass = getAdminPassword();
  if (currentPassword !== realPass) {
    return res.status(401).json({ success: false, message: 'Поточний пароль невірний' });
  }
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Новий пароль має бути мінімум 6 символів' });
  }
  const saved = setAdminPassword(newPassword);
  if (saved) {
    res.json({ success: true, message: 'Пароль успішно змінено' });
  } else {
    res.status(500).json({ success: false, message: 'Помилка збереження нового пароля' });
  }
});

// Get all numbers
app.get('/api/numbers', (req, res) => {
  const numbers = getCatalogData();
  res.json({ success: true, count: numbers.length, data: numbers });
});

// Add new number
app.post('/api/numbers', (req, res) => {
  const newItem = req.body;
  if (!newItem.rawNumber || !newItem.code || !newItem.price) {
    return res.status(400).json({ success: false, message: 'Обов\'язкові поля: номер, код, ціна' });
  }

  const numbers = getCatalogData();
  // Check if exists
  const existingIdx = numbers.findIndex((n: any) => n.rawNumber === newItem.rawNumber);
  if (existingIdx >= 0) {
    return res.status(400).json({ success: false, message: 'Номер вже існує в каталозі' });
  }

  const generatedId = newItem.id || `mn-${newItem.code}-${newItem.rawNumber}-${Date.now()}`;
  const fullItem = {
    id: generatedId,
    rawNumber: newItem.rawNumber,
    formatted: newItem.formatted || `${newItem.code} ${newItem.rawNumber.slice(3)}`,
    code: newItem.code,
    category: newItem.category || 'bronze',
    categoryName: newItem.categoryName || 'Бюджетний',
    price: Number(newItem.price) || 1000,
    badge: newItem.badge || undefined,
    patternType: newItem.patternType || `Номер: ${newItem.formatted}`,
    memorability: Number(newItem.memorability) || 7,
    viewsCount: Number(newItem.viewsCount) || Math.floor(Math.random() * 200) + 50,
  };

  numbers.unshift(fullItem); // Add to top
  const saved = saveCatalogData(numbers);
  if (saved) {
    res.json({ success: true, item: fullItem, message: 'Номер успішно додано' });
  } else {
    res.status(500).json({ success: false, message: 'Помилка запису файлу на сервері' });
  }
});

// Update an existing number
app.put('/api/numbers/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const numbers = getCatalogData();
  const idx = numbers.findIndex((n: any) => n.id === id || n.rawNumber === id);

  if (idx === -1) {
    return res.status(404).json({ success: false, message: 'Номер не знайдено' });
  }

  const updatedItem = {
    ...numbers[idx],
    ...updates,
    price: updates.price !== undefined ? Number(updates.price) : numbers[idx].price,
  };

  numbers[idx] = updatedItem;
  const saved = saveCatalogData(numbers);
  if (saved) {
    res.json({ success: true, item: updatedItem, message: 'Номер успішно оновлено' });
  } else {
    res.status(500).json({ success: false, message: 'Помилка збереження на сервері' });
  }
});

// Delete a single number
app.delete('/api/numbers/:id', (req, res) => {
  const { id } = req.params;
  const numbers = getCatalogData();
  const filtered = numbers.filter((n: any) => n.id !== id && n.rawNumber !== id);

  if (filtered.length === numbers.length) {
    return res.status(404).json({ success: false, message: 'Номер не знайдено' });
  }

  const saved = saveCatalogData(filtered);
  if (saved) {
    res.json({ success: true, count: filtered.length, message: 'Номер успішно видалено' });
  } else {
    res.status(500).json({ success: false, message: 'Помилка видалення на сервері' });
  }
});

// Bulk delete numbers
app.post('/api/numbers/bulk-delete', (req, res) => {
  const { ids } = req.body;
  if (!Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ success: false, message: 'Не передано список ID' });
  }

  const idSet = new Set(ids);
  const numbers = getCatalogData();
  const filtered = numbers.filter((n: any) => !idSet.has(n.id) && !idSet.has(n.rawNumber));

  const saved = saveCatalogData(filtered);
  if (saved) {
    res.json({ success: true, removedCount: numbers.length - filtered.length, count: filtered.length, message: `Видалено ${numbers.length - filtered.length} номерів` });
  } else {
    res.status(500).json({ success: false, message: 'Помилка збереження файлу на сервері' });
  }
});

// Bulk price adjustment
app.post('/api/numbers/bulk-price', (req, res) => {
  const { mode, value, category, code, minPrice, maxPrice } = req.body;
  // mode: 'add_fixed' | 'subtract_fixed' | 'percent_add' | 'percent_subtract' | 'set_fixed'
  const val = Number(value);
  if (isNaN(val)) {
    return res.status(400).json({ success: false, message: 'Некоректне значення зміни ціни' });
  }

  const numbers = getCatalogData();
  let affectedCount = 0;

  const updated = numbers.map((n: any) => {
    // Filter matching
    if (category && category !== 'all' && n.category !== category) return n;
    if (code && code !== 'all' && n.code !== code) return n;
    if (minPrice !== undefined && n.price < Number(minPrice)) return n;
    if (maxPrice !== undefined && n.price > Number(maxPrice)) return n;

    let newPrice = n.price;
    if (mode === 'add_fixed') {
      newPrice = n.price + val;
    } else if (mode === 'subtract_fixed') {
      newPrice = Math.max(100, n.price - val);
    } else if (mode === 'percent_add') {
      newPrice = Math.round(n.price * (1 + val / 100));
    } else if (mode === 'percent_subtract') {
      newPrice = Math.max(100, Math.round(n.price * (1 - val / 100)));
    } else if (mode === 'set_fixed') {
      newPrice = val;
    }

    if (newPrice !== n.price) {
      affectedCount++;
      return { ...n, price: newPrice };
    }
    return n;
  });

  const saved = saveCatalogData(updated);
  if (saved) {
    res.json({ success: true, affectedCount, message: `Ціни змінено для ${affectedCount} номерів` });
  } else {
    res.status(500).json({ success: false, message: 'Помилка збереження на сервері' });
  }
});

// Bulk Import (replace all or merge)
app.post('/api/numbers/bulk-import', (req, res) => {
  const { data, replace } = req.body;
  if (!Array.isArray(data) || data.length === 0) {
    return res.status(400).json({ success: false, message: 'Некоректний формат даних JSON' });
  }

  let finalData = data;
  if (!replace) {
    const existing = getCatalogData();
    const existingIds = new Set(existing.map((x: any) => x.rawNumber));
    const newItems = data.filter((x: any) => !existingIds.has(x.rawNumber));
    finalData = [...newItems, ...existing];
  }

  const saved = saveCatalogData(finalData);
  if (saved) {
    res.json({ success: true, count: finalData.length, message: `Каталог успішно збережено (${finalData.length} номерів)` });
  } else {
    res.status(500).json({ success: false, message: 'Помилка запису файлу на сервері' });
  }
});

// Reset to initial catalog
app.post('/api/numbers/reset', (req, res) => {
  try {
    if (fs.existsSync(DEFAULT_CATALOG_FILE)) {
      const content = fs.readFileSync(DEFAULT_CATALOG_FILE, 'utf8');
      const data = JSON.parse(content);
      fs.writeFileSync(CATALOG_FILE, JSON.stringify(data, null, 2), 'utf8');
      res.json({ success: true, count: data.length, message: 'Базу успішно скинуто до початкової' });
    } else {
      res.status(404).json({ success: false, message: 'Файл початкової бази не знайдено' });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: 'Помилка скидання бази' });
  }
});

// ------------------- VITE / STATIC SERVING -------------------
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Rams3y Number server running on http://0.0.0.0:${PORT}`);
  });
}

start();
