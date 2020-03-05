import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { HelmRelease } from '../../workload.types';
import { HelmReleaseCardComponent } from './helm-release-card.component';

describe('HelmReleaseCardComponent', () => {
  let component: HelmReleaseCardComponent;
  let fixture: ComponentFixture<HelmReleaseCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseCardComponent],
      imports: KubernetesBaseTestModules,
      providers: [
        DatePipe,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseCardComponent);
    component = fixture.componentInstance;
    component.row = {
      status: 'status',
      info: {
        last_deployed: null
      },
      chart: {
        metadata: {}
      }
    } as HelmRelease;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
