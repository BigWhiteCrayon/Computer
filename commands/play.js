const ytdl = require('ytdl-core');
const yts = require('yt-search');
const qCommand = require('./queue.js');
let queue = require('../resources/queue.json');

let timerStart = null;
let currentURL = null;
let timerElapsed = null;

module.exports = {
    name: 'play',
    description: 'plays music',
    voice: true,
    async execute(message, args) {
        if (message.member.voice.channel) {
            this.connection = await message.member.voice.channel.join();
            if (args[0]) {
                let opts = {
                    query: args.join(' '),
                    pageStart: 1,
                    pageEnd: 1,
                }

                yts(opts, (err, res) => {
                    if (err) { return console.error(err); }
                    if (this.connection.speaking.bitfield == 0) {

                        message.client.user.setPresence({ activity: { type: 'LISTENING', name: res.videos[0].title } });
                        this.connection.play(ytdl(res.videos[0].url, {filter: 'audioonly' }), { volume: 0.25 })
                            .on('start', () => {
                                this.timerStart = process.hrtime.bigint();
                                this.currentURL = res.videos[0].url;
                                this.isPlaying = true;
                            })
                            .on('speaking', (value) => {
                                if (value == 1) { return; }

                                musicQueueHandler(this.connection);
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
    async executeVoice(args) {
        if (args[0]) {
            let opts = {
                query: args.join(' '),
                pageStart: 1,
                pageEnd: 1,
            }

            yts(opts, (err, res) => {
                if (err) { return console.error(err); }
                if (!this.isPlaying && !this.isPaused) {
                    this.connection.client.user.setPresence({ activity: { type: 'LISTENING', name: res.videos[0].title } });
                    this.connection.play(ytdl(res.videos[0].url, {filter: 'audioonly' }), { volume: 0.25 })
                        .on('start', () => {
                            this.timerStart = process.hrtime.bigint();
                            this.currentURL = res.videos[0].url;
                            this.isPlaying = true;
                        })
                        .on('speaking', (value) => {
                            if (value == 1) { return; }

                            musicQueueHandler(this.connection);
                        });
                }
                else {
                    queue.push({
                        url: res.videos[0].url,
                        title: res.videos[0].title
                    });
                }
            })
        }
    },
    pause() {
        if (!this.isPlaying) { return; }
        this.isPaused = true;
        this.isPlaying = false;
        this.timerElapsed = process.hrtime.bigint() - this.timerStart;
    },
    //at the moment due to how inconsistent youtube is this just doesn't work, I'm leaving it in for hope
    resume() {
        if (!this.isPaused) { return; }
        this.isPaused = false;
        this.isPlaying = true;
        this.connection.play(ytdl(this.currentURL+'&t='+(this.timerElapsed / 1000000000n).toString(), { filter: 'audioonly' }), { volume: 0.25 })
            .on('start', () => {
                this.timerStart = process.hrtime.bigint() - this.timerElapsed;
            })
            .on('speaking', (value) => {
                if (value == 1) { return; }

                musicQueueHandler(this.connection);
            });
    },
    isPaused: false,
    isPlaying: false,
    connection: null
};

function musicQueueHandler(connection) {
    if (queue[0]) {
        const song = queue.shift();
        if (connection.client.user.lastMessage && queue[0]) {
            qCommand.execute(connection.client.user.lastMessage);
        }
        else if (!queue[0] && connection.client.user.lastMessage) {
            connection.client.user.lastMessage.delete().catch(console.error);
        }
        connection.client.user.setPresence({ activity: { type: 'LISTENING', name: song.title } });
        connection.play(ytdl(song.url, {filter: 'audioonly' }), { volume: 0.25 })
            .on('start', () => {
                module.exports.timerStart = process.hrtime.bigint();
                module.exports.currentURL = song.url;
            })
            .on('speaking', (value) => {
                if (value == 1) { return; }

                musicQueueHandler(connection);
            });
    }
    else {
        module.exports.isPlaying = false;
        module.exports.currentURL = null;
        connection.client.user.setPresence({}).catch(console.error);
    }
}