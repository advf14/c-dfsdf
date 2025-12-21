const mongoose = require('mongoose');
const crypto = require('crypto');

(async ()=>{
  try{
    // initialize mongoose-long like server.js does
    require('mongoose-long')(mongoose);
    await mongoose.connect('mongodb+srv://advf133:hoangquocthien@cluster0.hyrzdvw.mongodb.net/CLUB3333',{useNewUrlParser:true,useUnifiedTopology:true});
    console.log('DB connected');
    const User = require('../app/Models/Users');
    const UserInfo = require('../app/Models/UserInfo');
    const users = await User.find({'local.username':/^testbot/});
    console.log('Found users', users.length);
    for(const u of users){
      console.log('Processing', u.local.username, u._id.toString());
      const idStr = u._id.toString();
      const ui = await UserInfo.findOne({id: idStr});
      if (!ui){
        const name = (u.local.username+'').toLowerCase();
        const newUi = new UserInfo({id: idStr, name: name, avatar:'0'});
        await newUi.save();
        console.log('Created UserInfo for', name);
      } else {
        console.log('UserInfo exists');
      }
      // create token
      const token = crypto.createHash('sha256').update(new Date()+''+Math.random()).digest('hex');
      await User.updateOne({'_id': u._id}, {$set:{'local.token': token}}).exec();
      console.log('Set token for', u.local.username, token.slice(0,8));
    }
    process.exit(0);
  }catch(e){
    console.error(e);
    process.exit(1);
  }
})();
