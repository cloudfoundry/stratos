import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TabNavService } from '../../../../core/src/tab-nav.service';
import { BaseTestModulesNoShared } from '../../../../core/test-framework/core-test.helper';
import { HelmModule } from '../helm.module';
import { MonocularTabBaseComponent } from './monocular-tab-base.component';

describe('MonocularTabBaseComponent', () => {
  let component: MonocularTabBaseComponent;
  let fixture: ComponentFixture<MonocularTabBaseComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [
        ...BaseTestModulesNoShared,
        HelmModule
      ],
      providers: [
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MonocularTabBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
