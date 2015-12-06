"use strict";

var context;
var UI;
var source = null;
var gainNode = null;
// var sampleUrl = "/samples/sink_all_120bpm_44.wav";
var sampleUrl = "/samples/sink_short_120.wav";
// var sampleUrl = "/samples/cmaj120.wav";
// var sampleUrl = "/samples/gbd01.mp3";
// var sampleUrl = "/samples/jongly.wav";
// var sampleUrl = "/samples/verbme.aif";
// var sampleUrl = "/samples/SupaTrigga_dry1.mp3";


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
	this.audioData = null;
}

var Buffers = {
	_buffers: {},
	count: 0,

	init: function(callback) {
		var buffers = [
			new Buffer("/samples/sink_short_120.wav", 120),
			new Buffer("/samples/cmaj120.wav", 120),
			new Buffer("/samples/jongly.wav", 172)
		];
		async.map(buffers, Buffers.load, function onBuffersLoaded(err) {
			if (err === null) {
				return callback(null);
			} else {
				console.error("Error loading buffer(s)", err);
				return callback(err);
			}
		});
	}

	load: function(buffer, callback) {
		console.log("called Buffers.load", buffer.url);
		var request = new XMLHttpRequest();
		request.open('GET', buffer.url, true);
		request.responseType = 'arraybuffer';

		// Decode asynchronously
		request.onload = function() {
			window.context.decodeAudioData(request.response,
				function(audioData) {
					console.log("successfully decoded", buffer.url);
					buffer.audioData = audioData;
					Buffers._buffers[buffer.url] = buffer;
					Buffers.count++;
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

	get: function(url) {
		var buf = Buffers._buffers[url];
		if (buf !== undefined) {
			return buf;
		} else {
			console.error("Buffers does not contain", url);
		}
	}
};

// function initBuffers(callback) {
// 	var buffers = [
// 		new Buffer("/samples/sink_short_120.wav", 120),
// 		new Buffer("/samples/cmaj120.wav", 120),
// 		new Buffer("/samples/jongly.wav", 172)
// 	];
// 	async.map(buffers, Buffers.load, function onBuffersLoaded(err) {//, results) {
// 		if (err === null) {
// 			return callback(null);
// 		} else {
// 			console.error("Error loading buffer(s)", err);
// 			return callback(err);
// 		}
// 	});
// }


// function loadAudio(url, onSuccess) {
// 	window.buffer = null;

// 	var request = new XMLHttpRequest();
// 	request.open('GET', url, true);
// 	request.responseType = 'arraybuffer';

// 	// Decode asynchronously
// 	request.onload = function() {
// 		console.log("request loaded, now decode...");

// 		context.decodeAudioData(request.response,
// 			function(buffer) {
// 				console.log("successfully decoded", url);
// 				onSuccess(buffer);
// 			},
// 			function(e) {
// 				if (e) console.error("actual exception", e);
// 				else console.error("failed to decode", url);
// 			}
// 		);
// 	};

// 	request.send();
// }

// function onAudioLoaded(buffer) {
// 	console.log("loaded", buffer);
// 	window.buffer = buffer;
// }

function play() {
	if (window.buffer === null) {
		console.error("Buffer is null; cannot play");
		return;
	}
	if (source !== null) {
		source.stop();
	}

	source = context.createBufferSource();
	source.buffer = window.buffer;
	source.connect(gainNode);
	source.detune.value = UI.speed.value;
	source.loop = true;

	// console.log("source.buffer.length: " + source.buffer.length);
	// length is in samples
	// console.log("source.buffer.length / source.buffer.sampleRate: " + source.buffer.length / source.buffer.sampleRate);
	// console.log("source.buffer.duration: " + source.buffer.duration);

	var beatSubdivision = parseFloat(UI.getBeatSubdivisionValue());
	console.log("beatSubdivision: " + beatSubdivision);
	var minBeats = 1;
	var maxBeats = 4;

	var secsPerBeat = Util.bpmToSecs(UI.bpm.value) * beatSubdivision;
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
}

function stop() {
	if (source === null) {
		console.error("null audio source");
		return;
	}
	source.stop();
	source = null;
}

function setPitch(value) {
	UI.speedOutput.value = value;
	if (source !== null) {
		source.detune.value = value;
	}
}

function resetPitch() {
	setPitch(0);
	UI.speed.value = 0;
}

function setVolume(value) {
	gainNode.gain.value = value;
}

function onVolume(ev) {
	var value = ev.target.value;
	value *= value;
	setVolume(value);
}

function onPitch(ev) {
	setPitch(ev.target.value);
}

function initUI(callback) {
	window.UI = {};

	UI.sampleUrl = document.getElementById("sample-url");
	UI.sampleUrl.value = window.sampleUrl;

	UI.play = document.getElementById("play");
	UI.play.addEventListener('click', play);

	UI.stop = document.getElementById("stop");
	UI.stop.addEventListener('click', stop);

	UI.speed = document.getElementById("speed");
	UI.speed.addEventListener('input', onPitch);

	UI.pitchReset = document.getElementById("pitch-reset");
	UI.pitchReset.addEventListener('click', resetPitch);

	UI.speedOutput = document.getElementById("speed-output");
	UI.speedOutput.value = 0;

	UI.bpm = document.getElementById("bpm");

	UI.getBeatSubdivisionValue = function() {
		return document.querySelector("input[name=beat-subdivision]:checked").value;
	};

	UI.volume = document.getElementById("volume");
	UI.volume.addEventListener('input', onVolume);

	callback(null);
}

function initAudioContext(callback) {
	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		context = new AudioContext();
		gainNode = context.createGain();
		gainNode.connect(context.destination);
	} catch(e) {
		console.error("Web Audio is not supported, bailing");
		// return false;
		return callback("Web Audio is not supported, bailing");
	}
	return callback(null);
	// return true;
}

function main() {
	async.series([
		initAudioContext,
		Buffers.init,
		initUI,
		function(cb) {
			console.log("sinkdrummer is ready to roll");
			cb(null);
		}
	], function(err) {
		if (err !== null) {
			console.error("async.series err", err);
		}
	});
}

window.addEventListener('load', main);
