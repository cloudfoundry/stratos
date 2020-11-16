import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefaultEndpointHomeComponentComponent } from './default-endpoint-home-component.component';

describe('DefaultEndpointHomeComponentComponent', () => {
  let component: DefaultEndpointHomeComponentComponent;
  let fixture: ComponentFixture<DefaultEndpointHomeComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefaultEndpointHomeComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultEndpointHomeComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
