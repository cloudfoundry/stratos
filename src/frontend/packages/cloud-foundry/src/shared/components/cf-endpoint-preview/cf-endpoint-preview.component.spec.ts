import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CardCfRecentAppsComponent } from '../cards/card-cf-recent-apps/card-cf-recent-apps.component';
import { CompactAppCardComponent } from '../cards/card-cf-recent-apps/compact-app-card/compact-app-card.component';
import { CfEndpointPreviewComponent } from './cf-endpoint-preview.component';

describe('CfEndpointPreviewComponent', () => {
  let component: CfEndpointPreviewComponent;
  let fixture: ComponentFixture<CfEndpointPreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CfEndpointPreviewComponent,
        CardCfRecentAppsComponent,
        CompactAppCardComponent,
      ],
      providers: generateTestCfEndpointServiceProvider(),
      imports: generateCfBaseTestModules(),
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfEndpointPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
