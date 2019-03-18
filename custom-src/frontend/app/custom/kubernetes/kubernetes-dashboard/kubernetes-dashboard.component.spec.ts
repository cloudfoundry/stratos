import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesDashboardComponent } from './kubernetes-dashboard.component';

describe('KubernetesDashboardComponent', () => {
  let component: KubernetesDashboardComponent;
  let fixture: ComponentFixture<KubernetesDashboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubernetesDashboardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesDashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
