import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityCatalogHelper, EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { generateCFEntities } from '@test-framework/cf';
import { CreateQuotaStepComponent } from './create-quota-step.component';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

describe('CreateQuotaStepComponent', () => {
  let component: CreateQuotaStepComponent;
  let fixture: ComponentFixture<CreateQuotaStepComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CreateQuotaStepComponent,
        QuotaDefinitionFormComponent,
        EntityCatalogTestModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
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
        }
      ]
    });

    fixture = TestBed.createComponent(CreateQuotaStepComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  // app-form-field shows a field's <app-error> text as its error line.
  it('says a taken quota name exists', async () => {
    await fixture.whenStable();
    component.form.allQuotas = ['taken'];
    const host: HTMLElement = fixture.nativeElement;
    const input = host.querySelector<HTMLInputElement>('input[formcontrolname="name"]')!;
    input.value = 'taken';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();

    const id = input.getAttribute('aria-errormessage');
    expect(id && host.querySelector(`#${id}`)?.textContent?.trim()).toBe(
      'A quota with this name already exists. Please enter a different one.'
    );
  });
});
