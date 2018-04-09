# radio-paradise

RadioParadise API

Get stream info (bitrate=4 for FLAC): 
https://api.radioparadise.com/api/get_block?bitrate=4&info=true

The result includes:

1. a URL ("url") for a flac file that is played back using http streaming (add ?src=alexa to this URL during testing), for example
https://apps.radioparadise.com/blocks/chan/0/4/1682119-1682123.flac?src=alexa

2. the value "end_event", which is used to build the next API query, and "length", the play time (in sec) of that block

3. an array of song metadata for the songs included in that block of programming

4. for each song, the elapsed time (in ms - from the beginning of the block) when that song begins.

The player would start the file & display the metadata for song[0]. After song[0]['elapsed'] ms, the display would change to song[1], etc.

As the elapsed time on the block file gets close to the end, the data for the next block is loaded via this call:

https://api.radioparadise.com/api/get_block?bitrate=4&info=true&event={$end_event}

The URL for the next block is then enqueued to start immediately after the current block ends. That start should trigger the next metadata update.

At any point during playback, the following call will retrieve a block starting with the next song on our playlist ('skip' function).

https://api.radioparadise.com/api/get_block?bitrate=4&info=true&event={$event}&elapsed={elapsed time in sec for block file}
