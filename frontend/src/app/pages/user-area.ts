import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

interface UserTournament {
  id: number;
  title: string;
  category: string;
  locationType: 'ONLINE' | 'IN SEDE';
  startDate: string;
  endDate: string;
  image: string;
  description: string;
  status: 'iscritto' | 'in_coda' | 'in_corso' | 'concluso';
  queuePosition?: number;
  score?: string;
  position?: string;
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
              Area Utente - {{ authService.currentUser()?.nome }} {{ authService.currentUser()?.cognome }}
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
            @for (t of ongoingTournaments; track t.id) {
              <div class="user-card card-ongoing">
                <div class="card-image-box"><img [src]="t.image" [alt]="t.title" /></div>
                <div class="card-body">
                  <h4 class="card-name">{{ t.title }}</h4>
                  <p class="card-dates">🗓 {{ t.startDate }} - {{ t.endDate }}</p>
                  <p class="card-desc">{{ t.description }}</p>
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
            @for (t of registeredTournaments; track t.id) {
              <div class="user-card">
                <div class="card-image-box"><img [src]="t.image" [alt]="t.title" /></div>
                <div class="card-body">
                  <h4 class="card-name">{{ t.title }}</h4>
                  <p class="card-dates">🗓 Inizio: {{ t.startDate }}</p>
                  <p class="card-desc">{{ t.description }}</p>

                  <button type="button" class="btn-cancel" (click)="openCancelModal(t)">Annulla iscrizione</button>
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
            @for (t of queuedTournaments; track t.id) {
              <div class="user-card">
                <div class="card-image-box"><img [src]="t.image" [alt]="t.title" /></div>
                <div class="card-body">
                  <h4 class="card-name">{{ t.title }}</h4>
                  <p class="queue-notice">⚠️ Sei in posizione <strong>#{{ t.queuePosition || 2 }}</strong> nella lista d'attesa.</p>

                  <button type="button" class="btn-cancel" (click)="openCancelModal(t)">Annulla coda</button>
                </div>
              </div>
            } @empty {
              <p class="empty-msg">Non sei in coda d'attesa per alcun torneo.</p>
            }
          </div>
        </div>
      </section>

      <!-- MODAL ANNULLAMENTO -->
      @if (tournamentToCancel) {
        <div class="modal-backdrop" (click)="closeCancelModal()">
          <div class="modal-dialog-card" (click)="$event.stopPropagation()">
            <h3 class="modal-dialog-title">Sei sicuro di voler annullare?</h3>
            <p class="modal-dialog-text">Annullando l'iscrizione per "{{ tournamentToCancel.title }}" libererai il tuo posto.</p>
            <div class="modal-dialog-buttons">
              <button type="button" class="btn-modal-proceed" (click)="confirmCancelRegistration()">Procedi</button>
              <button type="button" class="btn-modal-abort" (click)="closeCancelModal()">Annulla</button>
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

    .sub-section { margin-bottom: 2.5rem; }
    .sub-section-title { font-size: 1.15rem; font-weight: 700; margin-bottom: 1.25rem; color: #0f172a; }
    .tournaments-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.75rem; }
    
    .user-card { background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 14px; overflow: hidden; display: flex; flex-direction: column; }
    .card-image-box { height: 140px; background: #0f172a; }
    .card-image-box img { width: 100%; height: 100%; object-fit: cover; }
    .card-body { padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1; }
    .card-name { font-size: 1.1rem; font-weight: 800; margin: 0 0 0.5rem 0; color: #0f172a; }
    .card-desc { font-size: 0.85rem; color: #475569; margin-bottom: 1.25rem; flex-grow: 1; }

    .status-pill-ongoing { background: #eff6ff; color: #1d4ed8; padding: 0.6rem; border-radius: 8px; font-size: 0.82rem; font-weight: 700; text-align: center; }
    .queue-notice { font-size: 0.82rem; color: #b45309; background: #fffbeb; padding: 0.6rem; border-radius: 8px; margin-bottom: 1rem; }

    .btn-cancel { width: 100%; padding: 0.65rem; background: white; color: #ef4444; border: 1.5px solid #ef4444; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-cancel:hover { background: #fef2f2; }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.65); z-index: 2000; display: flex; align-items: center; justify-content: center; }
    .modal-dialog-card { background: white; border-radius: 16px; padding: 2rem; max-width: 420px; text-align: center; }
    .modal-dialog-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 1.5rem; }
    .btn-modal-proceed { padding: 0.75rem; background: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-modal-abort { padding: 0.75rem; background: white; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .empty-msg { font-size: 0.9rem; color: #64748b; font-style: italic; }
  `]
})
export class UserAreaComponent {
  authService = inject(AuthService);

  allBaseTournaments: UserTournament[] = [
    { id: 1, title: 'Cybersecurity CTF Challenge', category: 'CYBERSECURITY', locationType: 'ONLINE', startDate: '20 Ottobre 2026', endDate: '22 Ottobre 2026', image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80', description: 'Inizio imminente.', status: 'iscritto' },
    { id: 2, title: 'Rocket League E-Sports Cup', category: 'GAMING', locationType: 'ONLINE', startDate: '31 Ottobre 2026', endDate: '27 Ottobre 2026', image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80', description: 'Sei in lista d\'attesa.', status: 'in_coda', queuePosition: 1 },
    { id: 3, title: 'AI & Coding Hackathon', category: 'SOFTWARE DEV', locationType: 'IN SEDE', startDate: '10 Ottobre 2026', endDate: '14 Ottobre 2026', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80', description: 'Hackathon maratona in corso.', status: 'in_corso' },
    { id: 4, title: 'FIFA / EA Sports FC Tournament', category: 'GAMING', locationType: 'IN SEDE', startDate: '24 Ottobre 2026', endDate: '25 Ottobre 2026', image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80', description: 'Sei in lista d\'attesa.', status: 'in_coda', queuePosition: 2 },
    { id: 5, title: 'Web Dev Speed Run', category: 'IT', locationType: 'ONLINE', startDate: '7 Novembre 2026', endDate: '7 Novembre 2026', image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=600&q=80', description: 'Sfida a tempo per la creazione di landing page.', status: 'iscritto' }
  ];

  tournamentToCancel: UserTournament | null = null;

  get ongoingTournaments(): UserTournament[] {
    return this.allBaseTournaments.filter(t => t.status === 'in_corso');
  }

  get registeredTournaments(): UserTournament[] {
    const enrollments = this.authService.userEnrollments().filter(e => e.type === 'iscritto');
    const ids = enrollments.map(e => e.id);
    return this.allBaseTournaments.filter(t => ids.includes(t.id) && t.status !== 'in_corso');
  }

  get queuedTournaments(): UserTournament[] {
    const enrollments = this.authService.userEnrollments().filter(e => e.type === 'in_coda');
    return enrollments.map(e => {
      const base = this.allBaseTournaments.find(t => t.id === e.id);
      return {
        ...base!,
        queuePosition: e.queuePosition || 1
      };
    }).filter(t => t.id);
  }

  openCancelModal(t: UserTournament) { this.tournamentToCancel = t; }
  closeCancelModal() { this.tournamentToCancel = null; }

  confirmCancelRegistration() {
    if (!this.tournamentToCancel) return;
    this.authService.cancelEnrollment(this.tournamentToCancel.id);
    this.closeCancelModal();
  }
}