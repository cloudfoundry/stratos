import { readFileSync } from 'fs';
import { join } from 'path';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';

import { cfCurrentUserPermissionsService } from '@stratosui/cloud-foundry';
import { StepComponent } from '@stratosui/core';
import { TEST_CATALOGUE_ENTITIES, generateStratosEntities, EntityCatalogTestModule, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid } from '@stratosui/store/testing';
import { generateCFEntities, generateTestCfEndpointServiceProvider, CloudFoundryOrganizationServiceMock } from '@test-framework/cf';
import { CnsiOrgsSource } from '../../../../services/data-sources/cnsi-orgs-source';
import { CloudFoundryOrganizationService } from '../../services/cloud-foundry-organization.service';
import { CloudFoundryUserProvidedServicesService } from '../../../../shared/services/cloud-foundry-user-provided-services.service';
import { EditOrganizationStepComponent } from './edit-organization-step.component';

describe('EditOrganizationStepComponent', () => {
  let component: EditOrganizationStepComponent;
  let fixture: ComponentFixture<EditOrganizationStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditOrganizationStepComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities()
          ]
        },
        ...cfCurrentUserPermissionsService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: { endpointId: testSCFEndpointGuid },
              queryParams: {}
            }
          }
        },
        generateTestCfEndpointServiceProvider(),
        { provide: CloudFoundryOrganizationService, useClass: CloudFoundryOrganizationServiceMock },
        CloudFoundryUserProvidedServicesService,
      ]
    })
      .compileComponents();

    // Initialize Entity Catalog Helper AFTER compileComponents
    const ech = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(ech);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditOrganizationStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // app-form-field shows a field's <app-error> text as its error line.
  it('says a taken organization name exists', async () => {
    component.allOrgsInEndpoint = ['taken'];
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input[formcontrolname="orgName"]')!;
    input.value = 'taken';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    const id = input.getAttribute('aria-errormessage');
    expect(id && host.querySelector(`#${id}`)?.textContent?.trim()).toBe(
      'An organization with this name already exists. Please enter a different one.'
    );
  });

  // nginx's own 502 page, as a proxy in front of Stratos sends it.
  it('keeps an error page\'s heading after its lead-in when the update fails', async () => {
    const page = readFileSync(join(import.meta.dirname, '../../../../../../store/src/testdata/upstream-errors/nginx-502.body'), 'utf8');
    vi.spyOn(CnsiOrgsSource.prototype, 'update')
      .mockRejectedValue(new HttpErrorResponse({ error: page, status: 502, statusText: 'Bad Gateway' }));
    const step = TestBed.createComponent(StepComponent).componentInstance;
    step.signalHandle = component.signalHandle;

    const result = await firstValueFrom(step.invokeNext(0));

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to update organization: 502 Bad Gateway\nnginx/1.28.0');
    expect(result.messagePieces).toEqual([
      { text: 'Failed to update organization: ', style: 'text' },
      { text: '502 Bad Gateway', style: 'heading' },
      { text: '\nnginx/1.28.0', style: 'text' },
    ]);
  });
});
