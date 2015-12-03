"use strict";

var context;
var UI;
var source = null;
var sampleUrl = "/samples/sink_all_120bpm_44.wav";
// var sampleUrl = "/samples/verbme.aif";
// var sampleUrl = "/samples/SupaTrigga_dry1.mp3";

// var Util = {
// 	floatToCents: function(float) {
// 		// -1200   0   1200
// 		//     0   1.0 2.0
// 		return float;
// 	}
// };

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
	console.log("play!");
	if (window.buffer === null) {
		console.error("Buffer is null; cannot play");
		return;
	}
	source = context.createBufferSource();
	source.buffer = window.buffer;
	source.connect(context.destination);
	source.detune.value = UI.speed.value;
	source.start();
}

function stop() {
	console.log("stop!");
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
