import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { parseISO } from 'date-fns';

import { StartEndDateComponent } from './start-end-date.component';

describe('StartEndDateComponent', () => {
  let component: StartEndDateComponent;
  let fixture: ComponentFixture<StartEndDateComponent>;
  let _element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection()
      ],
      imports: [
        StartEndDateComponent,
        NoopAnimationsModule,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(StartEndDateComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    _element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Both pickers name their fields alike; the group tells them apart.
  it('groups the start and end pickers under their own names', () => {
    const groups = Array.from(_element.querySelectorAll('[role="group"]'));
    expect(groups.map(g => g.getAttribute('aria-label'))).toEqual(['Start', 'End']);
    for (const group of groups) {
      expect(group.querySelector('app-date-time')).not.toBeNull();
    }
  });

  it('should show message if invalid', () => {
    fixture.componentRef.setInput('end', parseISO('2019-01-01T03:00:00.000Z'));
    fixture.componentRef.setInput('start', parseISO('2019-01-02T03:00:00.000Z'));

    expect(component.validMessage).toEqual('Start date must be before end date.');
  });

  it('should emit changes if valid dates', () => {
    vi.spyOn(component.startChange, 'emit');
    vi.spyOn(component.endChange, 'emit');
    fixture.componentRef.setInput('start', parseISO('2019-01-01T03:00:00.000Z'));
    fixture.componentRef.setInput('end', parseISO('2019-01-03T03:00:00.000Z'));
    fixture.componentRef.setInput('start', parseISO('2019-01-02T03:00:00.000Z'));
    fixture.componentRef.setInput('end', parseISO('2019-01-04T03:00:00.000Z'));

    expect(component.startChange.emit).toHaveBeenCalled();
    expect(component.endChange.emit).toHaveBeenCalled();
  });

  it('should be able to use custom validate method', () => {
    const customValidate = vi.fn().mockReturnValue(null);
    fixture.componentRef.setInput('validate', customValidate);
    fixture.componentRef.setInput('start', parseISO('2019-01-02T03:00:00.000Z'));

    expect(customValidate).toHaveBeenCalledWith(component.start, undefined);
  });

  it('should validate dates by default', () => {
    fixture.componentRef.setInput('start', parseISO('2019-01-01T03:00:00.000Z'));
    fixture.componentRef.setInput('end', parseISO('2019-01-02T03:00:00.000Z'));
    expect(component.valid).toBeTruthy();
  });
});


