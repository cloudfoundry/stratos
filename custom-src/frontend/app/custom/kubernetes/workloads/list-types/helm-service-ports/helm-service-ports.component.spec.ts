import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmServicePortsComponent } from './helm-service-ports.component';

describe('HelmServicePortsComponent', () => {
  let component: HelmServicePortsComponent;
  let fixture: ComponentFixture<HelmServicePortsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmServicePortsComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmServicePortsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
