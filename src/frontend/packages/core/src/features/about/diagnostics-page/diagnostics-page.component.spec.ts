import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthDataService } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, CoreTestingModule } from '@test-framework';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { TabNavService } from '../../../tab-nav.service';
import { DiagnosticsPageComponent } from './diagnostics-page.component';

describe('DiagnosticsPageComponent', () => {
  let component: DiagnosticsPageComponent;
  let fixture: ComponentFixture<DiagnosticsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CoreTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        DiagnosticsPageComponent,
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService,
        ...STORE_TEST_PROVIDERS,
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(DiagnosticsPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The page waits for a session with diagnostics, then shows the Helm
  // release time and, to an admin, the user section.
  it('shows the diagnostics once the session has them', async () => {
    const text = () => (fixture.nativeElement as HTMLElement).textContent!.replace(/\s+/g, ' ');
    expect(text()).not.toContain('Kubernetes');

    (TestBed.inject(AuthDataService) as any)._auth.update((a: object) => ({
      ...a,
      sessionData: {
        user: { name: 'tester', admin: true },
        version: { proxy_version: '1.2.3-4' },
        config: {},
        diagnostics: {
          deploymentType: 'Kubernetes',
          helmLastModified: 'seconds:1700049600',
          databaseMigrations: [],
        },
      },
    }));
    await fixture.whenStable();
    expect(text()).toContain('Kubernetes');
    expect(text()).toContain('1.2.3-4');
    expect(text()).toContain('Nov 15, 2023');
    expect(text()).toContain('tester');
    expect(text()).toContain('(admin)');
  });
});
