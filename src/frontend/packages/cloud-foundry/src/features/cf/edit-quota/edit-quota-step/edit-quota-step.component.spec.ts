import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, provideZonelessChangeDetection } from '@angular/core';
import { FormGroup, FormControl } from '@angular/forms';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { throwError } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

import {
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModule,
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateCFEntities } from '@test-framework/cf';
import { EditQuotaStepComponent } from './edit-quota-step.component';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { QuotaDataService } from '../../../../services/endpoint-data/quota-data.service';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';

// Mock QuotaDefinitionFormComponent since it has complex dependencies
@Component({
  selector: 'app-quota-definition-form',
  template: '<div></div>',
  standalone: true
})
class MockQuotaDefinitionFormComponent {
  formGroup = new FormGroup({
    name: new FormControl(''),
    totalServices: new FormControl(0),
    totalRoutes: new FormControl(0),
    memoryLimit: new FormControl(0),
    instanceMemoryLimit: new FormControl(0),
    nonBasicServicesAllowed: new FormControl(false),
    totalReservedRoutePorts: new FormControl(0),
    appInstanceLimit: new FormControl(0),
    totalServiceKeys: new FormControl(0),
    totalPrivateDomains: new FormControl(0),
    appTasksLimit: new FormControl(0),
  });

  valid() { return true; }
}

describe('EditQuotaStepComponent', () => {
  let component: EditQuotaStepComponent;
  let fixture: ComponentFixture<EditQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditQuotaStepComponent,
        MockQuotaDefinitionFormComponent,
        EntityCatalogTestModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        ...STORE_TEST_PROVIDERS,
        EntityCatalogHelper,
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: 'cfGuid',
            orgGuid: 'orgGuid',
            spaceGuid: 'spaceGuid'
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                quotaId: 'quotaId',
                endpointId: 'cfGuid'
              },
              queryParams: {}
            },
          }
        }
      ]
    });

    // Manually initialize EntityCatalogHelper for components that use it in constructor
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    fixture = TestBed.createComponent(EditQuotaStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('names what CF rejected when the update fails', async () => {
    vi.spyOn(TestBed.inject(QuotaDataService), 'updateOrgQuota').mockReturnValue(throwError(() => new HttpErrorResponse({
      error: { errors: [{ code: 10008, title: 'CF-UnprocessableEntity', detail: 'Quota Definition name must be unique' }] },
      status: 422, statusText: 'Unprocessable Entity',
    })));
    component.form = new MockQuotaDefinitionFormComponent() as unknown as QuotaDefinitionFormComponent;

    await expect(component.signalHandle.submit!()).rejects.toThrow('Failed to update quota: Quota Definition name must be unique');
  });
});
