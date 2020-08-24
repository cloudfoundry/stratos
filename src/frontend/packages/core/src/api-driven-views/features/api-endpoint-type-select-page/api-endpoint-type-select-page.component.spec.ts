import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { generateBaseTestStoreModules } from '../../../../test-framework/core-test.helper';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';
import { ApiEndpointTypeSelectPageComponent } from './api-endpoint-type-select-page.component';

describe('ApiEndpointTypeSelectPageComponent', () => {
  let component: ApiEndpointTypeSelectPageComponent;
  let fixture: ComponentFixture<ApiEndpointTypeSelectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateBaseTestStoreModules(),
        CoreModule,
        RouterTestingModule,
        SharedModule,
        ApiDrivenViewsModule,
      ],
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiEndpointTypeSelectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
