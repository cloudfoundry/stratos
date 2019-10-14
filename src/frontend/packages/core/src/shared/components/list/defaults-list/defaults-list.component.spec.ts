import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { PaginatedAction } from '../../../../../../store/src/types/pagination.types';
import { CoreTestingModule } from '../../../../../test-framework/core-test.modules';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { STRATOS_ENDPOINT_TYPE, userFavoritesEntitySchema } from '../../../../base-entity-schemas';
import { MDAppModule } from '../../../../core/md.module';
import { SharedModule } from '../../../shared.module';
import { DefaultsListComponent } from './defaults-list.component';

describe('DefaultsListComponent', () => {
  let component: DefaultsListComponent<any, any>;
  let fixture: ComponentFixture<DefaultsListComponent<any, any>>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        CoreTestingModule,
        SharedModule,
        createBasicStoreModule(),
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultsListComponent);
    component = fixture.componentInstance;
    component.actionOrConfig = {
      endpointType: STRATOS_ENDPOINT_TYPE,
      entityType: userFavoritesEntitySchema.entityType,
      endpointGuid: '123',
      paginationKey: '123',
      type: 'mock action'
    } as PaginatedAction;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
