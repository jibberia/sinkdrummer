"use strict";

var context;

var sampleUrl = "/samples/sink_all_120bpm_44.wav";
// var sampleUrl = "/samples/verbme.aif";
// var sampleUrl = "/samples/SupaTrigga_dry1.mp3";

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
	var source = context.createBufferSource();
	source.buffer = window.buffer;
	source.connect(context.destination);
	source.start(0);
}

function initUIEventListeners() {
	var playBtn = document.getElementById("play");
	playBtn.addEventListener('click', play);
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
	initUIEventListeners();
	console.log("sinkdrummer is ready to roll");
}

window.addEventListener('load', main);
