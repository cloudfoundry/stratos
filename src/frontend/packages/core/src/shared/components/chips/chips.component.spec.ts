import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppChipsComponent } from './chips.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CoreModule } from '../../../core/core.module';

describe('AppChipsComponent', () => {
  let component: AppChipsComponent;
  let fixture: ComponentFixture<AppChipsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AppChipsComponent],
      imports: [
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppChipsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
