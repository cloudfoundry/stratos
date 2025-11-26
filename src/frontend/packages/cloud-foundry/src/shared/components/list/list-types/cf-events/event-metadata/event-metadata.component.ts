import { CommonModule, JsonPipe } from '@angular/common';
import { Component, Inject, Input, type OnInit, Optional , ChangeDetectionStrategy } from '@angular/core';
import { TailwindDialogService, MAT_DIALOG_DATA } from '@stratosui/core';

@Component({
  selector: 'app-event-metadata',
  templateUrl: './event-metadata.component.html',
  styleUrls: ['./event-metadata.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    JsonPipe
  ]
})
export class EventMetadataComponent implements OnInit {

  static maxValuesLength = 500;
  static maxKeys = 5;

  @Input() metadata!: Record<string, unknown>;
  @Input() canShowPopup = true;
  showPopup = false;
  isPopup = false;

  constructor(
    private dialog: TailwindDialogService,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: {
      metadata: Record<string, unknown>;
    },
  ) {

    if (this.data) {
      this.metadata = data.metadata;
      this.canShowPopup = false;
      this.isPopup = true;
    }
  }

  ngOnInit() {
    if (this.canShowPopup) {
      const totalLength = Object.values(this.metadata).reduce((count: number, value: unknown): number => {
        if ((count as number) > EventMetadataComponent.maxValuesLength) {
          return count;
        }
        return (count as number) + (value ? JSON.stringify(value).length : 0);
      }, 0);

      this.showPopup =
        Object.keys(this.metadata).length > EventMetadataComponent.maxKeys ||
        (totalLength as number) > EventMetadataComponent.maxValuesLength;
    }
  }

  doShowPopup() {
    this.dialog.open(EventMetadataComponent, {
      data: {
        metadata: this.metadata,
        canShowPopup: false
      },
      disableClose: false
    });
  }

}
