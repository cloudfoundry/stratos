import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RestoreEndpointsComponent } from './restore-endpoints.component';

describe('RestoreEndpointsComponent', () => {
  let component: RestoreEndpointsComponent;
  let fixture: ComponentFixture<RestoreEndpointsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RestoreEndpointsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RestoreEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
