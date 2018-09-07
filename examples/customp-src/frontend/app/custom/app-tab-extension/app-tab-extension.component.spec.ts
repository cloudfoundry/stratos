import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppTabExtensionComponent } from './app-tab-extension.component';

describe('AppTabExtensionComponent', () => {
  let component: AppTabExtensionComponent;
  let fixture: ComponentFixture<AppTabExtensionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppTabExtensionComponent ]
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
