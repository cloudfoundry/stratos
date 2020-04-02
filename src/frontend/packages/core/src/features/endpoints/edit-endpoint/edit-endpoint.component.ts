import { Component, Injectable } from '@angular/core';

@Component({
  selector: 'app-edit-endpoint',
  templateUrl: './edit-endpoint.component.html',
  styleUrls: ['./edit-endpoint.component.scss'],
  providers: []
})
export class EditEndpointComponent {
  cancelUrl = '/endpoints';
}
