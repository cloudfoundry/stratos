import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../core/core.module';
import { BooleanIndicatorComponent, BooleanIndicatorType } from './boolean-indicator.component';

describe('BooleanIndicatorComponent', () => {
  let component: BooleanIndicatorComponent;
  let fixture: ComponentFixture<BooleanIndicatorComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [BooleanIndicatorComponent, CoreModule, NoopAnimationsModule]
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(BooleanIndicatorComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('type', BooleanIndicatorType.enabledDisabled);
    fixture.componentRef.setInput('isTrue', true);
    await fixture.whenStable();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show text by default', () => {
    expect(element.textContent).toContain('Enabled');
  });

  // Without its text the icon is the only answer, so it names it; with the
  // text beside it, the icon is decoration.
  it('names the icon only when the text is hidden', async () => {
    const icon = () => element.querySelector('.material-icons')!;
    expect(icon().getAttribute('aria-hidden')).toBe('true');

    fixture.componentRef.setInput('showText', false);
    await fixture.whenStable();
    expect(icon().getAttribute('role')).toBe('img');
    expect(icon().getAttribute('aria-label')).toBe('Enabled');
    expect(icon().hasAttribute('aria-hidden')).toBe(false);
  });

  it('should hide text if set', async () => {
    fixture.componentRef.setInput('showText', false);
    await fixture.whenStable();
    expect(element.textContent).not.toContain('Enabled');
  });

  it('should show unknown if not boolean value', async () => {
    fixture.componentRef.setInput('isTrue', null);
    await fixture.whenStable();
    expect(element.textContent).toContain('Unknown');
  });
});
