var context;

var sampleUrl = "/Users/kevin/Desktop/old-computer/a samples/sink_all_120bpm_44.aif";

var main = function() {
	console.log("sinkdrummer says hi");
	try {
		context = new AudioContext();
	} catch(e) {
		console.error("Web Audio is not supported");
	}

};

var load = function(url) {

}

window.addEventListener('load', main);

