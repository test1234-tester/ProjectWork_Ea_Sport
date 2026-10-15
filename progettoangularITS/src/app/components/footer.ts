import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink],
  template: `
    <footer class="footer-global">
      <div class="footer-container">
        
        <!-- Colonna Principale: Nome e Contatto Mail -->
        <div class="footer-col company-col">
          <div class="footer-brand">
            <span class="company-name">Lazio Digital ITS Academy</span>
          </div>
          <p class="company-contact">
            Contattaci a <a href="mailto:itslaziodigital@gmail.com" class="email-link">itslaziodigital&#64;gmail.com</a>
          </p>
        </div>

        <!-- Colonna Esplora (Solo FAQ) -->
        <div class="footer-col">
          <h4 class="col-title">Esplora</h4>
          <ul class="footer-links">
            <li><a routerLink="/faq">FAQ</a></li>
          </ul>
        </div>

        <!-- Colonna Seguici (Facebook e Instagram) -->
        <div class="footer-col">
          <h4 class="col-title">Seguici</h4>
          <ul class="footer-links">
            <li><a href="https://facebook.com" target="_blank" rel="noopener">Facebook</a></li>
            <li><a href="https://instagram.com" target="_blank" rel="noopener">Instagram</a></li>
          </ul>
        </div>

      </div>
    </footer>
  `,
  styles: [`
    .footer-global {
      background-color: #ffffff;
      border-top: 1px solid #e5e7eb;
      padding: 1.25rem 0; /* Ridotto il padding verticale da 3rem a 1.25rem */
      color: #374151;
      font-size: 0.85rem;
      margin-top: auto;
    }

    .footer-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
      display: grid;
      grid-template-columns: 2fr 1fr 1fr;
      gap: 1.5rem;
      align-items: center; /* Allinea il contenuto al centro verticale */
    }

    .company-col {
      padding-right: 1rem;
    }

    .footer-brand {
      font-weight: 700;
      font-size: 1rem;
      color: #111827;
      margin-bottom: 0.25rem;
    }

    .company-contact {
      color: #4b5563;
      margin: 0;
    }

    .email-link {
      color: #111827;
      text-decoration: underline;
      font-weight: 500;
    }

    .col-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: #111827;
      margin-bottom: 0.35rem;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .footer-links {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .footer-links li {
      margin-bottom: 0.2rem;
    }

    .footer-links a {
      text-decoration: none;
      color: #4b5563;
      transition: color 0.2s ease;
    }

    .footer-links a:hover {
      color: #000000;
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .footer-container {
        grid-template-columns: 1fr 1fr;
        gap: 1rem;
      }
      .company-col {
        grid-column: span 2;
      }
    }

    @media (max-width: 480px) {
      .footer-container {
        grid-template-columns: 1fr;
      }
      .company-col {
        grid-column: span 1;
      }
    }
  `]
})
export class FooterComponent {}