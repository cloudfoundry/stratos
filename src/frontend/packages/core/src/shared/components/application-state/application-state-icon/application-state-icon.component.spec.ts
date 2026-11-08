import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ApplicationStateIconComponent } from './application-state-icon.component';

describe('ApplicationStateIconComponent', () => {
  let component: ApplicationStateIconComponent;
  let fixture: ComponentFixture<ApplicationStateIconComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        ApplicationStateIconComponent,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationStateIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // The icon carries meaning on its own (the recent apps card shows nothing
  // else), so it is an image with the state as its name (WCAG 1.1.1).
  it('is an image named after the state', async () => {
    fixture.componentRef.setInput('status', 'STARTED');
    await fixture.whenStable();
    const icon = fixture.nativeElement.querySelector('[role="img"]') as HTMLElement;
    expect(icon.getAttribute('aria-label')).toBe('Started');
    expect(icon.closest('[aria-hidden="true"]')).toBeNull();
  });

  it('is no image while it has no state', async () => {
    fixture.componentRef.setInput('status', null);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="img"]')).toBeNull();
  });
});
