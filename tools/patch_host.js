const fs = require('fs');
const paths = ['public/src/project.js','public/admin/src/project.js','ADMIN/src/project.js'];
paths.forEach(p=>{
  try{
    if(fs.existsSync(p)){
      let s = fs.readFileSync(p,'utf8');
      const before = '"74.220.49.0"';
      const after = 'location.hostname+":8080"';
      const cnt = (s.match(new RegExp(before.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&'),'g')) || []).length;
      if(cnt>0){
        s = s.split(before).join(after);
        fs.writeFileSync(p,s,'utf8');
        console.log('patched',p,'replacements=',cnt);
      } else {
        console.log('no match',p);
      }
    } else console.log('not found',p);
  }catch(e){ console.error('err',p,e.message) }
});
