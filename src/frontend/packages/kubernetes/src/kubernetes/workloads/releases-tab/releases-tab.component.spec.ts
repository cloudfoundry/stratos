import { DatePipe } from '@angular/common';
import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleasesTabComponent } from './releases-tab.component';

describe('ReleasesTabComponent', () => {
  let component: HelmReleasesTabComponent;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,
        HelmReleasesTabComponent,
      ],
      providers: [
        DatePipe,
        HelmReleaseHelperService,
        TabNavService,
        provideZonelessChangeDetection(),
      ]
    }),
      .compileComponents();
  });

  beforeEach(() => {
    const fixture = TestBed.createComponent(HelmReleasesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
