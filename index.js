require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const Voice = require('./voice.js');

const client = new Discord.Client();
client.commands = new Discord.Collection();
client.voiceCommands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
	//since I don't expect all typed commands to have a voice command equivilent this if is required
	if(command.voice){
		client.voiceCommands.set(command.name, command);
	}	
}

client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.slice(prefix.length).split(/ +/);
	const command = args.shift().toLowerCase();

	if (!client.commands.has(command)) return;

	try {
		client.commands.get(command).execute(message, args);
	} catch (error) {
		console.error(error);
		message.reply('there was an error trying to execute that command!');
	}
});

///////////////////////////////////////////////////////////////////////////////
//	This is the voice section. It will only work on linux or MacOS			//
//	My recommedation is to either use the docker image or comment this out	//
//////////////////////////////////////////////////////////////////////////////

const voiceMap = new Map(); // stores all the voice objects

client.on('voiceStateUpdate', async (oldVoiceState, newVoiceState) => {
	if (newVoiceState.member.user.bot){ return; }
	else if(!newVoiceState.channel || //if a user disconnects their voice state is now null
			(newVoiceState.guild.voice && newVoiceState.guild.voice.connection && 
			newVoiceState.channel != newVoiceState.guild.voice.channel)){

		if(!voiceMap.has(newVoiceState.member) || !newVoiceState.guild.voice.connection){ return; }//they were never connected

		if(oldVoiceState.channel.members.size <= 1){
			oldVoiceState.guild.voice.connection.disconnect();
			client.user.setPresence({}).catch(console.error);
		}

		voiceMap.get(newVoiceState.member).close();
		voiceMap.delete(newVoiceState);
	}
	else{
		if(newVoiceState.guild.voice && newVoiceState.guild.voice.connection &&
			newVoiceState.channelID != newVoiceState.guild.voice.channelID){ return; }

		console.log(newVoiceState.member.user.username);
		voiceMap.set(newVoiceState.member, new Voice(newVoiceState.member));
	}
});

client.login(process.env.DISCORD_TOKEN).then(() => {
	console.log('don\'t worry Jared, it\'s working');
});
