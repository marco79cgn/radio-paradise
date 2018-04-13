var flacApiBaseUrl = 'https://api.radioparadise.com/api/get_block?bitrate=4&info=true';
var flacApiNextEventUrl = 'https://api.radioparadise.com/api/get_block?bitrate=4&info=true';
var nextStream;

function getNextEvent(callback) {	
	const xhr = new XMLHttpRequest();
	xhr.open('get', 'https://cors-anywhere.herokuapp.com/'+flacApiNextEventUrl, true);
	xhr.onload = function(e) {
		var data = JSON.parse(this.response);
  		nextStream = data.url+'?src=alexa';
  		flacApiNextEventUrl = flacApiBaseUrl + '&event=' + data.end_event;
  		callback();
	}
	xhr.send();
}

function playStream() {
	var stream = new Howl({
		src: [nextStream],
		ext: ['flac'],
		autoplay: true,
		html5: true,
		onend: function() {
			getNextEvent(playStream);
		}
	});
	stream.play();
}

getNextEvent(playStream);
