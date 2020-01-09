import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../core/src/core/md.module';
import { CodeBlockComponent } from '../../../../../core/src/shared/components/code-block/code-block.component';
import {
  CopyToClipboardComponent,
} from '../../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { CliInfoComponent } from './cli-info.component';

describe('CliInfoComponent', () => {
  let component: CliInfoComponent;
  let fixture: ComponentFixture<CliInfoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CliInfoComponent, CodeBlockComponent, CopyToClipboardComponent],
      imports: [
        CoreModule,
        MDAppModule,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CliInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
