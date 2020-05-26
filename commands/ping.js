module.exports = {
	name: 'ping',
	description: 'Ping!',
	execute(message, args) {
		if(message.member.displayName == 'Inheritor'){
			return message.channel.send('I\'m sorry Jared. I\'m afraid I can\'t do that.', {tts: true});
		}
		message.channel.send('I\'m sorry Dave. I\'m afraid I can\'t do that.', {tts: true});
	},
};