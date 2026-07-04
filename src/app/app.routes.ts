import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/guards/auth.guard';
import { APP_ROUTES } from './core/constants/app.constant';

export const routes: Routes = [
  {
    path: '',
    redirectTo: APP_ROUTES.DOCUMENTS,
    pathMatch: 'full',
  },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'evd/documents',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/evd/pages/documents/documents.page').then((m) => m.DocumentsPage),
  },
  {
    path: '**',
    redirectTo: APP_ROUTES.DOCUMENTS,
  },
];
