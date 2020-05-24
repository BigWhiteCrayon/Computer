const unirest = require('unirest');
const ytdl = require('ytdl-core');
const qCommand = require('./queue.js');
let queue = require('../resources/queue.json');

module.exports = {
    name: 'play',
    description: 'plays music',
    async execute(message, args) {
        if (message.member.voice.channel) {
            const connection = await message.member.voice.channel.join();
            if (args[0]) {
                let string = '';
                for (const arg of args) {
                    string += arg + '%20';
                }
                string = string.substring(0, string.length - 3);
                let url = 'https://www.googleapis.com/youtube/v3/search?key=' + process.env.GOOGLE_API_KEY +
                    '&part=snippet&maxResults=1&q=' + string + '&type=video';
                req = await unirest('GET', url)
                    .end((res) => {
                        if (res.error) {
                            if (res.status == 403) {
                                return message.channel.send('The player is currently our of plays. I plan to fix this soon.'
                                    + 'Jordan is sorry for his incompetence');
                            }
                            console.log(res.error);
                        }
                        else if (connection.speaking.bitfield == 0) {
                            const musicURL = 'https://www.youtube.com/watch?v=' + res.body.items[0].id.videoId;
                            message.client.user.setPresence({ activity: { type: 'LISTENING', name:  res.body.items[0].snippet.title}});
                            connection.play(ytdl(musicURL, { quality: 'highestaudio', filter: 'audioonly' }), { volume: 0.25 })
                                .on('speaking', (value) => {
                                    if (value == 1) { return; }

                                    musicQueueHandler(connection);
                                });
                            message.delete().catch(console.error);
                        }
                        else {
                            queue.push({
                                videoId: res.body.items[0].id.videoId,
                                title: res.body.items[0].snippet.title,
                                artist: res.body.items[0].snippet.channelTitle,
                                thumbnails: res.body.items[0].snippet.thumbnails
                            });

                            qCommand.execute(message, args);
                        }
                    });
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
        const musicURL = 'https://www.youtube.com/watch?v=' + queue[0].videoId;
        queue.shift();
        connection.play(ytdl(musicURL, { quality: 'highestaudio', filter: 'audioonly' }), { volume: 0.25 })
            .on('speaking', (value) => {
                if (value == 1) { return; }
                message.delete().catch(console.error);
                message.client.user.setPresence({ activity: { type: 'LISTENING', name:  res.body.items[0].snippet.title}});
                musicQueueHandler(connection);
            });
    }
    message.client.user.setPresence({});
}