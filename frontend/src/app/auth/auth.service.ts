import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { login, logout, setUser } from './auth.actions';
import { selectAuthToken } from './auth.selectors';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private store: Store) {}

  login(token: string, user: any) {
    this.store.dispatch(login({ token }));
    this.store.dispatch(setUser({ user }));
  }

  logout() {
    this.store.dispatch(logout());
  }

  getToken() {
    return this.store.select(selectAuthToken);
  }
}
