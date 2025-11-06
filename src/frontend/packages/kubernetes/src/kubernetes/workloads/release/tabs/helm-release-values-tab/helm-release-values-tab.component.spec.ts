import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../../../core/src/tab-nav.service';
import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { HelmReleaseValuesTabComponent } from './helm-release-values-tab.component';

describe('HelmReleaseValuesTabComponent', () => {
  let component: HelmReleaseValuesTabComponent;
  let fixture: ComponentFixture<HelmReleaseValuesTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ,
        HelmReleaseValuesTabComponent
      ]providers: [
        
        // ...HelmBaseTestProviders,
        ...HelmReleaseProviders,
        TabNavService
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseValuesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
