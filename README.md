# OpenAPI Splitter

React + TypeScript + Vite инструмент для автоматического разделения **монолитных OpenAPI YAML** (10-20k строк) на логическую файловую структуру.

## Демо

**[Live Demo](https://your-openapi-splitter.vercel.app)**

## Стек
- React 19.2.0
- antd 6.2.3
- file-saver 2.0.5
- js-yaml 4.1.1
- jszip 3.10.1

## Структура проекта
  - `App.tsx` - Главный файл страницы
  - `parser.ts` - разделитель yaml


## Требования для установки
- Node.js
- Git


## Иструкция по запуску 
1. Клонируйте репозиторий:
```bash
git clone https://github.com/Reqwiew/openapi-splitter
cd openapi-splitter
```
2. Установите пакеты:
```bash
npm i
```
3. Запустите в dev:
```bash
npm run dev
```
4. После запуска:
будет доступно по умолчанию по адресу http://localhost:5173/

