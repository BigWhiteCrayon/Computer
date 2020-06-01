require('dotenv').config();
const fs = require('fs');
const Discord = require('discord.js');
const { prefix } = require('./config.json');
const voice = require('./voice.js');

const client = new Discord.Client();
client.commands = new Discord.Collection();

const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./commands/${file}`);
	client.commands.set(command.name, command);
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

client.on('voiceStateUpdate', async (oldVoiceState, newVoiceState) => {
	if (newVoiceState.member.user.bot || !newVoiceState.channel) { return }

	const connection = await newVoiceState.member.voice.channel.join().catch(console.error);
	
    
	console.log(newVoiceState.member.user.username);
	voice.listen(connection, newVoiceState.member.user);
});

client.login(process.env.DISCORD_TOKEN).then(()=> {
	console.log('don\'t worry Jared, it\'s working');
});
