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
	if(command.excecuteVoice){
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

//////////////////////////////////////////////////////////////////////////////////////
//	Voice was nowhere near ready to be deployed and I merged to master by mistake.	//
//	I have elected to leave it in and simply comment out the relevant section.		//
//////////////////////////////////////////////////////////////////////////////////////
const voiceMap = new Map();

client.on('voiceStateUpdate', async (oldVoiceState, newVoiceState) => {
	if (newVoiceState.member.user.bot){ return; }
	else if(!newVoiceState.channel){//if a user disconnects their voice state is now null
		if(!voiceMap.has(newVoiceState.member)){ return; }//they were never connected
		voiceMap.get(newVoiceState.member).close();
		voiceMap.delete(newVoiceState);
	}
	else{
		console.log(newVoiceState.member.user.username);
		voiceMap.set(newVoiceState.member, new Voice(newVoiceState.member));
	}
});

client.login(process.env.DISCORD_TOKEN).then(()=> {
	console.log('don\'t worry Jared, it\'s working');
});
