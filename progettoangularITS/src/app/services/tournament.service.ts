import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Torneo {
  id: number;
  nome: string;
  gioco: string;
  modalita: 'ONLINE' | 'IN SEDE' | string;
  stato: 'Aperto' | 'In Corso' | 'Chiuso' | 'Concluso' | 'Cancellato' | string;
  data_inizio: string;
  data_fine: string;
  descrizione: string;
  immagine: string;
  posti_max: number;
  posti_occupati?: number;
  in_coda?: number;
  titolo?: string;
}

@Injectable({
  providedIn: 'root'
})
export class TournamentService {
  private http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  getTornei(): Observable<Torneo[]> {
    return this.http.get<Torneo[]>(`${this.apiUrl}/tornei`);
  }

  getTorneoById(id: number): Observable<Torneo> {
    return this.http.get<Torneo>(`${this.apiUrl}/tornei/${id}`);
  }
}