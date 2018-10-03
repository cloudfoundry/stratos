import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryCellAppsComponent } from './cloud-foundry-cell-apps.component';


describe('CloudFoundryCellAppsComponent', () => {
  let component: CloudFoundryCellAppsComponent;
  let fixture: ComponentFixture<CloudFoundryCellAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundryCellAppsComponent,
      ],
      imports: [...BaseTestModules],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryCellAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
