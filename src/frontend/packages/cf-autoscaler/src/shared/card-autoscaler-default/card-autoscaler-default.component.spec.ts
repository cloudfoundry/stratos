import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CUSTOM_ELEMENTS_SCHEMA, importProvidersFrom, provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ApplicationServiceMock, ApplicationStateService } from "@test-framework/cf";
import { ApplicationService } from '@stratosui/cloud-foundry';
import { CoreModule } from '@stratosui/core';
import { generateBaseTestStoreModules } from '@test-framework/core-test.helper';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { CardAutoscalerDefaultComponent } from './card-autoscaler-default.component';

// FWT-959 wave-3 (A-effects-cleanup): the card used to consume policy
// data through EntityServiceFactory + GetAppAutoscalerPolicyAction. With
// the @ngrx surface gone the spec only needs to provide the HttpClient
// testing harness — the AutoscalerPolicyDataService is providedIn:
// 'root' and resolves automatically. We drain the policy GET in
// afterEach with a 404 so the data service settles into the "no policy"
// state matching legacy test behaviour (no policy data was previously
// emitted by the EntityServiceFactory mock either).
describe('CardAutoscalerDefaultComponent', () => {
  let component: CardAutoscalerDefaultComponent;
  let fixture: ComponentFixture<CardAutoscalerDefaultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardAutoscalerDefaultComponent,
      ],
      providers: [
        importProvidersFrom(
          CfAutoscalerTestingModule,
          ...generateBaseTestStoreModules(),
          CoreModule,
          NoopAnimationsModule
        ),
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAutoscalerDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    const httpMock = TestBed.inject(HttpTestingController);
    httpMock.match(() => true).forEach(req =>
      req.flush('Not Found', { status: 404, statusText: 'Not Found' }),
    );
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
