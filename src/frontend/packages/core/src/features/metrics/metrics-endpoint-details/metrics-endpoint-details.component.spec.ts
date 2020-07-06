import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { createBasicStoreModule } from '../../../../../store/testing/src/store-test-helper';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { SharedModule } from '../../../shared/shared.module';
import { MetricsService } from '../services/metrics-service';
import { CoreModule } from './../../../core/core.module';
import { MetricsEndpointDetailsComponent } from './metrics-endpoint-details.component';

describe('MetricsEndpointDetailsComponent', () => {
  let component: MetricsEndpointDetailsComponent;
  let fixture: ComponentFixture<MetricsEndpointDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule()
      ],
      declarations: [ MetricsEndpointDetailsComponent ],
      providers: [ MetricsService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsEndpointDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
