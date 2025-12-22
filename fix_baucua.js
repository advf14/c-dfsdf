const fs = require('fs');
let content = fs.readFileSync('app/Cron/baucua.js', 'utf8');

// Replace the money calculation section
const oldCode = `let tongDat    = cuoc[0]+cuoc[1]+cuoc[2]+cuoc[3]+cuoc[4]+cuoc[5];
				let update     = {};
				let updateGame = {};
				cuoc.thanhtoan = 1;
				cuoc.betwin    = TongThang;
				tongwin = TongThang-tongDat;
				cuoc.save();
				update['totall']     = totall;
				updateGame['totall'] = totall;					
				if (TongThang > 0) {
					update['red'] = TongThang;
					//LScuoc.updateOne({uid:cuoc.uid, phien:phien}, {$set:{betwin:tongwin}, $inc:{tienhienco:cuoc.betwin}}).exec();
				}
				if (totall > 0) {
					update['redWin'] = updateGame['win'] = totall;
				}
				if (totall < 0) {
					update['redLost'] = updateGame['lost'] = totall*-1;
				}
				update['redPlay'] = updateGame['bet'] = tongDat;`;

const newCode = `let tongDat    = cuoc[0]+cuoc[1]+cuoc[2]+cuoc[3]+cuoc[4]+cuoc[5];
				let tongwin    = TongThang - tongDat;
				let update     = {};
				let updateGame = {};
				cuoc.thanhtoan = 1;
				cuoc.betwin    = TongThang;
				cuoc.save();
				update['totall']     = totall;
				updateGame['totall'] = totall;
				update['redPlay'] = updateGame['bet'] = tongDat;
				
				// Tính lợi nhuận thực: tiền thắng - tiền cược
				let loi_nhuan = TongThang - tongDat;
				if (loi_nhuan > 0) {
					update['red'] = loi_nhuan;
					update['redWin'] = loi_nhuan;
					updateGame['win'] = loi_nhuan;
				} else if (loi_nhuan < 0) {
					update['red'] = loi_nhuan;
					update['redLost'] = -loi_nhuan;
					updateGame['lost'] = -loi_nhuan;
				}`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync('app/Cron/baucua.js', content);
  console.log('✓ Sửa tính lợi nhuận xong');
} else {
  console.log('✗ Không tìm thấy đoạn code cần sửa');
}
