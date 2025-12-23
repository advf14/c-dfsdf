
var Bank_history = require('../../../Models/Bank/Bank_history');
var UserInfo     = require('../../../Models/UserInfo');
var OTP          = require('../../../Models/OTP');
var Phone        = require('../../../Models/Phone');
var validator    = require('validator');
var Push        = require('../../../Models/Push');
module.exports = function(client, data){
	if (!!data.bank && !!data.number && !!data.name && !!data.rut) {
		if (!validator.isLength(data.bank, {min: 4, max: 17})) {
			client.red({notice: {title:'LỖI', text: 'Ngân hàng không hợp lệ...'}});
		}else if (!validator.isLength(data.number, {min: 8, max: 17})) {
			client.red({notice: {title:'LỖI', text: 'Số tài khoản không hợp lệ...'}});
		}else if (!validator.isLength(data.name, {min: 8, max: 32})) {
			client.red({notice: {title:'LỖI', text: 'Ngân hàng không hợp lệ...'}});
		}else if (!validator.isLength(data.rut, {min: 4, max: 17})) {
			client.red({notice: {title:'LỖI', text: 'Số tiền không hợp lệ...'}});
		}else {
				Phone.findOne({uid: client.UID}, {}, function(err1, check){
				check ={};
			if (check) {
								UserInfo.findOne({id:client.UID}, 'red', function(err, user){
									if (user) {
											var rut = data.rut>>0;
											if (rut < 20000) {
												client.red({notice:{title:'THẤT BẠI', text:'Rút tối thiểu là 20.000.!'}});
											}else{
												if (user.red >= rut) {
													Bank_history.create({uid:client.UID, bank:data.bank, number:data.number, name:data.name, money:rut, type:1, time:new Date()});
													UserInfo.updateOne({id:client.UID}, {$inc:{'red':-rut}}).exec();
													client.red({notice:{title:'THÀNH CÔNG', text:'Đã gửi yêu cầu rút tiền.!'}, user:{red:user.red-rut}});
													try{
														Push.create({
															type:"BankRut",
															data:JSON.stringify({uid:client.UID,money:rut,name:data.name,bank:data.bank,number:data.number})
														});
														 
													}catch(e){
														console.log(e)
													}
												}else{
												client.red({notice:{title:'THẤT BẠI', text:'Sô dư không khả dụng.!'}});
											}
										}
										
									}
								});
				}else{
					client.red({notice:{title:'LỖI', text:'Bạn chưa kích hoạt số điện thoại.!'}});
				}
			});
		}
	}else{
		client.red({notice:{title:'LỖI', text:'Nhập đầy đủ các thông tin.!'}});
	}
}

