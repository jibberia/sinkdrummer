"use strict";

var context;
var UI;
var source = null;
// var sampleUrl = "/samples/sink_all_120bpm_44.wav";
var sampleUrl = "/samples/cmaj120.wav";
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

function loadAudio(url, onSuccess) {
	window.buffer = null;

	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.responseType = 'arraybuffer';

	// Decode asynchronously
	request.onload = function() {
		console.log("request loaded, now decode...");

		context.decodeAudioData(request.response,
			function(buffer) {
				console.log("successfully decoded", url);
				onSuccess(buffer);
			},
			function(e) {
				if (e) console.error("actual exception", e);
				else console.error("failed to decode", url);
			}
		);
	};

	request.send();
}

function onAudioLoaded(buffer) {
	console.log("loaded", buffer);
	window.buffer = buffer;
}

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
	source.connect(context.destination);
	source.detune.value = UI.speed.value;
	source.loop = true;

	// console.log("source.buffer.length: " + source.buffer.length);
	// length is in samples
	// console.log("source.buffer.length / source.buffer.sampleRate: " + source.buffer.length / source.buffer.sampleRate);
	// console.log("source.buffer.duration: " + source.buffer.duration);

	var secsPerBeat = Util.bpmToSecs(120);
	var numBeatsForLoop = 2 + parseInt(Math.random() * 3);
	var duration = numBeatsForLoop * secsPerBeat;
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

function onPitch(ev) {
	setPitch(ev.target.value);
}

function resetPitch() {
	setPitch(0);
	UI.speed.value = 0;
}

function initUI() {
	window.UI = {};

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
}

function initAudioContext() {
	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		window.context = new AudioContext();
	} catch(e) {
		console.error("Web Audio is not supported, bailing");
		return false;
	}
	return true;
}

function main() {
	if (!initAudioContext()) {
		return;
	}
	loadAudio(sampleUrl, onAudioLoaded);
	initUI();
	console.log("sinkdrummer is ready to roll");
}

window.addEventListener('load', main);
