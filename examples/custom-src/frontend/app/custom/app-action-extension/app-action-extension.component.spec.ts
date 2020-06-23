import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { AppActionExtensionComponent } from './app-action-extension.component';

describe('AppActionExtensionComponent', () => {
  let component: AppActionExtensionComponent;
  let fixture: ComponentFixture<AppActionExtensionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppActionExtensionComponent ],
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
    fixture = TestBed.createComponent(AppActionExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
