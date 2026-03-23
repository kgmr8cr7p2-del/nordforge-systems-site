NORDFORGE SYSTEMS — статический сайт для публикации в интернете

Что это:
- одностраничный сайт на HTML/CSS/JS;
- не требует сборки и установки зависимостей;
- готов к публикации на статических хостингах;
- есть переключение RU/EN.

Локальная проверка:
1. Откройте файл index.html в браузере.
или
2. Запустите локальный сервер:
   python -m http.server 8000
3. Откройте в браузере:
   http://localhost:8000

Самый простой способ выложить сайт в интернет:
1. Netlify Drop.
2. Откройте папку проекта целиком.
3. Перетащите эту папку в Netlify Drop.
4. Сайт сразу получит публичный адрес вида:
   https://your-site-name.netlify.app

Публикация через Vercel:
1. Загрузите проект в GitHub, GitLab, Bitbucket или Azure DevOps.
2. Импортируйте репозиторий в Vercel.
3. Vercel сам распознает статический сайт и опубликует его.
4. Публичный адрес будет вида:
   https://your-project.vercel.app

Публикация через GitHub Pages:
1. Создайте новый репозиторий на GitHub.
2. Загрузите в него содержимое этой папки.
3. Пушьте изменения в ветку main.
4. Workflow из .github/workflows/deploy-pages.yml опубликует сайт автоматически.
5. Адрес сайта будет вида:
   https://USERNAME.github.io/REPOSITORY/

Если проект ещё не в Git:
1. git init
2. git branch -M main
3. git add .
4. git commit -m "Initial site"
5. git remote add origin <URL_ВАШЕГО_РЕПОЗИТОРИЯ>
6. git push -u origin main

Что уже добавлено для деплоя:
- vercel.json — конфиг для Vercel;
- netlify.toml — конфиг для Netlify;
- .github/workflows/deploy-pages.yml — автодеплой на GitHub Pages;
- .nojekyll — отключает Jekyll-обработку на GitHub Pages;
- robots.txt — базовое разрешение на индексацию.

Что ещё заменить под себя:
1. Ссылку Telegram:
   https://t.me/FrenzyFruit
2. Ссылку Avito:
   https://www.avito.ru/sankt-peterburg/igry_pristavki_i_programmy/ferma_ks2_cs2_gotovyy_variant_zhelezo_i_soft_8031437055?utm_campaign=native&utm_medium=item_page_android&utm_source=soc_sharing_seller
3. Фото в папке assets/images/:
   - showcase-1.jpg
   - showcase-2.png
   - showcase-3.jpg

Главные файлы:
- index.html — структура сайта и meta-теги;
- styles.css — стили и эффекты;
- script.js — переключение языка, мобильное меню, анимация появления блоков.

Что важно:
- из этой среды сайт нельзя реально опубликовать без вашего аккаунта на хостинге;
- проект уже подготовлен так, чтобы после загрузки на Netlify, Vercel или GitHub Pages любой человек мог открыть его из интернета.
