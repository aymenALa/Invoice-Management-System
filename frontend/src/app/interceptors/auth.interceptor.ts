import { HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ClientPortalService } from '../services/client-portal.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const clientPortalService = inject(ClientPortalService);

  // Don't add the token for login requests
  if (req.url.includes('/login') || req.url.includes('/activate')) {
    return next(req);
  }

  if (req.url.includes('/api/client-portal')) {
    const clientToken = clientPortalService.getToken();
    if (clientToken) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${clientToken}`
        }
      });
    }
    return next(req);
  }

  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  return next(req);
};
