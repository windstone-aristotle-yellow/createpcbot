# Значит так
чтобы запустить надо иметь:
* Node.js не ниже 16.6.0
* Не уверен, но вроде может потребоваться Python 2.7 И MSBuild Tools Для C++ (node-gyp)
* База данных PostgreSQL
* Прямые руки

Токен записывается в .env файл, пример в .env.example

Порядок запуска:
* Скачал проект
* npm install
* Создаешь базу данных, добавляешь ссылку на бд в .env
* npx prisma db push
* npx tsc
* npm run start

Вуаля, домашний бот запущен