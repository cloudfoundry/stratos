import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { TabNavService } from 'frontend/packages/core/src/tab-nav.service';

import { generateBaseTestStoreModules } from '../../../../test-framework/core-test.helper';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';
import { ApiEntityTypeSelectPageComponent } from './api-entity-type-select-page.component';

describe('ApiEntityTypeSelectPageComponent', () => {
  let component: ApiEntityTypeSelectPageComponent;
  let fixture: ComponentFixture<ApiEntityTypeSelectPageComponent>;

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
    fixture = TestBed.createComponent(ApiEntityTypeSelectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
