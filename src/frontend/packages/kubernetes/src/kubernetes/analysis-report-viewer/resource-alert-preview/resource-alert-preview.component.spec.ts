import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ResourceAlertPreviewComponent } from './resource-alert-preview.component';
import { ResourceAlertViewComponent } from './resource-alert-view/resource-alert-view.component';
import { SidePanelService } from '@stratosui/core';
import { KubernetesBaseTestModules } from '../../kubernetes.testing.module';

describe('ResourceAlertPreviewComponent', () => {
  let component: ResourceAlertPreviewComponent;
  let fixture: ComponentFixture<ResourceAlertPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({imports: [
        KubernetesBaseTestModules,

        ResourceAlertPreviewComponent,
        ResourceAlertViewComponent,
      ],
      providers: [

        SidePanelService,

        provideZonelessChangeDetection(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: 'test' },
              queryParams: {}
            }
          }
        }
      ]
    }).compileComponents();
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
