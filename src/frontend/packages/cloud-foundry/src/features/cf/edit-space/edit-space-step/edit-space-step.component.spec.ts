import { readFileSync } from 'fs';
import { join } from 'path';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { firstValueFrom } from 'rxjs';

import {
  TEST_CATALOGUE_ENTITIES,
  generateStratosEntities,
  EntityCatalogTestModule,
  EntityCatalogHelper,
  EntityCatalogHelpers,
} from '@stratosui/store';
import { STORE_TEST_PROVIDERS, testSCFEndpointGuid, populateStoreWithTestEndpoint } from '@stratosui/store/testing';
import { generateTestCfEndpointServiceProvider, ActiveRouteCfOrgSpace, CloudFoundrySpaceServiceMock } from "@test-framework/cf";
import { generateCFEntities } from '@stratosui/cloud-foundry';
import { StepComponent } from '@stratosui/core';
import { CnsiSpacesSource } from '../../../../services/data-sources/cnsi-spaces-source';
import { CloudFoundrySpaceService } from '../../services/cloud-foundry-space.service';
import { EditSpaceStepComponent } from "./edit-space-step.component";

describe('EditSpaceStepComponent', () => {
  let component: EditSpaceStepComponent;
  let fixture: ComponentFixture<EditSpaceStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditSpaceStepComponent,
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
        ...generateTestCfEndpointServiceProvider(testSCFEndpointGuid),
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: {
            cfGuid: testSCFEndpointGuid,
            orgGuid: testSCFEndpointGuid,
            spaceGuid: testSCFEndpointGuid
          }
        },
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const entityCatalogHelper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(entityCatalogHelper);

    populateStoreWithTestEndpoint();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditSpaceStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // app-form-field shows a field's <app-error> text as its error line.
  it('says a taken space name exists', async () => {
    // Another space in the org has the name.
    component.isNameUnique = () => false;
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input[formcontrolname="spaceName"]')!;
    input.value = 'taken';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    const id = input.getAttribute('aria-errormessage');
    expect(id && host.querySelector(`#${id}`)?.textContent?.trim()).toBe(
      'A space with this name already exists. Please enter a different one.'
    );
  });

  // nginx's own 502 page, as a proxy in front of Stratos sends it.
  const page = () => readFileSync(join(import.meta.dirname, '../../../../../../store/src/testdata/upstream-errors/nginx-502.body'), 'utf8');
  const nginx502 = (lead: string) => [
    { text: `${lead}: `, style: 'text' },
    { text: '502 Bad Gateway', style: 'heading' },
    { text: '\nnginx/1.28.0', style: 'text' },
  ];
  function stepFor() {
    const step = TestBed.createComponent(StepComponent).componentInstance;
    step.signalHandle = component.signalHandle;
    return step;
  }

  it('keeps an error page\'s heading after its lead-in when the update fails', async () => {
    vi.spyOn(CnsiSpacesSource.prototype, 'update')
      .mockRejectedValue(new HttpErrorResponse({ error: page(), status: 502, statusText: 'Bad Gateway' }));

    const result = await firstValueFrom(stepFor().invokeNext(0));

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to update space: 502 Bad Gateway\nnginx/1.28.0');
    expect(result.messagePieces).toEqual(nginx502('Failed to update space'));
  });

  it('keeps an error page\'s heading after its lead-in when the quota change fails', async () => {
    vi.spyOn(CnsiSpacesSource.prototype, 'update').mockResolvedValue({} as never);
    TestBed.inject(CloudFoundrySpaceService).spaceDataService.patch = vi.fn();
    component.editSpaceForm.patchValue({ quotaDefinition: 'quota-1' });
    const httpMock = TestBed.inject(HttpTestingController);

    const pending = firstValueFrom(stepFor().invokeNext(0));
    await vi.waitFor(() => httpMock.expectOne(r => r.method === 'POST')
      .flush(page(), { status: 502, statusText: 'Bad Gateway' }));
    const result = await pending;

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to update space quota: 502 Bad Gateway\nnginx/1.28.0');
    expect(result.messagePieces).toEqual(nginx502('Failed to update space quota'));
  });
});
