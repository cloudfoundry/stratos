import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ResourceAlertPreviewComponent } from './resource-alert-preview.component';
import { ResourceAlertViewComponent } from './resource-alert-view/resource-alert-view.component';
import { SidePanelService } from 'src/frontend/packages/core/src/shared/services/side-panel.service';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';

describe('ResourceAlertPreviewComponent', () => {
  let component: ResourceAlertPreviewComponent;
  let fixture: ComponentFixture<ResourceAlertPreviewComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ ResourceAlertPreviewComponent, ResourceAlertViewComponent ],
      imports: [
        KubernetesBaseTestModules,
      ],
      providers: [
        SidePanelService,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ResourceAlertPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
