import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="register-page">
      <div class="register-card">
        <h1 class="register-title">Registrati</h1>
        <p class="register-subtitle">Crea un nuovo account per partecipare ai tornei.</p>

        <form (ngSubmit)="onSubmit()" class="register-form">
          <div class="form-row">
            <div class="form-group">
              <label for="nome">Nome</label>
              <input type="text" id="nome" name="nome" [(ngModel)]="formData.nome" required placeholder="Nome" />
            </div>
            <div class="form-group">
              <label for="cognome">Cognome</label>
              <input type="text" id="cognome" name="cognome" [(ngModel)]="formData.cognome" required placeholder="Cognome" />
            </div>
          </div>

          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" [(ngModel)]="formData.email" required placeholder="nome@esempio.it" />
          </div>

          <div class="form-row">
            <div class="form-group">
              <label for="password">Crea Password</label>
              <input [type]="showPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="formData.password" required />
            </div>
            <div class="form-group">
              <label for="confirmPassword">Conferma Password</label>
              <input [type]="showPassword ? 'text' : 'password'" id="confirmPassword" name="confirmPassword" [(ngModel)]="formData.confirmPassword" required />
            </div>
          </div>

          <button type="submit" class="btn-submit">Registrati</button>
        </form>
      </div>

      <p class="login-prompt">
        Sei già registrato? <a routerLink="/login" class="login-link">Accedi da qui</a>
      </p>
    </div>

    <!-- MODAL CARD: REGISTRAZIONE COMPLETATA -->
    @if (showSuccessModal) {
      <div class="modal-backdrop">
        <div class="success-card">
          <div class="success-icon">🎉</div>
          <h2 class="success-title">Sei stato registrato!</h2>
          <p class="success-text">Il tuo account è stato creato con successo. Ora puoi accedere e partecipare a tutti i tornei dell'ITS.</p>

          <button type="button" class="btn-go-login" (click)="goToLogin()">
            Clicca qui per accedere
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .register-page { min-height: calc(100vh - 160px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; }
    .register-card { width: 100%; max-width: 520px; background-color: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 2.5rem; }
    .register-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; text-align: center; }
    .register-subtitle { font-size: 0.95rem; color: #475569; text-align: center; margin: 0 0 2rem 0; }
    .register-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    label { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    input { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
    .btn-submit { width: 100%; padding: 0.85rem; background-color: #0f172a; color: #ffffff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; }
    .login-prompt { margin-top: 1.5rem; text-align: center; }
    .login-link { color: #0f172a; text-decoration: underline; font-weight: 700; }

    /* CARD DI CONFERMA SUCCESS */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background-color: rgba(15, 23, 42, 0.7); backdrop-filter: blur(4px);
      z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 1.5rem;
    }

    .success-card {
      background-color: #ffffff; border-radius: 16px; padding: 2.5rem; max-width: 440px; width: 100%;
      text-align: center; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25); animation: modalFadeIn 0.25s ease-out;
    }

    .success-icon { font-size: 3rem; margin-bottom: 0.5rem; }
    .success-title { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem 0; }
    .success-text { font-size: 0.95rem; color: #475569; line-height: 1.5; margin-bottom: 2rem; }

    .btn-go-login {
      width: 100%; padding: 0.9rem; background-color: #0f172a; color: #ffffff; border: none;
      border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer;
    }
    .btn-go-login:hover { background-color: #1e293b; }

    @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class RegisterComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  formData = { nome: '', cognome: '', email: '', password: '', confirmPassword: '' };
  showPassword = false;
  showSuccessModal = false;

  onSubmit() {
    this.authService.register({
      nome: this.formData.nome,
      cognome: this.formData.cognome,
      email: this.formData.email
    });
    this.showSuccessModal = true;
  }

  goToLogin() {
    this.showSuccessModal = false;
    this.router.navigate(['/login']);
  }
}