import { createSelector } from '@ngrx/store';
import { AuthState } from './auth.reducer';

export const selectAuthState = (state: any) => state.auth;

export const selectAuthToken = createSelector(
  selectAuthState,
  (state: AuthState) => state.token
);

export const selectUser = createSelector(
  selectAuthState,
  (state: AuthState) => state.user
);
