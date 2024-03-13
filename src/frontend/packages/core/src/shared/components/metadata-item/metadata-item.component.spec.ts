import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MetadataItemComponent } from './metadata-item.component';
import { CoreModule } from '../../../core/core.module';
import { CopyToClipboardComponent } from '../copy-to-clipboard/copy-to-clipboard.component';

describe('MetadataItemComponent', () => {
  let component: MetadataItemComponent;
  let fixture: ComponentFixture<MetadataItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MetadataItemComponent,
        CopyToClipboardComponent
      ],
      imports: [
        CoreModule
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetadataItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
