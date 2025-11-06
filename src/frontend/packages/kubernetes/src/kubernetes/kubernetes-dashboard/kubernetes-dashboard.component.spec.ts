import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { TabNavService } from '../../../../core/src/tab-nav.service';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesDashboardTabComponent } from './kubernetes-dashboard.component';

describe('KubernetesDashboardTabComponent', () => {
  let component: KubernetesDashboardTabComponent;
  let fixture: ComponentFixture<KubernetesDashboardTabComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesDashboardTabComponent],
      imports: [...KubernetesBaseTestModules],
      providers: [
        TabNavService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                endpointId: 'anything'
              },
              queryParams: {}
            }
          }
        }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesDashboardTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
