import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import {
  BooleanIndicatorComponent,
} from '../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import {
  CopyToClipboardComponent,
} from '../../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { generateCfBaseTestModulesNoShared, STORE_TEST_PROVIDERS } from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CloudFoundrySpaceServiceMock } from "@test-framework/cloud-foundry-space.service.mock";
import { generateCFEntities } from '../../../../cf-entity-generator';
import { CloudFoundrySpaceService } from '../../../../features/cf/services/cloud-foundry-space.service';
import { CardCfSpaceDetailsComponent } from './card-cf-space-details.component';
describe('CardCfSpaceDetailsComponent', () => {
  let component: CardCfSpaceDetailsComponent;
  let fixture: ComponentFixture<CardCfSpaceDetailsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardCfSpaceDetailsComponent,
        MetadataItemComponent,
        CopyToClipboardComponent,
        BooleanIndicatorComponent,
        ...generateCfBaseTestModulesNoShared(),
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES,
              useValue: [
                ...generateCFEntities(),
                ...generateStratosEntities(),
              ]
            }
          ]
        },
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock },
        provideZonelessChangeDetection(),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfSpaceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
