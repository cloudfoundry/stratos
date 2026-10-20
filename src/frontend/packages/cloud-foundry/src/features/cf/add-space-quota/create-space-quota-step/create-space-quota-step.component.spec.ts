import { importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CoreModule } from '@stratosui/core';
import { generateTestCfEndpointServiceProvider, generateCfActiveRouteMock, CloudFoundryTestingModule } from '@test-framework/cloud-foundry-endpoint-service.helper';
import { CreateSpaceQuotaStepComponent } from './create-space-quota-step.component';

describe('CreateSpaceQuotaStepComponent', () => {
  let component: CreateSpaceQuotaStepComponent;
  let fixture: ComponentFixture<CreateSpaceQuotaStepComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CreateSpaceQuotaStepComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          CoreModule,
          NoopAnimationsModule,
          CloudFoundryTestingModule
        ),
        ...generateTestCfEndpointServiceProvider(),
        generateCfActiveRouteMock(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateSpaceQuotaStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // app-form-field shows a field's <app-error> text as its error line.
  it('says a taken space quota name exists', async () => {
    component.form.allQuotas = ['taken'];
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input[formcontrolname="name"]')!;
    input.value = 'taken';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    const id = input.getAttribute('aria-errormessage');
    expect(id && host.querySelector(`#${id}`)?.textContent?.trim()).toBe(
      'A space quota with this name already exists. Please enter a different one.'
    );
  });
});
