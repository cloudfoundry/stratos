import { HttpClientModule } from '@angular/common/http';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { BaseTestModules } from '../../../../test-framework/core-test.helper';
import { DemoHelperComponent } from './demo-helper.component';

describe('DemoHelperComponent', () => {
  let component: DemoHelperComponent;
  let fixture: ComponentFixture<DemoHelperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DemoHelperComponent],
      imports: [
        ...BaseTestModules,
        HttpClientModule
      ],
      providers: [
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DemoHelperComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
