import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TabNavService } from 'frontend/packages/core/tab-nav.service';
import { generateBaseTestStoreModules } from 'frontend/packages/core/test-framework/core-test.helper';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';
import { ApiEndpointSelectPageComponent } from './api-endpoint-select-page.component';

describe('ApiEndpointSelectPageComponent', () => {
  let component: ApiEndpointSelectPageComponent;
  let fixture: ComponentFixture<ApiEndpointSelectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateBaseTestStoreModules(),
        CoreModule,
        RouterTestingModule,
        SharedModule,
        ApiDrivenViewsModule,
      ],
      providers: [
        TabNavService,
      ]
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
