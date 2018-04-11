/*!
 *  Howler.js Audio Player Demo
 *  howlerjs.com
 *
 *  (c) 2013-2018, James Simpson of GoldFire Studios
 *  goldfirestudios.com
 *
 *  MIT License
 */
 
var flacApiBaseUrl = 'https://api.radioparadise.com/api/get_block?bitrate=4&info=true';
var flacApiNextEventUrl = 'https://api.radioparadise.com/api/get_block?bitrate=4&info=true';
var nextStream;
var nextPlaylist;

function getNextEvent(isNotBlocking, self, callback) {	
	const xhr = new XMLHttpRequest();
  xhr.open('get', 'https://cors-anywhere.herokuapp.com/'+flacApiNextEventUrl, isNotBlocking);
  var result;
  xhr.onload = function(e) {
    result = JSON.parse(this.response);
    console.log(result);
    nextStream = result.url+'?src=alexa';
    flacApiNextEventUrl = flacApiBaseUrl + '&event=' + result.end_event;
    if(callback) {
      nextPlaylist = callback(result, self);
    }
	}
    xhr.send();
    return result;
}

function getNextEventAndAddToPlaylist(self) {
    getNextEvent(true, self, addNextEventToPlaylist);
}

// Cache references to DOM elements.
var elms = ['track', 'timer', 'duration', 'playBtn', 'pauseBtn', 'prevBtn', 'nextBtn', 'playlistBtn', 'volumeBtn', 'progress', 'bar', 'wave', 'loading', 'playlist', 'list', 'volume', 'barEmpty', 'barFull', 'sliderBtn'];
elms.forEach(function(elm) {
  window[elm] = document.getElementById(elm);
});

/**
 * Player class containing the state of our playlist and where we are in it.
 * Includes all methods for playing, skipping, updating the display, etc.
 * @param {Array} playlist Array of objects with playlist song details ({title, file, howl}).
 */
var Player = function(playlist) {
  this.playlist = playlist;
  this.index = 0;

  // Display the title of the first track.
  track.innerHTML = '1. ' + playlist.songs[0].artist + ' - ' + playlist.songs[0].title;

  while (list.hasChildNodes()) {   
    list.removeChild(list.firstChild);
  }

  // Setup the playlist display.
  var playlistLength = playlist.songs.length;
  for (var i = 0; i < playlistLength; i++) {
    var currentPlaylistItem = playlist.songs[i];
    var div = document.createElement('div');
    div.className = 'list-song';
    div.innerHTML = currentPlaylistItem.artist + ' - ' + currentPlaylistItem.title;
    div.index = i;
    div.onclick = function() {
      player.skipTo(this.index);
    };
    list.appendChild(div);
  }

};
Player.prototype = {
  /**
   * Play a song in the playlist.
   * @param  {Number} index Index of the song in the playlist (leave empty to play the first or current).
   */
  play: function(index) {
    var self = this;
    var sound;
    var updateTitle;

    index = typeof index === 'number' ? index : self.index;
    var data = self.playlist;

    // If we already loaded this track, use the current one.
    // Otherwise, setup and load a new Howl.
    if (data.howl) {
      sound = data.howl;
    } else {
      sound = data.howl = new Howl({
        src: [data.file],
        html5: true, // Force to HTML5 so that the audio can stream in (best for large files).
        onplay: function() {
          // Display the duration.
          duration.innerHTML = self.formatTime(Math.round(sound.duration()));

          // Start upating the progress of the track.
          requestAnimationFrame(self.step.bind(self));

          // Start the wave animation if we have already loaded
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          pauseBtn.style.display = 'block';
          //updateTitle = setInterval(function(){ updateTitleInHtml(self) }, 3000);
        },
        onload: function() {
          // Start the wave animation.
          wave.container.style.display = 'block';
          bar.style.display = 'none';
          loading.style.display = 'none';
          getNextEventAndAddToPlaylist(self);
        },
        onend: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          clearInterval(updateTitle);
          player = new Player(nextPlaylist);
          player.play();
        },
        onpause: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          clearInterval(updateTitle);
        },
        onstop: function() {
          // Stop the wave animation.
          wave.container.style.display = 'none';
          bar.style.display = 'block';
          clearInterval(updateTitle);
        }
      });
    }

    // Begin playing the sound.
    sound.play();

    // Update the track display.
    if(data.songs[index]) {
        track.innerHTML = (index + 1) + '. ' + data.songs[index].artist + ' - ' + data.songs[index].title;
    } else {
        index = 0;
        progress.style.width = '0%';
        track.innerHTML = (index + 1) + '. ' + data.songs[index].artist + ' - ' + data.songs[index].title;
    }

    // Show the pause button.
    if (sound.state() === 'loaded') {
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'block';
    } else {
      loading.style.display = 'block';
      playBtn.style.display = 'none';
      pauseBtn.style.display = 'none';
    }

    // Keep track of the index we are currently playing.
    self.index = index;
  },

  /**
   * Pause the currently playing track.
   */
  pause: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist.howl;

    // Pause the sound.
    sound.pause();

    // Show the play button.
    playBtn.style.display = 'block';
    pauseBtn.style.display = 'none';
  },

  /**
   * Skip to the next or previous track.
   * @param  {String} direction 'next' or 'prev'.
   */
  skip: function(direction) {
    var self = this;

    // Get the next track based on the direction of the track.
    var index = 0;
    if (direction === 'prev') {
      index = self.index - 1;
      if (index < 0) {
        index = 0;
      }
    } else {
      index = self.index + 1;
      if (index >= self.playlist.songs.length) {
        index = 0;
      }
    }
    self.skipTo(index);
  },

  /**
   * Skip to a specific track based on its playlist index.
   * @param  {Number} index Index in the playlist.
   */
  skipTo: function(index) {
    var self = this;

    // Stop the current track.
    var currentlyPlaying = self.playlist.howl;
    if (currentlyPlaying) {
      currentlyPlaying.stop();
      self.play(index); 
      this.seekTo(index, self.playlist);
    } else {
      // Reset progress.
      progress.style.width = '0%';
      // Play the new track.
      var id = self.play(index);
    }
  },

  /**
   * Set the volume and update the volume slider display.
   * @param  {Number} val Volume between 0 and 1.
   */
  volume: function(val) {
    var self = this;

    // Update the global volume (affecting all Howls).
    Howler.volume(val);

    // Update the display on the slider.
    var barWidth = (val * 90) / 100;
    barFull.style.width = (barWidth * 100) + '%';
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  },

  /**
   * Seek to a new position in the currently playing track.
   * @param  {Number} per Percentage through the song to skip.
   */
  seek: function(per) {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist.howl;
    // Convert the percent into a seek position.
    if (sound.playing()) {
        var newPosition = sound.duration() * per;
        sound.seek(newPosition);
        var currentSongs = self.playlist.songs;
        var arrayLength = currentSongs.length;
        var currentSong;
        var newIndex;
        for (var i = 0; i < arrayLength; i++) {
            var currentSongElapsed = currentSongs[i].elapsed;
            if ( (newPosition * 1000) <= currentSongElapsed) {
                currentSong = currentSongs[i-1];
                newIndex = i-1;
                break;
            }
        }
        if(!currentSong) {
            currentSong = currentSongs[arrayLength-1];
            newIndex=arrayLength-1;
        }
        track.innerHTML = (newIndex + 1) + '. ' + currentSong.artist + ' - ' + currentSong.title;
        self.index = newIndex;
    }
  },

  /**
   * Seek to a new position in the currently playing track.
   */
  seekTo: function(index, data) {
    var self = this;
    // Convert the percent into a seek position.
    var seekToPosition = data.totalLength * data.songs[index].begin;
    data.howl.seek(seekToPosition);    
  },

  /**
   * The step called within requestAnimationFrame to update the playback position.
   */
  step: function() {
    var self = this;

    // Get the Howl we want to manipulate.
    var sound = self.playlist.howl;

    // Determine our current seek position.
    var seek = sound.seek() || 0;
    timer.innerHTML = self.formatTime(Math.round(seek));
    progress.style.width = (((seek / sound.duration()) * 100) || 0) + '%';

    // If the sound is still playing, continue stepping.
    if (sound.playing()) {
      requestAnimationFrame(self.step.bind(self));
    }
  },

  /**
   * Toggle the playlist display on/off.
   */
  togglePlaylist: function() {
    var self = this;
    var display = (playlist.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      playlist.style.display = display;
    }, (display === 'block') ? 0 : 500);
    playlist.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Toggle the volume display on/off.
   */
  toggleVolume: function() {
    var self = this;
    var display = (volume.style.display === 'block') ? 'none' : 'block';

    setTimeout(function() {
      volume.style.display = display;
    }, (display === 'block') ? 0 : 500);
    volume.className = (display === 'block') ? 'fadein' : 'fadeout';
  },

  /**
   * Format the time from seconds to M:SS.
   * @param  {Number} secs Seconds to format.
   * @return {String}      Formatted time.
   */
  formatTime: function(secs) {
    var minutes = Math.floor(secs / 60) || 0;
    var seconds = (secs - minutes * 60) || 0;

    return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
  }
};

function updateTitleInHtml(self) {
  // update title
  var currentSongs = self.playlist.songs;
  var arrayLength = self.playlist.songs.length;
  var currentSong;
  var newIndex;
  for (var i = 0; i < arrayLength; i++) {
      var currentSongElapsed = currentSongs[i].elapsed;
      if ( (self.playlist.howl.seek() * 1000) <= currentSongElapsed) {
          currentSong = currentSongs[i-1];
          newIndex = i-1;
          break;
      }
  }
  if(!currentSong) {
      currentSong = currentSongs[arrayLength-1];
      newIndex=arrayLength-1;
  }
  var trackToSet = (newIndex + 1) + '. ' + currentSong.artist + ' - ' + currentSong.title;
  if(track.innerHTML != trackToSet) {
    console.log('setting new title.');
    track.innerHTML = trackToSet;
  }
}

var firstEvent = getNextEvent(false);

// Setup our new audio player class and pass it the playlist.

function buildPlaylistForFirstEvent(event) {
  var songsArray = Object.keys(event.song).map(function(k) { return event.song[k] });
  var playlistSongs = [];
  var amountOfSongs = songsArray.length;
  for (var i = 0; i < amountOfSongs; i++) {
    var currentSong = songsArray[i];
    var songItem = {
        artist: currentSong.artist,
        title: currentSong.title,
        begin: (currentSong.elapsed/1000)/event.length,
        elapsed: currentSong.elapsed
    };
    playlistSongs.push(songItem);
  }
  var playlist = {
    file: event.url + '?src=alexa',
    totalLength: event.length,
    songs: playlistSongs,
    howl: null
  };
  console.log('Got new playlist.');
  console.log(playlist);
  return playlist;
}

function addNextEventToPlaylist(event, self) {
  var songsArray = Object.keys(event.song).map(function(k) { return event.song[k] });
  var playlistSongs = [];
  var amountOfSongs = songsArray.length;
  for (var i = 0; i < amountOfSongs; i++) {
    var currentSong = songsArray[i];
    var songItem = {
        artist: currentSong.artist,
        title: currentSong.title,
        begin: (currentSong.elapsed/1000)/event.length,
        elapsed: currentSong.elapsed
    };
    playlistSongs.push(songItem);
  }
  var playlist = {
    file: event.url + '?src=alexa',
    totalLength: event.length,
    songs: playlistSongs,
    howl: null
  };
  console.log('Got new playlist.');
  console.log(playlist);
  return playlist;
}

var player = new Player(buildPlaylistForFirstEvent(firstEvent));

// Bind our player controls.
playBtn.addEventListener('click', function() {
  player.play();
});
pauseBtn.addEventListener('click', function() {
  player.pause();
});
prevBtn.addEventListener('click', function() {
  player.skip('prev');
});
nextBtn.addEventListener('click', function() {
  player.skip('next');
});
waveform.addEventListener('click', function(event) {
  player.seek(event.clientX / window.innerWidth);
});
playlistBtn.addEventListener('click', function() {
  player.togglePlaylist();
});
playlist.addEventListener('click', function() {
  player.togglePlaylist();
});
volumeBtn.addEventListener('click', function() {
  player.toggleVolume();
});
volume.addEventListener('click', function() {
  player.toggleVolume();
});

// Setup the event listeners to enable dragging of volume slider.
barEmpty.addEventListener('click', function(event) {
  var per = event.layerX / parseFloat(barEmpty.scrollWidth);
  player.volume(per);
});
sliderBtn.addEventListener('mousedown', function() {
  window.sliderDown = true;
});
sliderBtn.addEventListener('touchstart', function() {
  window.sliderDown = true;
});
volume.addEventListener('mouseup', function() {
  window.sliderDown = false;
});
volume.addEventListener('touchend', function() {
  window.sliderDown = false;
});

var move = function(event) {
  if (window.sliderDown) {
    var x = event.clientX || event.touches[0].clientX;
    var startX = window.innerWidth * 0.05;
    var layerX = x - startX;
    var per = Math.min(1, Math.max(0, layerX / parseFloat(barEmpty.scrollWidth)));
    player.volume(per);
  }
};

volume.addEventListener('mousemove', move);
volume.addEventListener('touchmove', move);

// Setup the "waveform" animation.
var wave = new SiriWave({
    container: waveform,
    width: window.innerWidth,
    height: window.innerHeight * 0.3,
    cover: true,
    speed: 0.03,
    amplitude: 0.7,
    frequency: 2
});
wave.start();

// Update the height of the wave animation.
// These are basically some hacks to get SiriWave.js to do what we want.
var resize = function() {
  var height = window.innerHeight * 0.3;
  var width = window.innerWidth;
  wave.height = height;
  wave.height_2 = height / 2;
  wave.MAX = wave.height_2 - 4;
  wave.width = width;
  wave.width_2 = width / 2;
  wave.width_4 = width / 4;
  wave.canvas.height = height;
  wave.canvas.width = width;
  wave.container.style.margin = -(height / 2) + 'px auto';

  // Update the position of the slider.
  var sound = player.playlist.howl;
  if (sound) {
    var vol = sound.volume();
    var barWidth = (vol * 0.9);
    sliderBtn.style.left = (window.innerWidth * barWidth + window.innerWidth * 0.05 - 25) + 'px';
  }
};
window.addEventListener('resize', resize);
resize();