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

## Test

```powershell
npm test
```

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
