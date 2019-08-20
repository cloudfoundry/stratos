import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import { BaseTestModules } from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { DetachAppsComponent } from './detach-apps/detach-apps.component';
import { DetachServiceInstanceComponent } from './detach-service-instance.component';

describe('DetachServiceInstanceComponent', () => {
  let component: DetachServiceInstanceComponent;
  let fixture: ComponentFixture<DetachServiceInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DetachServiceInstanceComponent, DetachAppsComponent],
      imports: [BaseTestModules],
      providers: [DatePipe, TabNavService]
    })
      .compileComponents();
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
