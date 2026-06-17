# StreamPilot

StreamPilot é um player IPTV legal, moderno e extensível para usuários que possuem listas M3U autorizadas e fontes EPG XMLTV próprias.

O projeto **não fornece conteúdo, canais, filmes, séries, listas M3U, fontes XMLTV ou provedores IPTV**. Cada usuário informa suas próprias URLs autorizadas.

## Stack

### Frontend

- React
- Vite
- TypeScript
- Tailwind CSS
- React Router
- Zustand
- HLS.js
- UI responsiva com foco em TV / controle remoto

### Backend

- Node.js
- Express
- TypeScript
- Prisma ORM
- SQLite para desenvolvimento local
- JWT
- REST API modular

## Estrutura

```txt
streampilot/
  frontend/
    src/
      components/
      pages/
      routes/
      services/
      store/
      types/
      utils/
  backend/
    src/
      controllers/
      routes/
      services/
      middleware/
      utils/
      prisma/
    prisma/
      schema.prisma
  README.md
```

## Pré-requisitos

- Node.js 20+
- npm 10+

## Como rodar localmente

### 1. Backend

```bash
cd backend
npm install
copy .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```

No macOS/Linux:

```bash
cp .env.example .env
```

Backend padrão: `http://localhost:4000`

### 2. Frontend

Abra outro terminal:

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

No macOS/Linux:

```bash
cp .env.example .env
```

Frontend padrão: `http://localhost:5173`

## Conta de teste criada pelo seed

```txt
Email: demo@streampilot.local
Senha: Demo123456!
```

O seed cria apenas dados fictícios e legais, sem links reais de conteúdo IPTV.

## Fluxo básico

1. Criar conta ou entrar com a conta demo.
2. Ir em **Painel**.
3. Cadastrar uma URL M3U autorizada.
4. Sincronizar a playlist.
5. Acessar **TV ao Vivo**, **Filmes** ou **Séries**.
6. Reproduzir no player.
7. O histórico será salvo automaticamente.
8. Marcar favoritos e continuar assistindo depois.
9. Cadastrar XMLTV autorizado e sincronizar EPG.

## Variáveis de ambiente

### Backend `backend/.env`

```env
DATABASE_URL="file:./dev.db"
PORT=4000
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
FRONTEND_ORIGIN="http://localhost:5173"
NODE_ENV="development"
```

### Frontend `frontend/.env`

```env
VITE_API_URL="http://localhost:4000/api"
```

## Endpoints principais

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

### Playlists

- `POST /api/playlists`
- `GET /api/playlists`
- `POST /api/playlists/:id/sync`
- `DELETE /api/playlists/:id`

### Media

- `GET /api/media`
- `GET /api/media/:id`
- `GET /api/media/categories`
- `GET /api/media/search?q=`

### Watch history

- `POST /api/history`
- `GET /api/history/continue-watching`
- `GET /api/history`

### Favorites

- `POST /api/favorites/:mediaId`
- `DELETE /api/favorites/:mediaId`
- `GET /api/favorites`

### EPG

- `POST /api/epg/source`
- `POST /api/epg/sync`
- `GET /api/epg/channel/:channelId`

## Formato M3U suportado no MVP

O parser básico entende linhas como:

```m3u
#EXTM3U
#EXTINF:-1 tvg-id="channel.one" tvg-name="Channel One" tvg-logo="https://example.com/logo.png" group-title="News",Channel One
https://example.com/live/channel-one.m3u8
```

O app tenta classificar o item como:

- `LIVE` para canais ao vivo
- `MOVIE` para grupos com termos como `movie`, `movies`, `filme`, `vod`
- `SERIES_EPISODE` para grupos/URLs/títulos com termos ou padrões de série como `S01E02`, `1x02`, `series`

## XMLTV suportado no MVP

O parser básico entende:

```xml
<tv>
  <channel id="channel.one">
    <display-name>Channel One</display-name>
  </channel>
  <programme start="20260615120000 +0000" stop="20260615130000 +0000" channel="channel.one">
    <title>Program title</title>
    <desc>Description</desc>
  </programme>
</tv>
```

## Segurança aplicada no MVP

- Senhas com hash via bcryptjs
- JWT para rotas privadas
- Helmet
- CORS com origem configurável
- Rate limit básico
- Validação de entrada com Zod
- Usuário só acessa seus próprios dados
- Sem conteúdo embutido ou fontes externas ilegais

## Próximos recursos planejados

- Múltiplos perfis por conta
- Sincronização em nuvem
- Cache de EPG
- Recomendações inteligentes
- App Android TV / Google TV nativo
- Controle remoto avançado com foco espacial
- Backup/exportação de playlists do usuário
- Jobs de sincronização agendada

## Autenticação via Google Sheets

Este projeto também vem com uma integração opcional para usar uma planilha do Google Sheets como base de cadastro/login.

### 1. Apps Script

Abra sua planilha, vá em **Extensions > Apps Script**, cole o arquivo:

```text
google-apps-script/Code.gs
```

No topo do arquivo, confirme:

```js
const SPREADSHEET_ID = '1t6Y7vp9xCBsgSrw8iubQeDjlEAmWFjUEag5yo9WOTmE';
const API_SECRET = 'CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_32_CHARS_MIN';
```

Troque `API_SECRET` por uma chave longa e use a mesma chave no backend `.env` como `SHEETS_AUTH_SECRET`.

Depois publique em **Deploy > New deployment > Web app**:

- Execute as: **Me**
- Who has access: **Anyone with the link**

Copie a URL `/exec` gerada.

### 2. Backend `.env`

```env
AUTH_PROVIDER="google_sheets"
SHEETS_AUTH_URL="https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec"
SHEETS_AUTH_SECRET="a-mesma-chave-do-Code.gs"
JWT_SECRET="outra-chave-longa-para-jwt"
FRONTEND_ORIGIN="http://localhost:5173,https://seu-site.netlify.app"
```

O frontend continua usando o backend normal:

```env
VITE_API_URL="http://localhost:4000/api"
```

Em produção, troque para a URL do seu backend no Render.

### Como funciona

- O cadastro/login continuam chamando `/api/auth/register` e `/api/auth/login`.
- O backend chama o Apps Script em segredo.
- A planilha salva apenas hash + salt da senha, não salva senha pura.
- O backend ainda cria um usuário local no SQLite para relacionar playlists, favoritos, histórico e EPG.
