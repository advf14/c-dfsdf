
const Users = require('../../../../Models/Users');
const UserInfo = require('../../../../Models/UserInfo');
const Phone = require('../../../../Models/Phone');
const Telegram = require('../../../../Models/Telegram');
const OTP = require('../../../../Models/OTP');
const validator = require('validator');
const Helper = require('../../../../Helpers/Helpers');

// Hàm xử lý lỗi chung
function handleError(client, error, defaultMessage = 'Có lỗi xảy ra') {
    console.error('Lỗi:', error);
    if (client && typeof client.red === 'function') {
        client.red({notice:{title:'LỖI', text: error.message || defaultMessage}});
    }
}

module.exports = async function(client, data) {
    // Kiểm tra client và dữ liệu đầu vào
    if (!client || typeof client.red !== 'function') {
        console.error('Client không hợp lệ hoặc thiếu phương thức red');
        return;
    }

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

        try {
            // Tìm thông tin người dùng
            const user = await UserInfo.findOne({'id': userId}).exec()
                .catch(error => {
                    throw new Error(`Lỗi khi tìm người dùng: ${error.message}`);
                });

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
                user.red = (parseInt(user.red) || 0) + parseInt(amount);
                
                try {
                    await user.save();
                    
                    // Cập nhật số dư cho tất cả các phiên đăng nhập
                    if (client.redT && client.redT.users && client.redT.users[userId]) {
                        client.redT.users[userId].forEach(socket => {
                            if (socket && typeof socket.red === 'function') {
                                socket.red({user: {red: user.red}});
                            }
                        });
                    }
                    
                    client.red({
                        notice:{
                            title: 'THÀNH CÔNG', 
                            text: `Đã cộng ${parseInt(amount).toLocaleString()} Red vào tài khoản`
                        }
                    });
                    
                } catch (saveError) {
                    console.error('Lỗi khi lưu thông tin người dùng:', saveError);
                    client.red({
                        notice:{
                            title: 'LỖI',
                            text: 'Không thể cập nhật số dư. Vui lòng thử lại sau.'
                        }
                    });
                }
            }

        // Cập nhật thông tin khác (type, rights)
        if (uData.type !== undefined) {
            update.type = uData.type === '1';
        }
        if (uData.rights !== undefined) {
            update.rights = uData.rights === '1' ? 0 : 1;
        }
        
            // Cập nhật thông tin khác (type, rights)
            if (uData.type !== undefined) {
                update.type = uData.type === '1';
            }
            if (uData.rights !== undefined) {
                update.rights = uData.rights === '1' ? 0 : 1;
            }
            
            if (Object.keys(update).length > 0) {
                try {
                    await UserInfo.updateOne(
                        {'id': userId}, 
                        {$set: update}
                    ).exec();
                    
                    client.red({
                        notice:{
                            title: 'THÀNH CÔNG',
                            text: 'Cập nhật thông tin thành công'
                        }
                    });
                } catch (updateError) {
                    console.error('Lỗi khi cập nhật thông tin người dùng:', updateError);
                    client.red({
                        notice:{
                            title: 'LỖI',
                            text: 'Không thể cập nhật thông tin. Vui lòng thử lại sau.'
                        }
                    });
                }
            }

            // Xử lý cập nhật số điện thoại
            if (uData.phone && Helper.checkPhoneValid(uData.phone)) {
                try {
                    await updatePhoneNumber(userId, uData.phone, client);
                } catch (phoneError) {
                    console.error('Lỗi khi cập nhật số điện thoại:', phoneError);
                    // Không cần thông báo lỗi ở đây vì đã được xử lý trong hàm updatePhoneNumber
                }
            }
            
        } catch (error) {
            console.error('Lỗi không xác định khi cập nhật người dùng:', error);
            if (client && typeof client.red === 'function') {
                client.red({
                    notice:{
                        title: 'LỖI HỆ THỐNG',
                        text: 'Có lỗi xảy ra, vui lòng thử lại sau.'
                    }
                });
            }
        }
    }
};

async function updatePhoneNumber(userId, phone, client) {
    try {
        const phoneCrack = Helper.phoneCrack(phone);
        if (!phoneCrack) {
            client.red({notice:{title:'LỖI', text:'Số điện thoại không hợp lệ'}});
            return;
        }

        // Chuẩn hóa mã vùng
        if (phoneCrack.region === '0' || phoneCrack.region === '84') {
            phoneCrack.region = '+84';
        }

        // Kiểm tra số điện thoại đã tồn tại chưa
        const existingPhone = await Phone.findOne({'phone': phoneCrack.phone}).exec();
        if (existingPhone && existingPhone.uid !== userId) {
            client.red({notice:{title:'LỖI', text:'Số điện thoại đã được sử dụng'}});
            return;
        }

        // Sử dụng transaction để đảm bảo tính toàn vẹn dữ liệu
        const session = await Phone.startSession();
        session.startTransaction();
        
        try {
            // Xóa thông tin cũ nếu có
            const currentPhone = await Phone.findOne({'uid': userId}).session(session).exec();
            
            if (currentPhone) {
                await Promise.all([
                    Telegram.deleteOne({'phone': currentPhone.phone}).session(session).exec(),
                    OTP.deleteMany({'uid': userId, 'phone': currentPhone.phone}).session(session).exec(),
                    UserInfo.updateOne(
                        {'id': userId}, 
                        {$set: {veryphone: false}},
                        {session}
                    ).exec()
                ]);
                
                // Cập nhật số mới
                currentPhone.phone = phoneCrack.phone;
                currentPhone.region = phoneCrack.region;
                await currentPhone.save({session});
            } else {
                // Tạo mới nếu chưa có
                await Phone.create([{
                    'uid': userId, 
                    'phone': phoneCrack.phone, 
                    'region': phoneCrack.region
                }], {session});
            }
            
            await session.commitTransaction();
            session.endSession();
            
            client.red({
                notice:{
                    title: 'THÀNH CÔNG',
                    text: 'Cập nhật số điện thoại thành công'
                }
            });
            
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error; // Ném lỗi để xử lý ở catch bên ngoài
        }
        
    } catch (error) {
        console.error('Lỗi khi cập nhật số điện thoại:', error);
        if (client && typeof client.red === 'function') {
            client.red({
                notice:{
                    title: 'LỖI',
                    text: 'Có lỗi khi cập nhật số điện thoại. Vui lòng thử lại sau.'
                }
            });
        }
        throw error; // Ném lại lỗi để xử lý ở hàm gọi
    }
