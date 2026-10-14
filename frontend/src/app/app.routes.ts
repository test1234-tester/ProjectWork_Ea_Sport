import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home';
import { LoginComponent } from './pages/login';
import { RegisterComponent } from './pages/register';
import { TorneiComponent } from './pages/tornei';
import { UserAreaComponent } from './pages/user-area';
import { AdminComponent } from './pages/admin';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tornei', component: TorneiComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'user-area', component: UserAreaComponent, canActivate: [authGuard] },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];