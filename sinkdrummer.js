"use strict";

var context;
var UI;
var source = null;
var gainNode = null;
var sinkdrummer = null;


var Util = {
	floatToCents: function(float) {
		// -1200   0   1200
		//     0   1.0 2.0
		return float;
	},
	bpmToSecs: function(bpm) {
		return 1.0 / (bpm / 60.0);
	},
	secsToSamps: function(ms, rate) {
		rate = rate || 44100;
		return ms / rate;
	}
};


function Buffer(url, bpm) {
	this.url = url;
	this.bpm = bpm;
	this.audioBuffer = null;
}

var Buffers = {
	_buffers: {},
	_bufferList: [],

	init: function(callback) {
		var buffers = [
			new Buffer("/samples/sink_short_120.wav", 120),
			new Buffer("/samples/cmaj120.wav", 120),
			new Buffer("/samples/jongly.wav", 172)
			// "/samples/SupaTrigga_dry1.mp3"
		];
		async.map(buffers, Buffers.load, function onBuffersLoaded(err) {
			if (err === null) {
				return callback(null);
			} else {
				console.error("Error loading buffer(s)", err);
				return callback(err);
			}
		});
	},

	load: function(buffer, callback) {
		console.log("Buffers.load", buffer.url);
		var request = new XMLHttpRequest();
		request.open('GET', buffer.url, true);
		request.responseType = 'arraybuffer';

		// Decode asynchronously
		request.onload = function() {
			window.context.decodeAudioData(request.response,
				function(audioData) {
					console.log("successfully decoded", buffer.url);
					buffer.audioBuffer = audioData;
					Buffers._buffers[buffer.url] = buffer;
					Buffers._bufferList.push(buffer);
					return callback(null, buffer);
				},
				function(e) {
					if (e) console.error("actual exception", e);
					else console.error("failed to decode", buffer.url);
					return callback("Failed to decode " + buffer.url, null);
				}
			);
		};

		request.send();
	},

	/// arg can be numeric index or URL
	get: function(arg) {
		var buf = null;
		if (typeof arg === "number") {
			buf = Buffers._bufferList[arg];
		} else if (typeof arg === "string") {
			buf = Buffers._buffers[arg];
		}

		if (buf !== undefined && buf !== null) {
			return buf;
		} else {
			console.error("Buffers does not contain", arg);
		}
	}
};


function Sinkdrummer(buffer) {
	this.buffer = buffer;
	this.source = null;
	console.log("sinkdrummer constructor", this);
}

Sinkdrummer.prototype.play = function() {
	console.log("play", this);
	if (this.buffer === null) {
		console.error("buffer is null; cannot play");
		return;
	}
	if (this.source !== null) {
		console.log("this.source is not null");
		window.src = this.source;
		this.source.stop();
	}

	var source = this.source = context.createBufferSource();
	source.buffer = this.buffer.audioBuffer;
	source.connect(gainNode);
	source.detune.value = UI.speed.value;
	source.loop = true;

	var beatSubdivision = parseFloat(UI.getBeatSubdivisionValue());
	console.log("beatSubdivision: " + beatSubdivision);
	var minBeats = 1;
	var maxBeats = 4;

	var secsPerBeat = Util.bpmToSecs(this.buffer.bpm) * beatSubdivision;
	var numBeatsForLoop = minBeats + parseInt(Math.random() * (maxBeats - minBeats));
	var duration = (numBeatsForLoop * secsPerBeat) / beatSubdivision;
	var totalBeats = source.buffer.duration / secsPerBeat;
	var startBeat = parseInt(Math.random() * (totalBeats - numBeatsForLoop));
	var startBeatSecs = startBeat * secsPerBeat;
	var endBeatSecs = startBeatSecs + duration;

	source.loopStart = startBeatSecs;
	source.loopEnd = endBeatSecs;

	console.log("loop from beat", startBeat, "for", numBeatsForLoop, "beats",
		        "seconds:", startBeatSecs, "-", endBeatSecs);

	source.start(context.currentTime, startBeatSecs);
};

Sinkdrummer.prototype.stop = function() {
	if (this.source === null) {
		console.error("null audio source");
		return;
	}
	this.source.stop();
	this.source = null;
};

Sinkdrummer.prototype.setPitch = function(value) {
	UI.speedOutput.value = value;
	if (source !== null) {
		source.detune.value = value;
	}
};

Sinkdrummer.prototype.resetPitch = function() {
	this.setPitch(0);
	UI.speed.value = 0;
};

Sinkdrummer.prototype.setVolume = function(value) {
	this.gainNode.gain.value = value;
};


function initUI(callback) {
	window.UI = {};

	UI.sampleUrl = document.getElementById("sample-url");
	UI.sampleUrl.value = sinkdrummer.buffer.url;

	UI.play = document.getElementById("play");
	UI.play.addEventListener('click', function onPlay() {
		sinkdrummer.play();
	});

	UI.stop = document.getElementById("stop");
	UI.stop.addEventListener('click', function onStop() {
		sinkdrummer.stop();
	});

	UI.speed = document.getElementById("speed");
	UI.speed.addEventListener('input', function onPitch(ev) {
		sinkdrummer.setPitch(ev.target.value);
	});

	UI.pitchReset = document.getElementById("pitch-reset");
	UI.pitchReset.addEventListener('click', function onPitchReset() {
		sinkdrummer.resetPitch();
	});

	UI.speedOutput = document.getElementById("speed-output");
	UI.speedOutput.value = 0;

	UI.bpm = document.getElementById("bpm");
	UI.bpm.value = sinkdrummer.buffer.bpm;

	UI.getBeatSubdivisionValue = function() {
		return document.querySelector("input[name=beat-subdivision]:checked").value;
	};

	UI.volume = document.getElementById("volume");
	UI.volume.addEventListener('input', function onVolume(ev) {
		var value = ev.target.value;
		value *= value;
		sinkdrummer.setVolume(value);
	});

	callback(null);
}


function initAudioContext(callback) {
	try {
		var AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
		gainNode = context.createGain();
		gainNode.connect(context.destination);
	} catch(e) {
		console.error("Web Audio is not supported, bailing");
		return callback("Web Audio is not supported, bailing");
	}
	return callback(null);
}


function main() {
	async.series([
		initAudioContext,
		Buffers.init,
		function testInitSinkdrummer(cb) {
			var buffer = Buffers.get(0);
			sinkdrummer = new Sinkdrummer(buffer);

			console.log("sinkdrummer is ready to roll");
			cb(null);
		},
		initUI
	],
	function(err) {
		if (err !== null) {
			console.error("async.series err", err);
		}
	});
}

window.addEventListener('load', main);
