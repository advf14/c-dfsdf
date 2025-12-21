const mongoose = require('mongoose');
const configDB = require('../config/database');
const crypto = require('crypto');
const readline = require('readline');
// Initialize mongoose-long
require('mongoose-long')(mongoose);
const Schema = mongoose.Schema;
const Types = Schema.Types;
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});
// Kết nối database
mongoose.connect(configDB.url, configDB.options)
  .then(() => console.log('Đã kết nối tới MongoDB'))
  .catch(err => {
    console.error('Lỗi kết nối MongoDB:', err);
    process.exit(1);
  });
// Import model sau khi đã kết nối
const UserInfo = require('../app/Models/UserInfo');
// Hàm tạo tên ngẫu nhiên
function generateRandomName(prefix = 'Bot') {
  const randomString = Math.random().toString(36).substring(2, 8);
  return `${prefix}${randomString}`.toLowerCase();
}
// Hàm tạo mật khẩu ngẫu nhiên
function generateRandomPassword(length = 12) {
  return crypto.randomBytes(Math.ceil(length / 2))
    .toString('hex')
    .slice(0, length);
}
// Hàm tạo tài khoản bot
async function createBotAccount(balance) {
  const username = generateRandomName();
  const password = generateRandomPassword();
  const botId = `bot_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  try {
    // Kiểm tra tài khoản đã tồn tại chưa
    const existingUser = await UserInfo.findOne({ id: botId });
    if (existingUser) {
      console.log(`Tài khoản ${botId} đã tồn tại`);
      return createBotAccount(balance);
    }
    // Tạo tài khoản mới với kiểu dữ liệu Long
    const newBot = new UserInfo({
      id: botId,
      name: username,
      red: balance,
      type: true, // Đánh dấu là bot
      veryphone: true,
      rights: 0,
      joinedOn: new Date()
    });
    
    await newBot.save();
    
    console.log('Đã tạo tài khoản bot thành công:');
    console.log(`- ID: ${botId}`);
    console.log(`- Tên đăng nhập: ${username}`);
    console.log(`- Mật khẩu: ${password}`);
    console.log(`- Số dư: ${parseInt(balance).toLocaleString()} đ`);
    console.log('----------------------------------');
    
    return { 
      id: botId, 
      username, 
      password, 
      balance: balance.toString()
    };
  } catch (error) {
    console.error('Lỗi khi tạo tài khoản bot:', error);
    throw error;
  }
}
// Hàm chính
async function main() {
  try {
    // Hỏi số lượng bot
    const count = await new Promise((resolve) => {
      rl.question('Nhập số lượng bot cần tạo (mặc định 1): ', (answer) => {
        resolve(answer.trim() === '' ? 1 : parseInt(answer) || 1);
      });
    });
    // Hỏi số tiền mỗi bot
    const balance = await new Promise((resolve) => {
      rl.question('Nhập số tiền cho mỗi bot (VD: 20000000000): ', (answer) => {
        const amount = answer.trim() === '' ? '20000000000' : answer.replace(/,/g, '');
        resolve(parseInt(amount));
      });
    });
    console.log(`\nĐang tạo ${count} tài khoản bot, mỗi bot ${balance.toLocaleString()}đ...\n`);
    
    const createdBots = [];
    for (let i = 0; i < count; i++) {
      const bot = await createBotAccount(balance);
      createdBots.push(bot);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    console.log('\nĐã tạo thành công các tài khoản bot:');
    createdBots.forEach((bot, index) => {
      console.log(`${index + 1}. ${bot.username} - ${parseInt(bot.balance).toLocaleString()}đ`);
    });
    
    // Ghi thông tin vào file
    const fs = require('fs');
    const path = require('path');
    const fileName = `bot_accounts_${new Date().toISOString().replace(/[:.]/g, '-')}.txt`;
    const filePath = path.join(__dirname, '..', 'bot_accounts', fileName);
    
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    
    // Ghi thông tin vào file
    const content = createdBots.map(bot => 
      `ID: ${bot.id}\nTên đăng nhập: ${bot.username}\nMật khẩu: ${bot.password}\nSố dư: ${parseInt(bot.balance).toLocaleString()}đ\n`
    ).join('\n----------------------------------\n');
    
    fs.writeFileSync(filePath, content);
    console.log(`\nĐã lưu thông tin vào file: ${filePath}`);
    
  } catch (error) {
    console.error('Có lỗi xảy ra:', error);
  } finally {
    // Đóng kết nối
    rl.close();
    await mongoose.connection.close();
    process.exit(0);
  }
}
// Chạy chương trình
main();