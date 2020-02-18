import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SimpleListComponent } from './simple-list.component';
import { SharedModule } from '../../../shared.module';
import { CoreModule } from '../../../../core/core.module';
import { AppReducersModule } from '../../../../../../store/src/reducers.module';
import { StratosCatalogEntity, StratosCatalogEndpointEntity } from '../../../../../../store/src/entity-catalog/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from '../../../../../../store/src/entity-catalog/entity-catalog.types';
import { EntitySchema } from '../../../../../../store/src/helpers/entity-schema';
import { EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '../../../../../../store/src/entity-catalog-test.module';
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
