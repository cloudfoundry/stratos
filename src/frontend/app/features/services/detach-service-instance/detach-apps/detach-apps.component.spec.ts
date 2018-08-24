import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetachAppsComponent } from './detach-apps.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DatePipe } from '@angular/common';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import {
  TableHeaderSelectComponent
} from '../../../../shared/components/list/list-table/table-header-select/table-header-select.component';

describe('DetachAppsComponent', () => {
  let component: DetachAppsComponent;
  let fixture: ComponentFixture<DetachAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DetachAppsComponent],
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
    fixture = TestBed.createComponent(DetachAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
