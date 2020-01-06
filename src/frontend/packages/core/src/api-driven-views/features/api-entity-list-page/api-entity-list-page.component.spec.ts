import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEntityListPageComponent } from './api-entity-list-page.component';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';
import { RouterTestingModule } from '@angular/router/testing';
import { EntityCatalogueModule } from '../../../core/entity-catalogue.module';
import { generateStratosEntities } from '../../../base-entity-types';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';

describe('ApiEntityListPageComponent', () => {
  let component: ApiEntityListPageComponent;
  let fixture: ComponentFixture<ApiEntityListPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        EntityCatalogueModule.forFeature(generateStratosEntities),
        CoreModule,
        RouterTestingModule,
        SharedModule,
        createBasicStoreModule(),
        ApiDrivenViewsModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiEntityListPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
