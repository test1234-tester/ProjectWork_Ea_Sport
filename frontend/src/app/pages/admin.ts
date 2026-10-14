import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';

// Entità TORNEO e STUDENTE dal Documento Requisiti (pagg. 16, 17, 18, 19, 20)
export interface Torneo {
  id: number;
  nome: string;
  gioco: string;
  modalita: 'IN SEDE' | 'ONLINE';
  data_inizio: string;
  data_fine: string;
  descrizione: string;
  immagine: string;
  stato: 'Aperto' | 'In corso' | 'Chiuso' | 'Cancellato' | 'aperto' | 'max_raggiunto' | 'in_corso' | 'chiuso';
  posti_max?: number;
  posti_occupati?: number;
}
export type Tournament = Torneo;

export interface Studente {
  id: number;
  nome_completo: string;
}
export type Student = Studente;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="admin-page-container">

      <!-- HEADER DASHBOARD ADMIN -->
      <header class="admin-header">
        <div class="header-main">
          <div>
            <span class="admin-tag">PANNELLO DI CONTROLLO AMMINISTRATORE</span>
            <h1 class="page-title">Dashboard Amministratore - Ottobre 2026</h1>
          </div>
          <div class="current-badge">
            ⚡ Ruolo: Admin Sistemista
          </div>
        </div>
      </header>

      <!-- GRIGLIA PRINCIPALE GESTIONE -->
      <div class="admin-grid">

        <!-- 1. SEZIONE GESTIONE TORNEI (CARDS CREA / MODIFICA / ELIMINA) -->
        <section class="admin-card-section full-width">
          <div class="section-title-box">
            <h2 class="section-title">Gestione Tornei</h2>
            <p class="section-subtitle">Crea nuovi tornei, modifica le schede esistenti o rimuovi eventi conclusi/annullati.</p>
          </div>

          <div class="cards-triple-grid">
            
            <!-- CARD 1: CREA NUOVO TORNEO -->
            <div class="action-card">
              <div class="card-hero-image">
                <img src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80" alt="Crea torneo" />
                <span class="card-badge badge-create">Crea</span>
              </div>
              <div class="card-content">
                <h3 class="card-heading">Crea Nuovo Torneo</h3>
                <p class="card-description">Imposta titolo, immagine di copertina, date di svolgimento e modalità (In sede o Online).</p>
                <button type="button" class="btn-primary" (click)="apriModalCreazione()">
                  Crea Torneo
                </button>
              </div>
            </div>

            <!-- CARD 2: MODIFICA TORNEO -->
            <div class="action-card">
              <div class="card-hero-image">
                <img src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80" alt="Modifica torneo" />
                <span class="card-badge badge-edit">Modifica</span>
              </div>
              <div class="card-content">
                <h3 class="card-heading">Modifica Torneo</h3>
                <p class="card-description">Seleziona un torneo esistente dal menu a tendina per aggiornarne i dettagli o le date.</p>
                
                <div class="select-wrapper">
                  <select [(ngModel)]="torneoDaModificareId" class="custom-select">
                    <option [ngValue]="null" disabled selected>Seleziona torneo...</option>
                    @for (t of tornei; track t.id) {
                      <option [ngValue]="t.id">{{ t.nome }}</option>
                    }
                  </select>
                </div>

                <button 
                  type="button" 
                  class="btn-secondary" 
                  [disabled]="!torneoDaModificareId"
                  (click)="apriModalModifica()"
                >
                  Modifica
                </button>
              </div>
            </div>

            <!-- CARD 3: ELIMINA TORNEO -->
            <div class="action-card">
              <div class="card-hero-image">
                <img src="https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80" alt="Elimina torneo" />
                <span class="card-badge badge-delete">Elimina</span>
              </div>
              <div class="card-content">
                <h3 class="card-heading">Elimina Torneo</h3>
                <p class="card-description">Seleziona un torneo dal menu a tendina per rimuoverlo definitivamente dal sistema.</p>
                
                <div class="select-wrapper">
                  <select [(ngModel)]="torneoDaEliminareId" class="custom-select">
                    <option [ngValue]="null" disabled selected>Seleziona torneo...</option>
                    @for (t of tornei; track t.id) {
                      <option [ngValue]="t.id">{{ t.nome }}</option>
                    }
                  </select>
                </div>

                <button 
                  type="button" 
                  class="btn-danger" 
                  [disabled]="!torneoDaEliminareId"
                  (click)="chiediConfermaEliminazione()"
                >
                  Cancella Torneo
                </button>
              </div>
            </div>

          </div>
        </section>

        <!-- 2. SEZIONE REGOLAZIONE LIMITE ISCRIZIONI UTENTE -->
        <section class="admin-card-section half-width">
          <div class="section-title-box">
            <h2 class="section-title">Gestisci limite iscrizioni per utente</h2>
            <p class="section-subtitle">Imposta il numero massimo di tornei a cui un singolo studente può iscriversi contemporaneamente.</p>
          </div>

          <div class="panel-box">
            <div class="limit-status-row">
              <span class="status-label">Limite attuale impostato:</span>
              <span class="limit-number-badge">{{ limiteMassimoIscrizioni }} iscrizioni max</span>
            </div>

            <form (ngSubmit)="chiediConfermaLimiteIscrizioni()" class="inline-form">
              <div class="form-group">
                <label for="maxEnrollmentsInput">Nuovo numero massimo iscrizioni:</label>
                <input 
                  type="number" 
                  id="maxEnrollmentsInput" 
                  name="maxEnrollmentsInput"
                  [(ngModel)]="limiteTemporaneoIscrizioni" 
                  min="1" 
                  max="10" 
                  required 
                  class="custom-input number-input"
                />
              </div>

              <button type="submit" class="btn-primary">
                Salva Nuovo Limite
              </button>
            </form>
          </div>
        </section>

        <!-- 3. SEZIONE INSERIMENTO PUNTEGGI -->
        <section class="admin-card-section half-width">
          <div class="section-title-box">
            <h2 class="section-title">Inserimento Punteggi & Risultati</h2>
            <p class="section-subtitle">Assegna punteggi e risultati agli studenti partecipanti ai tornei svolti o in corso.</p>
          </div>

          <div class="panel-box">
            <form (ngSubmit)="salvaPunteggio()" class="score-form">
              
              <!-- Seleziona Torneo -->
              <div class="form-group">
                <label for="scoreTournament">Seleziona Torneo:</label>
                <select id="scoreTournament" name="scoreTournament" [(ngModel)]="datiPunteggio.torneo_id" required class="custom-select">
                  <option [ngValue]="null" disabled selected>Scegli torneo...</option>
                  @for (t of tornei; track t.id) {
                    <option [ngValue]="t.id">{{ t.nome }}</option>
                  }
                </select>
              </div>

              <!-- Seleziona Studente -->
              <div class="form-group">
                <label for="scoreStudent">Seleziona Studente:</label>
                <select id="scoreStudent" name="scoreStudent" [(ngModel)]="datiPunteggio.nome_studente" required class="custom-select">
                  <option value="" disabled selected>Scegli studente...</option>
                  @for (s of studenti; track s.id) {
                    <option [value]="s.nome_completo">{{ s.nome_completo }}</option>
                  }
                </select>
              </div>

              <!-- Inserimento Punteggio Manuale -->
              <div class="form-group">
                <label for="scoreValue">Punteggio conseguito:</label>
                <input 
                  type="text" 
                  id="scoreValue" 
                  name="scoreValue" 
                  [(ngModel)]="datiPunteggio.punti" 
                  placeholder="Es. 450 pt / 14 Vittorie" 
                  required 
                  class="custom-input"
                />
              </div>

              <button type="submit" class="btn-primary full-btn" [disabled]="!datiPunteggio.torneo_id || !datiPunteggio.nome_studente || !datiPunteggio.punti">
                Aggiorna Punteggio
              </button>
            </form>
          </div>
        </section>

      </div>

    </div>

    <!-- MODAL 1: FORM CREA TORNEO -->
    @if (modalAttivo === 'modal_crea') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="modal-form-card" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close-x" (click)="chiudiModal()">&times;</button>
          <h2 class="modal-title">Crea Nuovo Torneo</h2>

          <form (ngSubmit)="chiediConfermaCreazione()" class="modal-form">
            <div class="form-group">
              <label for="createTitle">Titolo Torneo:</label>
              <input type="text" id="createTitle" name="createTitle" [(ngModel)]="moduloCreazione.nome" required placeholder="Es. EA Sports FC 25 Campus" class="custom-input" />
            </div>

            <div class="form-group">
              <label for="createImage">Carica Foto Copertina (URL o sfoglia file):</label>
              <input type="text" id="createImage" name="createImage" [(ngModel)]="moduloCreazione.immagine" placeholder="Incolla URL immagine o seleziona dal PC..." class="custom-input" />
            </div>

            <div class="form-group">
              <label for="createDesc">Descrizione Breve:</label>
              <textarea id="createDesc" name="createDesc" [(ngModel)]="moduloCreazione.descrizione" rows="3" required placeholder="Inserisci i dettagli ed il regolamento del torneo..." class="custom-textarea"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="createStartDate">Data Inizio (GG/MM/AA):</label>
                <input type="date" id="createStartDate" name="createStartDate" [(ngModel)]="moduloCreazione.data_inizio" required class="custom-input" />
              </div>

              <div class="form-group">
                <label for="createEndDate">Data Fine (GG/MM/AA):</label>
                <input type="date" id="createEndDate" name="createEndDate" [(ngModel)]="moduloCreazione.data_fine" required class="custom-input" />
              </div>
            </div>

            <div class="form-group">
              <label for="createLocation">Luogo / Modalità Svolgimento:</label>
              <select id="createLocation" name="createLocation" [(ngModel)]="moduloCreazione.modalita" required class="custom-select">
                <option value="IN SEDE">IN SEDE (Presso laboratori ITS)</option>
                <option value="ONLINE">ONLINE (Piattaforma o server dedicato)</option>
              </select>
            </div>

            <div class="modal-footer-btns">
              <button type="submit" class="btn-primary">Procedi e Salva</button>
              <button type="button" class="btn-secondary" (click)="chiudiModal()">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL 2: FORM MODIFICA TORNEO -->
    @if (modalAttivo === 'modal_modifica') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="modal-form-card" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close-x" (click)="chiudiModal()">&times;</button>
          <h2 class="modal-title">Modifica Torneo</h2>

          <form (ngSubmit)="chiediConfermaModifica()" class="modal-form">
            <div class="form-group">
              <label for="editTitle">Titolo Torneo:</label>
              <input type="text" id="editTitle" name="editTitle" [(ngModel)]="moduloModifica.nome" required class="custom-input" />
            </div>

            <div class="form-group">
              <label for="editImage">Carica Foto Copertina:</label>
              <input type="text" id="editImage" name="editImage" [(ngModel)]="moduloModifica.immagine" class="custom-input" />
            </div>

            <div class="form-group">
              <label for="editDesc">Descrizione Breve:</label>
              <textarea id="editDesc" name="editDesc" [(ngModel)]="moduloModifica.descrizione" rows="3" required class="custom-textarea"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editStartDate">Data Inizio:</label>
                <input type="date" id="editStartDate" name="editStartDate" [(ngModel)]="moduloModifica.data_inizio" required class="custom-input" />
              </div>

              <div class="form-group">
                <label for="editEndDate">Data Fine:</label>
                <input type="date" id="editEndDate" name="editEndDate" [(ngModel)]="moduloModifica.data_fine" required class="custom-input" />
              </div>
            </div>

            <div class="form-group">
              <label for="editLocation">Luogo / Modalità Svolgimento:</label>
              <select id="editLocation" name="editLocation" [(ngModel)]="moduloModifica.modalita" required class="custom-select">
                <option value="IN SEDE">IN SEDE (Presso laboratori ITS)</option>
                <option value="ONLINE">ONLINE (Piattaforma o server dedicato)</option>
              </select>
            </div>

            <div class="modal-footer-btns">
              <button type="submit" class="btn-primary">Salva Modifiche</button>
              <button type="button" class="btn-secondary" (click)="chiudiModal()">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- MODAL 3: CONFERMA AZIONE (CREA / MODIFICA / ELIMINA / LIMITE) -->
    @if (modalAttivo === 'modal_conferma') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="confirm-dialog-card" (click)="$event.stopPropagation()">
          <div class="dialog-icon-circle">⚠️</div>
          <h3 class="dialog-title">Conferma Operazione</h3>
          <p class="dialog-text">{{ testoDomandaConferma }}</p>

          <div class="dialog-buttons">
            <button type="button" class="btn-confirm-yes" (click)="eseguiAzioneConfermata()">
              Sì, Procedi
            </button>
            <button type="button" class="btn-confirm-no" (click)="chiudiModal()">
              Annulla
            </button>
          </div>
        </div>
      </div>
    }

    <!-- MODAL 4: NOTIFICA DI COMPLETA AZIONE (ESITO POSITIVO) -->
    @if (modalAttivo === 'modal_successo') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="confirm-dialog-card" (click)="$event.stopPropagation()">
          <div class="dialog-icon-circle success-icon">✅</div>
          <h3 class="dialog-title">Operazione Completata</h3>
          <p class="dialog-text">{{ testoFeedbackSuccesso }}</p>

          <button type="button" class="btn-primary full-btn" (click)="chiudiModal()">
            OK, Chiudi
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-page-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2.5rem 2rem 5rem 2rem;
    }

    /* HEADER DASHBOARD */
    .admin-header {
      margin-bottom: 2.5rem;
    }

    .header-main {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      flex-wrap: wrap;
      gap: 1rem;
      padding-bottom: 1.5rem;
      border-bottom: 1.5px solid #e2e8f0;
    }

    .admin-tag {
      font-size: 0.75rem;
      font-weight: 800;
      color: #2563eb;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      display: block;
      margin-bottom: 0.4rem;
    }

    .page-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.025em;
    }

    .current-badge {
      background-color: #0f172a;
      color: #ffffff;
      padding: 0.5rem 1rem;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 700;
    }

    /* LAYOUT GRIGLIA ADMIN */
    .admin-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 2rem;
    }

    .admin-card-section {
      background-color: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 4px 14px rgba(0,0,0,0.03);
    }

    .full-width { width: 100%; }
    .half-width { flex: 1 1 calc(50% - 1rem); min-width: 340px; }

    .section-title-box {
      margin-bottom: 1.5rem;
    }

    .section-title {
      font-size: 1.4rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.35rem 0;
    }

    .section-subtitle {
      font-size: 0.9rem;
      color: #64748b;
      margin: 0;
    }

    /* CARDS TRIPLE GESTIONE TORNEI */
    .cards-triple-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 1.5rem;
    }

    .action-card {
      background-color: #f8fafc;
      border: 1.5px solid #cbd5e1;
      border-radius: 12px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      transition: transform 0.2s ease, border-color 0.2s ease;
    }

    .action-card:hover {
      transform: translateY(-4px);
      border-color: #0f172a;
    }

    .card-hero-image {
      position: relative;
      height: 130px;
      background-color: #0f172a;
    }

    .card-hero-image img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .card-badge {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 0.3rem 0.65rem;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 800;
      color: #ffffff;
      text-transform: uppercase;
    }

    .badge-create { background-color: #10b981; }
    .badge-edit { background-color: #2563eb; }
    .badge-delete { background-color: #ef4444; }

    .card-content {
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
    }

    .card-heading {
      font-size: 1.15rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .card-description {
      font-size: 0.85rem;
      color: #475569;
      line-height: 1.45;
      margin: 0 0 1.25rem 0;
      flex-grow: 1;
    }

    /* INPUT E SELECT STILIZZATI */
    .select-wrapper { margin-bottom: 1rem; }

    .custom-select, .custom-input, .custom-textarea {
      width: 100%;
      padding: 0.7rem 0.9rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #0f172a;
      background-color: #ffffff;
      box-sizing: border-box;
      font-family: inherit;
    }

    .custom-select:focus, .custom-input:focus, .custom-textarea:focus {
      outline: none;
      border-color: #0f172a;
      box-shadow: 0 0 0 3px rgba(15, 23, 42, 0.08);
    }

    /* BOTTONI AZIONE */
    .btn-primary {
      width: 100%;
      padding: 0.75rem;
      background-color: #0f172a;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .btn-primary:hover { background-color: #1e293b; }
    .btn-primary:disabled { background-color: #cbd5e1; cursor: not-allowed; }

    .btn-secondary {
      width: 100%;
      padding: 0.75rem;
      background-color: #ffffff;
      color: #0f172a;
      border: 1.5px solid #0f172a;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .btn-secondary:hover { background-color: #f8fafc; }
    .btn-secondary:disabled { border-color: #cbd5e1; color: #94a3b8; cursor: not-allowed; }

    .btn-danger {
      width: 100%;
      padding: 0.75rem;
      background-color: #ef4444;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 0.9rem;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }
    .btn-danger:hover { background-color: #dc2626; }
    .btn-danger:disabled { background-color: #fca5a5; cursor: not-allowed; }

    /* FORM PANEL INLINE / CONFERMA ISCRIZIONE */
    .panel-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
    }

    .limit-status-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.25rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .status-label { font-size: 0.9rem; font-weight: 700; color: #334155; }
    .limit-number-badge { font-size: 0.9rem; font-weight: 800; color: #2563eb; background-color: #eff6ff; padding: 0.35rem 0.75rem; border-radius: 6px; }

    .inline-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
    .number-input { width: 100%; max-width: 160px; }

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .score-form { display: flex; flex-direction: column; gap: 1rem; }
    .full-btn { margin-top: 0.5rem; }

    /* MODALI */
    .modal-backdrop {
      position: fixed;
      top: 0; left: 0;
      width: 100vw; height: 100vh;
      background-color: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(4px);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.5rem;
    }

    .modal-form-card {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 2.25rem;
      max-width: 580px;
      width: 100%;
      position: relative;
      box-shadow: 0 20px 40px rgba(0,0,0,0.25);
      animation: modalFadeIn 0.25s ease-out;
    }

    .modal-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 1.5rem 0;
    }

    .modal-form { display: flex; flex-direction: column; gap: 1rem; }

    .modal-footer-btns {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .modal-close-x {
      position: absolute;
      top: 1rem; right: 1.25rem;
      background: none; border: none;
      font-size: 1.75rem; cursor: pointer; color: #64748b;
    }

    /* DIALOG CONFERMA */
    .confirm-dialog-card {
      background-color: #ffffff;
      border-radius: 16px;
      padding: 2.25rem;
      max-width: 420px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.25);
      animation: modalFadeIn 0.25s ease-out;
    }

    .dialog-icon-circle { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .dialog-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
    .dialog-text { font-size: 0.92rem; color: #475569; line-height: 1.5; margin-bottom: 1.75rem; }

    .dialog-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .btn-confirm-yes { padding: 0.75rem; background-color: #0f172a; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-confirm-no { padding: 0.75rem; background-color: #ffffff; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }

    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    @media (max-width: 960px) {
      .cards-triple-grid { grid-template-columns: 1fr; }
      .half-width { flex: 1 1 100%; }
    }
  `]
})
export class AdminComponent {
  private router = inject(Router);
  authService = inject(AuthService);

  // Elenco dei tornei caricati nel pannello (Entità TORNEO)
  tornei: Torneo[] = [
    {
      id: 1,
      nome: 'EA Sports FC 25 Championship',
      gioco: 'CALCIO E-SPORTS',
      modalita: 'IN SEDE',
      data_inizio: '2026-10-24',
      data_fine: '2026-10-26',
      descrizione: 'Sfida 1v1 su PlayStation 5 con eliminazione diretta.',
      immagine: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
      stato: 'aperto',
      posti_max: 32,
      posti_occupati: 14
    },
    {
      id: 2,
      nome: 'Rocket League E-Sports Cup',
      gioco: 'VEHICULAR SOCCER',
      modalita: 'ONLINE',
      data_inizio: '2026-10-31',
      data_fine: '2026-11-02',
      descrizione: 'Torneo 3v3 ad alta quota con server dedicati.',
      immagine: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=600&q=80',
      stato: 'max_raggiunto',
      posti_max: 16,
      posti_occupati: 16
    },
    {
      id: 3,
      nome: 'Valorant Tactical Showdown',
      gioco: 'FPS TATTICO 5v5',
      modalita: 'ONLINE',
      data_inizio: '2026-10-10',
      data_fine: '2026-10-16',
      descrizione: 'Scontri 5v5 con ban mappe e streaming semifinali.',
      immagine: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=600&q=80',
      stato: 'in_corso',
      posti_max: 20,
      posti_occupati: 20
    }
  ];

  // Elenco studenti per form punteggi
  studenti: Studente[] = [
    { id: 1, nome_completo: 'Mario Rossi' },
    { id: 2, nome_completo: 'Luigi Verdi' },
    { id: 3, nome_completo: 'Paolo Bianchi' },
    { id: 4, nome_completo: 'Giulia Neri' }
  ];

  // Modelli Form
  torneoDaModificareId: number | null = null;
  torneoDaEliminareId: number | null = null;

  moduloCreazione = {
    nome: '',
    immagine: '',
    descrizione: '',
    gioco: 'GAMING',
    data_inizio: '',
    data_fine: '',
    modalita: 'IN SEDE' as 'IN SEDE' | 'ONLINE',
    posti_max: 32
  };

  moduloModifica = {
    id: 0,
    nome: '',
    immagine: '',
    descrizione: '',
    gioco: 'GAMING',
    data_inizio: '',
    data_fine: '',
    modalita: 'IN SEDE' as 'IN SEDE' | 'ONLINE',
    posti_max: 32
  };

  datiPunteggio = {
    torneo_id: null as number | null,
    nome_studente: '',
    punti: ''
  };

  // Limite Iscrizioni Utente
  limiteMassimoIscrizioni = 3;
  limiteTemporaneoIscrizioni = 3;

  // Gestione Modali
  modalAttivo: 'modal_crea' | 'modal_modifica' | 'modal_conferma' | 'modal_successo' | null = null;
  tipoAzioneInSospeso: 'crea' | 'modifica' | 'elimina' | 'limite_iscrizioni' | null = null;
  
  testoDomandaConferma = '';
  testoFeedbackSuccesso = '';

  // Alias retrocompatibili
  get tournaments(): Torneo[] { return this.tornei; }
  get students(): Studente[] { return this.studenti; }
  get selectedTournamentToEditId(): number | null { return this.torneoDaModificareId; }
  set selectedTournamentToEditId(val: number | null) { this.torneoDaModificareId = val; }
  get selectedTournamentToDeleteId(): number | null { return this.torneoDaEliminareId; }
  set selectedTournamentToDeleteId(val: number | null) { this.torneoDaEliminareId = val; }
  get createForm() { return this.moduloCreazione; }
  get editForm() { return this.moduloModifica; }
  get scoreData() { return this.datiPunteggio; }
  get maxEnrollmentsLimit() { return this.limiteMassimoIscrizioni; }
  get tempMaxLimit() { return this.limiteTemporaneoIscrizioni; }
  set tempMaxLimit(v: number) { this.limiteTemporaneoIscrizioni = v; }
  get activeModal() { return this.modalAttivo; }

  // APERTURA MODAL FORM
  apriModalCreazione() {
    this.moduloCreazione = {
      nome: '',
      immagine: '',
      descrizione: '',
      gioco: 'GAMING',
      data_inizio: '',
      data_fine: '',
      modalita: 'IN SEDE',
      posti_max: 32
    };
    this.modalAttivo = 'modal_crea';
  }
  openCreateFormModal() { this.apriModalCreazione(); }

  apriModalModifica() {
    if (!this.torneoDaModificareId) return;
    const bersaglio = this.tornei.find(t => t.id === this.torneoDaModificareId);
    if (!bersaglio) return;

    this.moduloModifica = {
      id: bersaglio.id,
      nome: bersaglio.nome,
      immagine: bersaglio.immagine,
      descrizione: bersaglio.descrizione,
      gioco: bersaglio.gioco || 'GAMING',
      data_inizio: bersaglio.data_inizio,
      data_fine: bersaglio.data_fine,
      modalita: bersaglio.modalita,
      posti_max: bersaglio.posti_max || 32
    };
    this.modalAttivo = 'modal_modifica';
  }
  openEditFormModal() { this.apriModalModifica(); }

  // RICHIESTE CONFERMA CON POPUP
  chiediConfermaCreazione() {
    this.tipoAzioneInSospeso = 'crea';
    this.testoDomandaConferma = `Sei sicuro di voler creare il torneo "${this.moduloCreazione.nome}"?`;
    this.modalAttivo = 'modal_conferma';
  }
  askConfirmCreate() { this.chiediConfermaCreazione(); }

  chiediConfermaModifica() {
    this.tipoAzioneInSospeso = 'modifica';
    this.testoDomandaConferma = `Sei sicuro di voler salvare le modifiche per il torneo "${this.moduloModifica.nome}"?`;
    this.modalAttivo = 'modal_conferma';
  }
  askConfirmEdit() { this.chiediConfermaModifica(); }

  chiediConfermaEliminazione() {
    if (!this.torneoDaEliminareId) return;
    const bersaglio = this.tornei.find(t => t.id === this.torneoDaEliminareId);
    this.tipoAzioneInSospeso = 'elimina';
    this.testoDomandaConferma = `Sei sicuro di voler eliminare definitivamente il torneo "${bersaglio?.nome}"?`;
    this.modalAttivo = 'modal_conferma';
  }
  askConfirmDelete() { this.chiediConfermaEliminazione(); }

  chiediConfermaLimiteIscrizioni() {
    this.tipoAzioneInSospeso = 'limite_iscrizioni';
    this.testoDomandaConferma = `Sei sicuro di voler modificare il numero massimo di iscrizioni per utente a ${this.limiteTemporaneoIscrizioni}?`;
    this.modalAttivo = 'modal_conferma';
  }
  askConfirmMaxEnrollments() { this.chiediConfermaLimiteIscrizioni(); }

  // ESECUZIONE EFFETTIVA DELL'AZIONE CONFERMATA
  eseguiAzioneConfermata() {
    if (this.tipoAzioneInSospeso === 'crea') {
      const nuovoTorneo: Torneo = {
        id: Date.now(),
        nome: this.moduloCreazione.nome,
        gioco: this.moduloCreazione.gioco,
        modalita: this.moduloCreazione.modalita,
        data_inizio: this.moduloCreazione.data_inizio,
        data_fine: this.moduloCreazione.data_fine,
        descrizione: this.moduloCreazione.descrizione,
        immagine: this.moduloCreazione.immagine || 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=600&q=80',
        stato: 'aperto',
        posti_max: this.moduloCreazione.posti_max || 32,
        posti_occupati: 0
      };
      this.tornei.push(nuovoTorneo);
      this.testoFeedbackSuccesso = 'Torneo creato con successo!';
    } 
    else if (this.tipoAzioneInSospeso === 'modifica') {
      const indice = this.tornei.findIndex(t => t.id === this.moduloModifica.id);
      if (indice !== -1) {
        this.tornei[indice] = {
          ...this.tornei[indice],
          nome: this.moduloModifica.nome,
          immagine: this.moduloModifica.immagine,
          descrizione: this.moduloModifica.descrizione,
          data_inizio: this.moduloModifica.data_inizio,
          data_fine: this.moduloModifica.data_fine,
          modalita: this.moduloModifica.modalita
        };
      }
      this.testoFeedbackSuccesso = 'Torneo modificato con successo!';
    } 
    else if (this.tipoAzioneInSospeso === 'elimina') {
      this.tornei = this.tornei.filter(t => t.id !== this.torneoDaEliminareId);
      this.torneoDaEliminareId = null;
      this.testoFeedbackSuccesso = 'Torneo eliminato con successo!';
    }
    else if (this.tipoAzioneInSospeso === 'limite_iscrizioni') {
      this.limiteMassimoIscrizioni = this.limiteTemporaneoIscrizioni;
      this.testoFeedbackSuccesso = 'Numero iscrizioni massime per utente modificato con successo!';
    }

    this.tipoAzioneInSospeso = null;
    this.modalAttivo = 'modal_successo';
  }
  executeConfirmedAction() { this.eseguiAzioneConfermata(); }

  // SALVATAGGIO PUNTEGGI
  salvaPunteggio() {
    const t = this.tornei.find(tour => tour.id === this.datiPunteggio.torneo_id);
    if (t) {
      this.authService.aggiungiRisultato({
        id: Date.now(),
        torneo_id: t.id,
        nome_torneo: t.nome,
        data_svolgimento: `${t.data_inizio} - ${t.data_fine}`,
        nome_studente: this.datiPunteggio.nome_studente,
        punti: this.datiPunteggio.punti
      });
    }
    this.testoFeedbackSuccesso = `Punteggio (${this.datiPunteggio.punti}) assegnato con successo a ${this.datiPunteggio.nome_studente} per il torneo "${t?.nome}"!`;
    this.modalAttivo = 'modal_successo';
    this.datiPunteggio = { torneo_id: null, nome_studente: '', punti: '' };
  }
  saveScore() { this.salvaPunteggio(); }

  chiudiModal() {
    this.modalAttivo = null;
  }
  closeModal() { this.chiudiModal(); }
}