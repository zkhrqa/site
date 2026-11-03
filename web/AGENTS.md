# Prototype Instructions

Run the local server yourself and open the preview in the browser available to this environment. Do not give the user server-start instructions when you can run it.

Before making substantial visual changes, use the Product Design plugin's `get-context` skill when the visual source is unclear or no longer matches the current goal. When the user gives durable prototype-specific design feedback, preferences, or decisions, record them in `AGENTS.md`.

When implementing from a selected generated mock, treat that image as the source of truth for layout, component anatomy, density, spacing, color, typography, visible content, and hierarchy.

Build app UI in `src/`. Keep `.openai/hosting.json`, `worker/index.js`, `scripts/prepare-sites-build.mjs`, and `tests/sites-worker.test.mjs` intact so the same local prototype can be handed to Sites. Before a Sites handoff, run `npm run build` and `npm run test:sites`; the build must leave `dist/client/index.html`, `dist/server/index.js`, and `dist/.openai/hosting.json`.

## Мобильные уточнения, 3 ноября 2026

Шапка на телефоне закреплена при прокрутке; меню под кнопкой с тремя полосками раскрывается вертикально. Первый блок собирается в одну ширину: пояснение рядом с портретом, обе кнопки на всю ширину. У карты на телефоне невидимые границы окна, без прямоугольной рамки. Масштабирование плавное в обе стороны двумя пальцами; нажатие на группу не должно резко приближать карту. Другие секции в рамках этой правки не перерабатываются.


## Тексты первого экрана, 3 ноября 2026

Последняя редакция пользователя: H1 «Русский язык объединяет»; подзаголовок «20 интерактивных уроков о традициях и народах России»; рядом с портретом «[Имя Фамилия Автора]», затем «Учитель начальных классов, методист». Имя — явная заглушка до предоставления настоящего. Вторичная кнопка «Как устроен курс» ведёт к прежнему разделу о проекте. Подсказка над картой «Выберите урок на карте ниже ↓». Не возвращать прежние два лозунга в блок автора.

## Плотность мобильного Hero, 3 ноября 2026

Пользователь одобрил оформление, но просит меньше пустоты между блоками первого экрана. Сохранять компактные промежутки между подзаголовком, автором, кнопками и подсказкой карты; не возвращать 180 px высоты авторской строки и крупные суммарные отступы. Содержание, настольная композиция и остальные секции сохраняются.

## Переходы, последнее решение 3 ноября 2026

Подсказка «Выберите урок на карте ниже ↓» удалена. Кнопки Hero плавно прокручивают страницу к нужному разделу; изменение адреса не должно прерывать плавную прокрутку мгновенным вторым переходом. Мобильное меню раскрывается и закрывается короткой CSS-анимацией transform/opacity, без анимации геометрии страницы и новых зависимостей. Обязательно учитывать prefers-reduced-motion.
