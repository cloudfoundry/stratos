import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsComponent } from './metrics.component';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { MetricsService } from '../services/metrics-service';

describe('MetricsComponent', () => {
  let component: MetricsComponent;
  let fixture: ComponentFixture<MetricsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        createBasicStoreModule(),
      ],
      declarations: [ MetricsComponent ],
      providers: [ MetricsService ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
