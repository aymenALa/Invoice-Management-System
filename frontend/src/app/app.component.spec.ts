import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { AuthService } from './services/auth.service';
import { provideRouter } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

describe('AppComponent', () => {
  let authState: BehaviorSubject<boolean>;

  beforeEach(async () => {
    authState = new BehaviorSubject<boolean>(false);

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        {
          provide: AuthService,
          useValue: {
            isAuthenticated: () => authState.asObservable()
          }
        }
      ]
    }).compileComponents();
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

  it('should show the nav when the user is authenticated', () => {
    const fixture = TestBed.createComponent(AppComponent);
    authState.next(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-nav')).not.toBeNull();
  });
});
