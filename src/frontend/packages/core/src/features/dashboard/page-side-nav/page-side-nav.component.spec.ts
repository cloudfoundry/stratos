import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { STORE_TEST_PROVIDERS, BASE_TEST_PROVIDERS } from "@test-framework/core-test.helper";

import { EntityMonitorFactory, EntityServiceFactory } from '@stratosui/store';
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
        EntityServiceFactory,
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
});
