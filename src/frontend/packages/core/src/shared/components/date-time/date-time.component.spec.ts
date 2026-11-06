import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { DateTimeComponent } from './date-time.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MDAppModule } from '../../../core/md.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DateTimeComponent', () => {
  let component: DateTimeComponent;
  let fixture: ComponentFixture<DateTimeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        DateTimeComponent, // Now standalone
        FormsModule,
        ReactiveFormsModule,
        MDAppModule,
        NoopAnimationsModule,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DateTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // A date or time field never shows its placeholder, so it cannot be the name.
  it('names the date and time fields', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('input[type="date"]')?.getAttribute('aria-label')).toBe('Choose a date');
    expect(el.querySelector('input[type="time"]')?.getAttribute('aria-label')).toBe('Choose time');
  });

  it('shows a bound date in its fields and empties them when it is cleared', async () => {
    fixture.componentRef.setInput('dateTime', new Date(2019, 0, 2, 3, 4));
    await fixture.whenStable();
    expect(component.date.value).toBe('2019-01-02');
    expect(component.time.value).toBe('03:04');

    fixture.componentRef.setInput('dateTime', null);
    await fixture.whenStable();
    expect(component.date.value).toBeNull();
    expect(component.time.value).toBe('00:00');
  });

  it('ignores a bound date that is not valid', async () => {
    fixture.componentRef.setInput('dateTime', new Date(2019, 0, 2, 3, 4));
    await fixture.whenStable();
    fixture.componentRef.setInput('dateTime', new Date('not a date'));
    await fixture.whenStable();
    expect(component.date.value).toBe('2019-01-02');
  });
});
