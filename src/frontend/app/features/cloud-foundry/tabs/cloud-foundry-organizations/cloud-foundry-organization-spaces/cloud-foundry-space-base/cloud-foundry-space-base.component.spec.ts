import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceBaseComponent } from './cloud-foundry-space-base.component';

describe('CloudFoundrySpaceBaseComponent', () => {
  let component: CloudFoundrySpaceBaseComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundrySpaceBaseComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
