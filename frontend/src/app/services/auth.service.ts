import { Injectable, signal } from '@angular/core';

// 1. Entità UTENTE dal Documento Requisiti (pagg. 5, 7, 19)
export interface Utente {
  id?: number;
  nome: string;
  cognome: string;
  email: string;
  password?: string;
  ruolo?: 'Admin' | 'User';
}
export type User = Utente;

// 2. Entità ISCRIZIONE dal Documento Requisiti (pagg. 12, 19, 20)
export interface Iscrizione {
  id: number;
  torneo_id: number;
  data_iscrizione?: string;
  stato: 'Confermata' | 'In_Attesa';
  posizione_coda?: number;
}
export type EnrolledTournament = Iscrizione;

// 3. Entità RISULTATO dal Documento Requisiti (pagg. 14, 19, 20)
export interface Risultato {
  id: number | string;
  torneo_id: number;
  nome_torneo: string;
  data_svolgimento: string;
  nome_studente: string;
  punti: string;
  posizione?: number | string;
  vittorie?: number;
  sconfitte?: number;
}
export type TournamentScore = Risultato;

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Utente attualmente connesso
  utenteCorrente = signal<Utente | null>(this.recuperaUtenteMemorizzato());

  // Tornei a cui l'utente corrente è iscritto o in attesa
  iscrizioniUtente = signal<Iscrizione[]>(this.recuperaIscrizioniMemorizzate());

  // Risultati e punteggi ufficiali assegnati agli studenti
  risultatiStudenti = signal<Risultato[]>(this.recuperaRisultatiMemorizzati());

  // Getter alias retrocompatibili
  get currentUser() { return this.utenteCorrente; }
  get userEnrollments() { return this.iscrizioniUtente; }
  get studentScores() { return this.risultatiStudenti; }

  private recuperaUtenteMemorizzato(): Utente | null {
    const jsonUtente = localStorage.getItem('mock_current_user');
    return jsonUtente ? JSON.parse(jsonUtente) : null;
  }

  private recuperaIscrizioniMemorizzate(): Iscrizione[] {
    const dati = localStorage.getItem('mock_user_enrollments');
    return dati ? JSON.parse(dati) : [];
  }

  private recuperaRisultatiMemorizzati(): Risultato[] {
    const dati = localStorage.getItem('mock_student_scores');
    if (dati) {
      try {
        return JSON.parse(dati);
      } catch {
        // fallback
      }
    }
    return [
      {
        id: 1,
        torneo_id: 6,
        nome_torneo: 'Super Smash Bros. Ultimate Arena',
        data_svolgimento: '01/10/2026 - 03/10/2026',
        nome_studente: 'Mario Rossi',
        punti: '3° Posto - Semifinalista (850 pt)',
        posizione: 3,
        vittorie: 4,
        sconfitte: 1
      },
      {
        id: 2,
        torneo_id: 3,
        nome_torneo: 'Valorant Tactical Showdown',
        data_svolgimento: '10/10/2026 - 16/10/2026',
        nome_studente: 'Mario Rossi',
        punti: 'Vittoria Girone A (13 - 9)',
        posizione: 1,
        vittorie: 3,
        sconfitte: 0
      }
    ];
  }

  // Registrazione: salva l'account senza effettuare il login automatico
  registra(datiUtente: { nome: string; cognome: string; email: string; password?: string }) {
    const utentiRegistrati: Utente[] = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
    utentiRegistrati.push({
      ...datiUtente,
      id: Date.now(),
      ruolo: datiUtente.email.toLowerCase().includes('admin') ? 'Admin' : 'User'
    });
    localStorage.setItem('mock_registered_users', JSON.stringify(utentiRegistrati));
  }
  register(datiUtente: { nome: string; cognome: string; email: string }) {
    this.registra(datiUtente);
  }

  // Login: cerca l'utente registrato o ne crea uno fittizio mantenendo il nome fornito
  accedi(email: string) {
    const utentiRegistrati: Utente[] = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
    const utenteTrovato = utentiRegistrati.find(u => u.email.toLowerCase() === email.toLowerCase());

    const utente: Utente = utenteTrovato ? utenteTrovato : { 
      email, 
      nome: 'Mario', 
      cognome: 'Rossi',
      ruolo: email.toLowerCase().includes('admin') ? 'Admin' : 'User'
    };
    localStorage.setItem('mock_current_user', JSON.stringify(utente));
    this.utenteCorrente.set(utente);
  }
  login(email: string) {
    this.accedi(email);
  }

  esci() {
    localStorage.removeItem('mock_current_user');
    this.utenteCorrente.set(null);
  }
  logout() {
    this.esci();
  }

  eAutenticato(): boolean {
    return this.utenteCorrente() !== null;
  }
  isLoggedIn(): boolean {
    return this.eAutenticato();
  }

  eAdmin(): boolean {
    const utente = this.utenteCorrente();
    return !!utente && (utente.ruolo === 'Admin' || utente.email.toLowerCase().includes('admin'));
  }
  isAdmin(): boolean {
    return this.eAdmin();
  }

  // Gestione Iscrizioni ai Tornei
  iscriviAlTorneo(torneoId: number, stato: 'Confermata' | 'In_Attesa', posizioneCoda?: number) {
    const listaAttuale = this.iscrizioniUtente();
    if (!listaAttuale.some(i => i.torneo_id === torneoId)) {
      const nuovaLista: Iscrizione[] = [
        ...listaAttuale, 
        { 
          id: Date.now(), 
          torneo_id: torneoId, 
          stato, 
          data_iscrizione: new Date().toISOString(),
          posizione_coda: posizioneCoda 
        }
      ];
      this.iscrizioniUtente.set(nuovaLista);
      localStorage.setItem('mock_user_enrollments', JSON.stringify(nuovaLista));
    }
  }
  enrollInTournament(torneoId: number, tipo: 'iscritto' | 'in_coda', posizione?: number) {
    this.iscriviAlTorneo(torneoId, tipo === 'iscritto' ? 'Confermata' : 'In_Attesa', posizione);
  }

  annullaIscrizione(torneoId: number) {
    const nuovaLista = this.iscrizioniUtente().filter(i => i.torneo_id !== torneoId);
    this.iscrizioniUtente.set(nuovaLista);
    localStorage.setItem('mock_user_enrollments', JSON.stringify(nuovaLista));
  }
  cancelEnrollment(torneoId: number) {
    this.annullaIscrizione(torneoId);
  }

  eIscritto(torneoId: number): boolean {
    // Se l'utente connesso è un amministratore, non è iscritto e vede i tornei come non loggato
    if (this.eAdmin()) {
      return false;
    }
    return this.iscrizioniUtente().some(i => i.torneo_id === torneoId);
  }
  isEnrolled(torneoId: number): boolean {
    return this.eIscritto(torneoId);
  }

  // Gestione Risultati Tornei
  aggiungiRisultato(risultato: Risultato) {
    const listaAttuale = this.risultatiStudenti();
    const aggiornata = [risultato, ...listaAttuale];
    this.risultatiStudenti.set(aggiornata);
    localStorage.setItem('mock_student_scores', JSON.stringify(aggiornata));
  }
  addScore(risultato: Risultato) {
    this.aggiungiRisultato(risultato);
  }
}