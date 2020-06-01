const { Models, Detector } = require('snowboy');
const speech = require('@google-cloud/speech');
const SampleRate = require('node-libsamplerate');
const { Transform } = require('stream');

const speechClient = new speech.SpeechClient();

function listen(connection, user) {
	const audio = connection.receiver.createStream(user, { mode: 'pcm', end: 'manual' });

	const convertTo1ChannelStream = new ConvertTo1ChannelStream();

	const resample = new SampleRate({
		type: 2,
		channels: 1,
		fromRate: 48000,
		fromDepth: 16,
		toRate: 16000,
		toDepth: 16
	});
	let monoAudio = audio.pipe(convertTo1ChannelStream).pipe(resample);

	const models = new Models();

	const request = {
		config: {
			encoding: 'LINEAR16',
			sampleRateHertz: 16000,
			languageCode: 'en-US',
		},
		interimResults: false,
		singleUtterance: true
	};

	models.add({
		file: './node_modules/snowboy/resources/models/computer.umdl',
		sensitivity: '0.7',
		hotwords: 'computer'
	});

	const detector = new Detector({
		resource: './node_modules/snowboy/resources/common.res',
		models: models,
		audioGain: 2.0,
		applyFrontEnd: true
	});


	detector.on('hotword', function (index, hotword, buffer) {
		
		console.log('hotword', index, hotword);
		monoAudio.unpipe(detector);

		const requestStream = speechClient.streamingRecognize(request)
			.on('error', (err) => {
				console.error(err);
			})
			.on('data', data => {
				//console.log(data.results[0] ? data.results[0].alternatives : data);
				if (data.results[0]) {
					const client = connection.client;

					let args = data.results[0].alternatives[0].transcript.split(' ');
					const command = args.shift().toLowerCase();

					if (!client.commands.has(command)) return;

					if(command == 'play'){
						const play = require('./commands/play.js');
						play.voice(args, connection);
					}
				}
				monoAudio.unpipe(requestStream);
				monoAudio.pipe(detector);
				requestStream.end();
			});

		monoAudio.pipe(requestStream);

	});


	monoAudio.pipe(detector);
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

module.exports = {
	listen
};