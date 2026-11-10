import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { PageSubNavComponent } from '@stratosui/core';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { KubeAnalysisDataService } from '../../../../services/domain-data/kube-analysis-data.service';
import { KubeBaseGuidMock, KubernetesBaseTestModules } from '../../../kubernetes.testing.module';
import { KubernetesAnalysisReportComponent } from './kubernetes-analysis-report.component';

describe('KubernetesAnalysisReportComponent', () => {
  let component: KubernetesAnalysisReportComponent;
  let fixture: ComponentFixture<KubernetesAnalysisReportComponent>;
  let mockAnalysisData: { reportById: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockAnalysisData = {
      reportById: vi.fn().mockReturnValue(of({
        id: 'test-id',
        name: 'Test Analysis Report',
        type: 'popeye',
        report: { sections: [] },
        created: new Date().toISOString(),
      })),
    };

    await TestBed.configureTestingModule({
      imports: [
        KubernetesAnalysisReportComponent,
        ...KubernetesBaseTestModules,
      ],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'test-id' }, pathFromRoot: [] } } },
        KubeBaseGuidMock,
        { provide: KubeAnalysisDataService, useValue: mockAnalysisData },
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesAnalysisReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('names the loaded report in the breadcrumbs it hands the sub-nav', async () => {
    await fixture.whenStable();
    const subNav = fixture.debugElement.query(By.directive(PageSubNavComponent)).componentInstance as PageSubNavComponent;
    expect(subNav.breadcrumbs()?.map(b => b.value)).toEqual(['Analysis', 'Test Analysis Report']);
  });
});
