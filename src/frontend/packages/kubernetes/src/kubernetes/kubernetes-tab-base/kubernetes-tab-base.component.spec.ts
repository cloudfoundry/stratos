import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute } from '@angular/router';

import { TabNavService } from '../../../../core/src/tab-nav.service';
import { KubernetesBaseTestModules } from '../kubernetes.testing.module';
import { KubernetesTabBaseComponent } from './kubernetes-tab-base.component';

describe('KubernetesTabBaseComponent', () => {
  let component: KubernetesTabBaseComponent;
  let fixture: ComponentFixture<KubernetesTabBaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [KubernetesTabBaseComponent, ...KubernetesBaseTestModules],
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
    }),
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesTabBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
