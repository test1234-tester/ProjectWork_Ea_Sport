# Documentazione Progetto: ProjectWork_Ea_Sport

Benvenuto nella documentazione ufficiale della piattaforma per la gestione di tornei ed e-sports ITS.

## Indice della Documentazione
* [Specifiche API REST](api.md)
* [Richieste di Modifica e Uniformazione (Change Requests)](change-requests.md)
* [Diagramma ER e Modello Dati](#modello-dati-ed-er)

---

## Architettura e Pagine del Front-End

La piattaforma si articola nelle seguenti sezioni principali:

1. **Landing Page / Homepage (`/`)**
   * **Obiettivo**: Presentazione del brand, partner e FAQ interattive.
   * **Componenti principali**: `NavbarHeader`, `HeroSection`, `PartnerLogoSection`, `AccordionFAQSection`, `FooterGlobal`.

2. **Pagina Registrazione (`/register`)**
   * **Obiettivo**: Registrazione di un nuovo profilo studente.
   * **Requisiti sicurezza password**: Minimo 8 caratteri, una lettera maiuscola, un numero e un carattere speciale.

3. **Pagina Accesso / Login (`/login`)**
   * **Obiettivo**: Autenticazione per Studenti ed Amministratori.

4. **Pagina Catalogo Tornei (`/tornei`)**
   * **Obiettivo**: Consultazione dei tornei attivi, in corso o conclusi e gestione delle iscrizioni.
   * **Stati torneo**: `Aperto`, `Numero max raggiunto`, `In corso`, `Chiuso`.

5. **Pagina Area Utente (`/profile`)**
   * **Obiettivo**: Dashboard personale dello studente.
   * **Funzionalità**: Gestione corsi iscritti, corsi in attesa, download attestati in PDF, visualizzazione metriche e classifiche (K/D medio, vittorie, posizioni).

6. **Dashboard Amministratore (`/admin`)**
   * **Obiettivo**: Pannello riservato alla gestione dei tornei e delle iscrizioni.
   * **Funzionalità**: Creazione/modifica/eliminazione tornei, approvazione utenti dalla lista d'attesa, inserimento punteggi e rank.

---

## Modello Dati ed ER

Il database si basa su 5 entità principali:

* **UTENTE**: Registra gli utenti con ruoli `Admin` e `User`.
* **TORNEO**: Mantiene le informazioni generali, le date e lo stato del torneo (`Aperto`, `In Corso`, `Chiuso`, `Cancellato`).
* **ISCRIZIONE**: Traccia la richiesta di partecipazione (`Confermata`, `In_Attesa`).
* **RISULTATO**: Memorizza punti, posizione, vittorie e sconfitte degli utenti.
* **FAQ**: Gestisce le domande frequenti visualizzate nella Landing Page.

### Relazioni e Cardinalità
* **UTENTE (0,N) — ISCRIZIONE (1,1)**: Un utente può effettuare più iscrizioni; ogni iscrizione appartiene a un solo utente.
* **TORNEO (0,N) — ISCRIZIONE (1,1)**: Un torneo riceve più iscrizioni; ogni iscrizione si riferisce a un solo torneo.
* **UTENTE (0,N) — RISULTATO (1,1)**: Un utente ottiene più risultati; ogni risultato fa riferimento a un solo utente.
* **TORNEO (0,N) — RISULTATO (1,1)**: Un torneo registra più risultati; ciascun risultato appartiene a un solo torneo.