import { Component, inject, OnInit, signal, computed, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { TournamentService, Torneo } from '../services/tournament.service';

export type TipoFiltroStato = 'tutti' | 'aperto' | 'max_raggiunto' | 'chiuso';

/** Converte "YYYY-MM-DD" in "DD/MM/YYYY" senza perdita per timezone */
function formatData(str: string | null | undefined): string {
  if (!str) return '';
  const parti = String(str).substring(0, 10).split('-');
  if (parti.length !== 3) return str;
  return `${parti[2]}/${parti[1]}/${parti[0]}`;
}

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
          <button type="button" class="filter-btn" [class.active]="filtroAttivo() === 'tutti'" (click)="impostaFiltro('tutti')">
            Tutti i tornei ({{ tornei().length }})
          </button>
          <button type="button" class="filter-btn" [class.active]="filtroAttivo() === 'aperto'" (click)="impostaFiltro('aperto')">
            Iscrizioni Aperte
          </button>
          <button type="button" class="filter-btn" [class.active]="filtroAttivo() === 'max_raggiunto'" (click)="impostaFiltro('max_raggiunto')">
            In coda / Max Raggiunto
          </button>
          <button type="button" class="filter-btn" [class.active]="filtroAttivo() === 'chiuso'" (click)="impostaFiltro('chiuso')">
            Chiusi / Conclusi
          </button>
        </div>
      </div>

      <!-- BANNER ERRORE -->
      @if (errore()) {
        <div class="error-banner">
          ⚠️ {{ errore() }}
          <button type="button" class="retry-btn" (click)="caricaTorneiDalDatabase()">Riprova</button>
        </div>
      }

      <!-- MESSAGGIO ISCRIZIONE EFFETTUATA -->
      @if (messaggioSuccessoIscrizione()) {
        <div class="success-banner" (click)="messaggioSuccessoIscrizione.set(null)">
          ✅ {{ messaggioSuccessoIscrizione() }} — <u>clicca per chiudere</u>
        </div>
      }

      <!-- GRIGLIA TORNEI — visualizzata subito, nessun blocco clessidra -->
      <div class="tournaments-grid">
        @for (torneo of torneiFiltrati(); track torneo.id) {
          <div class="tournament-card">
            <div class="card-image-wrapper">
              <img [src]="torneo.immagine || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80'" [alt]="torneo.nome" class="card-img" />
              <span class="status-badge" [class]="'badge-' + calcolaStatoBadge(torneo)">
                {{ torneo.stato }}
              </span>
            </div>

            <div class="card-content">
              <span class="card-tag">{{ torneo.gioco }} • {{ torneo.modalita }}</span>
              <h2 class="card-title">{{ torneo.nome }}</h2>

              <div class="dates-row">
                <div class="date-col">
                  <span class="date-label">Inizio</span>
                  <span class="date-val">{{ formatData(torneo.data_inizio) }}</span>
                </div>
                <div class="date-col">
                  <span class="date-label">Fine</span>
                  <span class="date-val">{{ formatData(torneo.data_fine) }}</span>
                </div>
              </div>

              <p class="card-description">{{ torneo.descrizione }}</p>

              <div class="seats-info">
                <span class="seats-label">Posti: {{ torneo.posti_occupati || 0 }} / {{ torneo.posti_max || 32 }}</span>
                @if ((torneo.posti_occupati || 0) >= (torneo.posti_max || 32)) {
                  <span class="seats-full-badge">Completo</span>
                }
              </div>

              <!-- Pulsante Azione -->
              <div class="card-actions">
                @if (authService.eAdmin()) {
                  <button type="button" class="btn-action btn-disabled" disabled>
                    👑 Admin — Gestisci dalla Dashboard
                  </button>
                } @else if (authService.eIscritto(torneo.id)) {
                  <button type="button" class="btn-action btn-enrolled" (click)="vaiAdAreaUtente()">
                    ✓ Già Iscritto — Vai all'Area Utente
                  </button>
                } @else if (torneo.stato === 'Aperto') {
                  <button
                    type="button"
                    class="btn-action btn-open"
                    [disabled]="iscrizioneInCorso() === torneo.id"
                    (click)="chiediConfermaIscrizione(torneo)"
                  >
                    {{ iscrizioneInCorso() === torneo.id ? 'Iscrizione in corso...' : 'Iscriviti ora' }}
                  </button>
                } @else {
                  <button type="button" class="btn-action btn-disabled" disabled>
                    Iscrizioni non disponibili
                  </button>
                }
              </div>
            </div>
          </div>
        } @empty {
          <div class="no-tournaments">
            <span>🎮</span>
            <p>Nessun torneo disponibile per questo filtro.</p>
          </div>
        }
      </div>
    </div>

    <!-- MODAL CARD: CONFERMA ISCRIZIONE UTENTE -->
    @if (torneoDaConfermare(); as t) {
      <div class="modal-backdrop" (click)="chiudiModalConferma()">
        <div class="auth-prompt-card" (click)="$event.stopPropagation()">
          <div class="prompt-icon-circle">🎮</div>
          <h3 class="prompt-title">Sei sicuro di volerti iscrivere?</h3>
          <p class="prompt-text">
            Confermi la richiesta di iscrizione al torneo <strong>"{{ t.nome }}"</strong>?
            @if ((t.posti_occupati || 0) >= (t.posti_max || 32)) {
              <br><small style="color: #b45309; font-weight: 700;">Il torneo è al completo: verrai inserito in lista d'attesa.</small>
            }
          </p>

          <div class="prompt-buttons">
            <button
              type="button"
              class="btn-prompt-primary"
              [disabled]="iscrizioneInCorso() === t.id"
              (click)="eseguiIscrizione(t)"
            >
              {{ iscrizioneInCorso() === t.id ? 'Iscrizione...' : 'Sì' }}
            </button>
            <button type="button" class="btn-prompt-secondary" (click)="chiudiModalConferma()">
              Annulla
            </button>
          </div>
          <button type="button" class="prompt-close" (click)="chiudiModalConferma()">×</button>
        </div>
      </div>
    }

    <!-- MODAL AVVISO LOGIN (SE NON AUTENTICATO) -->
    @if (mostraModalAutenticazione()) {
      <div class="modal-backdrop" (click)="chiudiModalAutenticazione()">
        <div class="auth-prompt-card" (click)="$event.stopPropagation()">
          <div class="prompt-icon-circle">🔒</div>
          <h3 class="prompt-title">Accesso richiesto</h3>
          <p class="prompt-text">
            Per iscriverti a <strong>"{{ torneoSelezionatoPerAuth()?.nome }}"</strong> devi prima accedere o registrarti.
          </p>

          <div class="prompt-buttons">
            <button type="button" class="btn-prompt-primary" (click)="vaiAlLogin()">Accedi</button>
            <button type="button" class="btn-prompt-secondary" (click)="vaiAllaRegistrazione()">Registrati</button>
          </div>
          <button type="button" class="prompt-close" (click)="chiudiModalAutenticazione()">×</button>
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
    .filter-btn { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; transition: all 0.2s ease; font-size: 0.9rem; }
    .filter-btn:hover { background: #e2e8f0; }
    .filter-btn.active { background: #0f172a; color: #ffffff; border-color: #0f172a; }

    .loading-state { text-align: center; padding: 4rem 2rem; color: #64748b; }
    .loading-spinner { font-size: 2.5rem; margin-bottom: 1rem; animation: spin 1.5s linear infinite; display: block; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

    .error-banner { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 1rem 1.5rem; border-radius: 10px; text-align: center; margin-bottom: 2rem; display: flex; align-items: center; justify-content: center; gap: 1rem; }
    .retry-btn { background: #dc2626; color: white; border: none; padding: 0.4rem 1rem; border-radius: 6px; cursor: pointer; font-weight: 700; }
    .success-banner { background: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 1rem 1.5rem; border-radius: 10px; text-align: center; margin-bottom: 1.5rem; cursor: pointer; font-weight: 600; }

    .tournaments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .tournament-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.25s ease, box-shadow 0.25s ease; }
    .tournament-card:hover { transform: translateY(-5px); box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08); }
    .card-image-wrapper { position: relative; height: 180px; }
    .card-img { width: 100%; height: 100%; object-fit: cover; }
    .status-badge { position: absolute; top: 10px; left: 10px; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; color: white; }
    .badge-aperto { background: #10b981; }
    .badge-chiuso { background: #64748b; }
    .badge-in_corso { background: #3b82f6; }

    .card-content { padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1; }
    .card-tag { font-size: 0.75rem; font-weight: 700; color: #2563eb; text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
    .card-title { font-size: 1.25rem; font-weight: 800; margin: 0 0 1rem 0; color: #0f172a; }
    .dates-row { display: grid; grid-template-columns: 1fr 1fr; padding: 0.5rem 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-bottom: 0.75rem; }
    .date-label { font-size: 0.72rem; color: #64748b; text-transform: uppercase; font-weight: 600; display: block; }
    .date-val { font-size: 0.88rem; font-weight: 700; color: #0f172a; }
    .card-description { font-size: 0.88rem; color: #475569; margin-bottom: 1rem; flex-grow: 1; line-height: 1.55; }
    .seats-info { display: flex; align-items: center; gap: 0.5rem; font-size: 0.8rem; font-weight: 700; color: #0f172a; margin-bottom: 1rem; }
    .seats-full-badge { background: #fef2f2; color: #dc2626; font-size: 0.7rem; padding: 0.2rem 0.5rem; border-radius: 4px; font-weight: 800; }

    .card-actions { margin-top: auto; }
    .btn-action { width: 100%; padding: 0.75rem; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; font-size: 0.9rem; transition: opacity 0.2s; }
    .btn-action:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-open { background: #0f172a; color: white; }
    .btn-open:not(:disabled):hover { background: #1e293b; }
    .btn-enrolled { background: #10b981; color: white; }
    .btn-disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

    .no-tournaments { grid-column: 1 / -1; text-align: center; padding: 3rem; color: #64748b; }
    .no-tournaments span { font-size: 2.5rem; display: block; margin-bottom: 1rem; }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .auth-prompt-card { background: white; border-radius: 16px; padding: 2rem; max-width: 440px; width: 100%; text-align: center; position: relative; }
    .prompt-icon-circle { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .prompt-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
    .prompt-text { font-size: 0.95rem; color: #475569; margin-bottom: 1.5rem; }
    .prompt-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .btn-prompt-primary { padding: 0.75rem; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-prompt-secondary { padding: 0.75rem; background: white; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .prompt-close { position: absolute; top: 1rem; right: 1rem; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #64748b; }

    @media (max-width: 960px) { .tournaments-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 600px) { .tournaments-grid { grid-template-columns: 1fr; } }
  `]
})
export class TorneiComponent implements OnInit {
  authService = inject(AuthService);
  private tournamentService = inject(TournamentService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  tornei = signal<Torneo[]>([]);
  filtroAttivo = signal<TipoFiltroStato>('tutti');
  errore = signal('');
  mostraModalAutenticazione = signal(false);
  torneoSelezionatoPerAuth = signal<Torneo | null>(null);
  torneoDaConfermare = signal<Torneo | null>(null);
  messaggioSuccessoIscrizione = signal<string | null>(null);
  iscrizioneInCorso = signal<number | null>(null);

  // Funzione di formattazione data (disponibile nel template)
  formatData = formatData;

  torneiFiltrati = computed(() => {
    const list = this.tornei();
    const filtro = this.filtroAttivo();
    if (filtro === 'aperto') return list.filter(t => t.stato === 'Aperto');
    if (filtro === 'chiuso') return list.filter(t => t.stato === 'Chiuso' || t.stato === 'Concluso');
    if (filtro === 'max_raggiunto') {
      return list.filter(t => (t.posti_occupati || 0) >= (t.posti_max || 32));
    }
    return list;
  });

  ngOnInit() {
    this.caricaTorneiDalDatabase();
  }

  caricaTorneiDalDatabase() {
    this.errore.set('');
    this.tournamentService.getTornei().subscribe({
      next: (dati) => {
        this.tornei.set(dati);
        this.cdr.markForCheck();
      },
      error: () => {
        this.errore.set('Impossibile caricare i tornei. Verifica che il backend sia attivo su http://localhost:3000.');
        this.cdr.markForCheck();
      }
    });
  }

  calcolaStatoBadge(torneo: Torneo): string {
    if (torneo.stato === 'Aperto') return 'aperto';
    if (torneo.stato === 'In Corso') return 'in_corso';
    return 'chiuso';
  }

  impostaFiltro(filtro: TipoFiltroStato) {
    this.filtroAttivo.set(filtro);
  }

  chiediConfermaIscrizione(torneo: Torneo) {
    if (!this.authService.eAutenticato() || this.authService.eAdmin()) {
      this.torneoSelezionatoPerAuth.set(torneo);
      this.mostraModalAutenticazione.set(true);
      return;
    }
    // Mostra la card modale di conferma
    this.torneoDaConfermare.set(torneo);
  }

  chiudiModalConferma() {
    this.torneoDaConfermare.set(null);
  }

  eseguiIscrizione(torneo: Torneo) {
    this.iscrizioneInCorso.set(torneo.id);
    this.authService.iscriviAlTorneo(torneo.id, 'Confermata').subscribe({
      next: (isc) => {
        this.iscrizioneInCorso.set(null);
        this.torneoDaConfermare.set(null);
        const stato = isc.stato === 'In_Attesa' ? 'in lista d\'attesa' : 'confermata';
        this.messaggioSuccessoIscrizione.set(`Iscrizione ${stato} al torneo "${torneo.nome}"! Verifica nella tua Area Utente.`);
        this.caricaTorneiDalDatabase();
        this.authService.caricaIscrizioni();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.iscrizioneInCorso.set(null);
        this.torneoDaConfermare.set(null);
        const msg = err.error?.error || 'Errore durante l\'iscrizione al torneo.';
        alert(msg);
        this.cdr.markForCheck();
      }
    });
  }

  chiudiModalAutenticazione() { this.mostraModalAutenticazione.set(false); }
  vaiAlLogin() { this.router.navigate(['/login']); }
  vaiAllaRegistrazione() { this.router.navigate(['/register']); }
  vaiAdAreaUtente() { this.router.navigate(['/user-area']); }
}