import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ErrorPiece, ErrorPieceStyle } from '@stratosui/store';

/**
 * Tailwind classes for each style of error text. Colour and size are the
 * surrounding text's: a heading from an upstream error page is only bold,
 * not page-heading sized.
 */
export const ERROR_PIECE_CLASS: Record<ErrorPieceStyle, string> = {
  text: '',
  heading: 'font-semibold',
  strong: 'font-semibold',
  em: 'italic',
  code: 'font-mono',
};

/**
 * Shows error text read from an upstream response (extractHttpErrorPieces,
 * leadPieces) with its headings, emphasis and line breaks. Every piece is
 * interpolated text, so markup in it is shown, never parsed.
 */
@Component({
  selector: 'app-error-text',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'whitespace-pre-line' },
  template: `@for (piece of pieces(); track $index) {<span [class]="pieceClass[piece.style]">{{ piece.text }}</span>}`,
})
export class ErrorTextComponent {
  readonly pieces = input.required<readonly ErrorPiece[]>();
  protected readonly pieceClass = ERROR_PIECE_CLASS;
}
