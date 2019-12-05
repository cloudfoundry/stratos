import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEndpointSelectPageComponent } from './api-endpoint-select-page.component';
import { SharedModule } from '../../../shared/shared.module';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';
import { CoreModule } from '../../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { TabNavService } from '../../../../tab-nav.service';
import { EntityCatalogueModule } from '../../../core/entity-catalogue.module';
import { generateStratosEntities } from '../../../base-entity-types';

describe('ApiEndpointSelectPageComponent', () => {
  let component: ApiEndpointSelectPageComponent;
  let fixture: ComponentFixture<ApiEndpointSelectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        EntityCatalogueModule.forFeature(generateStratosEntities),
        CoreModule,
        RouterTestingModule,
        SharedModule,
        createBasicStoreModule(),
        ApiDrivenViewsModule,
      ],
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiEndpointSelectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
