import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedModule } from '../../../shared/shared.module';
import { CoreModule } from './../../../core/core.module';
import { MetricsEndpointDetailsComponent } from './metrics-endpoint-details.component';

describe('MetricsEndpointDetailsComponent', () => {
  let component: MetricsEndpointDetailsComponent;
  let fixture: ComponentFixture<MetricsEndpointDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        SharedModule
      ],
      declarations: [ MetricsEndpointDetailsComponent ]
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
