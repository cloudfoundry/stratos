import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEntityTypeSelectPageComponent } from './api-entity-type-select-page.component';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';
import { RouterTestingModule } from '@angular/router/testing';
import { EntityCatalogModule } from '../../../../../store/src/entity-catalog.module';
import { generateStratosEntities } from '../../../base-entity-types';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { createBasicStoreModule } from '@stratos/store/testing';
import { TabNavService } from '../../../../tab-nav.service';

describe('ApiEntityTypeSelectPageComponent', () => {
  let component: ApiEntityTypeSelectPageComponent;
  let fixture: ComponentFixture<ApiEntityTypeSelectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        EntityCatalogModule.forFeature(generateStratosEntities),
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
    fixture = TestBed.createComponent(ApiEntityTypeSelectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
