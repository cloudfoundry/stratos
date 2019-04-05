import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEndpointConnectComponent } from './create-endpoint-connect.component';

describe('CreateEndpointConnectComponent', () => {
  let component: CreateEndpointConnectComponent;
  let fixture: ComponentFixture<CreateEndpointConnectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateEndpointConnectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
