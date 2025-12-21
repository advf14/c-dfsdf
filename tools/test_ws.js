const WebSocket = require('ws');
// testing local server
const url = 'ws://127.0.0.1/client';
const username = 'testbot' + Math.floor(Math.random()*10000);
const password = 'Pa55word!';

function run() {
  const ws = new WebSocket(url, {rejectUnauthorized: false});
  ws.on('open', () => {
    console.log('OPEN');
    // Request captcha, then attempt register/login
    setTimeout(()=>{
      ws.send(JSON.stringify({captcha: 'signUp'}));
    }, 400);
    setTimeout(()=>{
      const reg = { authentication: { username: username, password: password, register: true, captcha: '1234' } };
      console.log('SEND REGISTER', reg.authentication.username);
      ws.send(JSON.stringify(reg));
      setTimeout(()=>{
        const login = { authentication: { username: username, password: password } };
        console.log('SEND LOGIN', login.authentication.username);
        ws.send(JSON.stringify(login));
      }, 800);
    }, 1400);
  });
  ws.on('message', (data) => {
    try{
      const msg = JSON.parse(data.toString());
      console.log('RECV', JSON.stringify(msg));
      // If server sends unauth or Authorized, react
      if (msg.Authorized) {
        console.log('Authorized OK — we are authenticated.');
        ws.close();
      }
      if (msg.unauth) {
        console.log('Unauth message:', JSON.stringify(msg.unauth));
      }
    }catch(e){
      console.log('MSG RAW', data.toString());
    }
  });
  ws.on('close', () => console.log('CLOSED'));
  ws.on('error', (e) => console.error('ERR', e && e.message));
}

run();
