import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { parseISO } from 'date-fns';

import { StartEndDateComponent } from './start-end-date.component';

describe('StartEndDateComponent', () => {
  let component: StartEndDateComponent;
  let fixture: ComponentFixture<StartEndDateComponent>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        StartEndDateComponent,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StartEndDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show message if invalid', () => {
    component.end = parseISO('2019-01-01T03:00:00.000Z');
    component.start = parseISO('2019-01-02T03:00:00.000Z');

    expect(component.validMessage).toEqual('Start date must be before end date.');
  });

  it('should emit changes if valid dates', () => {
    vi.spyOn(component.startChange, 'emit');
    vi.spyOn(component.endChange, 'emit');
    component.start = parseISO('2019-01-01T03:00:00.000Z');
    component.end = parseISO('2019-01-03T03:00:00.000Z');
    component.start = parseISO('2019-01-02T03:00:00.000Z');
    component.end = parseISO('2019-01-04T03:00:00.000Z');

    expect(component.startChange.emit).toHaveBeenCalled();
    expect(component.endChange.emit).toHaveBeenCalled();
  });

  it('should be able to use custom validate method', () => {
    const customValidate = vi.fn().mockReturnValue(null);
    component.validate = customValidate;
    component.start = parseISO('2019-01-02T03:00:00.000Z');

    expect(customValidate).toHaveBeenCalledWith(component.start, undefined);
  });

  it('should validate dates by default', () => {
    component.start = parseISO('2019-01-01T03:00:00.000Z');
    component.end = parseISO('2019-01-02T03:00:00.000Z');
    expect(component.valid).toBeTruthy();
  });
});


