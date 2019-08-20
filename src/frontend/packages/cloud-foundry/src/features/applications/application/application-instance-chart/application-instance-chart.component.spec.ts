import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';
import { ApplicationInstanceChartComponent } from './application-instance-chart.component';

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
