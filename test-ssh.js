const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
  console.log('CONNECTED!');
  conn.exec('echo "SSH_OK" && whoami', (err, stream) => {
    if (err) { console.error(err); conn.end(); return; }
    stream.on('close', () => conn.end());
    stream.on('data', (data) => console.log(data.toString()));
    stream.stderr.on('data', (data) => console.error(data.toString()));
  });
}).on('error', (err) => {
  console.error('ERROR:', err.message);
}).connect({
  host: '100.84.254.18',
  port: 22,
  username: 'root',
  password: '311211',
  readyTimeout: 30000,
  algorithms: {
    kex: [
      'ecdh-sha2-nistp256',
      'ecdh-sha2-nistp384',
      'ecdh-sha2-nistp521',
      'diffie-hellman-group-exchange-sha256',
      'diffie-hellman-group14-sha256',
      'diffie-hellman-group14-sha1'
    ],
    serverHostKey: [
      'ssh-rsa',
      'ecdsa-sha2-nistp256',
      'ssh-ed25519'
    ]
  }
});
