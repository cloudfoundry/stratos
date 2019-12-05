import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmBaseTestModules } from '../../helm-testing.module';
import { HelmConfigurationComponent } from './helm-configuration.component';

describe('HelmConfigurationComponent', () => {
  let component: HelmConfigurationComponent;
  let fixture: ComponentFixture<HelmConfigurationComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...HelmBaseTestModules
      ],
      declarations: [HelmConfigurationComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmConfigurationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
