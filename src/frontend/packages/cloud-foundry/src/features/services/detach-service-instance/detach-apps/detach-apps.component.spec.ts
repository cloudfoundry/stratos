import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DetachAppsComponent } from './detach-apps.component';

describe('DetachAppsComponent', () => {
  let component: DetachAppsComponent;
  let fixture: ComponentFixture<DetachAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DetachAppsComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        DatePipe, {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                serviceInstanceId: 'serviceInstanceId',
                endpointId: 'endpointId'
              }
            }
          }
        },
      ]
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
