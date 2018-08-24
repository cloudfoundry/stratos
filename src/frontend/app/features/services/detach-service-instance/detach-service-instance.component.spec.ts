import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetachServiceInstanceComponent } from './detach-service-instance.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DetachAppsComponent } from './detach-apps/detach-apps.component';
import { DatePipe } from '@angular/common';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import { TableHeaderSelectComponent } from '../../../shared/components/list/list-table/table-header-select/table-header-select.component';

describe('DetachServiceInstanceComponent', () => {
  let component: DetachServiceInstanceComponent;
  let fixture: ComponentFixture<DetachServiceInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DetachServiceInstanceComponent, DetachAppsComponent],
      imports: [BaseTestModules],
      providers: [DatePipe]
    });
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [TableHeaderSelectComponent],
      },
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetachServiceInstanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
