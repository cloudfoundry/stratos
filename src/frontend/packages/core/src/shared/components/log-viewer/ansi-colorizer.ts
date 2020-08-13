
// Ansi code to reset all colours
const RESET = '\x1B[0m';

const colorCodes = {
  black: 0,
  red: 1,
  green: 2,
  yellow: 3,
  blue: 4,
  magenta: 5,
  cyan: 6,
  white: 7
};

export class AnsiColorizer {

  colorize(message: string, color: string, boldOn?: boolean): string {
    if (boldOn) {
      if (color) {
        return '\x1B[1;3' + colorCodes[color] + 'm' + message + RESET;
      }
      return '\x1B[1m' + message + RESET;
    }
    if (color) {
      return '\x1B[3' + colorCodes[color] + 'm' + message + RESET;
    }
    return message;
  }
}
