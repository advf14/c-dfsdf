
var Users    = require('../../../../Models/Users');
var UserInfo = require('../../../../Models/UserInfo');
var Phone    = require('../../../../Models/Phone');
var Telegram = require('../../../../Models/Telegram');
var OTP      = require('../../../../Models/OTP');
var validator = require('validator');
var Helper    = require('../../../../Helpers/Helpers');

module.exports = async function(client, data) {
    try {
        if (!data || !data.id || !data.data) {
            return client.red({notice:{title:'LỖI', text:'Dữ liệu không hợp lệ'}});
        }

        const uData = data.data;
        const userId = data.id;
        const update = {};
        
        // Xử lý cập nhật mật khẩu
        if (!!uData.pass && validator.isLength(uData.pass, {min:6, max: 32})) {
            const password = Helper.generateHash(uData.pass);
            await Users.updateOne({'_id': userId}, {$set:{'local.password': password}}).exec();
            client.red({notice:{title:'THÀNH CÔNG', text:'Đổi mật khẩu thành công'}});
        }

        // Tìm thông tin người dùng
        const user = await UserInfo.findOne({'id': userId}).exec();
        if (!user) {
            return client.red({notice:{title:'LỖI', text:'Không tìm thấy người dùng'}});
        }

        // Xử lý cộng tiền
        if (uData.red !== undefined && uData.red !== '') {
            const amount = Helper.getOnlyNumberInString(uData.red);
            if (isNaN(amount) || amount <= 0) {
                return client.red({notice:{title:'LỖI', text:'Số tiền không hợp lệ'}});
            }
            
            // Cộng dồn số tiền
            user.red = (user.red || 0) + amount;
            await user.save();
            
            // Cập nhật số dư cho tất cả các phiên đăng nhập
            if (client.redT?.users?.[userId]) {
                client.redT.users[userId].forEach(socket => {
                    socket.red({user: {red: user.red}});
                });
            }
            
            client.red({notice:{title:'THÀNH CÔNG', text:`Đã cộng ${amount.toLocaleString()} Red vào tài khoản`}});
        }

        // Cập nhật thông tin khác (type, rights)
        if (uData.type !== undefined) {
            update.type = uData.type === '1';
        }
        if (uData.rights !== undefined) {
            update.rights = uData.rights === '1' ? 0 : 1;
        }
        
        if (Object.keys(update).length > 0) {
            await UserInfo.updateOne({'id': userId}, {$set: update}).exec();
        }

        // Xử lý cập nhật số điện thoại
        if (uData.phone && Helper.checkPhoneValid(uData.phone)) {
            await updatePhoneNumber(userId, uData.phone, client);
        }
        
    } catch (error) {
        console.error('Lỗi khi cập nhật người dùng:', error);
        client.red({notice:{title:'LỖI HỆ THỐNG', text:'Có lỗi xảy ra, vui lòng thử lại sau'}});
    }
};

async function updatePhoneNumber(userId, phone, client) {
    try {
        const phoneCrack = Helper.phoneCrack(phone);
        if (!phoneCrack) {
            return client.red({notice:{title:'LỖI', text:'Số điện thoại không hợp lệ'}});
        }

        // Chuẩn hóa mã vùng
        if (phoneCrack.region === '0' || phoneCrack.region === '84') {
            phoneCrack.region = '+84';
        }

        // Kiểm tra số điện thoại đã tồn tại chưa
        const existingPhone = await Phone.findOne({'phone': phoneCrack.phone}).exec();
        if (existingPhone && existingPhone.uid !== userId) {
            return client.red({notice:{title:'LỖI', text:'Số điện thoại đã được sử dụng'}});
        }

        // Xóa thông tin cũ nếu có
        const currentPhone = await Phone.findOne({'uid': userId}).exec();
        if (currentPhone) {
            await Promise.all([
                Telegram.deleteOne({'phone': currentPhone.phone}).exec(),
                OTP.deleteMany({'uid': userId, 'phone': currentPhone.phone}).exec(),
                UserInfo.updateOne({'id': userId}, {$set: {veryphone: false}}).exec()
            ]);
            
            // Cập nhật số mới
            currentPhone.phone = phoneCrack.phone;
            currentPhone.region = phoneCrack.region;
            await currentPhone.save();
        } else {
            // Tạo mới nếu chưa có
            await Phone.create({
                'uid': userId, 
                'phone': phoneCrack.phone, 
                'region': phoneCrack.region
            });
        }
        
        client.red({notice:{title:'THÀNH CÔNG', text:'Cập nhật số điện thoại thành công'}});
        
    } catch (error) {
        console.error('Lỗi khi cập nhật số điện thoại:', error);
        client.red({notice:{title:'LỖI', text:'Có lỗi khi cập nhật số điện thoại'}});
    }
}
