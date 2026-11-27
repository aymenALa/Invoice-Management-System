import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { provideRouter, Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Component } from '@angular/core';

@Component({ standalone: true, template: '' })
class DummyComponent {}

describe('AppComponent', () => {
  let authState: BehaviorSubject<boolean>;
  let router: Router;

  beforeEach(async () => {
    authState = new BehaviorSubject<boolean>(false);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([{ path: 'dashboard', component: DummyComponent }]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => authState.asObservable(),
            displayName$: () => of('alex.mercer'),
            getUsername: () => 'alex.mercer'
          }
        }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should hide the nav when the user is not authenticated', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-nav')).toBeNull();
  });

  it('should show the nav when the user is authenticated on a workspace route', async () => {
    const fixture = TestBed.createComponent(AppComponent);
    authState.next(true);
    await router.navigateByUrl('/dashboard');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-nav')).not.toBeNull();
  });
});
