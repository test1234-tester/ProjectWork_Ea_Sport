import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FaqItem {
  id: number;
  question: string;
  answer: string;
  isOpen: boolean;
}

interface PartnerItem {
  id: number;
  name: string;
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
            Tornei per tutti gli studenti.
          </span>
          <h1 class="hero-title">
            Dalla teoria al campo: <br />accendi la competizione!
          </h1>
          <p class="hero-description">
            Sviluppa le tue competenze con i nostri tornei, ideati per darti un vantaggio competitivo e farti emergere nel tuo campo. Unisciti alla nostra community di successo.
          </p>
          
          <div class="hero-actions">
            <a routerLink="/register" class="btn btn-primary">
              <span>Registrati per iscriverti ai tornei</span>
              <span class="btn-arrow">&rarr;</span>
            </a>
            <a routerLink="/tornei" class="btn btn-secondary">Esplora i tornei</a>
          </div>
          
          <span class="hero-caption">Divertiti con i nostri tornei</span>
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
          @for (partner of partners; track partner.id) {
            <div class="partner-card" [attr.aria-label]="partner.name">
              <img 
                [src]="partner.logo" 
                [alt]="partner.name" 
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
          @for (faq of faqs; track faq.id) {
            <div class="faq-item" [class.is-open]="faq.isOpen">
              <button class="faq-question-btn" (click)="toggleFaq(faq)" type="button">
                <span class="faq-question-text">{{ faq.question }}</span>
                <span class="faq-toggle-icon">{{ faq.isOpen ? '−' : '+' }}</span>
              </button>
              
              @if (faq.isOpen) {
                <div class="faq-answer">
                  <p>{{ faq.answer }}</p>
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
  partners: PartnerItem[] = [
    { id: 1, name: 'DGS', logo: '/dgs.png' },
    { id: 2, name: 'Exprivia', logo: '/exprivia.jpg' },
    { id: 3, name: 'Cyber 4.0', logo: '/cyber40.jpg' },
    { id: 4, name: 'One O One Games', logo: '/onegames.png' }
  ];

  faqs: FaqItem[] = [
    {
      id: 1,
      question: 'Chi può partecipare ai tornei?',
      answer: 'I nostri corsi sono aperti a tutti gli studenti e vengono svolti individualmente.',
      isOpen: true
    },
    {
      id: 2,
      question: 'Come posso iscrivermi a un torneo?',
      answer: 'Puoi registrarti alla piattaforma, accedere al catalogo dei tornei e cliccare sul pulsante di iscrizione.',
      isOpen: false
    },
    {
      id: 3,
      question: 'I tornei sono online o in presenza?',
      answer: 'I tornei possono essere sia online, che in prensenza. La modalità viene indicata nella descrizione del torneo.',
      isOpen: false
    },
    {
      id: 7,
      question: 'Come posso contattare il supporto tecnico?',
      answer: 'Puoi inviarci un e-mail a itslaziodigital@gmail.com oppure utilizzare la sezione contatti.',
      isOpen: false
    }
  ];

  toggleFaq(selectedFaq: FaqItem) {
    selectedFaq.isOpen = !selectedFaq.isOpen;
  }
}