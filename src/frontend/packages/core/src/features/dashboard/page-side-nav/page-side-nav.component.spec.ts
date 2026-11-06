import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { Subject } from 'rxjs';
import { STORE_TEST_PROVIDERS, BASE_TEST_PROVIDERS } from "@test-framework/core-test.helper";

import { BaseTestModulesNoShared } from "@test-framework/core-test.helper";
import { CurrentUserPermissionsService } from '@stratosui/core';
import { TabNavService } from '../../../tab-nav.service';
import { PageSideNavComponent } from './page-side-nav.component';

describe('PageSideNavComponent', () => {
  let component: PageSideNavComponent;
  let fixture: ComponentFixture<PageSideNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        BaseTestModulesNoShared,
        PageSideNavComponent,
      ],
      providers: [
        ...BASE_TEST_PROVIDERS,
        TabNavService,
        CurrentUserPermissionsService,
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageSideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a gated tab only once hidden$ has answered false', () => {
    const hidden$ = new Subject<boolean>();
    fixture.componentRef.setInput('tabs', [
      { link: 'summary', label: 'Summary' },
      { link: 'variables', label: 'Variables', hidden$ },
    ]);
    fixture.detectChanges();
    const gated = () => fixture.nativeElement.querySelector('[data-test="page-tab-Variables"]');

    // An ungated tab shows at once; a gated one waits for its answer.
    expect(fixture.nativeElement.querySelector('[data-test="page-tab-Summary"]')).not.toBeNull();
    expect(gated()).toBeNull();

    hidden$.next(false);
    fixture.detectChanges();
    expect(gated()).not.toBeNull();

    hidden$.next(true);
    fixture.detectChanges();
    expect(gated()).toBeNull();
  });
});
