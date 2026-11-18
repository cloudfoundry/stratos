import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { HelmReleaseGuidMock } from '../../../../../helm/helm-testing.module';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleaseHistoryTabComponent } from './helm-release-history-tab.component';

describe('HelmReleaseHistoryTabComponent', () => {
  let component: HelmReleaseHistoryTabComponent;
  let fixture: ComponentFixture<HelmReleaseHistoryTabComponent>;
  const revisions = signal<unknown[] | undefined>(undefined);

  beforeEach(async () => {
    revisions.set(undefined);
    // Mock HelmReleaseHelperService to avoid its constructor calling into the
    // workloads entity catalog, which isn't populated in this lightweight test.
    const mockHelmReleaseHelper: Partial<HelmReleaseHelperService> = {
      guid: 'test-endpoint:test-namespace:test-release',
      releaseTitle: 'test-release',
      endpointGuid: 'test-endpoint',
      namespace: 'test-namespace',
      release: signal(undefined),
      upgrade: vi.fn().mockReturnValue(signal(null)),
      history: vi.fn().mockReturnValue(revisions),
    };

    await TestBed.configureTestingModule({
      imports: [
        HelmReleaseHistoryTabComponent,
      ],
      providers: [
        { provide: HelmReleaseHelperService, useValue: mockHelmReleaseHelper },
        HelmReleaseGuidMock,
        { provide: ActivatedRoute, useValue: { snapshot: { params: {}, queryParams: {} } } },
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

  it('lists the revisions newest first, and is loading until they arrive', async () => {
    await fixture.whenStable();
    expect(component.config.pagedItems()).toEqual([]);
    expect((component.config.isAnyLoading as () => boolean)()).toBe(true);

    revisions.set([1, 3, 2].map(revision => ({
      revision, status: 'deployed', description: '', last_deployed: '2026-01-01T00:00:00Z',
      chart: { name: 'nginx', version: '1.0.0', appVersion: '1.0' },
    })));
    await fixture.whenStable();

    expect(component.config.pagedItems().map(r => r.revision)).toEqual([3, 2, 1]);
    expect((component.config.isAnyLoading as () => boolean)()).toBe(false);
  });
});
