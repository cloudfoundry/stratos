import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { KubernetesPodsTabComponent } from './kubernetes-pods-tab.component';


describe('KubernetesPodsTabComponent', () => {
  let component: KubernetesPodsTabComponent;
  let fixture: ComponentFixture<KubernetesPodsTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [KubernetesPodsTabComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesPodsTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
