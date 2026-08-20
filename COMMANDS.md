# Commands

Run commands from the project root:

```powershell
cd C:\Users\Lenovo\pfm
```

## Local Development

```powershell
pnpm install
pnpm dev
```

Open:

```text
http://127.0.0.1:5173/
```

Run the Express API in a second terminal:

```powershell
pnpm dev:api
```

Open:

```text
http://127.0.0.1:3000/api/health
```

During Vite development, frontend requests to `/api` are proxied to the Express server.

## Test

```powershell
npm test
```

## Run Express API

Build the typed backend:

```powershell
pnpm build:api
```

Run the compiled API:

```powershell
pnpm start:api
```

By default the API listens on:

```text
http://127.0.0.1:3000
```

Use `PORT` and `HOST` to change the listen address. Use `API_HOST` and `API_PORT` for the Vite dev proxy target.

Check the database connection:

```text
http://127.0.0.1:3000/api/db/health
```

The backend reads Postgres settings from `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, and `DB_NAME`.

Apply database migrations:

```powershell
pnpm db:migrate
```

For local email verification, register in the app and then open the verification link printed in the API terminal. A real email provider can replace that console sender later.

## Build For Firebase Hosting

```powershell
pnpm build
```

The build output is written to `dist/`.

## Deploy To Firebase Hosting

Install and log in once:

```powershell
npm install -g firebase-tools
firebase login
```

Build and deploy:

```powershell
pnpm build
firebase deploy --only hosting
```

## Build For GitHub Pages

Use this only if deploying under:

```text
https://orenpapa.github.io/standard_financial_tools/
```

```powershell
$env:VITE_BASE_PATH='/standard_financial_tools/'
pnpm build
Remove-Item Env:\VITE_BASE_PATH
```

## Preview Production Build Locally

```powershell
pnpm build
pnpm preview
```

Open:

```text
http://127.0.0.1:4173/
```
