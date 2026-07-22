import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EMPTY, of } from 'rxjs';

import { HelmReleaseGuidMock } from '../../../../../helm/helm-testing.module';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleaseHistoryTabComponent } from './helm-release-history-tab.component';

describe('HelmReleaseHistoryTabComponent', () => {
  let component: HelmReleaseHistoryTabComponent;
  let fixture: ComponentFixture<HelmReleaseHistoryTabComponent>;

  beforeEach(async () => {
    // Mock HelmReleaseHelperService to avoid its constructor calling into the
    // workloads entity catalog, which isn't populated in this lightweight test.
    const mockHelmReleaseHelper: Partial<HelmReleaseHelperService> = {
      guid: 'test-endpoint:test-namespace:test-release',
      releaseTitle: 'test-release',
      endpointGuid: 'test-endpoint',
      namespace: 'test-namespace',
      // Real release$ filters out null, so it never emits until a release
      // resolves; EMPTY models "no release resolved" without fabricating one.
      release$: EMPTY,
      hasUpgrade: vi.fn().mockReturnValue(of(null)),
      fetchReleaseHistory: vi.fn().mockReturnValue(of([])),
    };

    await TestBed.configureTestingModule({
      imports: [
        HelmReleaseHistoryTabComponent,
      ],
      providers: [
        { provide: HelmReleaseHelperService, useValue: mockHelmReleaseHelper },
        HelmReleaseGuidMock,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseHistoryTabComponent);
    component = fixture.componentInstance;
    // Not calling detectChanges() — the component's template bindings may
    // require full store state; this test only verifies instantiation.
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
