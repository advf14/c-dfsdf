
let first  = require('./Controllers/User.js').first;
let onPost = require('./Controllers/onPost.js');

let auth = function(client) {
	client.gameEvent = {};
	client.scene = 'home';
	first(client);
	client = null;
}

let signMethod = function(client) {
	client.TTClear = function(){
    try {
        if (!!this.caothap) {
            clearTimeout(this.caothap.time);
            this.caothap.time = null;
            this.caothap = null;
        }

        if (!!this.poker) {
            this.poker.outGame();
            this.poker = null;
        }
        if (!!this.bacay) {
            this.bacay.disconnect();
            this.bacay = null;
        }
        if (!!this.fish) {
            this.fish.outGame();
        }

        // Kiểm tra xocxoc và clients một cách an toàn
        if (this.redT && 
            this.redT.game && 
            this.redT.game.xocxoc && 
            this.UID && 
            typeof this.redT.game.xocxoc.removeClient === 'function') {
            
            const xocxoc = this.redT.game.xocxoc;
            
            try {
                // Gọi removeClient nếu UID tồn tại
                xocxoc.removeClient(this.UID);
                
                // Kiểm tra xem clients có tồn tại và là object không
                if (xocxoc.clients && typeof xocxoc.clients === 'object') {
                    // Thông báo cho các client khác
                    const clients = Object.keys(xocxoc.clients).length;
                    Object.values(xocxoc.clients).forEach((user) => {
                        if (user && user !== this && typeof user.red === 'function') {
                            user.red({xocxoc: {ingame: {client: clients}}});
                        }
                    });
                }
            } catch (e) {
                console.error('Error cleaning up xocxoc client:', e);
            } finally {
                // Giải phóng bộ nhớ
                this.redT = null;
            }
        }
    } catch (e) {
        console.error('Error in TTClear:', e);
    } finally {
        this.TTClear = null;
    }
}
	client = null;
}

module.exports = {
	auth:       auth,
	message:    onPost,
	signMethod: signMethod,
};
