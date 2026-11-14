import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, CoreTestingModule } from '@test-framework';

import { By } from '@angular/platform-browser';
import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
import { AuthSignalService } from '../../../core/signals/auth-signal.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { TabNavService } from '../../../tab-nav.service';
import { AboutPageComponent } from './about-page.component';

describe('AboutPageComponent', () => {
  let component: AboutPageComponent;
  let fixture: ComponentFixture<AboutPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CoreTestingModule,
        RouterTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        AboutPageComponent,
      ],
      providers: [
        TabNavService,
        CurrentUserPermissionsService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
        // The page renders its body once a session is known.
        { provide: AuthSignalService, useValue: { sessionData: signal({ valid: true, user: { name: 'tester', admin: false }, version: { proxy_version: '1.0.0' } }) } },
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // The page title and the section labels looked like headings but were
  // plain text (WCAG 1.3.1).
  it('has a page heading and a heading per section', async () => {
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    // The header renders through a portal; instantiate its template to see the projected title.
    const header: PageHeaderComponent = fixture.debugElement.query(By.directive(PageHeaderComponent)).componentInstance;
    const headerView = header.pageHeaderTmpl().createEmbeddedView({});
    headerView.detectChanges();
    const h1 = headerView.rootNodes.map((node: Node) => (node as HTMLElement).querySelector?.('h1')).find(Boolean);
    expect(h1?.textContent?.trim()).toBe('About');
    headerView.destroy();
    const sections = Array.from(root.querySelectorAll('h2')).map(h => h.textContent?.trim());
    expect(sections).toEqual(['Frontend', 'Backend', 'Signed in as']);
  });

  it('should expose buildInfo from BUILD_INFO token', () => {
    expect(component.buildInfo).toBeDefined();
    expect(component.buildInfo.version).toBeDefined();
    expect(component.buildInfo.gitCommit).toBeDefined();
    expect(component.buildInfo.gitBranch).toBeDefined();
    expect(component.buildInfo.buildDate).toBeDefined();
  });

  it('should have non-empty build info fields', () => {
    expect(component.buildInfo.version.length).toBeGreaterThan(0);
    expect(component.buildInfo.gitCommit.length).toBeGreaterThan(0);
    expect(component.buildInfo.gitBranch.length).toBeGreaterThan(0);
    expect(component.buildInfo.buildDate.length).toBeGreaterThan(0);
  });

  it('should derive the version and admin flag from the session', () => {
    expect(component.versionNumber()).toBe('1.0.0');
    expect(component.userIsAdmin()).toBe(false);
  });

  it('should expose angularVersion matching semver', () => {
    expect(component.angularVersion).toBeDefined();
    expect(component.angularVersion).toMatch(/^\d+\.\d+\.\d+/);
  });
});
