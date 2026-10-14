import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

// Entità TORNEO dal Documento Requisiti (pagg. 3, 9, 10, 19, 20)
export interface Torneo {
  id: number;
  nome: string;
  gioco: string;
  modalita: 'ONLINE' | 'IN SEDE';
  stato: 'Aperto' | 'Numero max raggiunto' | 'In corso' | 'Chiuso' | 'aperto' | 'max_raggiunto' | 'in_corso' | 'chiuso';
  stato_label: string;
  data_inizio: string;
  data_fine: string;
  descrizione: string;
  descrizione_completa?: string;
  immagine: string;
  dettagli_luogo?: string;
  posti_max?: number;
  posti_occupati?: number;
}
export type Tournament = Torneo;

export type TipoFiltroStato = 'tutti' | 'aperto' | 'max_raggiunto' | 'chiuso';

@Component({
  selector: 'app-tornei',
  standalone: true,
  imports: [],
  template: `
    <div class="tornei-page-container">
      
      <header class="tornei-header">
        <span class="badge-category">🎮 ARENA COMPETITIVA E-SPORTS</span>
        <h1 class="page-title">Tornei di Gaming Ufficiali</h1>
        <p class="page-subtitle">
          Scegli il tuo titolo preferito, prepara il pad o la tastiera e scendi nell'arena. Controlla le date, lo stato delle registrazioni e sfida i migliori gamer del campus!
        </p>
      </header>

      <!-- BARRA FILTRI -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button type="button" class="filter-btn" [class.active]="filtroAttivo === 'tutti'" (click)="impostaFiltro('tutti')">
            Tutti i tornei ({{ tornei.length }})
          </button>
          <button type="button" class="filter-btn" [class.active]="filtroAttivo === 'aperto'" (click)="impostaFiltro('aperto')">
            Iscrizioni Aperte
          </button>
          <button type="button" class="filter-btn" [class.active]="filtroAttivo === 'max_raggiunto'" (click)="impostaFiltro('max_raggiunto')">
            In coda / Max Raggiunto
          </button>
          <button type="button" class="filter-btn" [class.active]="filtroAttivo === 'chiuso'" (click)="impostaFiltro('chiuso')">
            Chiusi / Conclusi
          </button>
        </div>
      </div>

      <!-- GRIGLIA TORNEI -->
      <div class="tournaments-grid">
        @for (torneo of torneiFiltrati; track torneo.id) {
          <div class="tournament-card" (click)="apriModalDettaglio(torneo)">
            <div class="card-image-wrapper">
              <img [src]="torneo.immagine" [alt]="torneo.nome" class="card-img" />
              <span class="status-badge" [class]="'badge-' + torneo.stato">
                {{ torneo.stato_label }}
              </span>
            </div>

            <div class="card-content">
              <span class="card-tag">{{ torneo.gioco }} • {{ torneo.modalita }}</span>
              <h2 class="card-title">{{ torneo.nome }}</h2>

              <div class="dates-row">
                <div class="date-col"><span class="date-label">Inizio</span><span class="date-val">{{ torneo.data_inizio }}</span></div>
                <div class="date-col"><span class="date-label">Fine</span><span class="date-val">{{ torneo.data_fine }}</span></div>
              </div>

              <p class="card-description">{{ torneo.descrizione }}</p>

              <!-- Pulsante Azione -->
              <div class="card-actions" (click)="$event.stopPropagation()">
                @if (authService.eIscritto(torneo.id)) {
                  <button type="button" class="btn-action btn-enrolled" (click)="vaiAdAreaUtente()">
                    ✓ Già Iscritto (Vedi Area Utente)
                  </button>
                } @else if (torneo.stato === 'aperto' || torneo.stato === 'Aperto') {
                  <button type="button" class="btn-action btn-open" (click)="gestisciIscrizione(torneo)">
                    Iscriviti ora
                  </button>
                } @else if (torneo.stato === 'max_raggiunto' || torneo.stato === 'Numero max raggiunto') {
                  <button type="button" class="btn-action btn-queue" (click)="gestisciIscrizione(torneo)">
                    Mettiti in coda
                  </button>
                } @else {
                  <button type="button" class="btn-action btn-disabled" disabled>
                    Iscrizioni non disponibili
                  </button>
                }
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- MODAL AVVISO LOGIN (SE NON AUTENTICATO) -->
    @if (mostraModalAutenticazione) {
      <div class="modal-backdrop" (click)="chiudiModalAutenticazione()">
        <div class="auth-prompt-card" (click)="$event.stopPropagation()">
          <div class="prompt-icon-circle">🔒</div>
          <h3 class="prompt-title">Autenticazione richiesta</h3>
          <p class="prompt-text">
            Per poter procedere con l'iscrizione o metterti in coda per 
            <strong>"{{ torneoSelezionatoPerAuth?.nome }}"</strong>, devi accedere al tuo profilo o registrarti.
          </p>

          <div class="prompt-buttons">
            <button type="button" class="btn-prompt-primary" (click)="vaiAlLogin()">Accedi</button>
            <button type="button" class="btn-prompt-secondary" (click)="vaiAllaRegistrazione()">Registrati</button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL ESITO ISCRIZIONE -->
    @if (messaggioSuccessoIscrizione) {
      <div class="modal-backdrop" (click)="messaggioSuccessoIscrizione = null">
        <div class="auth-prompt-card" (click)="$event.stopPropagation()">
          <div class="prompt-icon-circle">✅</div>
          <h3 class="prompt-title">Operazione Completata!</h3>
          <p class="prompt-text">{{ messaggioSuccessoIscrizione }}</p>

          <div class="prompt-buttons">
            <button type="button" class="btn-prompt-primary" (click)="vaiAdAreaUtente()">Vai all'Area Utente</button>
            <button type="button" class="btn-prompt-secondary" (click)="messaggioSuccessoIscrizione = null">Rimani qui</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tornei-page-container { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem 5rem 2rem; }
    .tornei-header { margin-bottom: 2rem; }
    .badge-category { display: inline-block; font-size: 0.82rem; font-weight: 800; color: #2563eb; background-color: #eff6ff; padding: 0.35rem 0.85rem; border-radius: 20px; margin-bottom: 0.75rem; letter-spacing: 0.05em; text-transform: uppercase; }
    .page-title { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
    .page-subtitle { font-size: 1.05rem; color: #64748b; max-width: 650px; line-height: 1.6; margin: 0; }
    .filter-bar { padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 2.5rem; }
    .filter-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .filter-btn { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; }
    .filter-btn:hover { background: #e2e8f0; }
    .filter-btn.active { background: #0f172a; color: #ffffff; border-color: #0f172a; }

    .tournaments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .tournament-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s ease, border-color 0.25s ease; }
    .tournament-card:hover { transform: translateY(-5px); border-color: #cbd5e1; box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08); }
    .card-image-wrapper { position: relative; height: 180px; }
    .card-img { width: 100%; height: 100%; object-fit: cover; }
    .status-badge { position: absolute; top: 10px; left: 10px; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; color: white; }
    .badge-aperto { background: #10b981; } .badge-max_raggiunto { background: #f59e0b; } .badge-chiuso { background: #64748b; } .badge-in_corso { background: #3b82f6; }
    
    .card-content { padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1; }
    .card-tag { font-size: 0.75rem; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; display: block; }
    .card-title { font-size: 1.25rem; font-weight: 800; margin: 0 0 1rem 0; color: #0f172a; }
    .dates-row { display: grid; grid-template-columns: 1fr 1fr; padding: 0.5rem 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-bottom: 1rem; }
    .date-label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; margin-bottom: 0.15rem; }
    .date-val { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
    .card-description { font-size: 0.88rem; color: #475569; margin-bottom: 1.5rem; flex-grow: 1; line-height: 1.55; }

    .btn-action { width: 100%; padding: 0.75rem; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s ease; }
    .btn-open { background: #0f172a; color: white; }
    .btn-open:hover { background: #1e293b; }
    .btn-queue { background: white; color: #d97706; border: 1.5px solid #f59e0b; }
    .btn-queue:hover { background: #fffbeb; }
    .btn-enrolled { background: #10b981; color: white; }
    .btn-disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .auth-prompt-card { background: white; border-radius: 16px; padding: 2rem; max-width: 440px; width: 100%; text-align: center; }
    .prompt-icon-circle { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .prompt-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-prompt-primary { padding: 0.75rem; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-prompt-secondary { padding: 0.75rem; background: white; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }

    @media (max-width: 950px) {
      .tournaments-grid { grid-template-columns: repeat(2, 1fr); }
    }
    @media (max-width: 620px) {
      .tournaments-grid { grid-template-columns: 1fr; }
      .page-title { font-size: 2rem; }
    }
  `]
})
export class TorneiComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  filtroAttivo: TipoFiltroStato = 'tutti';
  mostraModalAutenticazione = false;
  torneoSelezionatoPerAuth: Torneo | null = null;
  messaggioSuccessoIscrizione: string | null = null;

  tornei: Torneo[] = [
    { 
      id: 1, 
      nome: 'EA Sports FC 25 Championship', 
      gioco: 'CALCIO E-SPORTS', 
      modalita: 'IN SEDE', 
      stato: 'Aperto', 
      stato_label: 'Aperto', 
      data_inizio: '24 Ottobre 2026', 
      data_fine: '26 Ottobre 2026', 
      descrizione: 'Sfida 1v1 su PlayStation 5. Mostra il tuo stile di gioco con tabellone a eliminazione diretta e postazioni gaming dedicate.', 
      descrizione_completa: '', 
      immagine: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80', 
      dettagli_luogo: 'Gaming Lounge ITS - Sala Console',
      posti_max: 32,
      posti_occupati: 14
    },
    { 
      id: 2, 
      nome: 'Rocket League E-Sports Cup', 
      gioco: 'VEHICULAR SOCCER', 
      modalita: 'ONLINE', 
      stato: 'Numero max raggiunto', 
      stato_label: 'Numero max raggiunto', 
      data_inizio: '31 Ottobre 2026', 
      data_fine: '2 Novembre 2026', 
      descrizione: 'Torneo 3v3 ad alta velocità. Voli aerei, parate acrobatiche all\'ultimo secondo e match spettacolari su server dedicati.', 
      descrizione_completa: '', 
      immagine: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', 
      dettagli_luogo: 'Online / Server Discord dedicato',
      posti_max: 16,
      posti_occupati: 16
    },
    { 
      id: 3, 
      nome: 'Valorant Tactical Showdown', 
      gioco: 'FPS TATTICO 5v5', 
      modalita: 'ONLINE', 
      stato: 'In corso', 
      stato_label: 'In corso', 
      data_inizio: '10 Ottobre 2026', 
      data_fine: '16 Ottobre 2026', 
      descrizione: 'Scontri 5v5 al cardiopalma: coordinazione tattica, ban mappe e agenti regolamentari con live stream delle semifinali.', 
      descrizione_completa: '', 
      immagine: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80', 
      dettagli_luogo: 'Online / Server EU',
      posti_max: 20,
      posti_occupati: 20
    },
    { 
      id: 4, 
      nome: 'Tekken 8 Iron Fist Trophy', 
      gioco: 'PICCHIADURO 1v1', 
      modalita: 'IN SEDE', 
      stato: 'Aperto', 
      stato_label: 'Aperto', 
      data_inizio: '14 Novembre 2026', 
      data_fine: '15 Novembre 2026', 
      descrizione: 'Duelli intensi con arcade stick e gamepad. Metti alla prova frame trap, combo aeree devastanti e difese impenetrabili.', 
      descrizione_completa: '', 
      immagine: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=600&q=80', 
      dettagli_luogo: 'Arena E-Sports ITS',
      posti_max: 32,
      posti_occupati: 18
    },
    { 
      id: 5, 
      nome: 'League of Legends Rift Clash', 
      gioco: 'MOBA 5v5', 
      modalita: 'ONLINE', 
      stato: 'Aperto', 
      stato_label: 'Aperto', 
      data_inizio: '21 Novembre 2026', 
      data_fine: '23 Novembre 2026', 
      descrizione: 'La leggendaria sfida nella Landa degli Evocatori: strategia di draft, controllo degli obiettivi e assalto al Nexus.', 
      descrizione_completa: '', 
      immagine: 'https://images.unsplash.com/photo-1547394765-185e131e37b2?auto=format&fit=crop&w=600&q=80', 
      dettagli_luogo: 'Online / Client Riot EUW',
      posti_max: 20,
      posti_occupati: 8
    },
    { 
      id: 6, 
      nome: 'Super Smash Bros. Ultimate Arena', 
      gioco: 'PLATFORM FIGHTER', 
      modalita: 'IN SEDE', 
      stato: 'Chiuso', 
      stato_label: 'Chiuso', 
      data_inizio: '1 Ottobre 2026', 
      data_fine: '3 Ottobre 2026', 
      descrizione: 'Scontro competitivo su Nintendo Switch: set di regole ufficiali a 3 vite senza oggetti casuali. Vincitore premiato sul podio.', 
      descrizione_completa: '', 
      immagine: 'https://images.unsplash.com/photo-1612287232056-b076ad005f2c?auto=format&fit=crop&w=600&q=80', 
      dettagli_luogo: 'Aula Magna ITS',
      posti_max: 32,
      posti_occupati: 32
    }
  ];

  // Alias retrocompatibili
  get tournaments(): Torneo[] { return this.tornei; }
  get activeFilter(): TipoFiltroStato { return this.filtroAttivo; }

  get torneiFiltrati(): Torneo[] {
    if (this.filtroAttivo === 'tutti') return this.tornei;
    if (this.filtroAttivo === 'chiuso') return this.tornei.filter(t => t.stato === 'Chiuso' || t.stato === 'chiuso' || t.stato === 'In corso' || t.stato === 'in_corso');
    if (this.filtroAttivo === 'aperto') return this.tornei.filter(t => t.stato === 'Aperto' || t.stato === 'aperto');
    if (this.filtroAttivo === 'max_raggiunto') return this.tornei.filter(t => t.stato === 'Numero max raggiunto' || t.stato === 'max_raggiunto');
    return this.tornei;
  }
  get filteredTournaments(): Torneo[] { return this.torneiFiltrati; }

  impostaFiltro(filtro: TipoFiltroStato) { this.filtroAttivo = filtro; }
  setFilter(filter: TipoFiltroStato) { this.impostaFiltro(filter); }

  gestisciIscrizione(torneo: Torneo) {
    if (!this.authService.eAutenticato() || this.authService.eAdmin()) {
      this.torneoSelezionatoPerAuth = torneo;
      this.mostraModalAutenticazione = true;
      return;
    }

    if (torneo.stato === 'aperto' || torneo.stato === 'Aperto') {
      this.authService.iscriviAlTorneo(torneo.id, 'Confermata');
      this.messaggioSuccessoIscrizione = `Iscrizione confermata al torneo "${torneo.nome}". Può essere consultato nella tua Area Utente!`;
    } else if (torneo.stato === 'max_raggiunto' || torneo.stato === 'Numero max raggiunto') {
      this.authService.iscriviAlTorneo(torneo.id, 'In_Attesa', 3);
      this.messaggioSuccessoIscrizione = `Ti sei messo in coda per il torneo "${torneo.nome}" (Posizione #3).`;
    }
  }
  handleEnroll(tournament: Torneo) { this.gestisciIscrizione(tournament); }

  apriModalDettaglio(torneo: Torneo) {}
  openDetailModal(t: Torneo) { this.apriModalDettaglio(t); }

  chiudiModalAutenticazione() { this.mostraModalAutenticazione = false; }
  closeAuthPrompt() { this.chiudiModalAutenticazione(); }

  vaiAlLogin() { this.router.navigate(['/login']); }
  navigateToLogin() { this.vaiAlLogin(); }

  vaiAllaRegistrazione() { this.router.navigate(['/register']); }
  navigateToRegister() { this.vaiAllaRegistrazione(); }

  vaiAdAreaUtente() { this.router.navigate(['/user-area']); }
  goToUserArea() { this.vaiAdAreaUtente(); }
}