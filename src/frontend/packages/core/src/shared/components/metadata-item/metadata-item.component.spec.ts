import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { MetadataItemComponent } from './metadata-item.component';
import { CoreModule } from '../../../core/core.module';
import { CopyToClipboardComponent } from '../copy-to-clipboard/copy-to-clipboard.component';

describe('MetadataItemComponent', () => {
  let component: MetadataItemComponent;
  let fixture: ComponentFixture<MetadataItemComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        MetadataItemComponent,
        CopyToClipboardComponent
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
