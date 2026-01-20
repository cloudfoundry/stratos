// build-backend.js
const fs = require('fs');
const cp = require('child_process');

fs.mkdirSync('dist/bin', { recursive: true });
const isWin = process.platform === 'win32';
const outPath = isWin ? '..\\..\\dist\\bin\\jetstream' : '../../dist/bin/jetstream';
const ldflags = `-X main.appVersion=${process.env.VERSION || 'dev'} -X main.buildDate=${process.env.BUILD_DATE || ''} -X main.gitCommit=${process.env.GIT_COMMIT || ''}`;
const cmd = `go build -ldflags \"${ldflags}\" -o ${outPath}`;
cp.execSync(cmd, { cwd: 'src/jetstream', stdio: 'inherit', shell: true });
