import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { DemoBackendService } from '../demo/demo-backend.service';

export const demoInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.demoMode || !req.url.includes('/api/')) {
    return next(req);
  }

  const demoBackend = inject(DemoBackendService);
  return from(demoBackend.handleRequest(req)).pipe(
    catchError(err => throwError(() => err))
  );
};
