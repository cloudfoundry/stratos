import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCfBaseTestModulesNoShared } from '@test-framework/cf';
import { CfOrgSpaceDataService } from '../../../data-services/cf-org-space-service.service';
import { CreateApplicationStep1Component } from './create-application-step1.component';

describe('CreateApplicationStep1Component', () => {
  let component: CreateApplicationStep1Component;
  let fixture: ComponentFixture<CreateApplicationStep1Component>;

  async function setup(endpointGuid: string | null) {
    await TestBed.configureTestingModule({
      imports: [
        CreateApplicationStep1Component,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(generateCfBaseTestModulesNoShared()),
        CfOrgSpaceDataService,
        {
          provide: ActivatedRoute,
          useValue: {
            root: {
              snapshot: {
                queryParams: { endpointGuid },
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateApplicationStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('should be created', async () => {
    await setup(null);
    expect(component).toBeTruthy();
  });

  it('does not lock the CF dropdown when not scoped to an endpoint', async () => {
    await setup(null);
    expect(component.endpointScoped).toBe(false);
  });

  it('pre-selects and locks the CF dropdown when scoped to an endpoint', async () => {
    await setup('cf-endpoint-guid');
    expect(component.endpointScoped).toBe(true);
    expect(component.cfOrgSpaceService.cf.select()).toBe('cf-endpoint-guid');
  });
});
