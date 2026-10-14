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
        <!-- Logo ITS Lazio Digital -->
        <a routerLink="/" class="logo-link" aria-label="Home ITS Academy">
          <img 
            src="/logolaziodigita.jpg" 
            alt="Lazio Digital ITS Academy" 
            class="logo-img" 
          />
        </a>

        <!-- Navigazione Principale -->
        <nav class="nav-actions">
          <a 
            routerLink="/" 
            routerLinkActive="active" 
            [routerLinkActiveOptions]="{exact: true}" 
            class="nav-link"
          >
            Home
          </a>

          <a 
            routerLink="/tornei" 
            routerLinkActive="active" 
            class="nav-link"
          >
            Scopri i nostri tornei
          </a>

          @if (authService.isLoggedIn()) {
            <!-- Schermata Utente Autenticato -->
            <a routerLink="/user-area" routerLinkActive="active" class="user-greeting-link">
              <span class="user-icon-circle">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </span>
              <span class="greeting-text">Ciao <strong>{{ authService.currentUser()?.nome }}</strong>!</span>
            </a>

            <button type="button" class="btn-esci" (click)="openLogoutModal()">
              Esci
            </button>
          } @else {
            <!-- Schermata Utente NON Autenticato -->
            <a 
              routerLink="/login" 
              routerLinkActive="btn-active"
              class="btn-accedi"
            >
              Accedi
            </a>

            <a 
              routerLink="/register" 
              routerLinkActive="register-active" 
              class="nav-register-link"
            >
              Non sei ancora registrato? <span class="underline-text">Puoi farlo qui</span>
            </a>
          }
        </nav>
      </div>
    </header>

    <!-- POPUP / CARD DI CONFERMA LOGOUT -->
    @if (showLogoutConfirmModal) {
      <div class="modal-backdrop" (click)="closeLogoutModal()">
        <div class="logout-card" (click)="$event.stopPropagation()">
          <div class="logout-icon-circle">🚪</div>
          <h3 class="logout-title">Sei sicuro di voler uscire?</h3>
          <p class="logout-text">Dovrai effettuare nuovamente l'accesso per iscriverti ai tornei e gestire il tuo profilo.</p>
          
          <div class="logout-buttons">
            <button type="button" class="btn-confirm-logout" (click)="confirmLogout()">
              Sì
            </button>
            <button type="button" class="btn-cancel-logout" (click)="closeLogoutModal()">
              Annulla
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    /* NAVBAR FISSA IN ALTO DURANTE LO SCROLL */
    .navbar-header {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      z-index: 1000;
      background-color: rgba(255, 255, 255, 0.98);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid #e5e7eb;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.04);
    }

    .navbar-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0.4rem 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .logo-link {
      display: flex;
      align-items: center;
      text-decoration: none;
    }

    .logo-img {
      height: 65px;
      width: auto;
      object-fit: contain;
      transition: transform 0.2s ease;
    }

    .logo-link:hover .logo-img {
      transform: scale(1.03);
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 1.25rem;
    }

    .nav-link {
      text-decoration: none;
      color: #1f2937;
      font-size: 0.92rem;
      font-weight: 600;
      display: inline-block;
      transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease;
      cursor: pointer;
    }

    .nav-link:hover {
      transform: scale(1.04);
      color: #000000;
    }

    .nav-link.active {
      font-weight: 800;
      color: #0f172a;
      border-bottom: 2px solid #0f172a;
    }

    /* BENVENUTO UTENTE */
    .user-greeting-link {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      text-decoration: none;
      color: #0f172a;
      padding: 0.35rem 0.75rem;
      border-radius: 20px;
      background-color: #f1f5f9;
      transition: background-color 0.2s ease;
    }

    .user-greeting-link:hover {
      background-color: #e2e8f0;
    }

    .user-icon-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .greeting-text {
      font-size: 0.9rem;
      color: #0f172a;
    }

    /* PULSANTE ACCEDI */
    .btn-accedi {
      text-decoration: none;
      color: #111827;
      background-color: #ffffff;
      border: 1.5px solid #111827;
      padding: 0.45rem 1.25rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      display: inline-block;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }

    .btn-accedi:hover, .btn-accedi.btn-active {
      transform: scale(1.05);
      background-color: #111827;
      color: #ffffff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    /* PULSANTE ESCI */
    .btn-esci {
      background-color: #0f172a;
      color: #ffffff;
      border: 1.5px solid #0f172a;
      padding: 0.45rem 1.25rem;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.15);
    }

    .btn-esci:hover {
      background-color: #ef4444;
      border-color: #ef4444;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
    }

    .nav-register-link {
      text-decoration: none;
      color: #4b5563;
      font-size: 0.88rem;
      font-weight: 500;
      transition: color 0.2s ease;
      white-space: nowrap;
    }

    .nav-register-link:hover {
      color: #000000;
    }

    .underline-text {
      text-decoration: underline;
      font-weight: 700;
      color: #111827;
    }

    /* MODAL LOGOUT */
    .modal-backdrop {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .logout-card {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 2rem;
      max-width: 400px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25);
      animation: modalFadeIn 0.25s ease-out;
    }

    .logout-icon-circle {
      font-size: 2.2rem;
      margin-bottom: 0.5rem;
    }

    .logout-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .logout-text {
      font-size: 0.9rem;
      color: #475569;
      margin-bottom: 1.5rem;
      line-height: 1.4;
    }

    .logout-buttons {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
    }

    .btn-confirm-logout {
      padding: 0.75rem;
      background-color: #ef4444;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-confirm-logout:hover {
      background-color: #dc2626;
    }

    .btn-cancel-logout {
      padding: 0.75rem;
      background-color: #ffffff;
      color: #0f172a;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      font-weight: 700;
      cursor: pointer;
    }

    .btn-cancel-logout:hover {
      background-color: #f8fafc;
    }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 960px) {
      .nav-actions {
        gap: 1rem;
      }
      .nav-register-link {
        font-size: 0.82rem;
      }
    }

    @media (max-width: 768px) {
      .navbar-container {
        padding: 0.4rem 1rem;
      }
      .logo-img {
        height: 48px;
      }
      .nav-actions {
        gap: 0.75rem;
        flex-wrap: wrap;
        justify-content: flex-end;
      }
      .nav-link, .nav-register-link {
        font-size: 0.8rem;
      }
      .btn-accedi, .btn-esci {
        padding: 0.35rem 0.85rem;
        font-size: 0.8rem;
      }
    }
  `]
})
export class NavbarComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  showLogoutConfirmModal = false;

  openLogoutModal() {
    this.showLogoutConfirmModal = true;
  }

  closeLogoutModal() {
    this.showLogoutConfirmModal = false;
  }

  confirmLogout() {
    this.closeLogoutModal();
    this.authService.logout();
    this.router.navigate(['/']);
  }
}