import { Component, OnInit } from '@angular/core';
import { PreviewableComponent } from '../../../../../../shared/previewable-component';

@Component({
  selector: 'app-helm-release-resource-preview',
  templateUrl: './helm-release-resource-preview.component.html',
  styleUrls: ['./helm-release-resource-preview.component.scss']
})
export class HelmReleaseResourcePreviewComponent implements OnInit, PreviewableComponent  {

  setProps(props: { [key: string]: any; }): void {
  }

  constructor() { }

  ngOnInit() {
  }

}
