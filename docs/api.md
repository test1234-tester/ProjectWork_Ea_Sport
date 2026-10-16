# Specifiche API REST - Piattaforma Tornei ITS

Il presente documento formalizza le specifiche degli endpoint REST per la piattaforma di gestione tornei e corsi ITS.

---

## 1. Modulo Autenticazione (`/api/auth`)

### 1.1. Registrazione Utente
* **Endpoint**: `POST /api/auth/register`
* **Accesso**: Pubblico
* **Stato**: Proposta di metodo
* **Descrizione**: Consente la creazione di un nuovo account studente.
* **Request Body**:
```json
{
  "nome": "Mario",
  "cognome": "Rossi",
  "email": "mario.rossi@example.com",
  "password": "PasswordSicura123!"
}
```
* **Response (201 Created)**:
```json
{
  "messaggio": "Registrazione completata",
  "utente": {
    "id": 12,
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario.rossi@example.com",
    "ruolo": "User"
  }
}
```

### 1.2. Login Utente
* **Endpoint**: `POST /api/auth/login`
* **Accesso**: Pubblico
* **Stato**: Proposta di metodo
* **Descrizione**: Autentica un utente registrato e restituisce la sessione.
* **Request Body**:
```json
{
  "email": "mario.rossi@example.com",
  "password": "PasswordSicura123!"
}
```
* **Response (200 OK)**:
```json
{
  "messaggio": "Login effettuato",
  "utente": {
    "id": 12,
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario.rossi@example.com",
    "ruolo": "User"
  }
}
```
* **Response Error (401 Unauthorized)**:
```json
{
  "errore": "Utente non autenticato"
}
```

### 1.3. Logout Utente
* **Endpoint**: `POST /api/auth/logout`
* **Accesso**: Utente autenticato
* **Stato**: Proposta di metodo
* **Descrizione**: Termina la sessione dell'utente autenticato.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "messaggio": "Logout effettuato"
}
```

---

## 2. Modulo Landing Page & Informazioni Generali

### 2.1. Tornei in Evidenza
* **Endpoint**: `GET /api/tornei/in-evidenza`
* **Accesso**: Pubblico
* **Stato**: Documentato
* **Descrizione**: Recupera l'elenco dei tornei in evidenza mostrati nella Homepage.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "tornei": [
    {
      "id": 1,
      "nome": "Arena Championship",
      "gioco": "Valorant",
      "descrizione": "Torneo competitivo aperto a tutti",
      "posti_max": 32,
      "stato": "Aperto",
      "data_inizio": "2026-11-15",
      "data_fine": "2026-11-16"
    }
  ]
}
```

### 2.2. Domande Frequenti (FAQ)
* **Endpoint**: `GET /api/faq`
* **Accesso**: Pubblico
* **Stato**: Documentato
* **Descrizione**: Recupera la lista delle domande frequenti da mostrare nell'Accordion.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "faq": [
    {
      "id": 1,
      "domanda": "Come posso iscrivermi a un torneo?",
      "risposta": "Accedi al tuo account e seleziona il pulsante Iscriviti."
    },
    {
      "id": 2,
      "domanda": "Cosa succede se il torneo è al completo?",
      "risposta": "Puoi entrare nella lista d'attesa, se le iscrizioni sono aperte."
    }
  ]
}
```

---

## 3. Modulo Catalogo Tornei & Iscrizioni (`/tornei`)

### 3.1. Elenco Completo Tornei
* **Endpoint**: `GET /api/v1/tournaments`
* **Accesso**: Pubblico
* **Stato**: Proposta (path da uniformare)
* **Descrizione**: Restituisce il catalogo completo dei tornei attivi o conclusi.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "tornei": [
    {
      "id": 1,
      "nome": "Arena Championship",
      "gioco": "Valorant",
      "descrizione": "Torneo competitivo",
      "posti_max": 32,
      "stato": "Aperto",
      "data_inizio": "2026-11-15",
      "data_fine": "2026-11-16"
    },
    {
      "id": 2,
      "nome": "Winter Cup",
      "gioco": "Rocket League",
      "descrizione": "Torneo stagionale",
      "posti_max": 16,
      "stato": "Chiuso",
      "data_inizio": "2026-12-01",
      "data_fine": "2026-12-02"
    }
  ]
}
```

### 3.2. Categorie Tornei
* **Endpoint**: `GET /api/v1/tournaments/categories`
* **Accesso**: Pubblico
* **Stato**: Documentato
* **Descrizione**: Restituisce l'elenco delle discipline e categorie disponibili.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "categorie": [
    {
      "id": 1,
      "nome": "Valorant"
    },
    {
      "id": 2,
      "nome": "Rocket League"
    },
    {
      "id": 3,
      "nome": "League of Legends"
    }
  ]
}
```

### 3.3. Dettaglio Singolo Torneo
* **Endpoint**: `GET /api/v1/tournaments/{id}`
* **Accesso**: Pubblico
* **Stato**: Documentato
* **Descrizione**: Recupera le informazioni dettagliate e i posti occupati di un torneo.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "id": 1,
  "nome": "Arena Championship",
  "gioco": "Valorant",
  "descrizione": "Torneo competitivo aperto a tutti",
  "posti_max": 32,
  "posti_occupati": 28,
  "stato": "Aperto",
  "data_inizio": "2026-11-15",
  "data_fine": "2026-11-16"
}
```
* **Response Error (404 Not Found)**:
```json
{
  "errore": "Torneo non trovato"
}
```

### 3.4. Iscrizione a un Torneo
* **Endpoint**: `POST /api/v1/tournaments/{id}/enroll`
* **Accesso**: Utente autenticato
* **Stato**: Documentato
* **Descrizione**: Registra l'iscrizione dello studente al torneo o l'inserimento in lista d'attesa.
* **Request Body**: Nessuno
* **Response (201 Created - Confermata)**:
```json
{
  "messaggio": "Iscrizione effettuata",
  "iscrizione": {
    "id": 101,
    "torneo_id": 1,
    "stato": "Confermata",
    "data_iscrizione": "2026-10-12T10:30:00"
  }
}
```
* **Response (201 Created - Lista d'Attesa)**:
```json
{
  "messaggio": "Inserimento nella lista d'attesa completato",
  "iscrizione": {
    "id": 102,
    "torneo_id": 1,
    "stato": "In_Attesa",
    "data_iscrizione": "2026-10-12T10:35:00"
  }
}
```
* **Response Error (409 Conflict)**:
```json
{
  "errore": "Le iscrizioni a questo torneo sono chiuse"
}
```

### 3.5. Disiscrizione da un Torneo
* **Endpoint**: `DELETE /api/v1/tournaments/{id}/enroll`
* **Accesso**: Utente autenticato
* **Stato**: Proposta da confermare
* **Descrizione**: Annulla la richiesta o l'iscrizione dell'utente corrente al torneo.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "messaggio": "Iscrizione annullata con successo"
}
```

---

## 4. Modulo Area Utente / Profilo Studente (`/profile`)

### 4.1. Informazioni Profilo Utente
* **Endpoint**: `GET /api/v1/users/me`
* **Accesso**: Utente autenticato
* **Stato**: Proposta di metodo
* **Descrizione**: Recupera nome, cognome, email e ruolo dell'utente loggato.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "utente": {
    "id": 12,
    "nome": "Mario",
    "cognome": "Rossi",
    "email": "mario.rossi@example.com",
    "ruolo": "User"
  }
}
```

### 4.2. Tornei dell'Utente
* **Endpoint**: `GET /api/v1/users/me/tournaments`
* **Accesso**: Utente autenticato
* **Stato**: Proposta di metodo
* **Descrizione**: Mostra i tornei iscritti suddivisi tra confermati e in lista d'attesa.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "tornei": [
    {
      "torneo_id": 1,
      "nome": "Arena Championship",
      "gioco": "Valorant",
      "stato_torneo": "Aperto",
      "stato_iscrizione": "Confermata",
      "data_inizio": "2026-11-15"
    },
    {
      "torneo_id": 2,
      "nome": "Winter Cup",
      "gioco": "Rocket League",
      "stato_torneo": "Aperto",
      "stato_iscrizione": "In_Attesa",
      "data_inizio": "2026-12-01"
    }
  ]
}
```

### 4.3. Statistiche e Storico Utente
* **Endpoint**: `GET /api/v1/users/me/statistics`
* **Accesso**: Utente autenticato
* **Stato**: Proposta di metodo
* **Descrizione**: Recupera lo storico delle partecipazioni, posizioni, vittorie e sconfitte.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "statistiche": {
    "tornei_totali": 8,
    "vittorie": 5,
    "sconfitte": 3,
    "posizioni": [
      {
        "torneo_id": 1,
        "posizione": 1
      },
      {
        "torneo_id": 2,
        "posizione": 4
      }
    ]
  }
}
```

### 4.4. Risultati Ufficiali Torneo
* **Endpoint**: `GET /api/v1/tournaments/{id}/results`
* **Accesso**: Pubblico
* **Stato**: Documentato
* **Descrizione**: Visualizza le classifiche ed i risultati pubblicati per il torneo.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "torneo_id": 1,
  "classifica": [
    {
      "posizione": 1,
      "utente": "Mario Rossi",
      "punti": 150
    }
  ]
}
```

---

## 5. Modulo Dashboard Amministratore (`/admin`)

### 5.1. Elenco Tornei (Vista Admin)
* **Endpoint**: `GET /api/v1/tournaments`
* **Accesso**: Admin / Pubblico
* **Stato**: Proposta di metodo
* **Descrizione**: Elenco completo di tutti i tornei per il pannello di gestione.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "tornei": [
    {
      "id": 1,
      "nome": "Arena Championship",
      "stato": "Aperto"
    }
  ]
}
```

### 5.2. Creazione Nuovo Torneo
* **Endpoint**: `POST /api/v1/tournaments`
* **Accesso**: Admin
* **Stato**: Proposta di metodo
* **Descrizione**: Crea una nuova competizione definendone parametri e regole.
* **Request Body**:
```json
{
  "nome": "Summer Cup",
  "descrizione": "Torneo estivo aperto agli iscritti",
  "gioco": "Valorant",
  "posti_max": 32,
  "stato": "Aperto",
  "data_inizio": "2027-06-15",
  "data_fine": "2027-06-16"
}
```
* **Response (201 Created)**:
```json
{
  "messaggio": "Torneo creato con successo",
  "id": 3
}
```

### 5.3. Modifica Torneo
* **Endpoint**: `PUT /api/v1/tournaments/{id}`
* **Accesso**: Admin
* **Stato**: Proposta di metodo
* **Descrizione**: Aggiorna le informazioni o le date di un torneo esistente.
* **Request Body**:
```json
{
  "nome": "Summer Cup - Edizione 2027",
  "descrizione": "Torneo estivo aggiornato",
  "gioco": "Valorant",
  "posti_max": 40,
  "stato": "Aperto",
  "data_inizio": "2027-06-20",
  "data_fine": "2027-06-21"
}
```
* **Response (200 OK)**:
```json
{
  "messaggio": "Torneo aggiornato correttamente",
  "torneo": {
    "id": 3,
    "nome": "Summer Cup - Edizione 2027",
    "posti_max": 40
  }
}
```

### 5.4. Eliminazione Torneo
* **Endpoint**: `DELETE /api/v1/tournaments/{id}`
* **Accesso**: Admin
* **Stato**: Proposta di metodo
* **Descrizione**: Rimuove un torneo se non ci sono iscritti o risultati salvati.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "messaggio": "Torneo eliminato con successo"
}
```
* **Response Error (409 Conflict)**:
```json
{
  "errore": "Impossibile eliminare un torneo con iscrizioni o risultati registrati"
}
```

### 5.5. Elenco Iscritti Torneo
* **Endpoint**: `GET /api/v1/tournaments/{id}/enrollments`
* **Accesso**: Admin
* **Stato**: Proposta di metodo
* **Descrizione**: Restituisce la lista degli studenti iscritti al torneo.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "torneo_id": 1,
  "iscritti": [
    {
      "utente_id": 12,
      "nome": "Mario Rossi",
      "stato": "Confermata"
    }
  ]
}
```

### 5.6. Elenco Lista d'Attesa
* **Endpoint**: `GET /api/v1/tournaments/{id}/waitlist`
* **Accesso**: Admin
* **Stato**: Proposta di metodo
* **Descrizione**: Restituisce gli utenti in attesa di approvazione per il torneo.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "torneo_id": 1,
  "lista_attesa": [
    {
      "utente_id": 18,
      "nome_utente": "Anna Verdi",
      "data_iscrizione": "2026-10-12T10:35:00",
      "stato": "In_Attesa"
    }
  ]
}
```

### 5.7. Approvazione Utente da Lista d'Attesa
* **Endpoint**: `POST /api/v1/tournaments/{id}/waitlist/{userId}/approve`
* **Accesso**: Admin
* **Stato**: Proposta di metodo
* **Descrizione**: Approva lo studente trasferendolo dalla lista d'attesa a confermato.
* **Request Body**: Nessuno
* **Response (200 OK)**:
```json
{
  "messaggio": "Iscrizione utente approvata con successo"
}
```

### 5.8. Inserimento/Aggiornamento Risultati
* **Endpoint**: `PUT /api/v1/tournaments/{id}/results/{userId}`
* **Accesso**: Admin
* **Stato**: Proposta di metodo
* **Descrizione**: Inserisce o aggiorna il punteggio e la posizione finale di uno studente.
* **Request Body**:
```json
{
  "punti": 120,
  "posizione": 1,
  "vittorie": 4,
  "sconfitte": 1
}
```
* **Response (200 OK)**:
```json
{
  "messaggio": "Risultato aggiornato con successo"
}
```