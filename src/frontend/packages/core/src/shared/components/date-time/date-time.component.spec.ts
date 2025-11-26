import { type ComponentFixture, TestBed } from '@angular/core/testing';
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
});
