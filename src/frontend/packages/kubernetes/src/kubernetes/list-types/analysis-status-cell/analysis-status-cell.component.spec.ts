import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MDAppModule } from '../../../../../core/src/public-api';
import {
  AnalysisReportSelectorComponent,
} from './../../analysis-report-viewer/analysis-report-selector/analysis-report-selector.component';
import { AnalysisStatusCellComponent } from './analysis-status-cell.component';

describe('AnalysisStatusCellComponent', () => {
  let component: AnalysisStatusCellComponent;
  let fixture: ComponentFixture<AnalysisStatusCellComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AnalysisStatusCellComponent, AnalysisReportSelectorComponent],
      imports: [
        MDAppModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisStatusCellComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
