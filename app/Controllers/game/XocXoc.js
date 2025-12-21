
const ingame = require('./XocXoc/ingame');
const outgame = require('./XocXoc/outgame');
const cuoc = require('./XocXoc/cuoc');
const history = require('./XocXoc/history');

class XocXoc {
    constructor(io) {
        this.io = io;
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

    // Thêm các phương thức khác của class XocXoc ở đây
}

module.exports = XocXoc;
