import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { DiagnosticsPageComponent } from './diagnostics-page.component';

describe('DiagnosticsPageComponent', () => {
  let component: DiagnosticsPageComponent;
  let fixture: ComponentFixture<DiagnosticsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DiagnosticsPageComponent],
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        createBasicStoreModule(),
      ],
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiagnosticsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
