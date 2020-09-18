import { Component, Inject, Input, OnInit, Optional } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-event-metadata',
  templateUrl: './event-metadata.component.html',
  styleUrls: ['./event-metadata.component.scss']
})
export class EventMetadataComponent implements OnInit {

  static maxValuesLength = 1000;
  static maxKeys = 5;

  @Input() metadata: { [name: string]: any };
  @Input() canShowPopup = true;
  showPopup = false;
  isPopup = false;

  constructor(
    private dialog: MatDialog,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: {
      metadata: { [name: string]: string },
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
      this.showPopup =
        Object.keys(this.metadata).length > EventMetadataComponent.maxKeys ||
        Object.values(this.metadata).reduce((count, value) => {
          if (count > EventMetadataComponent.maxValuesLength) {
            return count;
          }
          return count + (value ? value.toString().length : 0);
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
