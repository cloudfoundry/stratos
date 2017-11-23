import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EndpointsMissingComponent } from './endpoints-missing.component';

describe('EndpointsMissingComponent', () => {
  let component: EndpointsMissingComponent;
  let fixture: ComponentFixture<EndpointsMissingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EndpointsMissingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointsMissingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
