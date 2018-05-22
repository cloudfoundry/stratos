import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServiceBrokerCardComponent } from './service-broker-card.component';

describe('ServiceBrokerCardComponent', () => {
  let component: ServiceBrokerCardComponent;
  let fixture: ComponentFixture<ServiceBrokerCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ServiceBrokerCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServiceBrokerCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
