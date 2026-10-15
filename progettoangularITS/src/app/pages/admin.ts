import { Component, inject, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { TournamentService, Torneo } from '../services/tournament.service';
import { environment } from '../../environments/environment';

export interface Studente {
  id: number;
  nome: string;
  cognome: string;
  email: string;
  nome_completo?: string;
}

export interface StudenteInCoda {
  iscrizione_id: number;
  utente_id: number;
  nome: string;
  cognome: string;
  email: string;
  torneo_id: number;
  torneo_nome: string;
  posti_max: number;
  posti_occupati: number;
  posti_disponibili: number;
  posizione_coda: number;
  stato_torneo: string;
}

/** Formatta "YYYY-MM-DD" → "YYYY-MM-DD" (valore già corretto per input[type=date]) */
function toInputDate(val: string | null | undefined): string {
  if (!val) return '';
  return String(val).substring(0, 10);
}

/** Formatta la posizione in coda in italiano (es. 1° (Primo in coda)) */
function formattaPosizioneCoda(pos: number | null | undefined): string {
  const p = Number(pos) || 1;
  const nomi = [
    '', 'Primo', 'Secondo', 'Terzo', 'Quarto', 'Quinto',
    'Sesto', 'Settimo', 'Ottavo', 'Nono', 'Decimo'
  ];
  if (p >= 1 && p <= 10) {
    return `${p}° (${nomi[p]} in coda)`;
  }
  return `${p}° in coda`;
}

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
            <h1 class="page-title">Dashboard Amministratore</h1>
          </div>
          <div class="current-badge">⚡ Ruolo: Admin</div>
        </div>
      </header>

      <!-- BANNER ERRORE / SUCCESSO -->
      @if (messaggioErrore()) {
        <div class="error-banner">⚠️ {{ messaggioErrore() }}</div>
      }
      @if (messaggioSuccesso()) {
        <div class="success-banner">✅ {{ messaggioSuccesso() }}</div>
      }

      <!-- GRIGLIA PRINCIPALE GESTIONE -->
      <div class="admin-grid">

        <!-- 1. SEZIONE GESTIONE TORNEI -->
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
                <p class="card-description">Imposta titolo, gioco, date di svolgimento, modalità e immagine di copertina.</p>
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
                <p class="card-description">Seleziona un torneo esistente per aggiornarne i dettagli o le date.</p>

                <div class="select-wrapper">
                  <select [(ngModel)]="torneoDaModificareId" name="selectModifica" class="custom-select">
                    <option [ngValue]="null">-- Seleziona un torneo --</option>
                    @for (t of tornei(); track t.id) {
                      <option [ngValue]="t.id">{{ t.nome }}</option>
                    }
                  </select>
                </div>

                <button
                  type="button"
                  class="btn-secondary"
                  [disabled]="!torneoDaModificareId || caricamentoTornei()"
                  (click)="apriModalModifica()"
                >
                  Modifica Torneo
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
                <p class="card-description">Seleziona un torneo da rimuovere definitivamente dal sistema.</p>

                <div class="select-wrapper">
                  <select [(ngModel)]="torneoDaEliminareId" name="selectElimina" class="custom-select">
                    <option [ngValue]="null">-- Seleziona un torneo --</option>
                    @for (t of tornei(); track t.id) {
                      <option [ngValue]="t.id">{{ t.nome }}</option>
                    }
                  </select>
                </div>

                <button
                  type="button"
                  class="btn-danger"
                  [disabled]="!torneoDaEliminareId || caricamentoTornei()"
                  (click)="chiediConfermaEliminazione()"
                >
                  Elimina Torneo
                </button>
              </div>
            </div>

          </div>
        </section>

        <!-- 2. SEZIONE LIMITE ISCRIZIONI PER UTENTE -->
        <section class="admin-card-section half-width">
          <div class="section-title-box">
            <h2 class="section-title">Limite Iscrizioni per Utente</h2>
            <p class="section-subtitle">Imposta il numero massimo di tornei a cui un singolo studente può iscriversi contemporaneamente.</p>
          </div>

          <div class="panel-box">
            <div class="limit-status-row">
              <span class="status-label">Limite attuale:</span>
              <span class="limit-number-badge">{{ limiteMassimoIscrizioni() }} tornei max</span>
            </div>

            <form (ngSubmit)="chiediConfermaLimiteIscrizioni()" class="inline-form">
              <div class="form-group">
                <label for="maxEnrollmentsInput">Nuovo numero massimo di iscrizioni per utente:</label>
                <input
                  type="number"
                  id="maxEnrollmentsInput"
                  name="maxEnrollmentsInput"
                  [(ngModel)]="limiteTemporaneoIscrizioni"
                  min="1"
                  max="20"
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
            <p class="section-subtitle">Assegna punteggi e risultati agli studenti partecipanti ai tornei.</p>
          </div>

          <div class="panel-box">
            <form (ngSubmit)="salvaPunteggio()" class="score-form">

              <!-- Seleziona Torneo -->
              <div class="form-group">
                <label for="scoreTournament">Seleziona Torneo:</label>
                <select id="scoreTournament" name="scoreTournament" [(ngModel)]="datiPunteggio.torneo_id" required class="custom-select">
                  <option [ngValue]="null">-- Scegli torneo --</option>
                  @for (t of tornei(); track t.id) {
                    <option [ngValue]="t.id">{{ t.nome }}</option>
                  }
                </select>
              </div>

              <!-- Seleziona Studente -->
              <div class="form-group">
                <label for="scoreStudent">Seleziona Studente:</label>
                <select id="scoreStudent" name="scoreStudent" [(ngModel)]="datiPunteggio.utente_id" required class="custom-select">
                  <option [ngValue]="null">-- Scegli studente --</option>
                  @for (s of studenti(); track s.id) {
                    <option [ngValue]="s.id">{{ s.nome_completo || (s.nome + ' ' + s.cognome) }}</option>
                  }
                </select>
              </div>

              <!-- Punteggio -->
              <div class="form-group">
                <label for="scoreValue">Punteggio conseguito:</label>
                <input
                  type="number"
                  id="scoreValue"
                  name="scoreValue"
                  [(ngModel)]="datiPunteggio.punti"
                  placeholder="Es. 450"
                  required
                  class="custom-input"
                />
              </div>

              <!-- Posizione -->
              <div class="form-group">
                <label for="scorePos">Posizione in classifica:</label>
                <input
                  type="number"
                  id="scorePos"
                  name="scorePos"
                  [(ngModel)]="datiPunteggio.posizione"
                  placeholder="Es. 1"
                  min="1"
                  class="custom-input"
                />
              </div>

              <button type="submit" class="btn-primary full-btn" [disabled]="!datiPunteggio.torneo_id || !datiPunteggio.utente_id || salvataggioInCorso()">
                {{ salvataggioInCorso() ? 'Salvataggio...' : 'Inserisci punteggio' }}
              </button>
            </form>
          </div>
        </section>

      </div>

      <!-- 4. SEZIONE LISTA D'ATTESA (CODA) -->
      <div class="admin-grid">
        <section class="admin-card-section full-width">
          <div class="section-title-box">
            <h2 class="section-title">Studenti in Lista d'Attesa 🟡</h2>
            <p class="section-subtitle">Studenti in coda per tornei al completo. Puoi iscriverli direttamente (aumentando di 1 i posti del torneo) o rifiutare la richiesta.</p>
          </div>

          @if (caricamentoCoda()) {
            <div class="loading-coda">⏳ Caricamento lista d'attesa...</div>
          } @else if (studentiInCoda().length === 0) {
            <div class="empty-coda">
              <span>✅</span>
              <p>Nessuno studente in lista d'attesa al momento.</p>
            </div>
          } @else {
            <div class="coda-table-wrapper">
              <table class="coda-table">
                <thead>
                  <tr>
                    <th>Studente</th>
                    <th>Email</th>
                    <th>Torneo</th>
                    <th>Posizione in coda</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  @for (s of studentiInCoda(); track s.iscrizione_id) {
                    <tr>
                      <td class="td-nome">{{ s.nome }} {{ s.cognome }}</td>
                      <td class="td-email">{{ s.email }}</td>
                      <td class="td-torneo">{{ s.torneo_nome }}</td>
                      <td class="td-pos">
                        <span class="pos-badge">{{ formattaPosizioneCoda(s.posizione_coda) }}</span>
                      </td>
                      <td class="td-azioni">
                        <button
                          type="button"
                          class="btn-approva"
                          [disabled]="azioneInCorso() === s.iscrizione_id"
                          (click)="approvaIscrizione(s)"
                          title="Iscrivi al torneo"
                        >
                          {{ azioneInCorso() === s.iscrizione_id ? 'Iscrizione...' : '✓ Iscrivi al torneo' }}
                        </button>
                        <button
                          type="button"
                          class="btn-rifiuta"
                          [disabled]="azioneInCorso() === s.iscrizione_id"
                          (click)="rifiutaIscrizione(s)"
                          title="Rifiuta iscrizione"
                        >
                          {{ azioneInCorso() === s.iscrizione_id ? '...' : '✕ Rifiuta iscrizione' }}
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </section>
      </div>
    </div>

    <!-- ===== MODAL 1: CREA TORNEO ===== -->
    @if (modalAttivo() === 'modal_crea') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="modal-form-card" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close-x" (click)="chiudiModal()">&times;</button>
          <h2 class="modal-title">Crea Nuovo Torneo</h2>

          <form (ngSubmit)="eseguiCreazioneConferma()" class="modal-form" #formCrea="ngForm">
            <div class="form-group">
              <label for="createTitle">Titolo Torneo: *</label>
              <input type="text" id="createTitle" name="createTitle" [(ngModel)]="moduloCreazione.nome" required placeholder="Es. EA Sports FC 25 Campus" class="custom-input" />
            </div>

            <div class="form-group">
              <label for="createGame">Gioco / Disciplina: *</label>
              <input type="text" id="createGame" name="createGame" [(ngModel)]="moduloCreazione.gioco" required placeholder="Es. CALCIO E-SPORTS" class="custom-input" />
            </div>

            <div class="form-group">
              <label for="createImage">Immagine Copertina (URL):</label>
              <input type="url" id="createImage" name="createImage" [(ngModel)]="moduloCreazione.immagine" placeholder="https://..." class="custom-input" />
            </div>

            <div class="form-group">
              <label for="createDesc">Descrizione:</label>
              <textarea id="createDesc" name="createDesc" [(ngModel)]="moduloCreazione.descrizione" rows="3" placeholder="Inserisci i dettagli ed il regolamento..." class="custom-textarea"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="createStartDate">Data Inizio: *</label>
                <input type="date" id="createStartDate" name="createStartDate" [(ngModel)]="moduloCreazione.data_inizio" required class="custom-input" />
              </div>

              <div class="form-group">
                <label for="createEndDate">Data Fine: *</label>
                <input type="date" id="createEndDate" name="createEndDate" [(ngModel)]="moduloCreazione.data_fine" required class="custom-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="createLocation">Modalità:</label>
                <select id="createLocation" name="createLocation" [(ngModel)]="moduloCreazione.modalita" class="custom-select">
                  <option value="IN SEDE">IN SEDE (Laboratori ITS)</option>
                  <option value="ONLINE">ONLINE</option>
                </select>
              </div>

              <div class="form-group">
                <label for="createPosti">Posti massimi:</label>
                <input type="number" id="createPosti" name="createPosti" [(ngModel)]="moduloCreazione.posti_max" min="2" max="512" class="custom-input" />
              </div>
            </div>

            <div class="modal-footer-btns">
              <button type="submit" class="btn-primary" [disabled]="invioInCorso() || !formCrea.valid">
                {{ invioInCorso() ? 'Salvataggio...' : 'Crea Torneo' }}
              </button>
              <button type="button" class="btn-secondary" (click)="chiudiModal()">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ===== MODAL 2: MODIFICA TORNEO ===== -->
    @if (modalAttivo() === 'modal_modifica') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="modal-form-card" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close-x" (click)="chiudiModal()">&times;</button>
          <h2 class="modal-title">Modifica Torneo</h2>

          <form (ngSubmit)="eseguiModificaConferma()" class="modal-form" #formModifica="ngForm">
            <div class="form-group">
              <label for="editTitle">Titolo Torneo: *</label>
              <input type="text" id="editTitle" name="editTitle" [(ngModel)]="moduloModifica.nome" required class="custom-input" />
            </div>

            <div class="form-group">
              <label for="editGame">Gioco / Disciplina: *</label>
              <input type="text" id="editGame" name="editGame" [(ngModel)]="moduloModifica.gioco" required class="custom-input" />
            </div>

            <div class="form-group">
              <label for="editImage">Immagine Copertina (URL):</label>
              <input type="text" id="editImage" name="editImage" [(ngModel)]="moduloModifica.immagine" class="custom-input" />
            </div>

            <div class="form-group">
              <label for="editDesc">Descrizione:</label>
              <textarea id="editDesc" name="editDesc" [(ngModel)]="moduloModifica.descrizione" rows="3" class="custom-textarea"></textarea>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editStartDate">Data Inizio: *</label>
                <input type="date" id="editStartDate" name="editStartDate" [(ngModel)]="moduloModifica.data_inizio" required class="custom-input" />
              </div>

              <div class="form-group">
                <label for="editEndDate">Data Fine: *</label>
                <input type="date" id="editEndDate" name="editEndDate" [(ngModel)]="moduloModifica.data_fine" required class="custom-input" />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="editLocation">Modalità:</label>
                <select id="editLocation" name="editLocation" [(ngModel)]="moduloModifica.modalita" class="custom-select">
                  <option value="IN SEDE">IN SEDE (Laboratori ITS)</option>
                  <option value="ONLINE">ONLINE</option>
                </select>
              </div>

              <div class="form-group">
                <label for="editPosti">Posti massimi:</label>
                <input type="number" id="editPosti" name="editPosti" [(ngModel)]="moduloModifica.posti_max" min="2" max="512" class="custom-input" />
              </div>
            </div>

            <div class="form-group">
              <label for="editStato">Stato del torneo:</label>
              <select id="editStato" name="editStato" [(ngModel)]="moduloModifica.stato" class="custom-select">
                <option value="Aperto">Aperto</option>
                <option value="In Corso">In Corso</option>
                <option value="Chiuso">Chiuso</option>
                <option value="Concluso">Concluso</option>
                <option value="Cancellato">Cancellato</option>
              </select>
            </div>

            <div class="modal-footer-btns">
              <button type="submit" class="btn-primary" [disabled]="invioInCorso() || !formModifica.valid">
                {{ invioInCorso() ? 'Salvataggio...' : 'Salva Torneo' }}
              </button>
              <button type="button" class="btn-secondary" (click)="chiudiModal()">Annulla</button>
            </div>
          </form>
        </div>
      </div>
    }

    <!-- ===== MODAL 3: CONFERMA ELIMINAZIONE ===== -->
    @if (modalAttivo() === 'modal_conferma_elimina') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="confirm-dialog-card" (click)="$event.stopPropagation()">
          <div class="dialog-icon-circle">🗑️</div>
          <h3 class="dialog-title">Conferma Eliminazione</h3>
          <p class="dialog-text">{{ testoDomandaConferma() }}</p>

          <div class="dialog-buttons">
            <button type="button" class="btn-confirm-danger" [disabled]="invioInCorso()" (click)="eseguiEliminazione()">
              {{ invioInCorso() ? 'Eliminazione...' : 'Sì, Elimina Torneo' }}
            </button>
            <button type="button" class="btn-confirm-no" (click)="chiudiModal()">Annulla</button>
          </div>
        </div>
      </div>
    }

    <!-- ===== MODAL 4: CONFERMA LIMITE ISCRIZIONI ===== -->
    @if (modalAttivo() === 'modal_conferma_limite') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="confirm-dialog-card" (click)="$event.stopPropagation()">
          <div class="dialog-icon-circle">⚙️</div>
          <h3 class="dialog-title">Conferma Impostazione</h3>
          <p class="dialog-text">{{ testoDomandaConferma() }}</p>

          <div class="dialog-buttons">
            <button type="button" class="btn-confirm-yes" (click)="eseguiAggiornamentoLimite()">Sì, Applica</button>
            <button type="button" class="btn-confirm-no" (click)="chiudiModal()">Annulla</button>
          </div>
        </div>
      </div>
    }

    <!-- ===== MODAL 5: OPERAZIONE COMPLETATA (CREA, MODIFICA, ELIMINA, PUNTEGGIO) ===== -->
    @if (modalAttivo() === 'modal_successo') {
      <div class="modal-backdrop" (click)="chiudiModal()">
        <div class="confirm-dialog-card" (click)="$event.stopPropagation()">
          <div class="dialog-icon-circle success-icon">✅</div>
          <h3 class="dialog-title">{{ titoloFeedbackSuccesso() }}</h3>
          <p class="dialog-text">{{ testoFeedbackSuccesso() }}</p>

          <button type="button" class="btn-primary full-btn" (click)="chiudiModal()">
            Torna alla dashboard
          </button>
        </div>
      </div>
    }
  `,
  styles: [`
    .admin-page-container { max-width: 1200px; margin: 0 auto; padding: 2.5rem 2rem 5rem 2rem; }
    .admin-header { margin-bottom: 2.5rem; }
    .header-main { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 1rem; padding-bottom: 1.5rem; border-bottom: 1.5px solid #e2e8f0; }
    .admin-tag { font-size: 0.75rem; font-weight: 800; color: #2563eb; letter-spacing: 0.08em; text-transform: uppercase; display: block; margin-bottom: 0.4rem; }
    .page-title { font-size: 2.25rem; font-weight: 800; color: #0f172a; margin: 0; }
    .current-badge { background-color: #0f172a; color: #ffffff; padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; }

    .error-banner { background-color: #fef2f2; border: 1px solid #fecaca; color: #dc2626; padding: 0.75rem 1rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }
    .success-banner { background-color: #ecfdf5; border: 1px solid #a7f3d0; color: #065f46; padding: 0.75rem 1rem; border-radius: 8px; text-align: center; margin-bottom: 1.5rem; }

    .admin-grid { display: flex; flex-wrap: wrap; gap: 2rem; }
    .admin-card-section { background-color: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 2rem; box-shadow: 0 4px 14px rgba(0,0,0,0.03); }
    .full-width { width: 100%; box-sizing: border-box; }
    .half-width { flex: 1 1 calc(50% - 1rem); min-width: 320px; box-sizing: border-box; }

    .section-title-box { margin-bottom: 1.5rem; }
    .section-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 0.35rem 0; }
    .section-subtitle { font-size: 0.9rem; color: #64748b; margin: 0; }

    .cards-triple-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .action-card { background-color: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 12px; overflow: hidden; display: flex; flex-direction: column; }
    .card-hero-image { position: relative; height: 130px; background-color: #0f172a; flex-shrink: 0; }
    .card-hero-image img { width: 100%; height: 100%; object-fit: cover; }
    .card-badge { position: absolute; top: 10px; left: 10px; padding: 0.3rem 0.65rem; border-radius: 6px; font-size: 0.72rem; font-weight: 800; color: #ffffff; text-transform: uppercase; }
    .badge-create { background-color: #10b981; }
    .badge-edit { background-color: #2563eb; }
    .badge-delete { background-color: #ef4444; }

    .card-content { padding: 1.25rem; display: flex; flex-direction: column; flex-grow: 1; gap: 0.75rem; }
    .card-heading { font-size: 1.1rem; font-weight: 800; color: #0f172a; margin: 0; }
    .card-description { font-size: 0.85rem; color: #475569; line-height: 1.45; margin: 0; flex-grow: 1; }

    .select-wrapper { }
    .custom-select, .custom-input, .custom-textarea {
      width: 100%; padding: 0.7rem 0.9rem; border: 1.5px solid #cbd5e1; border-radius: 8px;
      font-size: 0.9rem; color: #0f172a; background-color: #ffffff; box-sizing: border-box;
      font-family: inherit; appearance: auto;
    }
    .custom-select:focus, .custom-input:focus, .custom-textarea:focus {
      outline: none; border-color: #0f172a;
    }

    .btn-primary { width: 100%; padding: 0.75rem; background-color: #0f172a; color: #ffffff; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .btn-primary:disabled { background-color: #94a3b8; cursor: not-allowed; }
    .btn-secondary { width: 100%; padding: 0.75rem; background-color: #ffffff; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .btn-secondary:disabled { border-color: #cbd5e1; color: #94a3b8; cursor: not-allowed; }
    .btn-danger { width: 100%; padding: 0.75rem; background-color: #ef4444; color: #ffffff; border: none; border-radius: 8px; font-size: 0.9rem; font-weight: 700; cursor: pointer; }
    .btn-danger:disabled { background-color: #fca5a5; cursor: not-allowed; }
    .full-btn { width: 100%; }

    .panel-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 1.5rem; }
    .limit-status-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; padding-bottom: 1rem; border-bottom: 1px solid #e2e8f0; }
    .status-label { font-size: 0.9rem; font-weight: 700; color: #334155; }
    .limit-number-badge { font-size: 0.9rem; font-weight: 800; color: #2563eb; background-color: #eff6ff; padding: 0.35rem 0.75rem; border-radius: 6px; }
    .number-input { max-width: 120px; }

    .inline-form, .score-form { display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .form-group label { font-size: 0.85rem; font-weight: 700; color: #0f172a; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }

    /* MODALI CON SCROLL */
    .modal-backdrop {
      position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
      background-color: rgba(15, 23, 42, 0.65); backdrop-filter: blur(4px);
      z-index: 2000; display: flex; align-items: flex-start; justify-content: center;
      padding: 2rem 1.5rem; overflow-y: auto;
    }
    .modal-form-card {
      background-color: #ffffff; border-radius: 16px; padding: 2.25rem;
      max-width: 600px; width: 100%; position: relative; margin: auto;
    }
    .modal-title { font-size: 1.6rem; font-weight: 800; color: #0f172a; margin: 0 0 1.5rem 0; }
    .modal-form { display: flex; flex-direction: column; gap: 1rem; }
    .modal-footer-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-top: 0.5rem; }
    .modal-close-x { position: absolute; top: 1rem; right: 1.25rem; background: none; border: none; font-size: 1.75rem; cursor: pointer; color: #64748b; line-height: 1; }

    .confirm-dialog-card {
      background-color: #ffffff; border-radius: 16px; padding: 2.25rem;
      max-width: 440px; width: 100%; text-align: center; margin: auto;
    }
    .dialog-icon-circle { font-size: 2.5rem; margin-bottom: 0.5rem; }
    .success-icon { }
    .dialog-title { font-size: 1.4rem; font-weight: 800; color: #0f172a; margin: 0 0 0.5rem 0; }
    .dialog-text { font-size: 0.92rem; color: #475569; line-height: 1.5; margin-bottom: 1.75rem; }
    .dialog-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .btn-confirm-yes { padding: 0.75rem; background-color: #0f172a; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-confirm-danger { padding: 0.75rem; background-color: #ef4444; color: #ffffff; border: none; border-radius: 8px; font-weight: 700; cursor: pointer; }
    .btn-confirm-danger:disabled { background-color: #fca5a5; cursor: not-allowed; }
    .btn-confirm-no { padding: 0.75rem; background-color: #ffffff; color: #0f172a; border: 1.5px solid #0f172a; border-radius: 8px; font-weight: 700; cursor: pointer; }

    @media (max-width: 960px) {
      .cards-triple-grid { grid-template-columns: 1fr; }
      .half-width { flex: 1 1 100%; }
    }

    /* LISTA D'ATTESA */
    .loading-coda { text-align: center; padding: 2rem; color: #64748b; }
    .empty-coda { text-align: center; padding: 2.5rem; background: #f8fafc; border-radius: 12px; border: 1.5px dashed #cbd5e1; }
    .empty-coda span { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .empty-coda p { color: #64748b; margin: 0; }

    .coda-table-wrapper { overflow-x: auto; border-radius: 10px; border: 1.5px solid #e2e8f0; }
    .coda-table { width: 100%; border-collapse: collapse; font-size: 0.88rem; }
    .coda-table thead { background: #0f172a; color: #ffffff; }
    .coda-table thead th { padding: 0.85rem 1rem; text-align: left; font-weight: 700; font-size: 0.8rem; letter-spacing: 0.05em; text-transform: uppercase; white-space: nowrap; }
    .coda-table tbody tr { border-bottom: 1px solid #f1f5f9; transition: background 0.15s; }
    .coda-table tbody tr:last-child { border-bottom: none; }
    .coda-table tbody tr:hover { background: #f8fafc; }
    .coda-table td { padding: 0.85rem 1rem; color: #334155; vertical-align: middle; }
    .td-nome { font-weight: 700; color: #0f172a; }
    .td-email { font-size: 0.82rem; color: #64748b; }
    .td-torneo { font-weight: 600; }
    .td-pos { text-align: center; }
    .pos-badge { display: inline-block; background: #eff6ff; color: #1d4ed8; font-weight: 800; padding: 0.25rem 0.65rem; border-radius: 6px; font-size: 0.82rem; }
    .posti-badge { display: inline-block; padding: 0.25rem 0.65rem; border-radius: 6px; font-weight: 700; font-size: 0.8rem; }
    .posti-ok { background: #ecfdf5; color: #065f46; }
    .posti-zero { background: #fef2f2; color: #dc2626; }
    .td-azioni { display: flex; gap: 0.5rem; flex-wrap: nowrap; }
    .btn-approva { padding: 0.45rem 0.85rem; background: #10b981; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.82rem; white-space: nowrap; }
    .btn-approva:disabled { background: #a7f3d0; cursor: not-allowed; }
    .btn-rifiuta { padding: 0.45rem 0.85rem; background: #ef4444; color: white; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; font-size: 0.82rem; white-space: nowrap; }
    .btn-rifiuta:disabled { background: #fca5a5; cursor: not-allowed; }
  `]
})
export class AdminComponent implements OnInit {
  private http = inject(HttpClient);
  private tournamentService = inject(TournamentService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  authService = inject(AuthService);

  tornei = signal<Torneo[]>([]);
  studenti = signal<Studente[]>([]);
  studentiInCoda = signal<StudenteInCoda[]>([]);
  caricamentoCoda = signal(false);
  azioneInCorso = signal<number | null>(null);

  messaggioErrore = signal('');
  messaggioSuccesso = signal('');
  caricamentoTornei = signal(false);
  invioInCorso = signal(false);
  salvataggioInCorso = signal(false);

  torneoDaModificareId: number | null = null;
  torneoDaEliminareId: number | null = null;

  moduloCreazione = this.creaModuloVuoto();
  moduloModifica = { id: 0, ...this.creaModuloVuoto(), stato: 'Aperto' as string };

  datiPunteggio = {
    torneo_id: null as number | null,
    utente_id: null as number | null,
    punti: 0,
    posizione: 1
  };

  limiteMassimoIscrizioni = signal(3);
  limiteTemporaneoIscrizioni = 3;

  modalAttivo = signal<string | null>(null);
  testoDomandaConferma = signal('');
  titoloFeedbackSuccesso = signal('');
  testoFeedbackSuccesso = signal('');

  formattaPosizioneCoda = formattaPosizioneCoda;

  private creaModuloVuoto() {
    return {
      nome: '',
      immagine: '',
      descrizione: '',
      gioco: '',
      data_inizio: '',
      data_fine: '',
      modalita: 'IN SEDE' as 'IN SEDE' | 'ONLINE',
      posti_max: 32
    };
  }

  ngOnInit() {
    this.caricaTornei();
    this.caricaStudenti();
    this.caricaCoda();
    // Carica il limite salvato in localStorage
    const saved = localStorage.getItem('limite_iscrizioni_admin');
    if (saved) {
      const val = Number(saved);
      this.limiteMassimoIscrizioni.set(val);
      this.limiteTemporaneoIscrizioni = val;
    }
  }

  private getHeaders() {
    const token = localStorage.getItem('auth_token');
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  private mostraBanner(tipo: 'errore' | 'successo', testo: string) {
    if (tipo === 'errore') {
      this.messaggioErrore.set(testo);
      this.messaggioSuccesso.set('');
    } else {
      this.messaggioSuccesso.set(testo);
      this.messaggioErrore.set('');
    }
    this.cdr.markForCheck();
    setTimeout(() => {
      this.messaggioErrore.set('');
      this.messaggioSuccesso.set('');
      this.cdr.markForCheck();
    }, 4000);
  }

  caricaTornei() {
    this.caricamentoTornei.set(true);
    this.cdr.markForCheck();
    this.tournamentService.getTornei().subscribe({
      next: (data) => {
        this.tornei.set(data);
        this.caricamentoTornei.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.mostraBanner('errore', 'Errore nel caricamento dei tornei dal backend.');
        this.caricamentoTornei.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  caricaStudenti() {
    this.http.get<Studente[]>(`${environment.apiUrl}/admin/utenti`, this.getHeaders()).subscribe({
      next: (data) => {
        this.studenti.set(data);
        this.cdr.markForCheck();
      },
      error: (err) => console.error('Errore caricamento studenti:', err)
    });
  }

  caricaCoda() {
    this.caricamentoCoda.set(true);
    this.cdr.markForCheck();
    this.http.get<StudenteInCoda[]>(`${environment.apiUrl}/admin/coda`, this.getHeaders()).subscribe({
      next: (data) => {
        this.studentiInCoda.set(data);
        this.caricamentoCoda.set(false);
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Errore caricamento coda:', err);
        this.caricamentoCoda.set(false);
        this.cdr.markForCheck();
      }
    });
  }

  approvaIscrizione(s: StudenteInCoda) {
    if (this.azioneInCorso() === s.iscrizione_id) return;
    this.azioneInCorso.set(s.iscrizione_id);
    this.cdr.markForCheck();
    this.http.post(
      `${environment.apiUrl}/admin/iscrizioni/${s.iscrizione_id}/approva`,
      {},
      this.getHeaders()
    ).subscribe({
      next: () => {
        this.azioneInCorso.set(null);
        this.caricaCoda();
        this.caricaTornei();
        this.titoloFeedbackSuccesso.set('Iscrizione confermata');
        this.testoFeedbackSuccesso.set(`Lo studente ${s.nome} ${s.cognome} è stato iscritto al torneo "${s.torneo_nome}". Il limite di iscritti del torneo è stato aumentato automaticamente.`);
        this.modalAttivo.set('modal_successo');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.azioneInCorso.set(null);
        this.mostraBanner('errore', err.error?.error || 'Errore durante l\'iscrizione.');
        this.cdr.markForCheck();
      }
    });
  }

  rifiutaIscrizione(s: StudenteInCoda) {
    if (this.azioneInCorso() === s.iscrizione_id) return;
    this.azioneInCorso.set(s.iscrizione_id);
    this.cdr.markForCheck();
    this.http.delete(
      `${environment.apiUrl}/admin/iscrizioni/${s.iscrizione_id}`,
      this.getHeaders()
    ).subscribe({
      next: () => {
        this.azioneInCorso.set(null);
        this.caricaCoda();
        this.mostraBanner('successo', `Iscrizione di ${s.nome} ${s.cognome} rimossa dalla lista d'attesa.`);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.azioneInCorso.set(null);
        this.mostraBanner('errore', err.error?.error || 'Errore durante il rifiuto.');
        this.cdr.markForCheck();
      }
    });
  }

  // APERTURA MODAL CREAZIONE
  apriModalCreazione() {
    this.moduloCreazione = this.creaModuloVuoto();
    this.invioInCorso.set(false);
    this.modalAttivo.set('modal_crea');
    this.cdr.markForCheck();
  }

  // APERTURA MODAL MODIFICA
  apriModalModifica() {
    if (!this.torneoDaModificareId) return;
    const bersaglio = this.tornei().find(t => t.id === this.torneoDaModificareId);
    if (!bersaglio) return;

    this.moduloModifica = {
      id: bersaglio.id,
      nome: bersaglio.nome || '',
      immagine: bersaglio.immagine || '',
      descrizione: bersaglio.descrizione || '',
      gioco: bersaglio.gioco || '',
      data_inizio: toInputDate(bersaglio.data_inizio),
      data_fine: toInputDate(bersaglio.data_fine),
      modalita: (bersaglio.modalita || 'IN SEDE') as 'IN SEDE' | 'ONLINE',
      posti_max: bersaglio.posti_max || 32,
      stato: bersaglio.stato || 'Aperto'
    };
    this.invioInCorso.set(false);
    this.modalAttivo.set('modal_modifica');
    this.cdr.markForCheck();
  }

  // CREAZIONE TORNEO
  eseguiCreazioneConferma() {
    if (this.invioInCorso()) return; // evita doppio submit
    if (!this.moduloCreazione.nome?.trim() || !this.moduloCreazione.gioco?.trim() ||
        !this.moduloCreazione.data_inizio || !this.moduloCreazione.data_fine) {
      this.mostraBanner('errore', 'Compila tutti i campi obbligatori (*).');
      return;
    }

    this.invioInCorso.set(true);
    this.cdr.markForCheck();
    this.http.post(`${environment.apiUrl}/admin/tornei`, this.moduloCreazione, this.getHeaders()).subscribe({
      next: () => {
        this.invioInCorso.set(false);
        this.caricaTornei();
        this.titoloFeedbackSuccesso.set('Torneo creato con successo');
        this.testoFeedbackSuccesso.set(`Il torneo "${this.moduloCreazione.nome}" è stato creato correttamente ed è ora visibile.`);
        this.modalAttivo.set('modal_successo');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.invioInCorso.set(false);
        this.mostraBanner('errore', err.error?.error || 'Errore durante la creazione del torneo.');
        this.cdr.markForCheck();
      }
    });
  }

  // MODIFICA TORNEO
  eseguiModificaConferma() {
    if (this.invioInCorso()) return;

    this.invioInCorso.set(true);
    this.cdr.markForCheck();
    this.http.put(`${environment.apiUrl}/admin/tornei/${this.moduloModifica.id}`, this.moduloModifica, this.getHeaders()).subscribe({
      next: () => {
        this.invioInCorso.set(false);
        this.caricaTornei();
        this.torneoDaModificareId = null;
        this.titoloFeedbackSuccesso.set('Torneo modificato con successo');
        this.testoFeedbackSuccesso.set(`Le modifiche al torneo "${this.moduloModifica.nome}" sono state salvate correttamente.`);
        this.modalAttivo.set('modal_successo');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.invioInCorso.set(false);
        this.mostraBanner('errore', err.error?.error || 'Errore durante la modifica del torneo.');
        this.cdr.markForCheck();
      }
    });
  }

  // CHIEDI CONFERMA ELIMINAZIONE
  chiediConfermaEliminazione() {
    if (!this.torneoDaEliminareId) return;
    const bersaglio = this.tornei().find(t => t.id === this.torneoDaEliminareId);
    this.testoDomandaConferma.set(`Vuoi davvero eliminare definitivamente il torneo "${bersaglio?.nome}"? Questa azione rimuoverà anche tutte le iscrizioni associate.`);
    this.modalAttivo.set('modal_conferma_elimina');
    this.cdr.markForCheck();
  }

  // ESEGUI ELIMINAZIONE
  eseguiEliminazione() {
    if (!this.torneoDaEliminareId || this.invioInCorso()) return;
    this.invioInCorso.set(true);
    this.cdr.markForCheck();

    this.http.delete(`${environment.apiUrl}/admin/tornei/${this.torneoDaEliminareId}`, this.getHeaders()).subscribe({
      next: () => {
        this.invioInCorso.set(false);
        this.caricaTornei();
        this.torneoDaEliminareId = null;
        this.titoloFeedbackSuccesso.set('Torneo eliminato con successo');
        this.testoFeedbackSuccesso.set('Il torneo e tutte le relative iscrizioni sono stati eliminati definitivamente.');
        this.modalAttivo.set('modal_successo');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.invioInCorso.set(false);
        this.chiudiModal();
        this.mostraBanner('errore', err.error?.error || 'Errore durante l\'eliminazione del torneo.');
        this.cdr.markForCheck();
      }
    });
  }

  // LIMITE ISCRIZIONI
  chiediConfermaLimiteIscrizioni() {
    if (this.limiteTemporaneoIscrizioni < 1) return;
    this.testoDomandaConferma.set(`Vuoi impostare il limite a ${this.limiteTemporaneoIscrizioni} iscrizioni per utente?`);
    this.modalAttivo.set('modal_conferma_limite');
    this.cdr.markForCheck();
  }

  eseguiAggiornamentoLimite() {
    this.limiteMassimoIscrizioni.set(this.limiteTemporaneoIscrizioni);
    localStorage.setItem('limite_iscrizioni_admin', String(this.limiteMassimoIscrizioni()));
    this.titoloFeedbackSuccesso.set('Limite aggiornato');
    this.testoFeedbackSuccesso.set(`Ogni utente può ora iscriversi a massimo ${this.limiteMassimoIscrizioni()} tornei contemporaneamente.`);
    this.modalAttivo.set('modal_successo');
    this.cdr.markForCheck();
  }

  // SALVA PUNTEGGIO
  salvaPunteggio() {
    if (!this.datiPunteggio.torneo_id || !this.datiPunteggio.utente_id || this.salvataggioInCorso()) return;

    this.salvataggioInCorso.set(true);
    this.cdr.markForCheck();
    this.http.put(
      `${environment.apiUrl}/admin/tornei/${this.datiPunteggio.torneo_id}/risultati/${this.datiPunteggio.utente_id}`,
      { punti: this.datiPunteggio.punti, posizione: this.datiPunteggio.posizione || 1 },
      this.getHeaders()
    ).subscribe({
      next: () => {
        this.salvataggioInCorso.set(false);
        this.datiPunteggio = { torneo_id: null, utente_id: null, punti: 0, posizione: 1 };
        this.titoloFeedbackSuccesso.set('Punteggio inserito');
        this.testoFeedbackSuccesso.set('Punteggio e posizione registrati con successo per lo studente selezionato.');
        this.modalAttivo.set('modal_successo');
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.salvataggioInCorso.set(false);
        this.mostraBanner('errore', err.error?.error || 'Errore durante il salvataggio del punteggio.');
        this.cdr.markForCheck();
      }
    });
  }

  chiudiModal() {
    this.modalAttivo.set(null);
    this.invioInCorso.set(false);
    this.caricaTornei();
    this.caricaCoda();
    this.cdr.markForCheck();
  }
}