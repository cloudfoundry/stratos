import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { PodUsageComponent } from './pod-usage.component';


describe('PodMemoryUsageComponent', () => {
  let component: PodUsageComponent;
  let fixture: ComponentFixture<PodUsageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [PodUsageComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PodUsageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
