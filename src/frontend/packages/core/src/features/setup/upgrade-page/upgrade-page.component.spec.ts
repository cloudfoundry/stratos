import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UpgradePageComponent } from './upgrade-page.component';
import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { MDAppModule } from '../../../core/md.module';
import { StratosTitleComponent } from '@stratos/shared';

describe('UpgradePageComponent', () => {
  let component: UpgradePageComponent;
  let fixture: ComponentFixture<UpgradePageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [UpgradePageComponent, IntroScreenComponent, StratosTitleComponent],
      imports: [
        MDAppModule,
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UpgradePageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

});
