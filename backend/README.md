# ITS Torneo — Backend PostgreSQL

Backend REST con Node.js, Express e PostgreSQL 18. Questo progetto è separato dal frontend React/Vite.

## Requisiti
- Node.js e npm
- PostgreSQL 18 in esecuzione
- pgAdmin 4 (facoltativo, per gestire il database)

## 1. Configura le credenziali
Apri la cartella del backend in VS Code. Nel terminale esegui:

```powershell
Copy-Item .env.example .env
```

Apri `.env` e sostituisci `INSERISCI_LA_TUA_PASSWORD_POSTGRES` con la password scelta durante l'installazione di PostgreSQL. Modifica anche `JWT_SECRET` con una stringa casuale lunga. Non condividere il file `.env` e non caricarlo su Git.

## 2. Installa le dipendenze
Nel terminale, dalla cartella del backend:

```powershell
npm install
```

## 3. Crea le tabelle nel database già creato in pgAdmin

```powershell
npm run db:init
```

Il comando crea le tabelle `utenti`, `tornei`, `iscrizioni`, `risultati` e `faq` nel database `its_torneo`. Non cancella tabelle esistenti.

## 4. Avvia il backend

```powershell
npm run dev
```

Prova ad aprire http://localhost:3001/api/health. Se tutto funziona, la risposta include `"status":"ok"` e `"database":"PostgreSQL"`.

## Endpoint inclusi
- `GET /api/health`
- `GET /api/tornei`, `GET /api/tornei/in-evidenza`, `GET /api/tornei/:id`
- `GET /api/faq`
- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/logout`
- `GET /api/utenti/me`, `GET /api/utenti/me/iscrizioni`
- `POST /api/tornei/:id/iscrizioni`, `DELETE /api/tornei/:id/iscrizioni/me`
- Admin: CRUD tornei, consultazione/modifica iscrizioni, salvataggio risultati.

Per le rotte protette, invia l'header `Authorization: Bearer <token>` ottenuto dal login. Il primo utente registrato ha ruolo `utente`; per ora il ruolo `admin` va assegnato manualmente dal proprietario del database in pgAdmin, dopo aver creato un account.

## Nota per lo sviluppo scolastico
Questo è uno starter didattico. Prima della consegna, concorda con il gruppo i nomi dei campi e degli endpoint, aggiungi test e completa eventuali funzioni richieste dal documento del progetto. Il logout JWT è gestito lato client: il client deve eliminare il token.
