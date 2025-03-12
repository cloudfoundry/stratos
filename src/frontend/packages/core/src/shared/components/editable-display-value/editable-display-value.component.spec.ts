import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CoreModule } from '../../../core/core.module';
import { DisplayValueComponent } from '../display-value/display-value.component';
import { EditableDisplayValueComponent } from './editable-display-value.component';

describe('EditableDisplayValueComponent', () => {
  let component: EditableDisplayValueComponent;
  let fixture: ComponentFixture<EditableDisplayValueComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        EditableDisplayValueComponent,
        DisplayValueComponent
      ],
      imports: [
        CommonModule,
        CoreModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditableDisplayValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
