import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleListComponent } from './simple-list.component';
import { SharedModule } from '../../../shared.module';
import { CoreModule } from '../../../../core/core.module';
import { AppReducersModule } from '../../../../../../store/src/reducers.module';
import { StratosCatalogueEntity, StratosCatalogueEndpointEntity } from '../../../../core/entity-catalogue/entity-catalogue-entity';
import { StratosEndpointExtensionDefinition } from '../../../../core/entity-catalogue/entity-catalogue.types';
import { EntitySchema } from '../../../../../../store/src/helpers/entity-schema';
import { EntityCatalogueTestModule, TEST_CATALOGUE_ENTITIES } from '../../../../core/entity-catalogue-test.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

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

  const catalogueEntityEndpoint = new StratosCatalogueEndpointEntity(endpoint);
  const ceType = 'testCatalogueEntity';
  const catalogueEntity = new StratosCatalogueEntity({
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
          ngModule: EntityCatalogueTestModule,
          providers: [
            {
              provide: TEST_CATALOGUE_ENTITIES, useValue: [
                catalogueEntityEndpoint,
                catalogueEntity
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
    component.catalogueEntity = catalogueEntity;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
