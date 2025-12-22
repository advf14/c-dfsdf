
const UserInfo = require('../../Models/UserInfo');
const helper   = require('../../Helpers/Helpers');

module.exports = function(client){
	UserInfo.findOne({id:client.UID}, 'red lastVip redPlay vip', function(err, user){
		var vipHT = ((user.redPlay-user.lastVip)/100000)>>0; // Điểm vip Hiện Tại
		var red   = 0; // Giá điểm vip

		if (vipHT >= 120000) {
			red = 1050;
		}else if (vipHT >= 50000){
			red = 900;
		}else if (vipHT >= 15000){
			red = 750;
		}else if (vipHT >= 6000){
			red = 600;
		}else if (vipHT >= 3000){
			red = 500;
		}else if (vipHT >= 1000){
			red = 425;
		}else if (vipHT >= 500){
			red = 300;
		}else if (vipHT >= 100){
			red = 250;
		}

		var tien = vipHT*red; // Tiền thưởng lastVip
		if (tien > 0) {
			// Fix: Sử dụng atomic $inc operation để tránh race condition
			UserInfo.findByIdAndUpdate(
				user._id,
				{
					$inc: {red: tien, vip: vipHT},
					$set: {lastVip: user.redPlay}
				},
				{new: true},
				function(err, updatedUser) {
					if (!err && updatedUser) {
						client.red({profile:{level: {level: 1, vipNext: 100, vipPre: 0, vipTL: updatedUser.vip, vipHT: 0}}, notice:{text: 'Bạn nhận được ' + helper.numberWithCommas(tien) + ' K', title: 'THÀNH CÔNG'}, user:{red: updatedUser.red}});
					} else {
						client.red({notice:{text: 'Lỗi cập nhật thưởng...', title: 'LỖI'}});
					}
				}
			);
		}else{
			client.red({notice:{text: 'Bạn chưa đủ cấp VIP để đổi thưởng...', title: 'THẤT BẠI'}});
		}
	});
}
