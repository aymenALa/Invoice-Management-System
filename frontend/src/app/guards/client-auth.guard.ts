import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { ClientPortalService } from '../services/client-portal.service';

export const clientAuthGuard: CanActivateFn = () => {
  const clientPortalService = inject(ClientPortalService);
  const router = inject(Router);

  if (clientPortalService.isAuthenticatedNow()) {
    return true;
  }

  return router.createUrlTree(['/auth']);
};
