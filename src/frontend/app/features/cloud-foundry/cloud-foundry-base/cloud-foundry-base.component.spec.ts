import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryBaseComponent } from './cloud-foundry-base.component';

describe('CloudFoundryBaseComponent', () => {
  let component: CloudFoundryBaseComponent;
  let fixture: ComponentFixture<CloudFoundryBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundryBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
