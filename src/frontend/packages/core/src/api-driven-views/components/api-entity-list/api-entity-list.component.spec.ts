import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiEntityListComponent } from './api-entity-list.component';

describe('ApiEntityListComponent', () => {
  let component: ApiEntityListComponent;
  let fixture: ComponentFixture<ApiEntityListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApiEntityListComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiEntityListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
