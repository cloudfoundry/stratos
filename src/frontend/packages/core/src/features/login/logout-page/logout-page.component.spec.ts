import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@test-framework';

import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { LogoutPageComponent } from './logout-page.component';

describe('LogoutPageComponent', () => {
  let component: LogoutPageComponent;
  let fixture: ComponentFixture<LogoutPageComponent>;
  const auth = { error: signal(false), logout: vi.fn() };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        LogoutPageComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: AuthSignalService, useValue: auth },
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    auth.error.set(false);
    fixture = TestBed.createComponent(LogoutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('swaps the progress bar for the error message when logging out fails', async () => {
    expect(fixture.nativeElement.querySelector('#logout__loading')).not.toBeNull();
    auth.error.set(true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('#logout__loading')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('An error occurred logging out');
  });
});
