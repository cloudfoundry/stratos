import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  EntityCatalogHelper,
  EntityCatalogHelpers,
  EntityCatalogTestModuleManualStore,
  StratosCatalogEndpointEntity,
  TEST_CATALOGUE_ENTITIES,
  entityCatalog,
  generateStratosEntities,
} from '@stratosui/store';
import { createBasicStoreModule, seedEndpointsDataService, STORE_TEST_PROVIDERS, testSCFEndpoint, testSCFEndpointGuid } from '@stratosui/store/testing';
import { By } from '@angular/platform-browser';
import { EndpointCertificatesComponent } from '../../certificates/endpoint-certificates.component';
import { EditEndpointStepComponent } from './edit-endpoint-step.component';

describe('EditEndpointStepComponent', () => {
  let component: EditEndpointStepComponent;
  let fixture: ComponentFixture<EditEndpointStepComponent>;
  let activatedRoute: any;

  beforeEach(async () => {
    // Create mutable route object with test endpoint GUID
    activatedRoute = {
      snapshot: {
        params: { id: testSCFEndpointGuid },
        queryParams: {}
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(), // This includes the test endpoint in initial state
        EditEndpointStepComponent,
        EntityCatalogTestModuleManualStore,
      ],
      providers: [
        EntityCatalogHelper,
        {
          provide: ActivatedRoute,
          useValue: activatedRoute
        },
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useFactory: generateStratosEntities
        },
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper AFTER TestBed is configured
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    // The form renders once the endpoint's type is in the catalog.
    entityCatalog.register(new StratosCatalogEndpointEntity({
      type: 'cf',
      label: 'Cloud Foundry',
      labelPlural: 'Cloud Foundry',
      logoUrl: '/core/assets/endpoint-icons/cloudfoundry.svg',
      authTypes: [],
    }, entity => `/cloud-foundry/${entity.guid}/summary`));

    // Seed the signal-native EndpointsDataService with the endpoint under
    // edit so the component (which reads `endpointsData.endpointsList`) finds
    // it by route id. Replaces the legacy ngrx `store.dispatch` seeding.
    const testEndpointWithClientId = {
      ...testSCFEndpoint,
      guid: testSCFEndpointGuid,
      client_id: '',  // Form expects a string value, not undefined
      skip_ssl_validation: false,
      ca_cert: 'STORED-CA-CERT',
      api_endpoint: {
        Scheme: 'https',
        Opaque: '',
        User: null,
        Host: 'api.test.com',
        Path: '',
        RawPath: '',
        ForceQuery: false,
        RawQuery: '',
        Fragment: ''
      }
    };

    seedEndpointsDataService([testEndpointWithClientId]);
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(EditEndpointStepComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    if (component) {
      component.ngOnDestroy();
    }
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('labels the CA certificate box with its caption', () => {
    const root: HTMLElement = fixture.nativeElement;
    const box = root.querySelector('textarea[formControlName="caCert"]');
    expect(box?.id, 'box has an id').toBeTruthy();
    expect(root.querySelector(`label[for="${box!.id}"]`)?.textContent?.trim()).toBe('Specify CA Certificate:');
  });

  // jetstream sends the stored certificate as ca_cert. Missing it, the
  // form showed no certificate and saving cleared the stored one.
  it('shows the stored CA certificate', () => {
    expect(component.showCACertField()).toBe(true);
    expect(component.editEndpoint.controls.caCert.value).toBe('STORED-CA-CERT');
  });
  // app-form-field shows a field's <app-error> text as its error line.
  it('says the name is required once it is cleared', async () => {
    await fixture.whenStable();
    const host: HTMLElement = fixture.nativeElement;
    const name = host.querySelector<HTMLInputElement>('#name')!;
    name.value = '';
    name.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    const id = name.getAttribute('aria-errormessage');
    expect(id && host.querySelector(`#${id}`)?.textContent?.trim()).toBe('Name is required');
  });

  describe('certificate cards', () => {
    const cards = () => fixture.debugElement.query(By.directive(EndpointCertificatesComponent));

    it('shows certificate cards for the CA in the form', async () => {
      await fixture.whenStable();
      const card = cards();
      expect(card, 'cards are shown').toBeTruthy();
      const cmp = card.componentInstance as EndpointCertificatesComponent;
      expect(cmp.pem()).toBe('STORED-CA-CERT');
      expect(cmp.endpointGuid()).toBe(testSCFEndpointGuid);
      expect(fixture.nativeElement.textContent).toContain('Applies to the endpoint address and its login server (UAA).');
    });

    it('passes edits of the CA control to the cards', async () => {
      await fixture.whenStable();
      component.editEndpoint.controls.caCert.setValue('EDITED-PEM');
      await fixture.whenStable();
      expect((cards().componentInstance as EndpointCertificatesComponent).pem()).toBe('EDITED-PEM');
    });

    it('passes an empty pem when the CA certificate is switched off', async () => {
      await fixture.whenStable();
      component.toggleCACertField();
      await fixture.whenStable();
      expect((cards().componentInstance as EndpointCertificatesComponent).pem()).toBe('');
      expect(fixture.nativeElement.textContent).toContain('Applies to the endpoint address and its login server (UAA).');
    });
  });
});
