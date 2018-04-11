var stream = new Howl({
    src: ['https://apps.radioparadise.com/blocks/chan/0/4/1682196-1682197.flac?src=alexa'],
    ext: ['flac'],
    autoplay: true,
    html5: true,
    onend: function() {
    	console.log('Finished!');
    	var client = new HttpClient();
		client.get('https://cors-anywhere.herokuapp.com/https://api.radioparadise.com/api/get_block?bitrate=4&info=true&event=1682204', function(response) {
    		console.log('Got the next piece!');
    		var nextStream = new Howl({
    			src: ['https://apps.radioparadise.com/blocks/chan/0/4/1682205-1682210.flac?src=alexa'],
    			ext: ['flac'],
    			autoplay: true,
    			html5: true
			});
			nextStream.play();
		});
  	}
});
stream.play();

var HttpClient = function() {
    this.get = function(aUrl, aCallback) {
        var anHttpRequest = new XMLHttpRequest();
        anHttpRequest.onreadystatechange = function() { 
            if (anHttpRequest.readyState == 4 && anHttpRequest.status == 200)
                aCallback(anHttpRequest.responseText);
        }

        anHttpRequest.open( "GET", aUrl, true );            
        anHttpRequest.send( null );
    }
}