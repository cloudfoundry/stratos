import { BuildCommand } from './commands/build';
import * as path from 'path';

console.log('CLI');

console.log(process.argv);

console.log(process.argv0);


const args = process.argv.slice(2);

console.log(args);

// __dirname is the path to the script
console.log(__dirname);

// Need at least one arg

if (args.length === 0) {
  // show help
  console.log('Need at least one argument - command name');
  process.exit(1);
}

// Check commands

const cmd = args[0];
const cmdArgs = args.slice(1);

switch (cmd) {
  case 'b':
  case 'build':
    new BuildCommand().run(cmdArgs);
    break;

  default:
    console.log('Command not recognized');
    break;

}
