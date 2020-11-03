import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HomePageEndpointCardComponent } from './home-page-endpoint-card.component';

describe('HomePageEndpointCardComponent', () => {
  let component: HomePageEndpointCardComponent;
  let fixture: ComponentFixture<HomePageEndpointCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HomePageEndpointCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomePageEndpointCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
