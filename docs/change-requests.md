# Registro Change Requests - ProjectWork EA Sport

Il presente documento traccia le modifiche ai requisiti concordate con il cliente/docente durante lo sviluppo del progetto.

---

## 📄 Change Request CR-01: Gestione Limite Dinamico Iscrizioni Utente

* **Data Richiesta:** 14 Ottobre 2026
* **Richiedente:** Docente / Product Owner
* **Stato:** Approvato / In Sviluppo
* **Moduli Impattati:** `Utente`, `Iscrizione`, Database PostgreSQL, Frontend Angular

---

### 1. Descrizione del Requisito
Per prevenire l'occupazione eccessiva di posti nei tornei/corsi da parte dei singoli utenti, viene introdotta una regola sul numero massimo di iscrizioni contemporanee consentite per ciascun utente.

* **Valore Default:** Ogni utente può iscriversi a un numero massimo di **3 tornei/corsi**.
* **Gestione Lista d'Attesa:** Il limite si applica sia alle iscrizioni confermate sia a quelle in coda/lista d'attesa (`In_Attesa`). Se l'utente ha raggiunto il proprio limite, non può iscriversi né mettersi in coda.
* **Gestione Amministratore:** L'Admin deve avere la possibilità di modificare individualmente il valore massimo di iscrizioni consentite per un determinato utente (es. portarlo da 3 a 5 o a qualsiasi altro numero).
* **Feedback Utente (UI):** Tentando un'iscrizione oltre il limite consentito, l'applicazione deve bloccare l'operazione e mostrare l'alert:
  > `"hai raggiunto il numero massimo di iscrizioni"`

---

### 2. Impatti di Architettura e Logica di Sistema

#### A. Persistenza Dati (Database)
* Aggiunta del campo `max_iscrizioni` nella tabella `utente` con valore predefinito pari a `3`.

#### B. Logica Backend (Spring Boot)
1. **Modulo Utente:**
   * Estensione del modello dati dell'utente per includere il parametro `maxIscrizioni`.
   * Esposizione di un endpoint REST dedicato all'Amministratore per aggiornare il limite massimo di un singolo utente.

2. **Modulo Iscrizione:**
   * In fase di creazione di una nuova iscrizione, il sistema esegue un controllo preliminare sul totale delle iscrizioni già associate all'utente.
   * Se il numero totale di iscrizioni attive raggiunge o supera il valore `maxIscrizioni` dell'utente, la richiesta viene bloccata e viene restituito il messaggio d'errore concordato.

#### C. Interfaccia Utente (Frontend Angular)
* **Gestione Errore:** Intercettazione della risposta di errore del backend con visualizzazione dell'alert per l'utente (`"hai raggiunto il numero massimo di iscrizioni"`).
* **Pannello Amministratore:** Aggiunta della funzionalità per permettere all'Admin di visualizzare e modificare il limite `maxIscrizioni` nella scheda di ciascun utente.
