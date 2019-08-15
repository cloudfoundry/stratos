import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { PaginationMonitorFactory } from '../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { TabNavService } from '../../../../../core/tab-nav.service';
import {
  BaseTestModules,
  generateTestCfServiceProvider,
} from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryComponent } from './cloud-foundry.component';

describe('CloudFoundryComponent', () => {
  let component: CloudFoundryComponent;
  let fixture: ComponentFixture<CloudFoundryComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryComponent],
        imports: [...BaseTestModules, BrowserAnimationsModule],
        providers: [PaginationMonitorFactory, generateTestCfServiceProvider(), TabNavService]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
