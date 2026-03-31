import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { TailwindDialogService, MAT_DIALOG_DATA } from '@stratosui/core';

@Component({
  selector: 'app-event-metadata',
  templateUrl: './event-metadata.component.html',
  styleUrls: ['./event-metadata.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule
  ]
})
export class EventMetadataComponent implements OnInit {
  private dialog = inject(TailwindDialogService);
  data? = inject<{
    metadata: {
        [name: string]: string;
    };
}>(MAT_DIALOG_DATA, { optional: true });


  static maxValuesLength = 500;
  static maxKeys = 5;

  @Input() metadata!: { [name: string]: any, };
  @Input() canShowPopup = true;
  showPopup = false;
  isPopup = false;

  constructor() {
    const data = this.data;


    if (this.data) {
      this.metadata = data.metadata;
      this.canShowPopup = false;
      this.isPopup = true;
    }
  }

  ngOnInit() {
    if (this.canShowPopup) {
      this.showPopup =
        Object.keys(this.metadata).length > EventMetadataComponent.maxKeys ||
        Object.values(this.metadata).reduce((count, value) => {
          if (count > EventMetadataComponent.maxValuesLength) {
            return count;
          }
          return count + (value ? JSON.stringify(value).length : 0);
        }, 0) > EventMetadataComponent.maxValuesLength;
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
