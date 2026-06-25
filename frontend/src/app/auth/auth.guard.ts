import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
import { selectAuthToken } from './auth.selectors';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private store: Store, private router: Router) {}

  canActivate(): Observable<boolean> {
    return this.store.select(selectAuthToken).pipe(
      take(1),
      map(token => !!token),
      tap(isAuthenticated => {
        if (!isAuthenticated) {
          this.router.navigate(['/login']);
        }
      })
    );
  }
}
