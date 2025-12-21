
const ingame = require('./XocXoc/ingame');
const outgame = require('./XocXoc/outgame');
const cuoc = require('./XocXoc/cuoc');
const history = require('./XocXoc/history');

class XocXoc {
    constructor(io) {
        this.io = io;
        this.clients = {}; // Khởi tạo đối tượng lưu trữ clients
        // Khởi tạo các biến cần thiết cho game
        this.initializeGame();
    }

    initializeGame() {
        // Khởi tạo trạng thái ban đầu của game
        // Thêm các phương thức khởi tạo cần thiết
    }

    handleClient(client, data) {
        if (!!data.ingame) {
            ingame(client);
        }
        if (!!data.outgame) {
            outgame(client);
        }
        if (!!data.cuoc) {
            cuoc(client, data.cuoc);
        }
        if (!!data.log) {
            history(client, data.log);
        }
    }

    // Thêm client vào danh sách
    addClient(uid, client) {
        this.clients[uid] = client;
    }

    // Xóa client khỏi danh sách
    removeClient(uid) {
        if (this.clients[uid]) {
            delete this.clients[uid];
        }
    }

    // Lấy thông tin client
    getClient(uid) {
        return this.clients[uid];
    }
}

module.exports = XocXoc;
