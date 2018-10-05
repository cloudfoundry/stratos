import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeAppChartNameComponent } from './kube-app-chart-name.component';

describe('KubeAppChartNameComponent', () => {
  let component: KubeAppChartNameComponent;
  let fixture: ComponentFixture<KubeAppChartNameComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubeAppChartNameComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeAppChartNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
