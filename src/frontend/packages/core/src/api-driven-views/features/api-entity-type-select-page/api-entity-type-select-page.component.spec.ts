import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEntityTypeSelectPageComponent } from './api-entity-type-select-page.component';

describe('ApiEntityTypeSelectPageComponent', () => {
  let component: ApiEntityTypeSelectPageComponent;
  let fixture: ComponentFixture<ApiEntityTypeSelectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApiEntityTypeSelectPageComponent ]
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
