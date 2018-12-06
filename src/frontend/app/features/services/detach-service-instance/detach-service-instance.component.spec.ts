import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetachServiceInstanceComponent } from './detach-service-instance.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DetachAppsComponent } from './detach-apps/detach-apps.component';
import { DatePipe } from '@angular/common';

describe('DetachServiceInstanceComponent', () => {
  let component: DetachServiceInstanceComponent;
  let fixture: ComponentFixture<DetachServiceInstanceComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetachServiceInstanceComponent, DetachAppsComponent ],
      imports: [BaseTestModules],
      providers: [DatePipe]
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
