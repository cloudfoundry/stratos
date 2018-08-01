import { Injectable } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { interval, Observable, of as observableOf, Subject } from 'rxjs';
import { delayWhen, filter, map, tap, concatMap, delay, throttleTime, takeWhile, buffer } from 'rxjs/operators';

import { AppState } from '../store/app-state';
import { chunkArray } from './utils.service';

export interface DispatchThrottlerAction {
  id: string;
  action: Action;
}

@Injectable()
export class DispatchThrottler {

  // private chunking = 1;
  // private ignoreWithinX: number;
  private dispatchRecord: {
    [id: string]: {
      time: number,
      queued: boolean
    }
  } = {};
  // private dispatched = new Subject();

  constructor(private store: Store<AppState>, private chunkSize = 1, private debounceInMs = 5000) {
    // this.dispatched.next(true);


    // this.dispatched.pipe(
    //   tap(() => console.log('dispatched a')),
    //   throttleTime(10000),
    //   tap(() => console.log('dispatched b')),
    // ).subscribe();
  }

  // setDispatchChunkSize(chunkSize: number) {
  //   this.chunking = chunkSize;
  //   // this.dispatched.next(true);
  //   // this.dispatched.subscribe();
  // }

  // setDispatchDebounceTime(time: number) {
  //   this.ignoreWithinX = time;
  // }

  private dispatch(filteredActions: DispatchThrottlerAction[]) {
    // this.dispatched.next(true);
    filteredActions.forEach(action => {
      this.dispatchRecord[action.id].time = new Date().getTime();
      this.dispatchRecord[action.id].queued = false;
      this.store.dispatch(action.action);
    });
  }

  throttle(actions: DispatchThrottlerAction[]): Observable<any> {
    return observableOf({ actions }).pipe(
      filter(({ actions }) => !!actions.length),
      map(({ actions }) => {
        if (this.debounceInMs) {
          const now = new Date().getTime();
          actions = actions.filter(action => {
            const record = this.dispatchRecord[action.id] || { time: 0, queued: false };
            // if (!record.queued && now - record.time > this.ignoreWithinX) {
            //   console.log(action, record);
            // }
            return !record.queued && now - record.time > this.debounceInMs;
          });
        }
        actions.forEach(action => {
          if (!this.dispatchRecord[action.id]) {
            this.dispatchRecord[action.id] = { time: 0, queued: false };
          }
          const record = this.dispatchRecord[action.id];
          record.queued = true;
        });
        // console.log(actions);
        return actions;
      }),
      filter(actions => !!actions.length),
      concatMap(filteredActions => {
        const chunks = chunkArray(filteredActions, this.chunkSize);
        this.dispatch(chunks.shift());
        return observableOf(...chunks);
      }),
      concatMap(actions => observableOf(actions).pipe(delay(4000))),
      tap(this.dispatch.bind(this)),
      tap(a => console.log('FINISHED', a))




    );
  }


  // concatMap(actions => observableOf(...actions).pipe(buffer(interval(5000)))),
  // concatMap(actions => observableOf(...actions)),
  // buffer(interval(5000))),

  //       const clicks = fromEvent(document, 'click');
  // const interval = interval(1000);
  // const buffered = interval.pipe(buffer(clicks));
  // buffered.subscribe(x => console.log(x));
  // concatMap(filteredActions => {
  //   const chunks = chunkArray(filteredActions, this.chunking);
  //   this.dispatch(chunks.shift());
  //   // chunks.splice(1, chunks.length);
  //   return interval(3000).pipe(
  //     map(() => chunks.shift()),
  //     takeWhile(chunk => !!chunk)
  //   );
  // }),
  // // delayWhen(() => interval(10000)),
  // tap(this.dispatch.bind(this)),

  // throttle(actions: DispatchThrottlerAction[]): Observable<any> {
  //   // const filteredActions = ;
  //   return observableOf({ actions }).pipe(
  //     filter(({ actions }) => !!actions.length),
  //     map(({ actions }) => {

  //       if (this.ignoreWithinX) {
  //         const now = new Date().getTime();
  //         actions = actions.filter(action => {
  //           const record = this.dispatchRecord[action.id] || { time: 0, queued: false };
  //           if (!record.queued && now - record.time > this.ignoreWithinX) {
  //             console.log(action, record);
  //           }
  //           return !record.queued && now - record.time > this.ignoreWithinX;
  //         });
  //         // console.log(actions, a);
  //         // return a;
  //       }
  //       actions.forEach(action => {
  //         if (!this.dispatchRecord[action.id]) {
  //           this.dispatchRecord[action.id] = { time: 0, queued: false };
  //         }
  //         const record = this.dispatchRecord[action.id];
  //         record.queued = true;
  //       });
  //       // console.log(actions);
  //       return actions;
  //     }),
  //     // tap(filteredActions => {
  //     //   filteredActions.forEach(action => {
  //     //     if (!this.dispatchRecord[action.id]) {
  //     //       this.dispatchRecord[action.id] = { time: 0, queued: false };
  //     //     }
  //     //     const record = this.dispatchRecord[action.id];
  //     //     record.queued = true;
  //     //   });
  //     // }),
  //     filter(actions => !!actions.length),
  //     concatMap(filteredActions => {
  //       const chunks = chunkArray(filteredActions, this.chunking);
  //       this.dispatch(chunks.shift());
  //       // chunks.splice(1, chunks.length);
  //       return interval(3000).pipe(
  //         map(() => chunks.shift()),
  //         takeWhile(chunk => !!chunk)
  //       );
  //     }),
  //     // delayWhen(() => interval(10000)),
  //     tap(this.dispatch.bind(this)),

  //     tap(a => console.log('FINISHED', a)),

  //   );
  // }

}
        // return observableOf([], ...chunks.splice(1, chunks.length));
        // .pipe(delay(10000))

 // concatMap(filteredActions => {
      //   return observableOf([], ...chunkArray(filteredActions, this.chunking));
      // }),
      // delay()
      // tap(a => console.log('before delay', a)),
      // // delayWhen(() => interval(Math.random() * 10000)),
      // delayWhen(() => {
      //   return interval(Math.random() * 10000).pipe(tap(() => console.log('interval fired')));

      //   // return this.dispatched.pipe(
      //   //   tap(() => console.log('dispatched a')),
      //   //   throttleTime(10000),
      //   //   tap(() => console.log('dispatched b')),
      //   // );

      // }),
      // // (Math.random() * 10000)),
      // // delay(10000),
      // // interval(Math.random() * 5000)
      // tap(this.dispatch.bind(this)),
