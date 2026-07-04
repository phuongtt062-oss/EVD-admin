import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { APP_ROUTES } from '../constants/app.constant';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  if (inject(AuthService).isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree([APP_ROUTES.LOGIN]);
};

export const guestGuard: CanActivateFn = () => {
  if (!inject(AuthService).isAuthenticated()) {
    return true;
  }
  return inject(Router).createUrlTree([APP_ROUTES.DOCUMENTS]);
};
