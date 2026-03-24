import { Routes } from '@angular/router';
import { Home } from './views/home/home';
import { authGuard } from './services/auth.guard';

export const routes: Routes = [
    {
    path: '',
    redirectTo: 'home',
    pathMatch: 'full'
    },
    {
    path: 'home',
    loadComponent: () =>
      import('./views/home/home').then(m => m.Home),
    canActivate: [authGuard]
  },
];
