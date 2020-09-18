import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CoreModule } from '../../../core/core.module';
import { CopyToClipboardComponent } from './copy-to-clipboard.component';

describe('CopyToClipboardComponent', () => {
  let component: CopyToClipboardComponent;
  let fixture: ComponentFixture<CopyToClipboardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CopyToClipboardComponent],
      imports: [
        CoreModule,
        CoreTestingModule,
        createBasicStoreModule(),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CopyToClipboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
