import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MDAppModule } from '../../../core/md.module';
import { ApplicationStateIconComponent } from './application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from './application-state-icon/application-state-icon.pipe';
import { ApplicationStateComponent } from './application-state.component';

describe('ApplicationStateComponent', () => {
  let component: ApplicationStateComponent;
  let fixture: ComponentFixture<ApplicationStateComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({

      providers: [provideZonelessChangeDetection()],

      imports: [
        MDAppModule,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
      ]

    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationStateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
