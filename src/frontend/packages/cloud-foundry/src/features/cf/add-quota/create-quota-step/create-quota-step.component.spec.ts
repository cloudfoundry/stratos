import { readFileSync } from 'fs';
import { join } from 'path';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpErrorResponse, provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { firstValueFrom, throwError } from 'rxjs';

import { StepComponent } from '@stratosui/core';

import { EntityCatalogHelper, EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES, generateStratosEntities } from '@stratosui/store';
import { generateCFEntities } from '@test-framework/cf';
import { CreateQuotaStepComponent } from './create-quota-step.component';
import { QuotaDefinitionFormComponent } from '../../quota-definition-form/quota-definition-form.component';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { QuotaDataService } from '../../../../services/endpoint-data/quota-data.service';

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

  // nginx's own 502 page, as a proxy in front of Stratos sends it.
  it('keeps an error page\'s heading after its lead-in when the create fails', async () => {
    await fixture.whenStable();
    const page = readFileSync(join(import.meta.dirname, '../../../../../../store/src/testdata/upstream-errors/nginx-502.body'), 'utf8');
    vi.spyOn(TestBed.inject(QuotaDataService), 'createOrgQuota')
      .mockReturnValue(throwError(() => new HttpErrorResponse({ error: page, status: 502, statusText: 'Bad Gateway' })));
    const step = TestBed.createComponent(StepComponent).componentInstance;
    step.signalHandle = component.signalHandle;

    const result = await firstValueFrom(step.invokeNext(0));

    expect(result.success).toBe(false);
    expect(result.message).toBe('Failed to create quota: 502 Bad Gateway\nnginx/1.28.0');
    expect(result.messagePieces).toEqual([
      { text: 'Failed to create quota: ', style: 'text' },
      { text: '502 Bad Gateway', style: 'heading' },
      { text: '\nnginx/1.28.0', style: 'text' },
    ]);
  });
});
