import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Entità Torneo per Profilo Studente dal Documento Requisiti (pagg. 13, 14, 15)
export interface TorneoUtente {
  id: number;
  torneo_id?: number;
  nome: string;
  gioco: string;
  modalita: 'ONLINE' | 'IN SEDE';
  data_inizio: string;
  data_fine: string;
  immagine: string;
  descrizione: string;
  stato_iscrizione: 'Confermata' | 'In_Attesa' | 'In_Corso' | 'Concluso' | 'iscritto' | 'in_coda' | 'in_corso';
  posizione_coda?: number;
  punti?: string;
  posizione?: string | number;
}
export type UserTournament = TorneoUtente;

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
              Area Utente - {{ authService.utenteCorrente()?.nome }} {{ authService.utenteCorrente()?.cognome }}
            </h1>
          </div>
          <div class="current-date-badge">📅 13 Ottobre 2026</div>
        </div>
      </header>

      <!-- SEZIONE 1: I MIEI TORNEI -->
      <section class="dashboard-section">
        <h2 class="section-title">I miei tornei</h2>

        <!-- TORNEI IN CORSO -->
        <div class="sub-section">
          <h3 class="sub-section-title">⚡ Tornei in corso</h3>
          <div class="tournaments-grid">
            @for (t of torneiInCorso; track t.id) {
              <div class="user-card card-ongoing">
                <div class="card-image-box"><img [src]="t.immagine" [alt]="t.nome" /></div>
                <div class="card-body">
                  <h4 class="card-name">{{ t.nome }}</h4>
                  <p class="card-dates">🗓 {{ t.data_inizio }} - {{ t.data_fine }}</p>
                  <p class="card-desc">{{ t.descrizione }}</p>
                  <div class="status-pill-ongoing">⚡ Competizione attiva</div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- TORNEI ISCRITTI -->
        <div class="sub-section">
          <h3 class="sub-section-title">🟢 Tornei Iscritti (In arrivo)</h3>
          <div class="tournaments-grid">
            @for (t of torneiIscritti; track t.id) {
              <div class="user-card">
                <div class="card-image-box"><img [src]="t.immagine" [alt]="t.nome" /></div>
                <div class="card-body">
                  <h4 class="card-name">{{ t.nome }}</h4>
                  <p class="card-dates">🗓 Inizio: {{ t.data_inizio }}</p>
                  <p class="card-desc">{{ t.descrizione }}</p>

                  <button type="button" class="btn-cancel" (click)="apriModalAnnullamento(t)">Annulla iscrizione</button>
                </div>
              </div>
            } @empty {
              <p class="empty-msg">Non sei iscritto a nessun torneo. <a routerLink="/tornei">Sfoglia i tornei aperti</a></p>
            }
          </div>
        </div>

        <!-- TORNEI IN CODA -->
        <div class="sub-section">
          <h3 class="sub-section-title">🟡 Tornei in Coda d'Attesa</h3>
          <div class="tournaments-grid">
            @for (t of torneiInAttesa; track t.id) {
              <div class="user-card">
                <div class="card-image-box"><img [src]="t.immagine" [alt]="t.nome" /></div>
                <div class="card-body">
                  <h4 class="card-name">{{ t.nome }}</h4>
                  <p class="queue-notice">⚠️ Sei in posizione <strong>#{{ t.posizione_coda || 2 }}</strong> nella lista d'attesa.</p>

                  <button type="button" class="btn-cancel" (click)="apriModalAnnullamento(t)">Annulla coda</button>
                </div>
              </div>
            } @empty {
              <p class="empty-msg">Non sei in coda d'attesa per alcun torneo.</p>
            }
          </div>
        </div>
      </section>

      <!-- SEZIONE 2: I TUOI PUNTEGGI & RISULTATI -->
      <section class="dashboard-section scores-section">
        <h2 class="section-title">I tuoi punteggi e risultati</h2>
        <p class="section-desc">Qui trovi tutti i punteggi finali registrati dall'amministrazione per i tornei a cui hai preso parte.</p>

        <div class="scores-cards-grid">
          @for (r of risultatiRicevuti; track r.id) {
            <div class="score-card">
              <div class="score-card-header">
                <span class="game-trophy-badge">🏆 Torneo</span>
                <span class="score-date">📅 {{ r.data_svolgimento }}</span>
              </div>
              <h3 class="score-tournament-title">{{ r.nome_torneo }}</h3>
              <div class="score-result-box">
                <span class="score-label">Punteggio finale ottenuto:</span>
                <span class="score-value-badge">{{ r.punti }}</span>
              </div>
            </div>
          } @empty {
            <div class="empty-scores-box">
              <span class="empty-icon">🎮</span>
              <p class="empty-msg">Nessun punteggio ancora registrato per il tuo profilo.</p>
            </div>
          }
        </div>
      </section>

      <!-- MODAL ANNULLAMENTO -->
      @if (torneoDaAnnullare) {
        <div class="modal-backdrop" (click)="chiudiModalAnnullamento()">
          <div class="modal-dialog-card" (click)="$event.stopPropagation()">
            <h3 class="modal-dialog-title">Sei sicuro di voler annullare?</h3>
            <p class="modal-dialog-text">Annullando l'iscrizione per "{{ torneoDaAnnullare.nome }}" libererai il tuo posto.</p>
            <div class="modal-dialog-buttons">
              <button type="button" class="btn-modal-proceed" (click)="confermaAnnullamentoIscrizione()">Procedi</button>
              <button type="button" class="btn-modal-abort" (click)="chiudiModalAnnullamento()">Annulla</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .user-area-container { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem 5rem 2rem; }
    .header-main { display: flex; justify-content: space-between; align-items: flex-end; padding-bottom: 1.5rem; border-bottom: 1.5px solid #e2e8f0; margin-bottom: 2.5rem; }
    .page-title { font-size: 2.25rem; font-weight: 800; color: #0f172a; margin: 0; }
    .current-date-badge { background: #f8fafc; border: 1.5px solid #cbd5e1; padding: 0.5rem 1rem; border-radius: 8px; font-weight: 700; }
    .user-welcome-tag { display: inline-block; font-size: 0.8rem; font-weight: 800; color: #2563eb; letter-spacing: 0.05em; margin-bottom: 0.35rem; }

    .dashboard-section { margin-bottom: 3rem; }
    .section-title { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin-bottom: 0.5rem; }
    .section-desc { font-size: 0.92rem; color: #64748b; margin-bottom: 1.5rem; }

    .sub-section { margin-bottom: 2.5rem; }
    .sub-section-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem; color: #0f172a; }
    .tournaments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
    
    .user-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
    .card-image-box { height: 140px; background: #0f172a; }
    .card-image-box img { width: 100%; height: 100%; object-fit: cover; }
    .card-body { padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1; }
    .card-name { font-size: 1.1rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #0f172a; }
    .card-dates { font-size: 0.82rem; font-weight: 600; color: #64748b; margin: 0 0 0.5rem 0; }
    .card-desc { font-size: 0.85rem; color: #475569; margin-bottom: 1.25rem; flex-grow: 1; }

    .status-pill-ongoing { background: #eff6ff; color: #1d4ed8; padding: 0.6rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-align: center; }
    .queue-notice { font-size: 0.82rem; color: #b45309; background: #fffbeb; padding: 0.6rem; border-radius: 8px; margin-bottom: 1rem; }

    .btn-cancel { width: 100%; padding: 0.65rem; background: white; color: #ef4444; border: 1.5px solid #ef4444; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-cancel:hover { background: #fef2f2; }

    /* SEZIONE PUNTEGGI */
    .scores-section { border-top: 1.5px solid #e2e8f0; padding-top: 2.5rem; }
    .scores-cards-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
    .score-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; padding: 1.5rem; display: flex; flex-direction: column; gap: 0.75rem; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03); }
    .score-card-header { display: flex; justify-content: space-between; align-items: center; }
    .game-trophy-badge { font-size: 0.78rem; font-weight: 800; color: #d97706; background-color: #fef3c7; padding: 0.3rem 0.65rem; border-radius: 6px; }
    .score-date { font-size: 0.82rem; font-weight: 600; color: #64748b; }
    .score-tournament-title { font-size: 1.2rem; font-weight: 800; color: #0f172a; margin: 0; }
    .score-result-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 0.85rem 1rem; display: flex; justify-content: space-between; align-items: center; }
    .score-label { font-size: 0.85rem; font-weight: 600; color: #475569; }
    .score-value-badge { font-size: 0.95rem; font-weight: 800; color: #10b981; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.35rem 0.75rem; border-radius: 8px; }

    .empty-scores-box { grid-column: 1 / -1; text-align: center; padding: 2.5rem 1rem; background: #f8fafc; border-radius: 12px; border: 1.5px dashed #cbd5e1; }
    .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .modal-dialog-card { background: white; border-radius: 16px; padding: 2rem; max-width: 420px; text-align: center; }
    .modal-dialog-title { font-size: 1.3rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
    .modal-dialog-text { font-size: 0.9rem; color: #475569; margin-bottom: 1.5rem; }
    .modal-dialog-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-modal-proceed { padding: 0.75rem; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-modal-abort { padding: 0.75rem; background: white; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .empty-msg { font-size: 0.9rem; color: #64748b; font-style: italic; }

    @media (max-width: 900px) {
      .tournaments-grid { grid-template-columns: repeat(2, 1fr); }
      .scores-cards-grid { grid-template-columns: 1fr; }
    }
    @media (max-width: 600px) {
      .tournaments-grid { grid-template-columns: 1fr; }
      .header-main { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
  `]
})
export class UserAreaComponent {
  authService = inject(AuthService);

  tuttiTorneiBase: TorneoUtente[] = [
    { 
      id: 1, 
      torneo_id: 1,
      nome: 'EA Sports FC 25 Championship', 
      gioco: 'CALCIO E-SPORTS', 
      modalita: 'IN SEDE', 
      data_inizio: '24 Ottobre 2026', 
      data_fine: '26 Ottobre 2026', 
      immagine: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80', 
      descrizione: 'Torneo 1v1 su PS5 confermato.', 
      stato_iscrizione: 'Confermata' 
    },
    { 
      id: 2, 
      torneo_id: 2,
      nome: 'Rocket League E-Sports Cup', 
      gioco: 'VEHICULAR SOCCER', 
      modalita: 'ONLINE', 
      data_inizio: '31 Ottobre 2026', 
      data_fine: '2 Novembre 2026', 
      immagine: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 
      descrizione: 'Sei in lista d\'attesa per il team 3v3.', 
      stato_iscrizione: 'In_Attesa', 
      posizione_coda: 1 
    },
    { 
      id: 3, 
      torneo_id: 3,
      nome: 'Valorant Tactical Showdown', 
      gioco: 'FPS TATTICO 5v5', 
      modalita: 'ONLINE', 
      data_inizio: '10 Ottobre 2026', 
      data_fine: '16 Ottobre 2026', 
      immagine: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80', 
      descrizione: 'Torneo 5v5 in corso con streaming.', 
      stato_iscrizione: 'In_Corso' 
    },
    { 
      id: 4, 
      torneo_id: 4,
      nome: 'Tekken 8 Iron Fist Trophy', 
      gioco: 'PICCHIADURO 1v1', 
      modalita: 'IN SEDE', 
      data_inizio: '14 Novembre 2026', 
      data_fine: '15 Novembre 2026', 
      immagine: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 
      descrizione: 'Sei in lista d\'attesa per i gironi.', 
      stato_iscrizione: 'In_Attesa', 
      posizione_coda: 2 
    },
    { 
      id: 5, 
      torneo_id: 5,
      nome: 'League of Legends Rift Clash', 
      gioco: 'MOBA 5v5', 
      modalita: 'ONLINE', 
      data_inizio: '21 Novembre 2026', 
      data_fine: '23 Novembre 2026', 
      immagine: 'https://images.unsplash.com/photo-1547394765-185e131e37b2?auto=format&fit=crop&w=600&q=80', 
      descrizione: 'Iscrizione team confermata nella Landa.', 
      stato_iscrizione: 'Confermata' 
    }
  ];

  torneoDaAnnullare: TorneoUtente | null = null;

  // Alias retrocompatibili
  get allBaseTournaments(): TorneoUtente[] { return this.tuttiTorneiBase; }
  get tournamentToCancel(): TorneoUtente | null { return this.torneoDaAnnullare; }

  get torneiInCorso(): TorneoUtente[] {
    return this.tuttiTorneiBase.filter(t => t.stato_iscrizione === 'In_Corso' || t.stato_iscrizione === 'in_corso');
  }
  get ongoingTournaments(): TorneoUtente[] { return this.torneiInCorso; }

  get torneiIscritti(): TorneoUtente[] {
    const iscrizioniConfermate = this.authService.iscrizioniUtente().filter(i => i.stato === 'Confermata');
    const ids = iscrizioniConfermate.map(i => i.torneo_id);
    return this.tuttiTorneiBase.filter(t => ids.includes(t.id) && t.stato_iscrizione !== 'In_Corso' && t.stato_iscrizione !== 'in_corso');
  }
  get registeredTournaments(): TorneoUtente[] { return this.torneiIscritti; }

  get torneiInAttesa(): TorneoUtente[] {
    const iscrizioniInAttesa = this.authService.iscrizioniUtente().filter(i => i.stato === 'In_Attesa');
    return iscrizioniInAttesa.map(i => {
      const base = this.tuttiTorneiBase.find(t => t.id === i.torneo_id);
      return {
        ...base!,
        posizione_coda: i.posizione_coda || 1
      };
    }).filter(t => t.id);
  }
  get queuedTournaments(): TorneoUtente[] { return this.torneiInAttesa; }

  get risultatiRicevuti() {
    const nomeUtente = `${this.authService.utenteCorrente()?.nome || ''} ${this.authService.utenteCorrente()?.cognome || ''}`.trim().toLowerCase();
    const tuttiRisultati = this.authService.risultatiStudenti();
    if (!nomeUtente) return tuttiRisultati;
    const filtrati = tuttiRisultati.filter(r => 
      r.nome_studente.toLowerCase().includes(nomeUtente) || 
      nomeUtente.includes(r.nome_studente.toLowerCase())
    );
    return filtrati.length > 0 ? filtrati : tuttiRisultati;
  }
  get userScores() { return this.risultatiRicevuti; }

  apriModalAnnullamento(t: TorneoUtente) { this.torneoDaAnnullare = t; }
  openCancelModal(t: TorneoUtente) { this.apriModalAnnullamento(t); }

  chiudiModalAnnullamento() { this.torneoDaAnnullare = null; }
  closeCancelModal() { this.chiudiModalAnnullamento(); }

  confermaAnnullamentoIscrizione() {
    if (!this.torneoDaAnnullare) return;
    this.authService.annullaIscrizione(this.torneoDaAnnullare.id);
    this.chiudiModalAnnullamento();
  }
  confirmCancelRegistration() { this.confermaAnnullamentoIscrizione(); }
}