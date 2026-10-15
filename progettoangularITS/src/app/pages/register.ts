import { Component, inject, signal, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="register-page">
      @if (mostraSuccesso()) {
        <div class="register-card success-card">
          <div class="success-icon">✅</div>
          <h1 class="success-title">Utente registrato correttamente</h1>
          <p class="success-text">Il tuo account è stato creato con successo. Ora puoi effettuare il login per partecipare ai tornei.</p>

          <div class="login-link-container">
            <a routerLink="/login" class="link-go-login">Clicca qui per accedere</a>
          </div>
        </div>
      } @else {
        <div class="register-card">
          <h1 class="register-title">Registrati</h1>
          <p class="register-subtitle">Crea un nuovo account per partecipare ai tornei.</p>

          @if (messaggioErrore()) {
            <div class="error-banner">
              {{ messaggioErrore() }}
            </div>
          }

          <form (ngSubmit)="inviaRegistrazione()" class="register-form">
            <div class="form-row">
              <div class="form-group">
                <label for="nome">Nome</label>
                <input type="text" id="nome" name="nome" [(ngModel)]="datiRegistrazione.nome" required placeholder="Nome" />
              </div>
              <div class="form-group">
                <label for="cognome">Cognome</label>
                <input type="text" id="cognome" name="cognome" [(ngModel)]="datiRegistrazione.cognome" required placeholder="Cognome" />
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email</label>
              <input type="email" id="email" name="email" [(ngModel)]="datiRegistrazione.email" required placeholder="nome@esempio.it" />
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="password">Crea Password</label>
                <input [type]="mostraPassword ? 'text' : 'password'" id="password" name="password" [(ngModel)]="datiRegistrazione.password" required />
              </div>
              <div class="form-group">
                <label for="confirmPassword">Conferma Password</label>
                <input [type]="mostraPassword ? 'text' : 'password'" id="confirmPassword" name="confirmPassword" [(ngModel)]="datiRegistrazione.confermaPassword" required />
              </div>
            </div>

            <button type="submit" class="btn-submit" [disabled]="caricamento()">
              {{ caricamento() ? 'Registrazione in corso...' : 'Registrati' }}
            </button>
          </form>
        </div>

        <p class="login-prompt">
          Sei già registrato? <a routerLink="/login" class="login-link">Accedi da qui</a>
        </p>
      }
    </div>
  `,
  styles: [`
    .register-page { min-height: calc(100vh - 160px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 3rem 1.5rem; }
    .register-card { width: 100%; max-width: 520px; background-color: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 2.5rem; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
    .register-title { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; text-align: center; }
    .register-subtitle { font-size: 0.95rem; color: #475569; text-align: center; margin: 0 0 2rem 0; }
    .register-form { display: flex; flex-direction: column; gap: 1.25rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    label { font-size: 0.9rem; font-weight: 700; color: #0f172a; }
    input { width: 100%; padding: 0.75rem 1rem; border: 1.5px solid #cbd5e1; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box; }
    input:focus { outline: none; border-color: #0f172a; }
    .btn-submit { width: 100%; padding: 0.85rem; background-color: #0f172a; color: #ffffff; border: none; border-radius: 8px; font-size: 1rem; font-weight: 700; cursor: pointer; transition: background-color 0.2s; }
    .btn-submit:hover:not(:disabled) { background-color: #1e293b; }
    .btn-submit:disabled { opacity: 0.6; cursor: not-allowed; }
    .login-prompt { margin-top: 1.5rem; text-align: center; font-size: 0.95rem; }
    .login-link { color: #0f172a; text-decoration: underline; font-weight: 700; }
    .error-banner { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem 1rem; border-radius: 8px; font-size: 0.875rem; font-weight: 600; margin-bottom: 1rem; text-align: center; }

    /* CARD DI CONFERMA REGISTRAZIONE */
    .success-card {
      text-align: center; animation: modalFadeIn 0.25s ease-out;
      border: 2px solid #10b981;
    }
    .success-icon { font-size: 3.5rem; margin-bottom: 0.5rem; }
    .success-title { font-size: 1.7rem; font-weight: 800; color: #0f172a; margin: 0 0 0.75rem 0; }
    .success-text { font-size: 1rem; color: #475569; line-height: 1.6; margin-bottom: 2rem; }

    .login-link-container { margin-top: 1.5rem; }
    .link-go-login {
      display: inline-block; padding: 0.85rem 2rem; background-color: #0f172a; color: #ffffff;
      border-radius: 8px; font-size: 1.05rem; font-weight: 700; text-decoration: underline; cursor: pointer;
      transition: background-color 0.2s, transform 0.1s;
    }
    .link-go-login:hover { background-color: #1e293b; color: #ffffff; transform: translateY(-1px); }

    @keyframes modalFadeIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
  `]
})
export class RegisterComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  datiRegistrazione = { nome: '', cognome: '', email: '', password: '', confermaPassword: '' };
  mostraPassword = false;
  mostraSuccesso = signal(false);
  caricamento = signal(false);
  messaggioErrore = signal('');

  inviaRegistrazione() {
    this.messaggioErrore.set('');

    if (!this.datiRegistrazione.nome || !this.datiRegistrazione.cognome || !this.datiRegistrazione.email || !this.datiRegistrazione.password) {
      this.messaggioErrore.set('Compila tutti i campi obbligatori.');
      return;
    }

    if (this.datiRegistrazione.password !== this.datiRegistrazione.confermaPassword) {
      this.messaggioErrore.set('Le password inserite non coincidono.');
      return;
    }

    if (this.datiRegistrazione.password.length < 8) {
      this.messaggioErrore.set('La password deve contenere almeno 8 caratteri.');
      return;
    }

    this.caricamento.set(true);

    this.authService.registra({
      nome: this.datiRegistrazione.nome,
      cognome: this.datiRegistrazione.cognome,
      email: this.datiRegistrazione.email,
      password: this.datiRegistrazione.password
    }).subscribe({
      next: () => {
        this.caricamento.set(false);
        this.mostraSuccesso.set(true);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.caricamento.set(false);
        this.messaggioErrore.set(err.error?.error || 'Errore durante la registrazione. Riprova.');
        this.cdr.markForCheck();
      }
    });
  }

  vaiAlLogin() {
    this.router.navigate(['/login']);
  }
}