import { Injectable, signal } from '@angular/core';

export interface User {
  nome: string;
  cognome: string;
  email: string;
}

export interface EnrolledTournament {
  id: number;
  type: 'iscritto' | 'in_coda';
  queuePosition?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // Utente attualmente connesso
  currentUser = signal<User | null>(this.getStoredUser());

  // Tornei a cui l'utente corrente si è iscritto o messo in coda
  userEnrollments = signal<EnrolledTournament[]>(this.getStoredEnrollments());

  private getStoredUser(): User | null {
    const userJson = localStorage.getItem('mock_current_user');
    return userJson ? JSON.parse(userJson) : null;
  }

  private getStoredEnrollments(): EnrolledTournament[] {
    const data = localStorage.getItem('mock_user_enrollments');
    return data ? JSON.parse(data) : [];
  }

  // Registrazione: salva l'account senza effettuare il login automatico
  register(userData: { nome: string; cognome: string; email: string }) {
    const registeredUsers = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
    registeredUsers.push(userData);
    localStorage.setItem('mock_registered_users', JSON.stringify(registeredUsers));
  }

  // Login: cerca l'utente registrato o ne crea uno fittizio mantenendo il nome fornito
  login(email: string) {
    const registeredUsers: User[] = JSON.parse(localStorage.getItem('mock_registered_users') || '[]');
    const foundUser = registeredUsers.find(u => u.email.toLowerCase() === email.toLowerCase());

    const user: User = foundUser ? foundUser : { email, nome: 'Mario', cognome: 'Rossi' };
    localStorage.setItem('mock_current_user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  logout() {
    localStorage.removeItem('mock_current_user');
    this.currentUser.set(null);
  }

  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  // Gestione Iscrizioni ai Tornei
  enrollInTournament(tournamentId: number, type: 'iscritto' | 'in_coda', queuePosition?: number) {
    const currentList = this.userEnrollments();
    if (!currentList.some(e => e.id === tournamentId)) {
      const newList = [...currentList, { id: tournamentId, type, queuePosition }];
      this.userEnrollments.set(newList);
      localStorage.setItem('mock_user_enrollments', JSON.stringify(newList));
    }
  }

  cancelEnrollment(tournamentId: number) {
    const newList = this.userEnrollments().filter(e => e.id !== tournamentId);
    this.userEnrollments.set(newList);
    localStorage.setItem('mock_user_enrollments', JSON.stringify(newList));
  }

  isEnrolled(tournamentId: number): boolean {
    return this.userEnrollments().some(e => e.id === tournamentId);
  }
}