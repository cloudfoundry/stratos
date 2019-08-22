import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { TabNavService } from '../../../../tab-nav.service';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { EulaPageComponent, EulaPageContentComponent } from './eula-page.component';

describe('EulaPageComponent', () => {
  let component: EulaPageComponent;
  let fixture: ComponentFixture<EulaPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EulaPageComponent, EulaPageContentComponent],
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ],
      providers: [TabNavService]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EulaPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
