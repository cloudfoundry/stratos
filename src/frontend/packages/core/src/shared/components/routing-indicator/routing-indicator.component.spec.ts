import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { RoutingIndicatorComponent } from './routing-indicator.component';
import { CoreModule } from '../../../core/core.module';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('RoutingIndicatorComponent', () => {
  let component: RoutingIndicatorComponent;
  let fixture: ComponentFixture<RoutingIndicatorComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      imports: [
        RoutingIndicatorComponent,
        RouterTestingModule,
        CoreModule,
        ProgressBarComponent,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
