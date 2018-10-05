import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubeAppVersionComponent } from './kube-app-version.component';

describe('KubeAppVersionComponent', () => {
  let component: KubeAppVersionComponent;
  let fixture: ComponentFixture<KubeAppVersionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ KubeAppVersionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubeAppVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
