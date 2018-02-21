import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceRoutesComponent } from './cloud-foundry-space-routes.component';

describe('CloudFoundrySpaceRoutesComponent', () => {
  let component: CloudFoundrySpaceRoutesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundrySpaceRoutesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
