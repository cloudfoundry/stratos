import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfCell } from '../../../../cf-page.types';
import { CloudFoundryCellAppsComponent } from './cloud-foundry-cell-apps.component';

describe('CloudFoundryCellAppsComponent', () => {
  let component: CloudFoundryCellAppsComponent;
  let fixture: ComponentFixture<CloudFoundryCellAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CloudFoundryCellAppsComponent,
      ],
      providers: [ActiveRouteCfCell],
      imports: generateCfBaseTestModules(),
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
