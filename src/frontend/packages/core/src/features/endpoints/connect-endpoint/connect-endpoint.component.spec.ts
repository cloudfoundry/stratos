import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ConnectEndpointComponent } from './connect-endpoint.component';

describe('ConnectEndpointComponent', () => {
  let component: ConnectEndpointComponent;
  let fixture: ComponentFixture<ConnectEndpointComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConnectEndpointComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectEndpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
