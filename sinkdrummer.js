"use strict";

var context;
// var buffer = null;
var sampleUrl = "/samples/sink_all_120bpm_44.wav";
// var sampleUrl = "/samples/verbme.aif";
// var sampleUrl = "/samples/SupaTrigga_dry1.mp3";

var loadAudio = function(url, onSuccess) {
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

		// context.decodeAudioData(request.response)
		// 	.then(function(buffer) {
		// 		console.log("audio decoded");
		//   		window.buffer = buffer;
		// 	});
		// 	.then, function(e) {
		// 	console.error(e.err);
		// });

	};

	request.send();
};

var onLoaded = function(buffer) {
	console.log("loaded", buffer);
};

var main = function() {
	console.log("sinkdrummer says hi");
	try {
		window.AudioContext = window.AudioContext || window.webkitAudioContext;
		window.context = new AudioContext();
	} catch(e) {
		console.error("Web Audio is not supported, bailing");
		return;
	}
	
	loadAudio(sampleUrl, onLoaded);
};

window.addEventListener('load', main);
