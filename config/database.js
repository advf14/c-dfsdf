
const url = process.env.MONGO_URL;

if (!url) {
	throw new Error('Missing MONGO_URL env var for MongoDB connection');
}

module.exports = {
	url,
	options: {
		//'user':   'kvcpro',
		//'pass':   'Minhhoang',
		dbName: 'RongVang88fun', // red
		useNewUrlParser: true,
		useUnifiedTopology: true,
		//'autoIndex':       false,
	},
};
