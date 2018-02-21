import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceAppsComponent } from './cloud-foundry-space-apps.component';

describe('CloudFoundrySpaceAppsComponent', () => {
  let component: CloudFoundrySpaceAppsComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CloudFoundrySpaceAppsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
