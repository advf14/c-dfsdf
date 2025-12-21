var ChuyenRed = require('../../../../Models/ChuyenRed');
var UserInfo = require('../../../../Models/UserInfo');
var tab_DaiLy = require('../../../../Models/DaiLy');
var OTP = require('../../../../Models/OTP');
var Phone = require('../../../../Models/Phone');
var validator = require('validator');
var Helper = require('../../../../Helpers/Helpers');

module.exports = function(req, res, redT) {
    try {
        const { body, userAuth } = req || {};
        const { Data: data } = body || {};
        
        // Xử lý dữ liệu đầu vào
        data.name = data.nickname || data.name;
        data.red = data.valueRed || data.red;
        data.desc = data.desc || data.message || 'Admin chuyển tiền';

        if (!data || !data.name || !data.red) {
            return res.json({ 
                status: 200, 
                success: false, 
                data: { message: 'Vui lòng nhập đủ thông tin!' } 
            });
        }

        var red = parseInt(data.red) || 0;
        var name = (data.name + '').toLowerCase().trim();

        // Validate dữ liệu
        if (name.length < 3 || name.length > 17 || red < 10000) {
            return res.json({
                status: 200,
                success: false,
                data: { message: 'Thông tin không hợp lệ!' }
            });
        }

        // Kiểm tra người dùng
        Promise.all([
            tab_DaiLy.findOne({
                $or: [
                    { nickname: name },
                    { nickname: userAuth.nickname }
                ]
            }).exec(),
            UserInfo.findOne({ name: name }, 'id name red').exec(),
            UserInfo.findOne({ id: userAuth.id }, 'red').exec()
        ])
        .then(([daily, to, user]) => {
            if (!to || !user) {
                return res.json({ 
                    status: 200, 
                    success: false, 
                    data: { message: 'Không tìm thấy thông tin người dùng!' } 
                });
            }

            if (to.id == userAuth.id) {
                return res.json({
                    status: 200,
                    success: false,
                    data: { message: 'Không thể tự chuyển cho chính mình!' }
                });
            }

            // Thực hiện chuyển tiền
            var thanhTien = red;
            var create = { 
                from: userAuth.nickname, 
                to: to.name, 
                red: red, 
                red_c: thanhTien, 
                time: new Date(), 
                message: data.desc 
            };

            // Cập nhật số dư người nhận
            UserInfo.updateOne(
                { name: to.name }, 
                { $inc: { red: thanhTien } }
            ).exec();

            // Ghi nhận lịch sử giao dịch
            new ChuyenRed(create).save();

            // Gửi thông báo realtime nếu người dùng đang online
            if (redT && redT.users && redT.users[to.id]) {
                redT.users[to.id].red({ 
                    notice: { 
                        title: 'CHUYỂN XU', 
                        text: `Bạn nhận được ${Helper.numberWithCommas(thanhTien)} XU từ Admin: ${userAuth.nickname}`
                    }, 
                    user: { 
                        red: (to.red || 0) + thanhTien 
                    } 
                });
            }

            res.json({
                status: 200,
                success: true,
                data: {
                    message: `Chuyển ${Helper.numberWithCommas(thanhTien)} XU thành công cho ${to.name}`
                }
            });

        })
        .catch(err => {
            console.error('Transfer error:', err);
            res.json({ 
                status: 500, 
                success: false, 
                data: { message: 'Có lỗi xảy ra, vui lòng thử lại!' } 
            });
        });

    } catch (error) {
        console.error('Transfer admin error:', error);
        res.json({ 
            status: 500, 
            success: false, 
            data: { message: 'Lỗi hệ thống, vui lòng liên hệ admin!' } 
        });
    }
};