import { TestBed } from "@angular/core/testing";
import { APP_BASE_HREF } from "@angular/common";

/**
 * The ngx Charts lobrary needs APP_BASE_HREF - so we will provide it through
 * a global beforeEach so we don't have to add it to all the necessary
 * spec files.
 */
beforeEach( () => {
  TestBed.configureTestingModule({
    providers: [ { provide: APP_BASE_HREF, useValue: '/' } ]
  });
});  
