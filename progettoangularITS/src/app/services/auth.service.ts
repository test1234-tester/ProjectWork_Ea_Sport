import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

// 1. Entità UTENTE dal Documento Requisiti
export interface Utente {
  id?: number;
  nome: string;
  cognome: string;
  email: string;
  password?: string;
  ruolo?: 'Admin' | 'User';
}
export type User = Utente;

// 2. Entità ISCRIZIONE dal Documento Requisiti
export interface Iscrizione {
  id: number;
  torneo_id: number;
  data_iscrizione?: string;
  stato: 'Confermata' | 'In_Attesa';
  posizione_coda?: number;
}
export type EnrolledTournament = Iscrizione;

// 3. Entità RISULTATO dal Documento Requisiti
export interface Risultato {
  id: number | string;
  torneo_id: number;
  utente_id?: number;
  nome_torneo: string;
  data_svolgimento: string;
  nome_studente: string;
  punti: string;
  posizione?: number | string;
  vittorie?: number;
  sconfitte?: number;
}
export type TournamentScore = Risultato;

export interface AuthResponse {
  messaggio?: string;
  utente: Utente;
  token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // Utente attualmente connesso
  utenteCorrente = signal<Utente | null>(this.recuperaUtenteMemorizzato());

  // Tornei a cui l'utente corrente è iscritto
  iscrizioniUtente = signal<Iscrizione[]>([]);

  // Risultati e punteggi ufficiali
  risultatiStudenti = signal<Risultato[]>([]);

  // Getter alias retrocompatibili
  get currentUser() { return this.utenteCorrente; }
  get userEnrollments() { return this.iscrizioniUtente; }
  get studentScores() { return this.risultatiStudenti; }

  constructor() {
    if (this.eAutenticato()) {
      this.caricaIscrizioni();
      this.caricaRisultati();
    }
  }

  private recuperaUtenteMemorizzato(): Utente | null {
    const jsonUtente = localStorage.getItem('current_user');
    return jsonUtente ? JSON.parse(jsonUtente) : null;
  }

  private impostaSessione(res: AuthResponse): void {
    const utente = res.utente;
    localStorage.setItem('current_user', JSON.stringify(utente));
    if (res.token) {
      localStorage.setItem('auth_token', res.token);
    }
    this.utenteCorrente.set(utente);
    this.caricaIscrizioni();
    this.caricaRisultati();
  }

  // --- AUTENTICAZIONE E REGISTRAZIONE ---

  // Registrazione: invia i dati al backend PostgreSQL
  registra(datiUtente: { nome: string; cognome: string; email: string; password?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/register`, datiUtente);
  }
  register(datiUtente: { nome: string; cognome: string; email: string; password?: string }) {
    return this.registra(datiUtente);
  }

  // Login: effettua la chiamata HTTP al backend Express
  accedi(credenziali: { email: string; password?: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, credenziali).pipe(
      tap(res => this.impostaSessione(res))
    );
  }
  login(email: string, password?: string) {
    return this.accedi({ email, password });
  }

  esci() {
    localStorage.removeItem('current_user');
    localStorage.removeItem('auth_token');
    this.utenteCorrente.set(null);
    this.iscrizioniUtente.set([]);
    this.risultatiStudenti.set([]);
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

  // --- GESTIONE ISCRIZIONI ---

  caricaIscrizioni(): void {
    const utente = this.utenteCorrente();
    if (!utente || !utente.id) return;

    this.http.get<Iscrizione[]>(`${this.apiUrl}/utenti/${utente.id}/iscrizioni`).subscribe({
      next: (iscrizioni) => this.iscrizioniUtente.set(iscrizioni),
      error: (err) => console.error('Errore nel caricamento delle iscrizioni:', err)
    });
  }

  iscriviAlTorneo(torneoId: number, stato: 'Confermata' | 'In_Attesa', posizioneCoda?: number): Observable<Iscrizione> {
    const utente = this.utenteCorrente();

    // Verifica limite iscrizioni (impostato dall'admin in localStorage)
    const limiteStr = localStorage.getItem('limite_iscrizioni_admin');
    const limite = limiteStr ? Number(limiteStr) : 3;
    const iscrizioniConfermateAttive = this.iscrizioniUtente().filter(i => i.stato === 'Confermata').length;

    if (iscrizioniConfermateAttive >= limite) {
      // Limite raggiunto: mostra alert, NON mettere in coda
      return throwError(() => ({
        error: {
          errore: `Hai raggiunto il limite di ${limite} iscrizioni contemporanee. Annulla un'iscrizione per potertene iscrivere a nuovi tornei.`,
          error: `Hai raggiunto il limite di ${limite} iscrizioni contemporanee. Annulla un'iscrizione per potertene iscrivere a nuovi tornei.`
        }
      }));
    }

    const payload = { utente_id: utente?.id, torneo_id: torneoId, stato, posizione_coda: posizioneCoda };

    return this.http.post<any>(`${this.apiUrl}/iscrizioni`, payload).pipe(
      tap((risposta: any) => {
        // Il backend restituisce { messaggio, iscrizione: { id, torneo_id, stato, data_iscrizione } }
        // oppure direttamente l'oggetto iscrizione (retrocompatibilità)
        const nuovaIscrizione: Iscrizione = risposta?.iscrizione ?? risposta;
        if (nuovaIscrizione?.torneo_id) {
          this.iscrizioniUtente.set([...this.iscrizioniUtente(), nuovaIscrizione]);
        }
      })
    );
  }
  enrollInTournament(torneoId: number, tipo: 'iscritto' | 'in_coda', posizione?: number) {
    return this.iscriviAlTorneo(torneoId, tipo === 'iscritto' ? 'Confermata' : 'In_Attesa', posizione);
  }


  annullaIscrizione(torneoId: number): Observable<void> {
    const utente = this.utenteCorrente();
    return this.http.delete<void>(`${this.apiUrl}/iscrizioni?utenteId=${utente?.id}&torneoId=${torneoId}`).pipe(
      tap(() => {
        const nuovaLista = this.iscrizioniUtente().filter(i => i.torneo_id !== torneoId);
        this.iscrizioniUtente.set(nuovaLista);
      })
    );
  }
  cancelEnrollment(torneoId: number) {
    return this.annullaIscrizione(torneoId);
  }

  eIscritto(torneoId: number): boolean {
    if (this.eAdmin()) return false;
    return this.iscrizioniUtente().some(i => i.torneo_id === torneoId);
  }
  isEnrolled(torneoId: number): boolean {
    return this.eIscritto(torneoId);
  }

  // --- GESTIONE RISULTATI ---

  caricaRisultati(): void {
    this.http.get<Risultato[]>(`${this.apiUrl}/risultati`).subscribe({
      next: (risultati) => this.risultatiStudenti.set(risultati),
      error: (err) => console.error('Errore nel caricamento dei risultati:', err)
    });
  }

  aggiungiRisultato(risultato: Risultato): Observable<Risultato> {
    return this.http.post<Risultato>(`${this.apiUrl}/risultati`, risultato).pipe(
      tap(nuovoRisultato => {
        this.risultatiStudenti.set([nuovoRisultato, ...this.risultatiStudenti()]);
      })
    );
  }
  addScore(risultato: Risultato) {
    return this.aggiungiRisultato(risultato);
  }
}