# Інструкція з розгортання на Cloudflare Pages

## Чому виникала помилка при завантаженні?
Повідомлення:
> `This uploader does not yet support projects that require a build process. TypeScript files were found. Please use wrangler deploy instead for full feature support.`

**Причина:** Веб-інтерфейс Cloudflare Pages ("Direct Upload" / "Upload assets") не компілює файли автоматично, якщо перетягнути сирі файли проєкту (`.ts`, `.tsx`, `package.json`). Він очікує **тільки скомпільовані статичні файли з папки `dist`**!

---

## Спосіб 1: Завантаження через браузер (Direct Upload) — найпростіший

1. У проєкті виконайте команду збірки:
   ```bash
   npm run build:pages
   ```
2. У корені з'явиться папка **`dist`** (містить `index.html`, папку `assets`, `_redirects`, `_headers`).
3. В кабінеті **Cloudflare Dashboard** -> **Workers & Pages** -> **Create application** -> **Pages** -> **Upload assets**.
4. Введіть назву проєкту (наприклад, `rams3y-numbers`).
5. **ВАЖЛИВО:** Перетягніть у вікно завантаження **саме папку `dist`** (або zip-архів з вмістом папки `dist`), а **НЕ** весь проєкт!
6. Натисніть **Deploy site**. Сайт буде опубліковано за секунди!

---

## Спосіб 2: Автоматичний деплой через GitHub / GitLab (Рекомендовано)

Якщо проєкт завантажено в GitHub або GitLab:
1. У Cloudflare Dashboard перейдіть у **Workers & Pages** -> **Pages** -> **Connect to Git**.
2. Виберіть репозиторій.
3. У налаштуваннях збірки (**Build settings**) вкажіть:
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build:pages` (або `npm run build`)
   - **Build output directory:** `dist`
   - **Root directory:** `/`
4. Натисніть **Save and Deploy**. Cloudflare сам автоматично збиратиме та оновлюватиме сайт при кожному оновленні коду.

---

## Спосіб 3: Через термінал (Wrangler CLI)

Виконайте команду:
```bash
npm run pages:deploy
```
або:
```bash
npx wrangler pages deploy dist --project-name=rams3y-numbers
```

---

## Що було адаптовано в коді для бездоганної роботи на Cloudflare:

1. **Повна автономність (Static & LocalStorage)**:
   - Якщо сайт працює на статичному Cloudflare Pages без Express-сервера, каталог 6 800+ номерів завантажується миттєво з вбудованої бази.
   - Всі операції адмінки (додавання номерів, редагування цін, видалення, фільтри) зберігаються в `localStorage` браузера.

2. **Підтримка SPA-роутингу (`public/_redirects`)**:
   - Додано правило `/* /index.html 200`, щоб при оновленні сторінки в Cloudflare не виникало помилки 404.

3. **Cloudflare Pages Functions**:
   - Додано каталог `functions/api/`, який Cloudflare автоматично перетворює на безсерверні Edge-функції для `/api/numbers` та перевірки пароля адмінки.

4. **Пароль адміністратора**:
   - Стандартний пароль: **`rams3y2026`** (також підтримується зміна пароля в налаштуваннях).
