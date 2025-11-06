import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { HelmReleaseProviders, KubernetesBaseTestModules } from '../../../../kubernetes.testing.module';
import { HelmReleaseNotesTabComponent } from './helm-release-notes-tab.component';

describe('HelmReleaseNotesTabComponent', () => {
  let component: HelmReleaseNotesTabComponent;
  let fixture: ComponentFixture<HelmReleaseNotesTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [
        HelmReleaseNotesTabComponent
      ],
      providers: [
        ...HelmReleaseProviders
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseNotesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
