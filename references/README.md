# Исходники и референсы

Файлы скопированы в проект 3 ноября 2026 года. Оригиналы оставлены на месте. Точные исходные пути и SHA-256 находятся в [manifest.json](manifest.json).

## Визуальные источники

| Файл | Статус |
| --- | --- |
| [album-home-selected.png](design/album-home-selected.png) | Главная «Альбом дружбы», выбранная пользователем по названию |
| [album-lesson-desktop-proposal.png](design/album-lesson-desktop-proposal.png) | Предложение страницы первого урока, ещё не принято отдельно |
| [album-activity-projector-proposal.png](design/album-activity-projector-proposal.png) | Предложение задания для проектора, ещё не принято отдельно |
| [album-lesson-mobile-proposal.png](design/album-lesson-mobile-proposal.png) | Предложение мобильной версии, ещё не принято отдельно |
| [aydar-lesson-desktop-proposal.png](design/aydar-lesson-desktop-proposal.png) | Новое предложение страницы Айдара |
| [aydar-activity-projector-proposal.png](design/aydar-activity-projector-proposal.png) | Новое предложение задания Айдара на проекторе |
| [aydar-activity-mobile-proposal.png](design/aydar-activity-mobile-proposal.png) | Новое предложение задания Айдара на телефоне |

Все семь изображений созданы Image Gen в этом чате. Их роль — визуальный источник; они не являются разметкой, готовыми активами для всей страницы, достоверной географической картой или подтверждением проверки работающего интерфейса. Не переносить демонстрационное «3 А», счётчики и место для фотографии как подтверждённые данные автора. Промпты нового комплекта Айдара сохранены в `design/prompts/`.

Альтернативная главная «Навстречу друг другу» не выбрана и не включена в рабочий набор.

## Документы пользователя

| Урок | Технологическая карта | Рабочий лист |
| --- | --- | --- |
| 1 | [lesson-01-teacher.docx](lessons/lesson-01-teacher.docx) | [lesson-01-worksheet.docx](lessons/lesson-01-worksheet.docx) |
| 2 | [lesson-02-teacher.doc](lessons/lesson-02-teacher.doc) | [lesson-02-worksheet.docx](lessons/lesson-02-worksheet.docx) |
| 3 | [lesson-03-teacher.docx](lessons/lesson-03-teacher.docx) | [lesson-03-worksheet.docx](lessons/lesson-03-worksheet.docx) |

Это копии исходных файлов, без исправлений и конвертации. Второй урок предоставлен в старом DOC; скачиваемую DOCX/PDF-версию ещё предстоит подготовить. Весь каталог `references/` остаётся вне публичной сборки; релизные документы выбираются и проверяются отдельно.

## Навык

Источник и установка записаны в [skills-installation.json](skills-installation.json). Подробная роль навыков — [docs/SKILLS.md](../docs/SKILLS.md).

## Обновление статуса реализации, 3 ноября 2026

Прямой запрос пользователя «реализуй первый маршрут, оформление нравится» принят как разрешение реализовать выбранную главную и маршрут Егора по сохранённым предложениям. Экраны Айдара остаются предложениями для следующего этапа. Первый маршрут реализован в `web/`; соответствие источникам и ограничения описаны в `docs/IMPLEMENTATION.md` (из корня проекта).
