import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultEndpointHomeComponent } from './default-endpoint-home-component.component';

describe('DefaultEndpointHomeComponentComponent', () => {
  let component: DefaultEndpointHomeComponent;
  let fixture: ComponentFixture<DefaultEndpointHomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefaultEndpointHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultEndpointHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
