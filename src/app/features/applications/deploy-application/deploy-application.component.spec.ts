import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeployApplicationComponent } from './deploy-application.component';

describe('DeployApplicationComponent', () => {
  let component: DeployApplicationComponent;
  let fixture: ComponentFixture<DeployApplicationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DeployApplicationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeployApplicationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
