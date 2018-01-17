import { Component, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-application',
  templateUrl: './edit-application.component.html',
  styleUrls: ['./edit-application.component.scss']
})
export class EditApplicationComponent implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {

    console.log('APPLICATION EDIT');

    console.log(this.router);
  }

}
