import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '@stratosui/store-test.module';
import {
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '@stratosui/store';
import { StratosEndpointExtensionDefinition } from '@stratosui/store';
import { EntitySchema } from '@stratosui/store';
import { AppReducersModule } from '.@stratosui/store';
import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../shared.module';
import { SimpleListComponent } from './simple-list.component';

describe('SimpleListComponent', () => {
  let component: SimpleListComponent;
  let fixture: ComponentFixture<SimpleListComponent>;

  const endpoint = {
    type: 'test',
    label: 'test test',
    labelPlural: 'test tests',
    icon: 'test',
    logoUrl: '/test',
    authTypes: [],
  } as StratosEndpointExtensionDefinition;

  const catalogEntityEndpoint = new StratosCatalogEndpointEntity(endpoint);
  const ceType = 'testCatalogEntity';
  const catalogEntity = new StratosCatalogEntity({
    type: ceType,
    schema: new EntitySchema('key', endpoint.type),
    endpoint,
  }, {
    entityBuilder: {
      getLines: () => ([]),
      getMetadata: () => ({ name: 'test' }),
      getGuid: () => 'test',
    },
    actionBuilders: {
      getMultiple: () => ({
        type: 'testAction',
        paginationKey: 'testPagKey',
        entityType: ceType,
        endpointType: endpoint.type
      })
    }
  });

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        SharedModule,
        CoreModule,
        AppReducersModule,
        RouterTestingModule,
        SharedModule,
        NoopAnimationsModule,
        {
          ngModule: EntityCatalogTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES, useValue: [
                catalogEntityEndpoint,
                catalogEntity
              ]
            }
          ]
        }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SimpleListComponent);
    component = fixture.componentInstance;
    component.catalogEntity = catalogEntity;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
