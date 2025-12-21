XocXoc.prototype.thanhtoan = async function(dice = null) {
    if (!dice) return;

    try {
        // ... (phần tính toán kết quả như cũ) ...

        const list = await XocXoc_cuoc.find({phien: phien}).lean().exec();
        
        if (!list.length) {
            this.play();
            return;
        }

        // Xử lý từng người chơi tuần tự để tránh xung đột
        for (const cuoc of list) {
            try {
                // Tính toán tiền thắng/thua
                let { tongDat, tongThang, totall } = this.tinhTienCuoc(cuoc, gameChan, red3, red4, white3, white4);

                // Tạo đối tượng cập nhật
                let update = {
                    totall: totall,
                    redPlay: tongDat
                };

                if (tongThang > 0) {
                    update.red = tongThang;
                }
                if (totall > 0) {
                    update.redWin = totall;
                } else if (totall < 0) {
                    update.redLost = Math.abs(totall);
                }

                // Cập nhật số dư người chơi
                if (!cuoc.bot) {
                    await this.capNhatSoDuNguoiChoi(cuoc.uid, update, tongThang, totall);
                }

                // Cập nhật thống kê
                await XocXoc_user.updateOne(
                    { uid: cuoc.uid }, 
                    { $inc: { 
                        totall: update.totall,
                        bet: update.redPlay,
                        ...(update.redWin && { win: update.redWin }),
                        ...(update.redLost && { lost: update.redLost })
                    }}
                ).exec();

                // Thông báo cho người chơi
                this.guiThongBaoThangThua(cuoc, tongThang, totall);

            } catch (error) {
                console.error(`Lỗi khi xử lý người chơi ${cuoc.uid || 'unknown'}:`, error);
            }
        }

        // Reset và chơi vòng mới
        this.resetGameState();
        this.play();

    } catch (error) {
        console.error('Lỗi nghiêm trọng trong hàm thanhtoan:', error);
        // Khởi động lại vòng chơi nếu có lỗi
        this.play();
    }
};

// Hàm phụ trợ: Tính toán tiền cược
XocXoc.prototype.tinhTienCuoc = function(cuoc, gameChan, red3, red4, white3, white4) {
    let tongDat = cuoc.chan + cuoc.le + cuoc.red3 + cuoc.red4 + cuoc.white3 + cuoc.white4;
    let tongThang = 0;
    let totall = 0;

    // Tính toán tiền thắng/thua cho từng loại cược
    const tinhTien = (cuocTien, thang, heSo) => {
        if (cuocTien > 0) {
            if (thang) {
                const thang = cuocTien * heSo;
                tongThang += thang;
                totall += thang;
            } else {
                totall -= cuocTien;
            }
        }
    };

    tinhTien(cuoc.chan, gameChan, 1.98);
    tinhTien(cuoc.le, !gameChan, 1.98);
    tinhTien(cuoc.red3, red3, 3.94);
    tinhTien(cuoc.red4, red4, 14.7);
    tinhTien(cuoc.white3, white3, 3.94);
    tinhTien(cuoc.white4, white4, 14.7);

    return { tongDat, tongThang, totall };
};

// Hàm phụ trợ: Cập nhật số dư người chơi
XocXoc.prototype.capNhatSoDuNguoiChoi = async function(uid, update, tongThang, totall) {
    const session = await UserInfo.startSession();
    session.startTransaction();

    try {
        const user = await UserInfo.findOne({ id: uid }).session(session);
        if (!user) {
            throw new Error(`Không tìm thấy người chơi ${uid}`);
        }

        // Cập nhật số dư
        if (update.red) {
            user.red = (user.red || 0) + update.red;
        }

        // Lưu thay đổi
        await user.save({ session });
        await session.commitTransaction();
        
        console.log(`Đã cập nhật số dư cho ${uid}: +${update.red || 0} (Tổng: ${user.red})`);

    } catch (error) {
        await session.abortTransaction();
        console.error(`Lỗi khi cập nhật số dư cho ${uid}:`, error);
        throw error;
    } finally {
        session.endSession();
    }
};

// Hàm phụ trợ: Gửi thông báo thắng/thua
XocXoc.prototype.guiThongBaoThangThua = function(cuoc, tongThang, totall) {
    if (this.clients[cuoc.uid]) {
        const status = {
            xocxoc: {
                status: {
                    win: tongThang > 0,
                    bet: Math.abs(totall)
                }
            }
        };
        if (tongThang > 0) {
            status.xocxoc.status.winAmount = tongThang;
        }
        this.clients[cuoc.uid].red(status);
    }
};

// Hàm phụ trợ: Reset trạng thái game
XocXoc.prototype.resetGameState = function() {
    this.time = 43;
    this.ingame = { red: {} };
    this.resetData();
    this.resetDataAdmin();
};