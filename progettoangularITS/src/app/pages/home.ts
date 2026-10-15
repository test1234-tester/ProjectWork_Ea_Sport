import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

// Entità FAQ e Partner dal Documento Requisiti (pagg. 3, 20)
interface Faq {
  id: number;
  domanda: string;
  risposta: string;
  aperta: boolean;
}

interface Partner {
  id: number;
  nome: string;
  logo: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home-container">
      
      <!-- 1. HERO SECTION -->
      <section class="hero-section">
        <div class="hero-content">
          <span class="hero-overline">
            🎮 Il Circuito E-Sports Ufficiale
          </span>
          <h1 class="hero-title">
            Dalla passione all'arena: <br />accendi la sfida del gaming!
          </h1>
          <p class="hero-description">
            Metti alla prova riflessi, strategia e gioco di squadra nei tornei eSports più competitivi. Da EA Sports FC a Rocket League e Valorant, sfida i migliori gamer del campus e scala le classifiche per conquistare la vittoria.
          </p>
          
          <div class="hero-actions">
            <a routerLink="/register" class="btn btn-primary">
              <span>Iscriviti ai tornei gaming</span>
              <span class="btn-arrow">&rarr;</span>
            </a>
            <a routerLink="/tornei" class="btn btn-secondary">Esplora i tornei</a>
          </div>
          
          <span class="hero-caption">⚡ Postazioni LAN, server dedicati, premi esclusivi e live streaming</span>
        </div>

        <!-- Box Video Header -->
        <div class="hero-media-wrapper">
          <div class="hero-media-box">
            <video 
              class="hero-video" 
              src="/videoheader.mp4" 
              autoplay 
              muted 
              loop 
              playsinline 
              controls>
              Il tuo browser non supporta la riproduzione video.
            </video>
          </div>
        </div>
      </section>


      <!-- 2. SEZIONE PARTNER ("I NOSTRI ALLEATI") -->
      <section class="partners-section">
        <h2 class="section-title">I nostri alleati</h2>
        
        <div class="partners-grid">
          @for (p of partner; track p.id) {
            <div class="partner-card" [attr.aria-label]="p.nome">
              <img 
                [src]="p.logo" 
                [alt]="p.nome" 
                class="partner-logo-img" 
              />
            </div>
          }
        </div>
      </section>


      <!-- 3. SEZIONE FAQ ("DOMANDE FREQUENTI") -->
      <section class="faq-section" id="faq">
        <!-- Colonna Sinistra: Header & Contatti -->
        <div class="faq-header-col">
          <span class="badge-faq">FAQ</span>
          <h2 class="faq-title">Domande frequenti</h2>
          <p class="faq-subtitle">Hai altre domande?</p>
          <a href="mailto:itslaziodigital@gmail.com" class="faq-contact-link">
            Contattaci &rarr;
          </a>
        </div>

        <!-- Colonna Destra: Accordion Interattivo -->
        <div class="faq-accordion-col">
          @for (item of elencoFaq; track item.id) {
            <div class="faq-item" [class.is-open]="item.aperta">
              <button class="faq-question-btn" (click)="alternaFaq(item)" type="button">
                <span class="faq-question-text">{{ item.domanda }}</span>
                <span class="faq-toggle-icon">{{ item.aperta ? '−' : '+' }}</span>
              </button>
              
              @if (item.aperta) {
                <div class="faq-answer">
                  <p>{{ item.risposta }}</p>
                </div>
              }
            </div>
          }
        </div>
      </section>

    </div>
  `,
  styles: [`
    .home-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem 2rem 4rem 2rem;
    }

    /* HERO SECTION */
    .hero-section {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 3rem;
      align-items: center;
      padding: 3.5rem 3rem;
      border-radius: 20px;
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
      margin-bottom: 2rem;
    }

    .hero-content, 
    .hero-media-wrapper {
      min-width: 0;
      width: 100%;
    }

    .hero-overline {
      display: inline-block;
      font-size: 0.85rem;
      font-weight: 700;
      color: #2563eb;
      background-color: #eff6ff;
      padding: 0.35rem 0.85rem;
      border-radius: 20px;
      margin-bottom: 1rem;
      letter-spacing: 0.02em;
    }

    .hero-title {
      font-size: 2.6rem;
      font-weight: 800;
      line-height: 1.15;
      color: #0f172a;
      margin: 0 0 1.25rem 0;
      letter-spacing: -0.025em;
    }

    .hero-description {
      font-size: 0.98rem;
      line-height: 1.65;
      color: #475569;
      margin-bottom: 2rem;
      max-width: 480px;
    }

    .hero-actions {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.8rem 1.6rem;
      border-radius: 8px;
      font-size: 0.92rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
    }

    .btn-primary {
      background-color: #0f172a;
      color: #ffffff;
      border: 1.5px solid #0f172a;
      box-shadow: 0 4px 14px rgba(15, 23, 42, 0.2);
    }

    .btn-primary:hover {
      background-color: #1e293b;
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.3);
    }

    .btn-arrow {
      transition: transform 0.25s ease;
    }

    .btn-primary:hover .btn-arrow {
      transform: translateX(6px);
    }

    .btn-secondary {
      background-color: #ffffff;
      color: #0f172a;
      border: 1.5px solid #cbd5e1;
    }

    .btn-secondary:hover {
      background-color: #ffffff;
      border-color: #0f172a;
      transform: translateY(-3px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }

    .hero-caption {
      display: block;
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
    }

    .hero-media-wrapper {
      display: flex;
      justify-content: flex-end;
      align-items: center;
    }

    .hero-media-box {
      width: 100%;
      max-width: 480px;
      height: 280px;
      border-radius: 14px;
      overflow: hidden;
      background-color: #000000;
      border: 2px solid #e2e8f0;
      box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
    }

    .hero-video {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    /* PARTNERS SECTION */
    .partners-section {
      padding: 4rem 0;
      text-align: center;
      border-bottom: 1px solid #f1f5f9;
    }

    .section-title {
      font-size: 1.75rem;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 2.5rem;
      letter-spacing: -0.02em;
    }

    .partners-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 1.5rem;
      align-items: center;
    }

    .partner-card {
      background-color: #ffffff;
      border: 1.5px solid #e2e8f0;
      border-radius: 14px;
      padding: 1.25rem 1.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 105px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .partner-card:hover {
      transform: translateY(-6px);
      border-color: #0f172a;
      box-shadow: 0 14px 28px rgba(0, 0, 0, 0.1);
    }

    .partner-logo-img {
      max-height: 100%;
      max-width: 100%;
      object-fit: contain;
      transition: transform 0.25s ease;
    }

    .partner-card:hover .partner-logo-img {
      transform: scale(1.06);
    }

    /* FAQ SECTION */
    .faq-section {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 3rem;
      padding-top: 4rem;
    }

    .badge-faq {
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.08em;
      color: #2563eb;
      text-transform: uppercase;
      display: block;
      margin-bottom: 0.5rem;
    }

    .faq-title {
      font-size: 2rem;
      font-weight: 800;
      color: #0f172a;
      margin: 0 0 0.5rem 0;
    }

    .faq-subtitle {
      font-size: 0.95rem;
      color: #64748b;
      margin-bottom: 0.5rem;
    }

    .faq-contact-link {
      display: inline-block;
      font-size: 0.95rem;
      font-weight: 700;
      color: #0f172a;
      text-decoration: none;
      transition: color 0.2s ease;
    }

    .faq-contact-link:hover {
      color: #2563eb;
      text-decoration: underline;
    }

    .faq-accordion-col {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .faq-item {
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      padding: 0 1.25rem;
      background-color: #ffffff;
      transition: all 0.25s ease;
    }

    .faq-item.is-open {
      background-color: #0f172a;
      border-color: #0f172a;
      color: #ffffff;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.15);
    }

    .faq-question-btn {
      width: 100%;
      background: none;
      border: none;
      padding: 1.2rem 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      text-align: left;
      cursor: pointer;
      font-family: inherit;
    }

    .faq-question-text {
      font-size: 1.02rem;
      font-weight: 700;
      color: #0f172a;
      padding-right: 1rem;
      transition: color 0.25s ease;
    }

    .faq-item.is-open .faq-question-text {
      color: #ffffff;
    }

    .faq-toggle-icon {
      font-size: 1.3rem;
      font-weight: 700;
      color: #0f172a;
      transition: color 0.25s ease;
    }

    .faq-item.is-open .faq-toggle-icon {
      color: #38bdf8;
    }

    .faq-answer {
      padding-bottom: 1.25rem;
      font-size: 0.92rem;
      line-height: 1.65;
      color: #475569;
      transition: color 0.25s ease;
    }

    .faq-item.is-open .faq-answer p {
      color: #cbd5e1;
      margin: 0;
    }

    /* RESPONSIVE DESIGN */
    @media (max-width: 900px) {
      .hero-section {
        grid-template-columns: 1fr;
        padding: 2.5rem 1.5rem;
      }
      .hero-media-wrapper {
        justify-content: center;
      }
      .hero-media-box {
        max-width: 100%;
        height: 230px;
      }
      .partners-grid {
        grid-template-columns: repeat(2, 1fr);
      }
      .faq-section {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 600px) {
      .hero-title {
        font-size: 2rem;
      }
      .hero-actions {
        flex-direction: column;
      }
      .partners-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class HomeComponent {
  partner: Partner[] = [
    { id: 1, nome: 'DGS', logo: '/dgs.png' },
    { id: 2, nome: 'Exprivia', logo: '/exprivia.jpg' },
    { id: 3, nome: 'Cyber 4.0', logo: '/cyber40.jpg' },
    { id: 4, nome: 'One O One Games', logo: '/onegames.png' }
  ];

  elencoFaq: Faq[] = [
    {
      id: 1,
      domanda: 'Chi può partecipare ai tornei di gaming?',
      risposta: 'Tutti gli studenti e appassionati di gaming! I tornei sono aperti sia a singoli player (sfide 1v1 come FC 25 o Tekken) sia a team per i titoli a squadre (Rocket League, Valorant, League of Legends).',
      aperta: true
    },
    {
      id: 2,
      domanda: 'Come posso iscrivermi a una competizione?',
      risposta: 'Crea il tuo profilo giocatore, esplora la sezione Tornei, scegli la tua disciplina gaming e clicca su "Iscriviti ora". Se il numero massimo di partecipanti è raggiunto, puoi metterti in coda per subentrare in caso di forfait.',
      aperta: false
    },
    {
      id: 3,
      domanda: 'I match si svolgono online o in presenza (LAN party)?',
      risposta: 'Organizziamo sia match online con server dedicati e coordinamento Discord, sia entusiasmanti eventi in presenza nelle nostre aree LAN attrezzate con PC gaming, console PS5 e maxischermi.',
      aperta: false
    },
    {
      id: 4,
      domanda: 'Quali piattaforme di gioco sono supportate?',
      risposta: 'Supportiamo tornei su PlayStation 5, PC da gaming e Nintendo Switch, con regole competitive ufficiali per ogni titolo.',
      aperta: false
    },
    {
      id: 5,
      domanda: 'Come posso contattare gli arbitri o l\'assistenza?',
      risposta: 'Puoi contattare lo staff organizzativo e gli arbitri del torneo tramite e-mail a itslaziodigital@gmail.com oppure direttamente tramite il server Discord ufficiale durante le giornate di gara.',
      aperta: false
    }
  ];

  alternaFaq(faqSelezionata: Faq) {
    faqSelezionata.aperta = !faqSelezionata.aperta;
  }
}