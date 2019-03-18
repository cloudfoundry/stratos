import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmRepositoryCountComponent } from './helm-repository-count.component';

describe('HelmRepositoryCountComponent', () => {
  let component: HelmRepositoryCountComponent;
  let fixture: ComponentFixture<HelmRepositoryCountComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmRepositoryCountComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmRepositoryCountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
