import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { ApplicationInstanceChartComponent } from './application-instance-chart.component';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('ApplicationInstanceChartComponent', () => {
  let component: ApplicationInstanceChartComponent;
  let fixture: ComponentFixture<ApplicationInstanceChartComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        RouterTestingModule,
        CoreModule,
        SharedModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationInstanceChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
