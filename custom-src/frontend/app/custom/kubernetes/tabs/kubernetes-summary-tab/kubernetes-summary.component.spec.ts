import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesSummaryTabComponent } from './kubernetes-summary.component';

describe('KubernetesDashboardComponent', () => {
  let component: KubernetesSummaryTabComponent;
  let fixture: ComponentFixture<KubernetesSummaryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesSummaryTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesSummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
