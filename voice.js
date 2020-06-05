const { Models, Detector } = require('snowboy');
const speech = require('@google-cloud/speech');
const SampleRate = require('node-libsamplerate');
const { Transform } = require('stream');
const play = require('./commands/play.js');

const speechClient = new speech.SpeechClient();

class Voice {
	constructor(member) {
		const models = new Models();

		models.add({
			file: './node_modules/snowboy/resources/models/computer.umdl',
			sensitivity: process.env.SNOWBOY_SENSITIVITY,
			hotwords: 'computer'
		});

		this.detector = new Detector({
			resource: './node_modules/snowboy/resources/common.res',
			models: models,
			audioGain: Number(process.env.SNOWBOY_GAIN),
			applyFrontEnd: true
		});

		const resample = new SampleRate({
			type: 2,
			channels: 1,
			fromRate: 48000,
			fromDepth: 16,
			toRate: 16000,
			toDepth: 16
		});

		let firstConnection = member.guild.voice ? member.guild.voice.channel : member.guild.voice;
		this.connection = member.voice.channel.join().then(connection => {
			this.connection = connection;

			if(!firstConnection){
				this.connection.play('./resources/on_connect.wav', { volume: 0.01 });
			}

			const audio = this.connection.receiver.createStream(member.user, { mode: 'pcm', end: 'manual' });
	
			const convertTo1ChannelStream = new ConvertTo1ChannelStream();
	
			this.monoAudio = audio.pipe(convertTo1ChannelStream).pipe(resample);
			this.requestStream = null;

			//truth be told I'm not satisfied with this solution
			//I would prefer to declare the object then call listen, it seems more intuitive to me
			//however its late when I refactored this and I'd be lying if I said I expected this to be changed soon
			this.listen();
		});
	}

	listen() {
		const request = {
			config: {
				encoding: 'LINEAR16',
				sampleRateHertz: 16000,
				languageCode: 'en-US',
			},
			interimResults: false,
			singleUtterance: true
		};

		this.detector.on('hotword', () => {
			this.monoAudio.unpipe(this.detector);
			if (play.isPlaying) {
				play.pause();
			}
			this.connection.play('./resources/on_connect.wav', { volume: 0.75 });


			this.requestStream = speechClient.streamingRecognize(request)
				.on('error', console.error)
				.on('data', data => {
					if (play.isPaused) {
						play.resume();
					}
					this.monoAudio.unpipe(this.requestStream);
					this.monoAudio.pipe(this.detector);
					this.requestStream.end();

					if (data.results[0]) {
						const client = this.connection.client;

						let args = data.results[0].alternatives[0].transcript.split(' ');
						const command = args.shift().toLowerCase();

						if (!client.voiceCommands.has(command)){ return; }

						try {
							if(!play.connection){
								play.connection = this.connection;
							}
							client.voiceCommands.get(command).executeVoice(args);
						} catch (error) {
							console.error(error);
						}
					}
				});

			setTimeout(() => {
				if (this.requestStream.writable) {
					this.monoAudio.unpipe(this.requestStream);
					this.monoAudio.pipe(this.detector);
					this.requestStream.setWritable(false);
				}
			}, 6000);
			this.monoAudio.pipe(this.requestStream);
		});
		this.monoAudio.pipe(this.detector);
	}

	close() {
		if (this.requestStream && this.requestStream.writable) {
			this.requestStream.destroy();
			if(play.isPaused){
				play.resume();
			}
		}
		if(this.monoAudio){
			this.monoAudio.destroy();
			this.detector.destroy();
		}
	}
}


function convertBufferTo1Channel(buffer) {
	const convertedBuffer = Buffer.alloc(buffer.length / 2)

	for (let i = 0; i < convertedBuffer.length / 2; i++) {
		const uint16 = buffer.readUInt16LE(i * 4)
		convertedBuffer.writeUInt16LE(uint16, i * 2)
	}

	return convertedBuffer
}

class ConvertTo1ChannelStream extends Transform {
	constructor(source, options) {
		super(options)
	}

	_transform(data, encoding, next) {
		next(null, convertBufferTo1Channel(data))
	}
}

module.exports = Voice

