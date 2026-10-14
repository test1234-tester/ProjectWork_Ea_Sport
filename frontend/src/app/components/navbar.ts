import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar-header">
      <div class="navbar-container">
        <!-- Logo -->
        <a routerLink="/" class="logo-link" aria-label="Home ITS Academy">
          <img src="/logolaziodigita.jpg" alt="Lazio Digital ITS Academy" class="logo-img" />
        </a>

        <!-- Navigazione -->
        <nav class="nav-actions">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
            Home
          </a>

          <a routerLink="/tornei" routerLinkActive="active" class="nav-link">
            Scopri i nostri tornei
          </a>

          @if (authService.eAutenticato()) {
            <!-- Se l'utente è un Admin -->
            @if (authService.utenteCorrente()?.email?.includes('admin')) {
              <a routerLink="/admin" routerLinkActive="active" class="user-greeting-link admin-style">
                <span class="user-icon-circle admin-circle">⚙️</span>
                <span class="greeting-text">Ciao <strong>Admin</strong>!</span>
              </a>
            } @else {
              <!-- Se è un Utente Normale -->
              <a routerLink="/user-area" routerLinkActive="active" class="user-greeting-link">
                <span class="user-icon-circle">👤</span>
                <span class="greeting-text">Ciao <strong>{{ authService.utenteCorrente()?.nome }}</strong>!</span>
              </a>
            }

            <button type="button" class="btn-esci" (click)="apriModalLogout()">
              Esci
            </button>
          } @else {
            <a routerLink="/login" routerLinkActive="btn-active" class="btn-accedi">Accedi</a>
            <a routerLink="/register" class="nav-register-link">
              Non sei ancora registrato? <span class="underline-text">Puoi farlo qui</span>
            </a>
          }
        </nav>
      </div>
    </header>

    @if (mostraModalConfermaLogout) {
      <div class="modal-backdrop" (click)="chiudiModalLogout()">
        <div class="logout-card" (click)="$event.stopPropagation()">
          <div class="logout-icon-circle">🚪</div>
          <h3 class="logout-title">Sei sicuro di voler uscire?</h3>
          <p class="logout-text">Dovrai effettuare nuovamente l'accesso per accedere alle funzionalità della piattaforma.</p>
          
          <div class="logout-buttons">
            <button type="button" class="btn-confirm-logout" (click)="confermaLogout()">Sì</button>
            <button type="button" class="btn-cancel-logout" (click)="chiudiModalLogout()">Annulla</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .navbar-header {
      position: fixed; top: 0; left: 0; width: 100%; z-index: 1000;
      background-color: rgba(255, 255, 255, 0.98); backdrop-filter: blur(8px);
      border-bottom: 1px solid #e5e7eb; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    }
    .navbar-container { max-width: 1200px; margin: 0 auto; padding: 0.4rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .logo-img { height: 65px; width: auto; object-fit: contain; }
    .nav-actions { display: flex; align-items: center; gap: 1.25rem; }
    .nav-link { text-decoration: none; color: #1f2937; font-size: 0.92rem; font-weight: 600; cursor: pointer; }
    .nav-link.active { font-weight: 800; color: #0f172a; border-bottom: 2px solid #0f172a; }

    .user-greeting-link { display: flex; align-items: center; gap: 0.5rem; text-decoration: none; color: #0f172a; padding: 0.35rem 0.75rem; border-radius: 20px; background-color: #f1f5f9; }
    .admin-style { background-color: #fef2f2; border: 1px solid #fca5a5; }
    .user-icon-circle { width: 28px; height: 28px; border-radius: 50%; background-color: #0f172a; color: white; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; }
    .admin-circle { background-color: #ef4444; }

    .btn-accedi { text-decoration: none; color: #111827; background-color: #ffffff; border: 1.5px solid #111827; padding: 0.45rem 1.25rem; border-radius: 8px; font-weight: 700; }
    .btn-esci { background-color: #0f172a; color: #ffffff; border: 1.5px solid #0f172a; padding: 0.45rem 1.25rem; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .btn-esci:hover { background-color: #ef4444; border-color: #ef4444; }

    .nav-register-link { text-decoration: none; color: #4b5563; font-size: 0.88rem; }
    .underline-text { text-decoration: underline; font-weight: 700; color: #111827; }

    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background-color: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
    .logout-card { background-color: #ffffff; border-radius: 16px; padding: 2rem; max-width: 400px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25); }
    .logout-icon-circle { font-size: 2.2rem; margin-bottom: 0.5rem; }
    .logout-title { font-size: 1.35rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
    .logout-text { font-size: 0.9rem; color: #475569; margin-bottom: 1.5rem; }
    .logout-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .btn-confirm-logout { padding: 0.75rem; background-color: #ef4444; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-cancel-logout { padding: 0.75rem; background-color: #ffffff; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  mostraModalConfermaLogout = false;

  apriModalLogout() { this.mostraModalConfermaLogout = true; }
  chiudiModalLogout() { this.mostraModalConfermaLogout = false; }

  confermaLogout() {
    this.chiudiModalLogout();
    this.authService.esci();
    this.router.navigate(['/']);
  }
}