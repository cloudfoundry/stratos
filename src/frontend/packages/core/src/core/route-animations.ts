import {
  trigger,
  transition,
  style,
  query,
  group,
  animate,
  AnimationTriggerMetadata,
} from '@angular/animations';

export const fadeAnimation: AnimationTriggerMetadata = trigger('fadeAnimation', [
  transition('* <=> *', [
    query(':enter, :leave', [
      style({
        position: 'absolute',
        width: '100%',
        opacity: 0,
      }),
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 }),
    ], { optional: true }),
    query(':leave', [
      animate('300ms ease-out', style({ opacity: 0 })),
    ], { optional: true }),
    query(':enter', [
      animate('300ms 150ms ease-in', style({ opacity: 1 })),
    ], { optional: true }),
  ]),
]);

export const slideInAnimation: AnimationTriggerMetadata = trigger('routeAnimations', [
  transition('LoginPage => *', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }),
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0, transform: 'scale(0.95)' }),
    ], { optional: true }),
    query(':leave', [
      style({ opacity: 1, transform: 'scale(1)' }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate('400ms cubic-bezier(0.4, 0.0, 0.2, 1)',
          style({
            opacity: 0,
            transform: 'scale(1.05)',
          })
        ),
      ], { optional: true }),
      query(':enter', [
        animate('500ms 150ms cubic-bezier(0.0, 0.0, 0.2, 1)',
          style({
            opacity: 1,
            transform: 'scale(1)',
          })
        ),
      ], { optional: true }),
    ]),
  ]),
  transition('* => LoginPage', [
    style({ position: 'relative' }),
    query(':enter, :leave', [
      style({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
      }),
    ], { optional: true }),
    query(':enter', [
      style({ opacity: 0 }),
    ], { optional: true }),
    query(':leave', [
      style({ opacity: 1 }),
    ], { optional: true }),
    group([
      query(':leave', [
        animate('300ms ease-out', style({ opacity: 0 })),
      ], { optional: true }),
      query(':enter', [
        animate('400ms 100ms ease-in', style({ opacity: 1 })),
      ], { optional: true }),
    ]),
  ]),
]);

// Smooth fade transition for login to dashboard
export const loginTransition: AnimationTriggerMetadata = trigger('loginTransition', [
  transition(':leave', [
    style({
      opacity: 1,
      transform: 'scale(1)',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      zIndex: 9999
    }),
    animate('600ms 200ms cubic-bezier(0.4, 0.0, 0.2, 1)',
      style({
        opacity: 0,
        transform: 'scale(0.98)',
      })
    ),
  ]),
]);
