import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CodeBlockComponent } from './code-block.component';
import { DOCUMENT } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';

describe('CodeBlockComponent', () => {
  let component: CodeBlockComponent;
  let fixture: ComponentFixture<CodeBlockComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CodeBlockComponent,
      ],
      imports: [
        CoreModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CodeBlockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
