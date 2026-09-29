import { execSync } from 'node:child_process';
import { readdirSync, writeFileSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

// --- КОНФИГУРАЦИЯ ---
const ROOT_DIR = '.';           // Корень проекта (LectionSite1)
const OUT_DIR = 'dist';         // Папка для итоговой сборки
// --------------------

// Очищаем папку dist перед новой сборкой
if (existsSync(OUT_DIR)) {
  console.log(`Очистка папки ${OUT_DIR}...`);
  rmSync(OUT_DIR, { recursive: true, force: true });
}
mkdirSync(OUT_DIR, { recursive: true });

// Получаем список всех папок в корне (кроме служебных)
const entries = readdirSync(ROOT_DIR, { withFileTypes: true })
  .filter(dirent => dirent.isDirectory() && !['node_modules', 'dist', '.git'].includes(dirent.name))
  .map(dirent => dirent.name);

const presentations = [];

for (const dir of entries) {
  // Проверяем, есть ли в папке файл презентации. 
  // Мы ищем файл, начинающийся на "slides_"
  const slidesFile = join(ROOT_DIR, dir, `slides_${dir}.md`);
  
  if (!existsSync(slidesFile)) {
    console.log(`Пропускаю папку ${dir}: файл slides_${dir}.md не найден.`);
    continue; 
  }

  console.log(`\n--- Сборка презентации: ${dir} ---`);
  const basePath = `/${dir}/`; // URL будет, например, /F2L3/
  const outPath = join(OUT_DIR, dir);

  try {
    // Запускаем slidev build с указанием базового пути и папки вывода
    execSync(`npx slidev build "${slidesFile}" --base ${basePath} --out "${outPath}"`, {
      stdio: 'inherit',
      cwd: ROOT_DIR,
    });
    
    presentations.push({ name: dir, path: basePath });
    console.log(`Успешно собрано: ${dir}`);
  } catch (error) {
    console.error(`Ошибка при сборке ${dir}:`, error.message);
  }
}

// Генерируем индексную страницу
console.log('\n--- Генерация индексной страницы ---');
let indexHtml = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Лекции</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 800px; margin: 4rem auto; padding: 0 1rem; line-height: 1.6; color: #333; }
    h1 { font-size: 2rem; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; }
    ul { list-style: none; padding: 0; }
    li { margin: 1rem 0; }
    a { text-decoration: none; color: #3b82f6; font-size: 1.2rem; font-weight: 500; transition: color 0.2s; }
    a:hover { color: #1d4ed8; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>Список презентаций</h1>
  <ul>
`;

for (const p of presentations) {
  indexHtml += `    <li><a href="${p.path}">${p.name}</a></li>\n`;
}

indexHtml += `  </ul>
</body>
</html>`;

writeFileSync(join(OUT_DIR, 'index.html'), indexHtml);
console.log('Индексная страница успешно создана в dist/index.html');
