import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface Tournament {
  id: number;
  title: string;
  category: string;
  locationType: 'ONLINE' | 'IN SEDE';
  status: 'aperto' | 'max_raggiunto' | 'in_corso' | 'chiuso';
  statusLabel: string;
  startDate: string;
  endDate: string;
  description: string;
  fullDescription: string;
  image: string;
  locationDetails: string;
}

type FilterStatus = 'tutti' | 'aperto' | 'max_raggiunto' | 'chiuso';

@Component({
  selector: 'app-tornei',
  standalone: true,
  imports: [],
  template: `
    <div class="tornei-page-container">
      
      <header class="tornei-header">
        <span class="badge-category">SPORTS E E-SPORTS</span>
        <h1 class="page-title">I tornei dell'ITS</h1>
        <p class="page-subtitle">
          Scegli la tua prossima sfida. Scopri le date, verifica lo stato delle iscrizioni e trova il torneo che fa per te.
        </p>
      </header>

      <!-- BARRA FILTRI -->
      <div class="filter-bar">
        <div class="filter-tabs">
          <button type="button" class="filter-btn" [class.active]="activeFilter === 'tutti'" (click)="setFilter('tutti')">
            Tutti i tornei ({{ tournaments.length }})
          </button>
          <button type="button" class="filter-btn" [class.active]="activeFilter === 'aperto'" (click)="setFilter('aperto')">
            Iscrizioni Aperte
          </button>
          <button type="button" class="filter-btn" [class.active]="activeFilter === 'max_raggiunto'" (click)="setFilter('max_raggiunto')">
            In coda / Max Raggiunto
          </button>
          <button type="button" class="filter-btn" [class.active]="activeFilter === 'chiuso'" (click)="setFilter('chiuso')">
            Chiusi / Conclusi
          </button>
        </div>
      </div>

      <!-- GRIGLIA TORNEI -->
      <div class="tournaments-grid">
        @for (tournament of filteredTournaments; track tournament.id) {
          <div class="tournament-card" (click)="openDetailModal(tournament)">
            <div class="card-image-wrapper">
              <img [src]="tournament.image" [alt]="tournament.title" class="card-img" />
              <span class="status-badge" [class]="'badge-' + tournament.status">
                {{ tournament.statusLabel }}
              </span>
            </div>

            <div class="card-content">
              <span class="card-tag">{{ tournament.category }} / {{ tournament.locationType }}</span>
              <h2 class="card-title">{{ tournament.title }}</h2>

              <div class="dates-row">
                <div class="date-col"><span class="date-label">Inizio</span><span class="date-val">{{ tournament.startDate }}</span></div>
                <div class="date-col"><span class="date-label">Fine</span><span class="date-val">{{ tournament.endDate }}</span></div>
              </div>

              <p class="card-description">{{ tournament.description }}</p>

              <!-- Pulsante Azione -->
              <div class="card-actions" (click)="$event.stopPropagation()">
                @if (authService.isEnrolled(tournament.id)) {
                  <button type="button" class="btn-action btn-enrolled" (click)="goToUserArea()">
                    ✓ Già Iscritto (Vedi Area Utente)
                  </button>
                } @else if (tournament.status === 'aperto') {
                  <button type="button" class="btn-action btn-open" (click)="handleEnroll(tournament)">
                    Iscriviti ora
                  </button>
                } @else if (tournament.status === 'max_raggiunto') {
                  <button type="button" class="btn-action btn-queue" (click)="handleEnroll(tournament)">
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
    @if (showAuthPromptModal) {
      <div class="modal-backdrop" (click)="closeAuthPrompt()">
        <div class="auth-prompt-card" (click)="$event.stopPropagation()">
          <div class="prompt-icon-circle">🔒</div>
          <h3 class="prompt-title">Autenticazione richiesta</h3>
          <p class="prompt-text">
            Per poter procedere con l'iscrizione o metterti in coda per 
            <strong>"{{ targetTournamentForAuth?.title }}"</strong>, devi accedere al tuo profilo o registrarti.
          </p>

          <div class="prompt-buttons">
            <button type="button" class="btn-prompt-primary" (click)="navigateToLogin()">Accedi</button>
            <button type="button" class="btn-prompt-secondary" (click)="navigateToRegister()">Registrati</button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL ESITO ISCRIZIONE -->
    @if (enrollmentSuccessMsg) {
      <div class="modal-backdrop" (click)="enrollmentSuccessMsg = null">
        <div class="auth-prompt-card" (click)="$event.stopPropagation()">
          <div class="prompt-icon-circle">✅</div>
          <h3 class="prompt-title">Operazione Completata!</h3>
          <p class="prompt-text">{{ enrollmentSuccessMsg }}</p>

          <div class="prompt-buttons">
            <button type="button" class="btn-prompt-primary" (click)="goToUserArea()">Vai all'Area Utente</button>
            <button type="button" class="btn-prompt-secondary" (click)="enrollmentSuccessMsg = null">Rimani qui</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .tornei-page-container { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem 5rem 2rem; }
    .tornei-header { margin-bottom: 2rem; }
    .page-title { font-size: 2.5rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
    .filter-bar { padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 2.5rem; }
    .filter-tabs { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .filter-btn { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 8px; padding: 0.5rem 1rem; font-weight: 600; cursor: pointer; }
    .filter-btn.active { background: #0f172a; color: #ffffff; border-color: #0f172a; }

    .tournaments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem; }
    .tournament-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; cursor: pointer; }
    .card-image-wrapper { position: relative; height: 180px; }
    .card-img { width: 100%; height: 100%; object-fit: cover; }
    .status-badge { position: absolute; top: 10px; left: 10px; padding: 0.35rem 0.75rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; color: white; }
    .badge-aperto { background: #10b981; } .badge-max_raggiunto { background: #f59e0b; } .badge-chiuso { background: #64748b; }
    
    .card-content { padding: 1.5rem; display: flex; flex-direction: column; flex-grow: 1; }
    .card-title { font-size: 1.25rem; font-weight: 800; margin: 0 0 1rem 0; color: #0f172a; }
    .dates-row { display: grid; grid-template-columns: 1fr 1fr; padding: 0.5rem 0; border-top: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; margin-bottom: 1rem; }
    .card-description { font-size: 0.88rem; color: #475569; margin-bottom: 1.5rem; flex-grow: 1; }

    .btn-action { width: 100%; padding: 0.75rem; border-radius: 8px; font-weight: 700; border: none; cursor: pointer; }
    .btn-open { background: #0f172a; color: white; }
    .btn-queue { background: white; color: #d97706; border: 1.5px solid #f59e0b; }
    .btn-enrolled { background: #10b981; color: white; }
    .btn-disabled { background: #e2e8f0; color: #94a3b8; cursor: not-allowed; }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .auth-prompt-card { background: white; border-radius: 16px; padding: 2rem; max-width: 440px; width: 100%; text-align: center; }
    .prompt-icon-circle { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .prompt-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-prompt-primary { padding: 0.75rem; background: #0f172a; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-prompt-secondary { padding: 0.75rem; background: white; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }
  `]
})
export class TorneiComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  activeFilter: FilterStatus = 'tutti';
  showAuthPromptModal = false;
  targetTournamentForAuth: Tournament | null = null;
  enrollmentSuccessMsg: string | null = null;

  tournaments: Tournament[] = [
    { id: 1, title: 'Cybersecurity CTF Challenge', category: 'CYBERSECURITY', locationType: 'ONLINE', status: 'aperto', statusLabel: 'Aperto', startDate: '20 Ottobre 2026', endDate: '15 Ottobre 2026', description: 'Sfida le tue abilità di penetration testing.', fullDescription: '', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', locationDetails: 'Online' },
    { id: 2, title: 'Rocket League E-Sports Cup', category: 'GAMING', locationType: 'ONLINE', status: 'max_raggiunto', statusLabel: 'Numero max raggiunto', startDate: '31 Ottobre 2026', endDate: '27 Ottobre 2026', description: 'Torneo 3v3 ad eliminazione diretta.', fullDescription: '', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', locationDetails: 'Online' },
    { id: 3, title: 'AI & Coding Hackathon', category: 'SOFTWARE DEV', locationType: 'IN SEDE', status: 'in_corso', statusLabel: 'In corso', startDate: '10 Ottobre 2026', endDate: '7 Ottobre 2026', description: '24 ore per sviluppare un prototipo AI.', fullDescription: '', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', locationDetails: 'In sede' },
    { id: 4, title: 'FIFA / EA Sports FC Tournament', category: 'GAMING', locationType: 'IN SEDE', status: 'max_raggiunto', statusLabel: 'Numero max raggiunto', startDate: '24 Ottobre 2026', endDate: '19 Ottobre 2026', description: 'Torneo 1v1 su PlayStation 5.', fullDescription: '', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80', locationDetails: 'In sede' },
    { id: 5, title: 'Web Dev Speed Run', category: 'IT', locationType: 'ONLINE', status: 'aperto', statusLabel: 'Aperto', startDate: '7 Novembre 2026', endDate: '3 Novembre 2026', description: 'Crea una landing page responsive da zero.', fullDescription: '', image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80', locationDetails: 'Online' }
  ];

  get filteredTournaments(): Tournament[] {
    if (this.activeFilter === 'tutti') return this.tournaments;
    if (this.activeFilter === 'chiuso') return this.tournaments.filter(t => t.status === 'chiuso' || t.status === 'in_corso');
    return this.tournaments.filter(t => t.status === this.activeFilter);
  }

  setFilter(filter: FilterStatus) { this.activeFilter = filter; }

  handleEnroll(tournament: Tournament) {
    if (!this.authService.isLoggedIn()) {
      this.targetTournamentForAuth = tournament;
      this.showAuthPromptModal = true;
      return;
    }

    if (tournament.status === 'aperto') {
      this.authService.enrollInTournament(tournament.id, 'iscritto');
      this.enrollmentSuccessMsg = `Iscrizione confermata al torneo "${tournament.title}". Può essere consultato nella tua Area Utente!`;
    } else if (tournament.status === 'max_raggiunto') {
      this.authService.enrollInTournament(tournament.id, 'in_coda', 3);
      this.enrollmentSuccessMsg = `Ti sei messo in coda per il torneo "${tournament.title}" (Posizione #3).`;
    }
  }

  openDetailModal(t: Tournament) {}
  closeAuthPrompt() { this.showAuthPromptModal = false; }
  navigateToLogin() { this.router.navigate(['/login']); }
  navigateToRegister() { this.router.navigate(['/register']); }
  goToUserArea() { this.router.navigate(['/user-area']); }
}