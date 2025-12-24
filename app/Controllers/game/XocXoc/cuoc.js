
let XocXoc_cuoc = require('../../../Models/XocXoc/XocXoc_cuoc');
let UserInfo    = require('../../../Models/UserInfo');
let TopVip      = require('../../../Models/VipPoint/TopVip');
let getConfig   = require('../../../Helpers/Helpers').getConfig;
let Push    = require('../../../Models/Push');

var cacheXocXoc = {}

module.exports = function(client, data){
	if (!!data.cuoc && !!data.box) {
		let cuoc = data.cuoc>>0;
		let box  = data.box;

		if (client.redT.game.xocxoc.time < 2 || client.redT.game.xocxoc.time > 30) {
			client.red({xocxoc:{notice: 'Vui lòng cược ở phiên sau.!!'}});
			return;
		}

		if (!(cuoc === 1000 || cuoc === 10000 || cuoc === 50000 || cuoc === 100000 || cuoc === 1000000) ||
			!(box === 'chan' || box === 'le' || box === 'red3' || box === 'red4' || box === 'white3' || box === 'white4')) {
			client.red({mini:{XocXoc:{notice: 'Cược thất bại...'}}});
		}else{
			let name = client.profile.name;
			UserInfo.findOne({id:client.UID}, 'red', function(err, user){
				if (!user || user.red < cuoc) {
					client.red({xocxoc:{notice: 'Bạn không đủ GOLD để cược.!!'}});
				} else {



					let phien = client.redT.game.xocxoc.phien
					// if (client.cacheXocXoc == undefined) client.cacheXocXoc = {}
					// if (client.cacheXocXoc[`${client.UID}-${phien}`] == undefined) client.cacheXocXoc[`${client.UID}-${phien}`] = {'chan': 0,'le':0}
					// else {
					// 	let tmp = client.cacheXocXoc[`${client.UID}-${phien}`]
					// 	client.cacheXocXoc = {}
					// 	client.cacheXocXoc[`${client.UID}-${phien}`] = tmp
						
					// }
					// client.cacheXocXoc[`${client.UID}-${phien}`];

					// console.log(client.cacheXocXoc,`${client.UID}-${phien}`,box)

					// if (box == 'chan') {
					// 	if(client.cacheXocXoc[`${client.UID}-${phien}`]['le'] > 0)
					// 	{
					// 		return client.red({xocxoc:{notice: 'Bạn không được đặt 2 cửa cùng lúc!!'}});
					// 	}
					// }
					// else if (box == 'le') {
					// 	if(client.cacheXocXoc[`${client.UID}-${phien}`]['chan'] > 0)
					// 	{
					// 		return client.red({xocxoc:{notice: 'Bạn không được đặt 2 cửa cùng lúc!!'}});
					// 	}
					// }
					// client.cacheXocXoc[`${client.UID}-${phien}`][box] += 1

					let now = new Date().getTime();
					if(client.timeCacheXocXoc == undefined)
						client.timeCacheXocXoc = now - 250
					
					
					if(now - client.timeCacheXocXoc < 250)
						return client.red({xocxoc:{notice: 'Bạn đạt quá nhanh'}});
					client.timeCacheXocXoc = now

					let xocxoc = client.redT.game.xocxoc;
					user.red -= cuoc;
					user.save();

					

					xocxoc.chip[box][cuoc] += 1;

					XocXoc_cuoc.findOne({uid:client.UID, phien:xocxoc.phien}, function(err, checkOne) {
						if (checkOne){
							checkOne[box] += cuoc;
							checkOne.save();
						}else{
							var create = {uid:client.UID,name: name, phien:xocxoc.phien, time: new Date()};
							create[box] = cuoc;
							XocXoc_cuoc.create(create);
						}

						let newData = {
							'chan':   0,
							'le':     0,
							'red3':   0,
							'red4':   0,
							'white3': 0,
							'white4': 0,
						};
						newData[box] = cuoc;
						let me_cuoc = {};
						xocxoc.data.red[box] += cuoc;
						xocxoc.dataAdmin.red[box] += cuoc;
						if (xocxoc.ingame.red[name]) {
							xocxoc.ingame.red[name][box] += cuoc;
						}else{
							xocxoc.ingame.red[name] = newData;
						}
						me_cuoc.red = xocxoc.ingame.red[name];
						Object.values(xocxoc.clients).forEach(function(users){
							if (client !== users) {
								users.red({xocxoc:{chip:{box:box, cuoc:cuoc}}});
							}else{
								users.red({xocxoc:{mechip:{box:box, cuoc:data.cuoc}, me:me_cuoc}, user:{red:user.red}});
							}
						});

						Push.create({
							type:"GameXocXocBet",
							data:JSON.stringify({uid:client.UID,name:client.profile.name,money:cuoc,box:box})
						});
						let vipStatus = getConfig('topVip');
						if (!!vipStatus && vipStatus.status === true) {
							TopVip.updateOne({'name':name}, {$inc:{vip:cuoc}}).exec(function(errV, userV){
								if (!!userV && userV.n === 0) {
									try{
						    			TopVip.create({'name':name, 'vip':cuoc});
									} catch(e){
									}
								}
								name = null;
								cuoc = null;
							});
						}else{
							name = null;
							cuoc = null;
						}
						client  = null;
						xocxoc  = null;
						me_cuoc = null;
						newData = null;
						data    = null;
						box  = null;
					})
				}
			});
		}
	}
};
