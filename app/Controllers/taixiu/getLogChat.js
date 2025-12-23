
var TXChat  = require('../../Models/TaiXiu_chat');
var TaiXiu_User = require('../../Models/TaiXiu_user');
var UserInfo    = require('../../Models/UserInfo');
function getIndex(arr,name){
	for(let i=0; i< arr.length ;i++){
		if(arr[i]['name'] == name){
			return i+1;
		}
	}
	return 0;
}
module.exports = function(client){
	TaiXiu_User.find({'totall':{$gt:0}}, 'totall uid', {sort:{totall:-1}, limit:10}, function(err, results) {
		Promise.all(results.map(function(obj){
			return new Promise(function(resolve, reject) {
				UserInfo.findOne({'id': obj.uid}, function(error, result2){
					resolve({name:!!result2 ? result2.name : ''});
				})
			})
		}))
		.then(function(result){
			 
			 TXChat.find({},'name value', {sort:{'_id':-1}, limit: 20}, function(err, post) {
				if (post.length){
					Promise.all(post.map(function(obj){return {'user':obj.name, 'value':obj.value,'top':getIndex(result,obj.name)}}))
					.then(function(arrayOfResults) {
						client.red({taixiu:{chat:{logs: arrayOfResults.reverse()}}});
					})
				}
			});
		});
	});
	
}
