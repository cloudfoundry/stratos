import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppTabExtensionComponent } from './app-tab-extension.component';
import { CoreModule } from '../../core/core.module';
import { RouterTestingModule } from '@angular/router/testing';
import { SharedModule } from '../../shared/shared.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';

describe('AppTabExtensionComponent', () => {
  let component: AppTabExtensionComponent;
  let fixture: ComponentFixture<AppTabExtensionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppTabExtensionComponent ],
      imports: [
        CoreModule,
        RouterTestingModule,
        SharedModule,
        createBasicStoreModule()
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppTabExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
