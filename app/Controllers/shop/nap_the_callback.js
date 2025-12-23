let tab_NapThe = require('../../Models/NapThe');
let UserInfo = require('../../Models/UserInfo');
var helper = require('../../Helpers/Helpers');
var MongoClient = require('mongodb').MongoClient;
let configDB = require('../../../config/database');
var url = configDB.url;
module.exports = function (req, res) {
    //fs.readFile(path.dirname(path.dirname(__dirname)) + '/config/sys.json', 'utf8', (err, data)=>{
    let nhan = req.body.amount;
    var nhanInt = parseInt(nhan);
    nhanInt = nhanInt + nhanInt * 0;
    let status = req.body.status;
    let requestId = req.body.content;
    let clientUID = '';
    console.log("Server the tra ve " + requestId + "trang thai" + status + "thuc nhan duoc " + nhan);
    if (status == 'thanhcong') {
        tab_NapThe.updateOne({ 'requestId': requestId }, { $set: { nhan: nhanInt, status: 1 } }).exec();
        tab_NapThe.findOne({ 'requestId': requestId }, function (err, result) {
            if (err) throw err;
            if (result != null) {
                console.log(result.uid);
                clientUID = result.uid;
				UserInfo.findOneAndUpdate({'id':clientUID}, {$inc:{red:nhanInt}}, function(err2, user) {
					//dbo.collection("userinfos").findOneAndUpdate({'id':clientUID}, {$inc:{red:nhanInt}},function(err,result){
						if(err2) throw err2;
						console.log(' nhan duoc '+ nhanInt);
						 
						if (void 0 !== redT.users[clientUID]) {
							Promise.all(redT.users[clientUID].map(function(obj) {
								obj.red({ notice: {title:'THÀNH CÔNG', text:`Nạp thẻ thành công \nBạn nhận được ${helper.numberWithCommas(nhanInt)} gold.`, load: false}, user:{red: parseInt(user.red)+parseInt(nhanInt)} });
							}));
						}
				});
            }
        });
         
    }
    else {
        tab_NapThe.updateOne({ 'requestId': requestId }, { $set: { nhan: 0, status: 2 } }).exec();
		
    }
    res.sendStatus(200);
}