/**
 * Tài Xỉu Floating Money Animation
 * Hiệu ứng tiền nổi lên khi thắng/thua
 */

module.exports = {
    /**
     * Tạo floating money animation data
     * @param {number} amount - Số tiền cần hiển thị
     * @param {number} duration - Khoảng thời gian animation (ms)
     * @param {string} type - Loại animation (floatingMoney, floatingMoneyLose)
     * @returns {object} Animation config
     */
    createFloatingAnimation: function(amount, duration = 2000, type = 'floatingMoney') {
        return {
            type: type,
            amount: amount,
            duration: duration,
            startPosition: {x: 0, y: 0},              // Sẽ tính từ client
            endPosition: {x: 0, y: -150},              // Nổi lên 150px
            startOpacity: 1,
            endOpacity: 0,
            startScale: 1,
            endScale: 1.2,
            easing: 'easeOut',
            color: type === 'floatingMoney' ? '#FFD700' : '#FF6B6B',  // Gold cho win, Red cho lose
            fontSize: 48,
            fontWeight: 'bold',
            shadow: {
                color: '#000000',
                offsetX: 2,
                offsetY: 2,
                blur: 4,
                opacity: 0.5
            }
        };
    },

    /**
     * Format tiền thành string hiển thị
     * @param {number} money - Số tiền
     * @returns {string} Formatted money string
     */
    formatMoney: function(money) {
        if (money >= 1000000) {
            return (money / 1000000).toFixed(1) + 'M';
        } else if (money >= 1000) {
            return (money / 1000).toFixed(1) + 'K';
        }
        return money.toString();
    },

    /**
     * Tạo win animation package
     */
    createWinAnimation: function(betAmount, multiplier = 1.98) {
        const winAmount = Math.floor(betAmount * multiplier);
        return {
            type: 'floatingMoney',
            amount: winAmount,
            betAmount: betAmount,
            multiplier: multiplier,
            duration: 2000,
            particles: [
                {
                    type: 'coin',
                    count: 5,
                    size: 20,
                    color: '#FFD700',
                    speed: 2,
                    angle: Math.PI * 2 / 5
                }
            ]
        };
    },

    /**
     * Tạo lose animation package
     */
    createLoseAnimation: function(betAmount) {
        return {
            type: 'floatingMoneyLose',
            amount: betAmount,
            duration: 2000,
            shake: true,
            shakeIntensity: 5,
            particles: [
                {
                    type: 'spark',
                    count: 3,
                    size: 15,
                    color: '#FF6B6B',
                    speed: 1.5
                }
            ]
        };
    }
};
