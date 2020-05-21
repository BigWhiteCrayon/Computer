module.exports = {
	name: 'ping',
	description: 'Ping!',
	execute(message, args) {
		message.channel.send('I\'m sorry Dave. I\'m afraid I can\'t do that.', {tts: true});
	},
};