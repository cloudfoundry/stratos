import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeAppcreatedDateComponent } from './kube-appcreated-date.component';

describe('KubeAppcreatedDateComponent', () => {
  let component: KubeAppcreatedDateComponent;
  let fixture: ComponentFixture<KubeAppcreatedDateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubeAppcreatedDateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeAppcreatedDateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
