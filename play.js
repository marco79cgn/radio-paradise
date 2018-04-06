var flacApiBaseUrl = 'https://api.radioparadise.com/api/get_block?bitrate=4&info=true';
var flacApiNextEventUrl = 'https://api.radioparadise.com/api/get_block?bitrate=4&info=true';
var nextStream;

function getNextEvent(callback) {	
	const xhr = new XMLHttpRequest();
	xhr.open('get', 'https://crossorigin.me/'+flacApiNextEventUrl, true);
    xhr.onload = function(e) {
  		var data = JSON.parse(this.response);
  		console.log('now playing: '+ data);
  		nextStream = data.url+'?src=alexa';
  		flacApiNextEventUrl = flacApiBaseUrl + '&event=' + data.end_event;
  		callback();
	}
    xhr.send();
}

function prepareNextEvent() {	
	const xhr = new XMLHttpRequest();
	xhr.open('get', 'https://crossorigin.me/'+flacApiNextEventUrl, true);
    xhr.onload = function(e) {
  		var data = JSON.parse(this.response);
  		console.log('following Tracks: ' + data);
  		nextStream = data.url+'?src=alexa';
  		flacApiNextEventUrl = flacApiBaseUrl + '&event=' + data.end_event;
	}
    xhr.send();
}

function playStream() {
	console.log('Playing Stream ' + nextStream);
	var stream = new Howl({
    	src: [nextStream],
		ext: ['flac'],
    	autoplay: true,
		html5: true,
		onplay: function() {
			prepareNextEvent();			
		},
    	onend: function() {
    		getNextEvent(playStream);
  		}
	});
	stream.play();
}

getNextEvent(playStream);
