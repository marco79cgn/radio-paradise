# radio-paradise

A web based player for [Radio Paradise](http://www.radioparadise.com). It's build upon [howler-js](https://github.com/goldfire/howler.js) in plain javascript and plays the FLAC stream (lossless). No interaction is required, but it's possible to skip or repeat tracks and even to choose them from the playlist.

![alt text](https://github.com/marco79cgn/radio-paradise/blob/master/rp-player-gui.png "")

![alt text](https://github.com/marco79cgn/radio-paradise/blob/master/rp-player-playlist.png "")

Since the Radio Paradise API doesn't allow Cross-Origin Domain Sharing (CORS), the requests have to be proxied via [cors-anywhere](https://cors-anywhere.herokuapp.com/). The service might be unreliable over time and is not production ready.

**Disclaimer:**
This is a private proof of concept project and no official product of [Radio Paradise](http://www.radioparadise.com).

## RadioParadise API

Get stream info (bitrate=4 for FLAC):
https://api.radioparadise.com/api/get_block?bitrate=4&info=true

Result:
```
{
    "event": "1682118",
    "end_event": "1682123",
    "length": "1027.719",
    "url": "https://apps.radioparadise.com/blocks/chan/0/4/1682118-1682123.flac",
    "expiration": 1523016067,
    "image_base": "//img.radioparadise.com/",
    "song": {
        "0": {
            "event": "1682118",
            "duration": 225500,
            "artist": "Spirit of the West",
            "title": "And If Venice is Sinking",
            "cover": "covers/l/B000002HFI.jpg",
            "elapsed": 0
        },
        "1": {
            "event": "1682119",
            "duration": 205850,
            "artist": "Amelia Curran",
            "title": "Scattered & Small",
            "cover": "covers/l/B001JQHT8K.jpg",
            "elapsed": 225500
        }
    }
}
```

The result includes:
1. a URL ("url") for a flac file that is played back using http streaming (add ?src=alexa to this URL during testing), for example
`https://apps.radioparadise.com/blocks/chan/0/4/1682119-1682123.flac?src=alex`
2. the value `end_event`, which is used to build the next API query, and `length`, the play time (in sec) of that block
3. an array of song metadata for the songs included in that block of programming
4. for each song, the `elapsed` time (in ms - from the beginning of the block) when that song begins.

### Workflow:
- The player would start the file & display the metadata for `song[0]`. 
- After `song[0]['elapsed']` ms, the display would change to `song[1]`, etc.
- As the elapsed time on the block file gets close to the end, the data for the next block is loaded via this call:
`https://api.radioparadise.com/api/get_block?bitrate=4&info=true&event={$end_event}`
- The URL for the next block is then enqueued to start immediately after the current block ends. That start should trigger the next metadata update.
- At any point during playback, the following call will retrieve a block starting with the next song on our playlist ('skip' function).
`https://api.radioparadise.com/api/get_block?bitrate=4&info=true&event={$event}&elapsed={elapsed time in sec for block file}`
