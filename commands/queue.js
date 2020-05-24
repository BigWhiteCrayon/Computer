let queue = require('../resources/queue.json');

module.exports = {
	name: 'queue',
	description: 'Displays the current song queue',
	execute(message, args) {
		if(!queue[0]){
            return message.channel.send('The queue is currently empty. Enter a song!');
        }
        let reply = 'Current Queue\n1. ' + queue[0].title;
        for(let i = 1; i < queue.length; i++){
            reply += '\n' + (i + 1).toString() + '. ' + queue[i].title;
        }
        message.channel.send(reply);
        
        message.delete().catch(console.error);
        
        if(message.client.user.lastMessage)
            message.client.user.lastMessage.delete();
	},
};