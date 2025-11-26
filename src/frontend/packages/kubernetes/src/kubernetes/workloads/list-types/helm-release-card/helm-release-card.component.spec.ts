import { DatePipe } from '@angular/common';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import type { HelmRelease } from '../../workload.types';
import { HelmReleaseCardComponent } from './helm-release-card.component';

describe('HelmReleaseCardComponent', () => {
  let component: HelmReleaseCardComponent;
  let fixture: ComponentFixture<HelmReleaseCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        HelmReleaseCardComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        provideRouter([]),
        DatePipe,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseCardComponent);
    component = fixture.componentInstance;
    component.row = {
      status: 'status',
      info: {
        last_deployed: null,
      },
      chart: {
        metadata: {}
      }
    } as HelmRelease;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
