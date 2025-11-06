import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { HelmReleaseGuidMock } from '../../../../../helm/helm-testing.module';
import { HelmReleaseHelperService } from '../helm-release-helper.service';
import { HelmReleaseHistoryTabComponent } from './helm-release-history-tab.component';

describe('HelmReleaseHistoryTabComponent', () => {
  let component: HelmReleaseHistoryTabComponent;
  let fixture: ComponentFixture<HelmReleaseHistoryTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        HelmReleaseHistoryTabComponent
      ]providers: [
        
        HelmReleaseHelperService,
        HelmReleaseGuidMock
      ,
        provideZonelessChangeDetection()
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseHistoryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
