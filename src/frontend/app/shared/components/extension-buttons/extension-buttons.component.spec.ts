import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ExtensionButtonsComponent } from './extension-buttons.component';

describe('ExtensionButtonsComponent', () => {
  let component: ExtensionButtonsComponent;
  let fixture: ComponentFixture<ExtensionButtonsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ExtensionButtonsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtensionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
