const unirest = require('unirest');
const ytdl = require('ytdl-core');
const yts = require('yt-search');
const qCommand = require('./queue.js');
let queue = require('../resources/queue.json');

module.exports = {
    name: 'play',
    description: 'plays music',
    async execute(message, args) {
        if (message.member.voice.channel) {
            const connection = await message.member.voice.channel.join();
            if (args[0]) {
                let opts = {
                    query: args.join(' '),
                    pageStart: 1, 
                    pageEnd: 1,
                }

                yts( opts, (err, res) => {
                    if(err) { return console.error(err); }
                    if (connection.speaking.bitfield == 0) {
                        
                        message.client.user.setPresence({ activity: { type: 'LISTENING', name:  res.videos[0].title}});
                        connection.play(ytdl(res.videos[0].url, { quality: 'highestaudio', filter: 'audioonly' }), { volume: 0.25 })
                            .on('speaking', (value) => {
                                if (value == 1) { return; }

                                musicQueueHandler(connection);
                            });
                        message.delete().catch(console.error);
                    }
                    else {
                        queue.push({
                            url: res.videos[0].url,
                            title: res.videos[0].title
                        });

                        qCommand.execute(message, args);
                    }
                })
            }
            else {
                message.channel.send('Please provide a song title')
            }
        }
        else {
            message.channel.send('You need to join a channel first');
        }
    },
};

function musicQueueHandler(connection) {
    if (queue[0]) {
        const song = queue.shift();
        if(connection.client.user.lastMessage && queue[0]){
            qCommand.execute(connection.client.user.lastMessage);
        }
        else if(!queue[0]){
            connection.client.user.lastMessage.delete().catch(console.error);
        }
        connection.client.user.setPresence({ activity: { type: 'LISTENING', name:  song.title}});
        connection.play(ytdl(song.url, { quality: 'highestaudio', filter: 'audioonly' }), { volume: 0.25 })
            .on('speaking', (value) => {
                if (value == 1) { return; }

                musicQueueHandler(connection);
            });
    }
    else{
        connection.client.user.setPresence({}).catch(console.error);
    }
}