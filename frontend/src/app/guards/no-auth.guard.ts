import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ClientPortalService } from '../services/client-portal.service';

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const clientPortalService = inject(ClientPortalService);
  const router = inject(Router);

  if (authService.isAuthenticatedNow()) {
    return router.createUrlTree(['/dashboard']);
  }

  if (clientPortalService.isAuthenticatedNow()) {
    return router.createUrlTree(['/client-portal']);
  }

  return true;
};
