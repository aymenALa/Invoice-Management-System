import { createReducer, on } from '@ngrx/store';
import { login, logout, setUser } from './auth.actions';

export interface AuthState {
  token: string | null;
  user: any | null;
}

export const initialState: AuthState = {
  token: null,
  user: null,
};

export const authReducer = createReducer(
  initialState,
  on(login, (state, { token }) => ({ ...state, token })),
  on(logout, (state) => ({ ...state, token: null, user: null })),
  on(setUser, (state, { user }) => ({ ...state, user }))
);
