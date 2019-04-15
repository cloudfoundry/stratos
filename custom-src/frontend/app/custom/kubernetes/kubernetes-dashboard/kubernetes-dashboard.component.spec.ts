import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesDashboardTabComponent } from './kubernetes-dashboard.component';

describe('KubernetesDashboardComponent', () => {
  let component: KubernetesDashboardTabComponent;
  let fixture: ComponentFixture<KubernetesDashboardTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesDashboardTabComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesDashboardTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
