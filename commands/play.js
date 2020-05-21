const unirest = require('unirest');
const ytdl = require('ytdl-core');
const ffmpeg = require('ffmpeg-static');

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
                req = unirest('GET', url)
                    .end(function (res) {
                        if (res.error) throw new Error(res.error);
                        const musicURL = 'https://www.youtube.com/watch?v=' + res.body.items[0].id.videoId;
                        connection.play(ytdl(musicURL, { quality: 'highestaudio' }), {volume: 0.25});
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