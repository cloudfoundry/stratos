import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEntityListPageComponent } from './api-entity-list-page.component';

describe('ApiEntityListPageComponent', () => {
  let component: ApiEntityListPageComponent;
  let fixture: ComponentFixture<ApiEntityListPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApiEntityListPageComponent ]
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
