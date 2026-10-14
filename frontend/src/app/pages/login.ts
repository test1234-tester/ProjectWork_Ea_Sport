import { Component, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <h1 class="login-title">Accedi al tuo profilo</h1>
        <p class="login-subtitle">Inserisci i tuoi dati per partecipare ai tornei.</p>

        <form (ngSubmit)="inviaForm()" class="login-form">
          <!-- Campo Email -->
          <div class="form-group">
            <label for="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              [(ngModel)]="datiForm.email" 
              required 
              autocomplete="email"
              placeholder="nome@esempio.it"
            />
          </div>

          <!-- Campo Password -->
          <div class="form-group">
            <label for="password">Password</label>
            <div class="password-wrapper">
              <input 
                [type]="mostraPassword ? 'text' : 'password'" 
                id="password" 
                name="password" 
                [(ngModel)]="datiForm.password" 
                required 
                autocomplete="current-password"
              />
              <button 
                type="button" 
                class="btn-toggle-password" 
                (click)="alternaVisibilitaPassword()" 
                [attr.aria-label]="mostraPassword ? 'Nascondi password' : 'Mostra password'"
                [title]="mostraPassword ? 'Nascondi password' : 'Mostra password'"
              >
                @if (mostraPassword) {
                  <!-- Icona Occhio Aperto -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                } @else {
                  <!-- Icona Occhio Barrato -->
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                    <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                    <path d="M6.61 6.61A13.52 13.52 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                    <line x1="2" x2="22" y1="2" y2="22"/>
                  </svg>
                }
              </button>
            </div>
            <p class="password-requirements">
              Requisiti password: almeno 8 caratteri, una lettera maiuscola, un numero e un carattere speciale (es. 1&#64;#$).
            </p>
          </div>

          <!-- Pulsante Submit -->
          <button type="submit" class="btn-submit">
            Accedi
          </button>
        </form>
      </div>

      <!-- Prompt di Registrazione Sotto la Card -->
      <p class="register-prompt">
        Non sei ancora registrato? <a routerLink="/register" class="register-link">Fallo qui</a>
      </p>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: calc(100vh - 160px);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      background-color: #ffffff;
    }

    .login-card {
      width: 100%;
      max-width: 480px;
      background-color: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 2.5rem;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.06);
    }

    .login-title {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
      text-align: center;
      letter-spacing: -0.025em;
    }

    .login-subtitle {
      font-size: 0.95rem;
      color: #475569;
      text-align: center;
      margin: 0 0 2rem 0;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    label {
      font-size: 0.9rem;
      font-weight: 700;
      color: #0f172a;
    }

    .form-group input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.95rem;
      color: #0f172a;
      background-color: #ffffff;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      box-sizing: border-box;
      font-family: inherit;
    }

    .form-group input:focus {
      outline: none;
      border-color: #0f172a;
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
    }

    .password-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      width: 100%;
    }

    .password-wrapper input {
      padding-right: 3rem;
    }

    .btn-toggle-password {
      position: absolute;
      right: 0.6rem;
      top: 50%;
      transform: translateY(-50%);
      background: transparent;
      border: none;
      color: #64748b;
      cursor: pointer;
      padding: 0.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 6px;
      transition: color 0.2s ease, background-color 0.2s ease;
    }

    .btn-toggle-password:hover {
      color: #0f172a;
      background-color: #f1f5f9;
    }

    .password-requirements {
      font-size: 0.78rem;
      color: #64748b;
      margin: 0.25rem 0 0 0;
      line-height: 1.4;
    }

    .btn-submit {
      width: 100%;
      padding: 0.85rem;
      margin-top: 0.5rem;
      background-color: #0f172a;
      color: #ffffff;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.15);
    }

    .btn-submit:hover {
      background-color: #1e293b;
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.25);
    }

    .register-prompt {
      margin-top: 1.5rem;
      font-size: 0.95rem;
      color: #0f172a;
      font-weight: 600;
      text-align: center;
    }

    .register-link {
      color: #0f172a;
      text-decoration: underline;
      font-weight: 700;
      transition: color 0.2s ease;
    }

    .register-link:hover {
      color: #2563eb;
    }

    @media (max-width: 540px) {
      .login-card {
        padding: 1.75rem;
      }
      .login-title {
        font-size: 1.65rem;
      }
    }
  `]
})
export class LoginComponent {
  private router = inject(Router);
  private authService = inject(AuthService);

  datiForm = {
    email: '',
    password: ''
  };

  mostraPassword = false;

  // Alias retrocompatibili
  get formData() { return this.datiForm; }
  get showPassword() { return this.mostraPassword; }

  alternaVisibilitaPassword() {
    this.mostraPassword = !this.mostraPassword;
  }
  togglePasswordVisibility() { this.alternaVisibilitaPassword(); }

  inviaForm() {
    console.log('Modulo di accesso inviato:', this.datiForm);
    
    // 1. Simula l'accesso dell'utente nel servizio mock
    this.authService.accedi(this.datiForm.email);

    // 2. Controllo del ruolo: Reindirizza alla pagina admin se l'email contiene "admin"
    if (this.datiForm.email.toLowerCase().includes('admin')) {
      this.router.navigate(['/admin']);
    } else {
      this.router.navigate(['/user-area']);
    }
  }
  onSubmit() { this.inviaForm(); }
}

//Aggiunta Dashboard Admin e correzione login