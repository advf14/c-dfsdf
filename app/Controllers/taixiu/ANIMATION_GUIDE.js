/**
 * HƯỚNG DẪN IMPLEMENT FLOATING MONEY ANIMATION
 * Cho Game Tài Xỉu (Cocos2D)
 * 
 * Animation Data Flow:
 * 1. Server (taixiu.js) gửi animation data khi client thắng/thua
 * 2. Client nhận dữ liệu từ socket
 * 3. Cocos2D render animation:
 *    - Tiền nổi lên từ vị trí cược
 *    - Kéo dài 2 giây
 *    - Fade out + scale up (1.0 → 1.2)
 *    - Biến mất
 */

// ============================================
// DỮ LỰU GỬI TỪ SERVER (taixiu.js)
// ============================================

// Khi THẮNG:
{
    taixiu: {
        win: {
            amount: 1980,          // Tiền thắng (1000 × 1.98)
            bonus: 0,              // Bonus thêm (nếu có)
            total: 1980,           // Tổng cộng
            phien: 12345           // ID phiên chơi
        },
        animation: {
            type: 'floatingMoney',
            amount: 1980,          // Số tiền hiển thị
            duration: 2000,        // 2 giây (2000ms)
            initialBet: 1000,      // Cược ban đầu
            multiplier: 1.98       // Hệ số nhân
        }
    }
}

// Khi THUA:
{
    taixiu: {
        lose: {
            amount: 1000,          // Tiền cược mất
            phien: 12345           // ID phiên chơi
        },
        animation: {
            type: 'floatingMoneyLose',
            amount: 1000,
            duration: 2000,
            status: 'lose'         // Đánh dấu là lose animation
        }
    }
}

// ============================================
// IMPLEMENT COCOS2D (JavaScript)
// ============================================

/*
// Trong TaiXiu scene handler:

socket.on('taixiu', function(data) {
    if (data.animation) {
        handleFloatingAnimation(data.animation, data.win || data.lose);
    }
});

function handleFloatingAnimation(animData, resultData) {
    let animNode = new cc.Node();
    let label = new cc.Label();
    
    // Format tiền (1980 → "1.98K")
    let displayAmount = formatMoney(animData.amount);
    
    label.string = '+' + displayAmount;
    label.fontSize = 48;
    label.fontColor = animData.type === 'floatingMoney' ? cc.color(255, 215, 0) : cc.color(255, 107, 107);
    label.node.parent = animNode;
    
    // Position: Tại nơi cược (dưới màn hình)
    animNode.x = cc.winSize.width / 2;   // Center X
    animNode.y = 100;                     // Gần dưới màn hình
    
    animNode.parent = this.gameLayer;
    
    // Tạo action animation
    let moveUp = cc.moveBy(animData.duration / 1000, 0, 200);      // Nổi lên 200px
    let fadeOut = cc.fadeTo(animData.duration / 1000, 0);          // Fade out
    let scaleUp = cc.scaleTo(animData.duration / 1000, 1.2);       // Scale 1.0 → 1.2
    
    let parallel = cc.spawn(moveUp, fadeOut, scaleUp);
    let remove = cc.callFunc(function() {
        animNode.removeFromParent();
    });
    
    let sequence = cc.sequence(parallel, remove);
    animNode.runAction(sequence);
}

function formatMoney(money) {
    if (money >= 1000000) {
        return (money / 1000000).toFixed(1) + 'M';
    } else if (money >= 1000) {
        return (money / 1000).toFixed(1) + 'K';
    }
    return money.toString();
}
*/

// ============================================
// HOẶC DÙNG cc.Tween (Cocos 3.x+)
// ============================================

/*
function handleFloatingAnimation(animData, resultData) {
    let animNode = new cc.Node();
    let label = new cc.Label();
    
    label.string = '+' + formatMoney(animData.amount);
    label.fontSize = 48;
    label.fontColor = animData.type === 'floatingMoney' 
        ? cc.color(255, 215, 0)      // Gold
        : cc.color(255, 107, 107);   // Red
    
    label.node.parent = animNode;
    animNode.x = cc.winSize.width / 2;
    animNode.y = 100;
    animNode.parent = this.gameLayer;
    
    // Tween animation (2 giây)
    cc.tween(animNode)
        .parallel(
            cc.tween().by(2, {y: 200}),           // Nổi lên 200px
            cc.tween().to(2, {opacity: 0}),       // Fade out
            cc.tween().to(2, {scale: 1.2})        // Scale 1.0 → 1.2
        )
        .call(function() {
            animNode.removeFromParent();
        })
        .start();
}
*/

// ============================================
// ANIMATION TIMING
// ============================================
// Duration: 2000ms (2 giây)
// 
// Timeline:
// 0ms ─── Tiền hiển thị (opacityy=1, scale=1.0)
// 1000ms ─ Tiền đã nổi lên nửa đường
// 2000ms ─ Tiền biến mất hoàn toàn (opacity=0, scale=1.2)

// ============================================
// GHI CHÚ QUAN TRỌNG
// ============================================
/*
1. Multiplier: 1.98 = cược × 1.98
   - Cược 1000 → Thắng 1980
   - Cược 100.000.000 → Thắng 198.000.000

2. Animation chiều dài: 2 giây (đủ để người chơi nhìn thấy)

3. Color:
   - Win (thắng): Gold (#FFD700)
   - Lose (thua): Red (#FF6B6B)

4. Position: Nổi lên từ vị trí cược (dưới màn hình)

5. Effect: Fade out + Scale up (làm cho tiền như "bay" lên)
*/
