import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEndpointSelectPageComponent } from './api-endpoint-select-page.component';

describe('ApiEndpointSelectPageComponent', () => {
  let component: ApiEndpointSelectPageComponent;
  let fixture: ComponentFixture<ApiEndpointSelectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApiEndpointSelectPageComponent ]
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
