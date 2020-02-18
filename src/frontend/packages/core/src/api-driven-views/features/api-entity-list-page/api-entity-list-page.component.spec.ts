import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { generateBaseTestStoreModules } from '../../../../test-framework/core-test.helper';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';
import { ApiEntityListPageComponent } from './api-entity-list-page.component';

describe('ApiEntityListPageComponent', () => {
  let component: ApiEntityListPageComponent;
  let fixture: ComponentFixture<ApiEntityListPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...generateBaseTestStoreModules(),
        CoreModule,
        RouterTestingModule,
        SharedModule,
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
