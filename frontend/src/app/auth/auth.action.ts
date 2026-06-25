import { createAction, props } from '@ngrx/store';

export const login = createAction('[Auth] Login', props<{ token: string }>());
export const logout = createAction('[Auth] Logout');
export const setUser = createAction('[Auth] Set User', props<{ user: any }>());
