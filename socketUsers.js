let validator = require('validator');
let User      = require('./app/Models/Users');
let UserInfo  = require('./app/Models/UserInfo');
let helpers   = require('./app/Helpers/Helpers');
let socket    = require('./app/socket.js');
// captcha removed
let forgotpass = require('./app/Controllers/user/for_got_pass');

// Authenticate!
let authenticate = function(client, data, callback) {
	if (!!data){
		let token = data.token;
		if (!!token && !!data.id) {
			let id = data.id>>0;
			UserInfo.findOne({'UID':id}, 'id', function(err, userI){
				if (!!userI) {
					User.findOne({'_id':userI.id}, 'local fail lock', function(err, userToken){
						if (!!userToken) {
							if (userToken.lock === true) {
								callback({title:'CẤM', text:'Tài khoản bị vô hiệu hóa.'}, false);
								return void 0;
							}
							if (void 0 !== userToken.fail && userToken.fail > 3) {
								callback({title:'THÔNG BÁO', text: 'Vui lòng đăng nhập !!'}, false);
								userToken.fail  = userToken.fail>>0;
								userToken.fail += 1;
								userToken.save();
							}else{
								if (userToken.local.token === token) {
									userToken.fail = 0;
									userToken.save();
									client.UID = userToken._id.toString();
									callback(false, true);
								}else{
									callback({title:'THẤT BẠI', text:'Bạn hoặc ai đó đã đăng nhập trên 1 thiết bị khác !!'}, false);
								}
							}
						}else{
							callback({title:'THẤT BẠI', text: 'Truy cập bị từ chối !!'}, false);
						}
					});
				}else{
					callback({title:'THẤT BẠI', text:'Truy cập bị từ chối !!'}, false);
				}
			});
		} else if(!!data.username && !!data.password){
			let username = ''+data.username+'';
			let password = ''+data.password+'';
			let captcha  = data.captcha;
			let register = !!data.register;
			let az09     = new RegExp('^[a-zA-Z0-9]+$');
			let testName = az09.test(username);

			if (!validator.isLength(username, {min: 3, max: 32})) {
				register && client.c_captcha('signUp');
				callback({title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Tài khoản (3-32 kí tự).'}, false);
			}else if (!validator.isLength(password, {min: 6, max: 32})) {
				register && client.c_captcha('signUp');
				callback({title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Mật khẩu (6-32 kí tự)'}, false);
			}else if (!testName) {
				register && client.c_captcha('signUp');
				callback({title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Tên đăng nhập chỉ gồm kí tự và số !!'}, false);
			}else if (username === password) {
				register && client.c_captcha('signUp');
				callback({title: register ? 'ĐĂNG KÝ' : 'ĐĂNG NHẬP', text: 'Tài khoản không được trùng với mật khẩu!!'}, false);
			}else{
				try {
					username = username.toLowerCase();
					// Đăng Ký (captcha disabled) 
					if (register) {
						username = username.toLowerCase();
						User.findOne({'local.username':username}).exec(function(err, check){
							if (!!check){
								callback({title: 'ĐĂNG KÝ', text: 'Tên tài khoản đã tồn tại !!'}, false);
							}else{
								User.create({'local.username':username, 'local.password':helpers.generateHash(password), 'local.regDate': new Date()}, function(err, user){
									if (!!user){
										// create UserInfo so first() can authorize immediately
										try{
											UserInfo.create({id: user._id.toString(), name: username, avatar:'0'}, function(errUi, ui){
												client.UID = user._id.toString();
												callback(false, true);
											});
										}catch(e){
											client.UID = user._id.toString();
											callback(false, true);
										}
									}else{
										callback({title: 'ĐĂNG KÝ', text: 'Tên tài khoản đã tồn tại !!'}, false);
									}
								});
							}
						});
					} else {
						// Đăng Nhập (captcha disabled)
						User.findOne({'local.username':username}, function(err, user){
							if (user){
								if (user.lock === true) {
									callback({title:'CẤM', text:'Tài khoản bị vô hiệu hóa.'}, false);
									return void 0;
								}
								if (user.validPassword(password)){
									if(!user.local.ban_login){
										user.fail = 0;
										user.save();
										client.UID = user._id.toString();
										callback(false, true);
										global['userOnline']++;
									}else{
										callback({title: 'ĐĂNG NHẬP', text: 'Tài khoản bị khoá. Vui lòng liên hệ CSKH để được hỗ trợ'}, false);
									}
								}else{
									user.fail  = user.fail>>0;
									user.fail += 1;
									user.save();
									callback({title: 'ĐĂNG NHẬP', text: 'Mật khẩu không chính xác!!'}, false);
								}
							}else{
								callback({title: 'ĐĂNG NHẬP', text: 'Tên Tài Khoản không tồn tại!!'}, false);
							}
						});
					}
				} catch (error) {
					callback({title: 'THÔNG BÁO', text: 'Có lỗi xảy ra, vui lòng kiểm tra lại!!'}, false);
				}
			}
		}
	}
};

module.exports = function(ws, redT){
	ws.auth      = false;
	ws.UID       = null;
	ws.captcha   = {};
	ws.c_captcha = function(){};
	ws.red = function(data){
		try {
			this.readyState == 1 && this.send(JSON.stringify(data));
		} catch(err) {}
	}
	socket.signMethod(ws);
	ws.on('message', function(message) {
		try {
			if (!!message) {
				message = JSON.parse(message);
				// captcha handling disabled
				if (!!message.forgotpass) {
					forgotpass(this, message.forgotpass);
				}
				if (this.auth == false && !!message.authentication) {
					authenticate(this, message.authentication, function(err, success){
						if (success) {
							this.auth = true;
							// Fix: Assign redT TRƯỚC khi gọi socket.auth để tránh null reference
							this.redT = redT;
							socket.auth(this);
							redT = null;
						} else if (!!err) {
							this.red({unauth: err});
							//this.close();
						} else {
							this.red({unauth: {message:'Authentication failure'}});
							//this.close();
						}
					}.bind(this));
				}else if(!!this.auth){
					socket.message(this, message);
				}
			}
		} catch (error) {
		}
	});
	ws.on('close', function(message) {
		if (this.UID !== null && void 0 !== this.redT.users[this.UID]) {
			if (this.redT.users[this.UID].length === 1 && this.redT.users[this.UID][0] === this) {
				delete this.redT.users[this.UID];
			}else{
				var self = this;
				this.redT.users[this.UID].forEach(function(obj, index){
					if (obj === self) {
						self.redT.users[self.UID].splice(index, 1);
					}
				});
			}
		}
		this.auth = false;
		void 0 !== this.TTClear && this.TTClear();
		global['userOnline'] = global['userOnline']--;
	});
}
