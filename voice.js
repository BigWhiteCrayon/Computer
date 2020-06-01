const { Models , Detector } = require('snowboy');
const speech = require('@google-cloud/speech');

const speechClient = new speech.SpeechClient();


function listen(audio){
	const convertTo1ChannelStream = new ConvertTo1ChannelStream();

	const monoAudio = audio.pipe(convertTo1ChannelStream);
	const models = new Models();

	const request = {
		config: {
		encoding: 'LINEAR16',
		sampleRateHertz: 48000,
		languageCode: 'en-US',
	  },
	  interimResults: false,
	  singleUtterance: true
	};

	models.add({
		file: './node_modules/snowboy/resources/models/computer.umdl',
		sensitivity: '0.99',
		hotwords: 'computer'
	});

	const detector = new Detector({
		resource: './node_modules/snowboy/resources/common.res',
		models: models,
		audioGain: 1.225,
		applyFrontEnd: true
	});


	  detector.on('hotword', function (index, hotword, buffer) {
		// <buffer> contains the last chunk of the audio that triggers the "hotword"
		// event. It could be written to a wav stream. You will have to use it
		// together with the <buffer> in the "sound" event if you want to get audio
		// data after the hotword.
		console.log('hotword', index, hotword);
		monoAudio.unpipe(detector);
		
		const requestStream = speechClient.streamingRecognize(request)
		.on('error', console.error)
		.on('data', data => {
		  console.log(data.results[0].alternatives);
		  monoAudio.unpipe(requestStream);
		  monoAudio.pipe(detector);
		  requestStream.end();
		});
		
		monoAudio.pipe(requestStream);
		
	  });
	
	  
	monoAudio.pipe(detector);
}

const { Transform } = require('stream')

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