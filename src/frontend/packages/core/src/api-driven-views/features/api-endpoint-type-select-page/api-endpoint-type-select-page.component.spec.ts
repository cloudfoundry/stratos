import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEndpointTypeSelectPageComponent } from './api-endpoint-type-select-page.component';
import { ApiDrivenViewsModule } from '../../api-driven-views.module';

describe('ApiEndpointTypeSelectPageComponent', () => {
  let component: ApiEndpointTypeSelectPageComponent;
  let fixture: ComponentFixture<ApiEndpointTypeSelectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [ApiDrivenViewsModule]
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
