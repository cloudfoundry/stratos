import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../../../core/src/tab-nav.service';
import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleaseValuesTabComponent } from './helm-release-values-tab.component';

describe('HelmReleaseValuesTabComponent', () => {
  let component: HelmReleaseValuesTabComponent;
  let fixture: ComponentFixture<HelmReleaseValuesTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules,

        HelmReleaseValuesTabComponent,
      ],
      providers: [
        ...HelmReleaseProviders,
        TabNavService,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
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

describe('HelmReleaseValuesTabComponent values', () => {
  it('shows the user, chart or merged values for the chosen view, null before the release loads', async () => {
    const release = signal<unknown>(undefined);
    await TestBed.configureTestingModule({
      imports: [HelmReleaseValuesTabComponent],
      providers: [
        provideZonelessChangeDetection(),
        { provide: HelmReleaseHelperService, useValue: { release } },
      ],
    }).overrideComponent(HelmReleaseValuesTabComponent, { set: { template: '' } }).compileComponents();
    const component = TestBed.createComponent(HelmReleaseValuesTabComponent).componentInstance;
    expect(component.values()).toBeNull();

    release.set({ config: { a: { x: 1 } }, chart: { values: { a: { y: 2 }, b: 3 } } });
    expect(component.values()).toEqual({ a: { x: 1 } });
    component.viewTypeChange('chart');
    expect(component.values()).toEqual({ a: { y: 2 }, b: 3 });
    component.viewTypeChange('combined');
    expect(component.values()).toEqual({ a: { x: 1, y: 2 }, b: 3 });
  });
});
