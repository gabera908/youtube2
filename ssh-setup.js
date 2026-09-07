const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const pubKey = fs.readFileSync(path.join(process.env.USERPROFILE, '.ssh', 'id_rsa.pub'), 'utf8').trim();

const commands = [
  'mkdir -p ~/.ssh',
  `echo '${pubKey}' >> ~/.ssh/authorized_keys`,
  'chmod 700 ~/.ssh',
  'chmod 600 ~/.ssh/authorized_keys',
  'echo SSH_KEY_ADDED',
  'cat ~/.ssh/authorized_keys'
].join(' && ');

conn.on('ready', () => {
  console.log('✓ Connected to server!');

  conn.exec(commands, (err, stream) => {
    if (err) {
      console.error('Exec error:', err);
      conn.end();
      return;
    }

    stream.on('close', (code, signal) => {
      console.log(`\n✓ Command finished (code: ${code})`);
      conn.end();
    }).on('data', (data) => {
      console.log('STDOUT: ' + data.toString());
    }).stderr.on('data', (data) => {
      console.log('STDERR: ' + data.toString());
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err.message);
}).connect({
  host: '100.84.254.18',
  port: 22,
  username: 'root',
  password: '311211',
  readyTimeout: 10000,
  tryKeyboard: true,
  onKeyboardInteractive: (name, instructions, instructionsLang, prompts, finish) => {
    console.log('Keyboard interactive auth...');
    finish(['311211']);
  }
});
