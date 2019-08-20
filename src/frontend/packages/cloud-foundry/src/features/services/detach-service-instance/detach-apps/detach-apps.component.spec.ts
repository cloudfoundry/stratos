import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BaseTestModules } from '../../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { DetachAppsComponent } from './detach-apps.component';

describe('DetachAppsComponent', () => {
  let component: DetachAppsComponent;
  let fixture: ComponentFixture<DetachAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DetachAppsComponent],
      imports: [BaseTestModules],
      providers: [DatePipe]
    })
      .compileComponents();
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
