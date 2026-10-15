import { Component, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService, Iscrizione, Risultato } from '../services/auth.service';
import { environment } from '../../environments/environment';

/** Iscrizione arricchita con i dati del torneo (risposta da /api/utenti/:id/iscrizioni) */
export interface IscrizioneConTorneo extends Iscrizione {
  nome: string;
  gioco: string;
  modalita: string;
  data_inizio: string;
  data_fine: string;
  immagine: string;
  descrizione: string;
  stato_torneo?: string;
}

export type TorneoUtente = IscrizioneConTorneo;
export type UserTournament = TorneoUtente;

/** Formatta "YYYY-MM-DD" → "DD/MM/YYYY" senza perdita timezone */
function formatData(str: string | null | undefined): string {
  if (!str) return '';
  const parti = String(str).substring(0, 10).split('-');
  if (parti.length !== 3) return str;
  return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

@Component({
  selector: 'app-user-area',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="user-area-container">
      <header class="profile-header">
        <div class="header-main">
          <div>
            <span class="user-welcome-tag">BENVENUTO NEL TUO DASHBOARD</span>
            <h1 class="page-title">
              Area Utente — {{ authService.utenteCorrente()?.nome }} {{ authService.utenteCorrente()?.cognome }}
            </h1>
          </div>
          <a routerLink="/tornei" class="btn-browse">🎮 Sfoglia i tornei</a>
        </div>
      </header>

      <!-- BANNER LOADING -->
      @if (caricamento()) {
        <div class="loading-state">
          <span>⏳</span> Caricamento delle tue iscrizioni...
        </div>
      }

      <!-- SEZIONE 1: I MIEI TORNEI -->
      <section class="dashboard-section">
        <h2 class="section-title">I miei tornei</h2>

        <!-- TORNEI IN CORSO -->
        @if (torneiInCorso().length > 0) {
          <div class="sub-section">
            <h3 class="sub-section-title">⚡ Tornei in corso</h3>
            <div class="tournaments-grid">
              @for (t of torneiInCorso(); track t.id) {
                <div class="user-card card-ongoing">
                  <div class="card-image-box">
                    <img [src]="t.immagine || placeholderImg" [alt]="t.nome" />
                  </div>
                  <div class="card-body">
                    <span class="card-gioco">{{ t.gioco }} • {{ t.modalita }}</span>
                    <h4 class="card-name">{{ t.nome }}</h4>
                    <p class="card-dates">🗓 {{ formatData(t.data_inizio) }} — {{ formatData(t.data_fine) }}</p>
                    <div class="status-pill-ongoing">⚡ Competizione attiva</div>
                  </div>
                </div>
              }
            </div>
          </div>
        }

        <!-- TORNEI ISCRITTI (CONFERMATI) -->
        <div class="sub-section">
          <h3 class="sub-section-title">🟢 Tornei Iscritti (In arrivo)</h3>
          <div class="tournaments-grid">
            @for (t of torneiIscritti(); track t.id) {
              <div class="user-card">
                <div class="card-image-box">
                  <img [src]="t.immagine || placeholderImg" [alt]="t.nome" />
                </div>
                <div class="card-body">
                  <span class="card-gioco">{{ t.gioco }} • {{ t.modalita }}</span>
                  <h4 class="card-name">{{ t.nome }}</h4>
                  <p class="card-dates">🗓 Inizio: {{ formatData(t.data_inizio) }}</p>
                  <p class="card-desc">{{ t.descrizione }}</p>

                  <button type="button" class="btn-cancel" (click)="apriModalAnnullamento(t)">
                    Annulla iscrizione
                  </button>
                </div>
              </div>
            } @empty {
              @if (!caricamento()) {
                <div class="empty-card">
                  <span>🎮</span>
                  <p>Non sei ancora iscritto a nessun torneo in arrivo.</p>
                  <a routerLink="/tornei" class="link-tornei">Sfoglia i tornei aperti →</a>
                </div>
              }
            }
          </div>
        </div>

        <!-- TORNEI IN LISTA D'ATTESA -->
        @if (torneiInAttesa().length > 0) {
          <div class="sub-section">
            <h3 class="sub-section-title">🟡 Tornei in Lista d'Attesa</h3>
            <div class="tournaments-grid">
              @for (t of torneiInAttesa(); track t.id) {
                <div class="user-card">
                  <div class="card-image-box">
                    <img [src]="t.immagine || placeholderImg" [alt]="t.nome" />
                  </div>
                  <div class="card-body">
                    <span class="card-gioco">{{ t.gioco }}</span>
                    <h4 class="card-name">{{ t.nome }}</h4>
                    <p class="queue-notice">
                      ⚠️ Sei in posizione <strong>#{{ t.posizione_coda || 1 }}</strong> nella lista d'attesa.
                    </p>

                    <button type="button" class="btn-cancel" (click)="apriModalAnnullamento(t)">
                      Annulla coda
                    </button>
                  </div>
                </div>
              }
            </div>
          </div>
        }
      </section>

      <!-- SEZIONE 2: I TUOI PUNTEGGI & RISULTATI -->
      <section class="dashboard-section scores-section">
        <h2 class="section-title">I tuoi punteggi e risultati</h2>
        <p class="section-desc">Qui trovi tutti i punteggi finali registrati dall'amministrazione per i tornei a cui hai preso parte.</p>

        <div class="scores-cards-grid">
          @for (r of risultatiUtente(); track r.id) {
            <div class="score-card">
              <div class="score-card-header">
                <span class="score-date">📅 {{ r.data_svolgimento }}</span>
              </div>
              <h3 class="score-tournament-title">{{ r.nome_torneo }}</h3>
              <div class="score-result-box">
                <span class="score-label">Punteggio finale:</span>
                <span class="score-value-badge">{{ r.punti }} pt</span>
              </div>
              @if (r.posizione) {
                <div class="score-position-row">
                  <span class="score-label">Posizione:</span>
                  <span class="score-pos-badge"># {{ r.posizione }}</span>
                </div>
              }
            </div>
          } @empty {
            @if (!caricamento()) {
              <div class="empty-scores-box">
                <span class="empty-icon">🎮</span>
                <p class="empty-msg">Nessun punteggio ancora registrato per il tuo profilo.</p>
              </div>
            }
          }
        </div>
      </section>

      <!-- MODAL ANNULLAMENTO ISCRIZIONE -->
      @if (torneoDaAnnullare) {
        <div class="modal-backdrop" (click)="chiudiModalAnnullamento()">
          <div class="modal-dialog-card" (click)="$event.stopPropagation()">
            <div class="modal-icon">⚠️</div>
            <h3 class="modal-dialog-title">Conferma Annullamento</h3>
            <p class="modal-dialog-text">
              Vuoi davvero annullare la tua iscrizione a<br>
              <strong>"{{ torneoDaAnnullare.nome }}"</strong>?
              <br><small>Il tuo posto potrebbe essere assegnato a chi è in lista d'attesa.</small>
            </p>
            <div class="modal-dialog-buttons">
              <button type="button" class="btn-modal-proceed" (click)="confermaAnnullamentoIscrizione()">
                Sì, Annulla Iscrizione
              </button>
              <button type="button" class="btn-modal-abort" (click)="chiudiModalAnnullamento()">
                No, Torna indietro
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-area-container { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem 5rem 2rem; }
    .header-main { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 1.5rem; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 2.5rem; flex-wrap: wrap; gap: 1rem; }
    .page-title { font-size: 2.1rem; font-weight: 800; color: #0f172a; margin: 0; }
    .user-welcome-tag { display: inline-block; font-size: 0.8rem; font-weight: 800; color: #2563eb; letter-spacing: 0.05em; margin-bottom: 0.35rem; text-transform: uppercase; }
    .btn-browse { background: #0f172a; color: white; padding: 0.7rem 1.25rem; border-radius: 8px; font-weight: 700; font-size: 0.9rem; text-decoration: none; }
    .loading-state { text-align: center; padding: 2rem; color: #64748b; font-size: 1rem; }

    .dashboard-section { margin-bottom: 3rem; }
    .section-title { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .section-desc { font-size: 0.92rem; color: #64748b; margin-bottom: 1.5rem; }
    .sub-section { margin-bottom: 2.5rem; }
    .sub-section-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem; color: #0f172a; }

    .tournaments-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.75rem; }
    .user-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
    .card-ongoing { border-color: #3b82f6; }
    .card-image-box { height: 140px; background: #0f172a; overflow: hidden; }
    .card-image-box img { width: 100%; height: 100%; object-fit: cover; }
    .card-body { padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1; gap: 0.5rem; }
    .card-gioco { font-size: 0.72rem; font-weight: 700; color: #2563eb; text-transform: uppercase; }
    .card-name { font-size: 1.1rem; font-weight: 800; margin: 0; color: #0f172a; }
    .card-dates { font-size: 0.82rem; font-weight: 600; color: #64748b; margin: 0; }
    .card-desc { font-size: 0.85rem; color: #475569; flex-grow: 1; }
    .status-pill-ongoing { background: #eff6ff; color: #1d4ed8; padding: 0.6rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-align: center; margin-top: auto; }
    .queue-notice { font-size: 0.82rem; color: #b45309; background: #fffbeb; padding: 0.6rem; border-radius: 8px; }
    .btn-cancel { width: 100%; padding: 0.65rem; background: white; color: #ef4444; border: 1.5px solid #ef4444; border-radius: 8px; font-weight: 700; cursor: pointer; margin-top: auto; }
    .btn-cancel:hover { background: #fef2f2; }

    .empty-card { grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; background: #f8fafc; border-radius: 12px; border: 1.5px dashed #cbd5e1; }
    .empty-card span { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
    .empty-card p { color: #64748b; margin: 0 0 1rem 0; }
    .link-tornei { color: #2563eb; font-weight: 700; text-decoration: underline; }

    /* PUNTEGGI */
    .scores-section { border-top: 1.5px solid #e2e8f0; padding-top: 2.5rem; }
    .scores-cards-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .score-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .score-card-header { display: flex; justify-content: space-between; align-items: center; }
    .game-trophy-badge { font-size: 0.78rem; font-weight: 800; color: #d97706; background-color: #fef3c7; padding: 0.3rem 0.65rem; border-radius: 6px; }
    .score-date { font-size: 0.82rem; font-weight: 600; color: #64748b; }
    .score-tournament-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
    .score-result-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; }
    .score-position-row { display: flex; justify-content: space-between; align-items: center; padding: 0 0.25rem; }
    .score-label { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .score-value-badge { font-size: 0.95rem; font-weight: 800; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.35rem 0.75rem; border-radius: 8px; }
    .score-pos-badge { font-size: 0.95rem; font-weight: 800; color: #0f172a; }
    .empty-scores-box { grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; background: #f8fafc; border-radius: 12px; border: 1.5px dashed #cbd5e1; }
    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
    .empty-msg { color: #64748b; }

    /* MODAL */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .modal-dialog-card { background: white; border-radius: 16px; padding: 2.25rem; max-width: 440px; width: 100%; text-align: center; }
    .modal-icon { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .modal-dialog-title { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
    .modal-dialog-text { font-size: 0.9rem; color: #475569; margin-bottom: 0; line-height: 1.6; }
    .modal-dialog-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-modal-proceed { padding: 0.75rem; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-modal-abort { padding: 0.75rem; background: white; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }

    @media (max-width: 700px) {
      .header-main { flex-direction: column; align-items: flex-start; }
    }
  `]
})
export class UserAreaComponent implements OnInit {
  authService = inject(AuthService);
  private http = inject(HttpClient);

  readonly placeholderImg = 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80';

  // Signals per dati reali
  iscrizioni = signal<IscrizioneConTorneo[]>([]);
  risultatiUtente = signal<Risultato[]>([]);
  caricamento = signal(true);

  // Retrocompatibilità
  get allBaseTournaments() { return this.iscrizioni(); }

  torneoDaAnnullare: IscrizioneConTorneo | null = null;

  // Funzione formattazione data nel template
  formatData = formatData;

  ngOnInit() {
    this.caricaDati();
  }

  caricaDati() {
    const utente = this.authService.utenteCorrente();
    if (!utente?.id) return;

    this.caricamento.set(true);

    // Carica iscrizioni con dettagli torneo
    this.http.get<IscrizioneConTorneo[]>(`${environment.apiUrl}/utenti/${utente.id}/iscrizioni`).subscribe({
      next: (data) => {
        this.iscrizioni.set(data);
        this.caricamento.set(false);
      },
      error: (err) => {
        console.error('Errore caricamento iscrizioni:', err);
        this.caricamento.set(false);
      }
    });

    // Carica risultati/punteggi filtrati per questo utente
    this.http.get<Risultato[]>(`${environment.apiUrl}/risultati`).subscribe({
      next: (tuttiRisultati) => {
        // Filtra solo quelli dell'utente corrente
        const myResults = tuttiRisultati.filter(r => r.utente_id === utente.id);
        this.risultatiUtente.set(myResults.length > 0 ? myResults : tuttiRisultati.filter(r => {
          const nomeCompleto = `${utente.nome} ${utente.cognome}`.toLowerCase();
          return r.nome_studente?.toLowerCase().includes(nomeCompleto) || nomeCompleto.includes(r.nome_studente?.toLowerCase());
        }));
      },
      error: (err) => console.error('Errore caricamento risultati:', err)
    });
  }

  torneiIscritti = () => this.iscrizioni().filter(
    i => i.stato === 'Confermata' && i.stato_torneo !== 'In Corso' && i.stato_torneo !== 'Concluso'
  );

  torneiInCorso = () => this.iscrizioni().filter(
    i => i.stato === 'Confermata' && i.stato_torneo === 'In Corso'
  );

  torneiInAttesa = () => this.iscrizioni().filter(
    i => i.stato === 'In_Attesa'
  );

  apriModalAnnullamento(t: IscrizioneConTorneo) {
    this.torneoDaAnnullare = t;
  }

  chiudiModalAnnullamento() {
    this.torneoDaAnnullare = null;
  }

  confermaAnnullamentoIscrizione() {
    if (!this.torneoDaAnnullare) return;
    const utente = this.authService.utenteCorrente();
    const torneoId = this.torneoDaAnnullare.torneo_id || this.torneoDaAnnullare.id;

    this.http.delete(`${environment.apiUrl}/iscrizioni?utenteId=${utente?.id}&torneoId=${torneoId}`).subscribe({
      next: () => {
        this.chiudiModalAnnullamento();
        this.caricaDati(); // Ricarica i dati del profilo utente
        this.authService.caricaIscrizioni(); // Aggiorna anche il segnale condiviso (usato da eIscritto())
      },
      error: (err) => {
        alert(err.error?.error || 'Errore durante l\'annullamento dell\'iscrizione.');
        this.chiudiModalAnnullamento();
      }
    });
  }

  // Alias retrocompatibili
  openCancelModal(t: IscrizioneConTorneo) { this.apriModalAnnullamento(t); }
  closeCancelModal() { this.chiudiModalAnnullamento(); }
  confirmCancelRegistration() { this.confermaAnnullamentoIscrizione(); }
}