import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule, STORE_TEST_PROVIDERS, CoreTestingModule } from '@test-framework';
import { of } from 'rxjs';

import { CurrentUserPermissionsService } from '../../../core/permissions/current-user-permissions.service';
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
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AboutPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
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

  it('should expose sessionData$ observable', () => {
    expect(component.sessionData$).toBeDefined();
  });

  it('should expose userIsAdmin$ observable', () => {
    expect(component.userIsAdmin$).toBeDefined();
  });

  it('should expose versionNumber$ observable', () => {
    expect(component.versionNumber$).toBeDefined();
  });
});
