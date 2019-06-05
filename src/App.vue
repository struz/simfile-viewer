<template>
  <v-app dark>
    <v-toolbar app>
      <v-toolbar-title class="headline text-uppercase">
        <span>Vuetify</span>
        <span class="font-weight-light">MATERIAL DESIGN</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn
        flat
        href="https://github.com/vuetifyjs/vuetify/releases/latest"
        target="_blank"
      >
        <span class="mr-2">Latest Release</span>
      </v-btn>
    </v-toolbar>

    <v-content>
      <v-container>
        <v-layout row>
          <v-flex md6>
            <screen></screen>
          </v-flex>
          <v-flex md6>
            <chart-picker
              @changeChart="changeChart">
            </chart-picker>
          </v-flex>
        </v-layout>
        <v-flex>
          <v-btn v-on:click="play">Test</v-btn>
          <v-btn v-on:click="seekTrack">Seek</v-btn>
          <v-text-field v-model.number="seek" type="number"></v-text-field>
        </v-flex>
      </v-container>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import Screen from './components/Screen.vue';
import ChartPicker from './components/ChartPicker.vue';

import { Howl } from 'howler';
import GameLoop from './lib/GameLoop';
import SCREENMAN from '@/lib/ScreenManager.ts';

// Register our main loop as soon as the page loads
// TODO: work out why this is so much better for syncing claps
// than the pixi ticker. It may just be that we want the audio
// loops way faster than screen draws.
// NOTE: very well might have been placebo from the two tries.
// Had the best sync ever with the ticker. I think what happened
// was that I didn't wait for the ticker to warm up - pressing test
// too early on page load fucks the syncing.
(() => {
  function main() {
    const stopMain = window.requestAnimationFrame( main );

    // Your main loop contents
    GameLoop.gameLoop(0);
  }

  main(); // Start the cycle
})();

import GAMESTATE from '@/lib/GameState';
import MsdFile from '@/lib/MsdFile';
import NoteLoaderSM from '@/lib/NoteLoaderSM';
import Song from '@/lib/Song';
import SOUNDMAN, { MusicToPlay } from '@/lib/GameSoundManager';
import { DebugTools } from '@/lib/Debug';
import { ChartURLs } from './lib/ChartPicker';
import FileOperations from './lib/FileOperations';

// Load SM file
let song = new Song();
let loadedSong = false;
const rawFile = new XMLHttpRequest();
rawFile.onreadystatechange = () => {
  if (rawFile.readyState === 4) {
    if (rawFile.status === 200 || rawFile.status === 0) {
      const bigSkySmFileTxt = rawFile.responseText;
      console.log('gotcha');

      const msdFile = new MsdFile(bigSkySmFileTxt);
      song = NoteLoaderSM.loadFromSimfile(msdFile);
      loadedSong = true;
    }
  }
};
rawFile.open('GET', './BigSky.sm', true);
rawFile.send(null);

// Load music
let loadedMusic = false;
const bigSkyMusic = new Howl({
  src: ['./bigsky.ogg'],
  onload: () => {
    console.log('gotcha2');
    loadedMusic = true;
  },
  onloaderror: (_, msg) => {
    console.log(`error loading bigsky.ogg: ${msg}`);
  },
});

let playing = false;

declare global {
  interface Window {
    howl: any;
    debugTools: any;
  }
}
window.howl = bigSkyMusic;

// See https://vuejs.org/v2/guide/typescript.html for why we do the below
@Component({
  name: 'App',
  components: {
    Screen,
    ChartPicker,
  },
})
class App extends Vue {
  public seek = 0;

  public play() {
    if (loadedMusic && loadedSong && !playing) {
      playing = true;

      // TODO: IMPORTANT: write functions to ensure that a Song is loaded before we play the Music
      // See PlayMusic() in C++ for an example.
      GAMESTATE.loadNextSong(song);
      GAMESTATE.play(); // ensure song timer is running

      const toPlay = new MusicToPlay();
      toPlay.music = bigSkyMusic;
      toPlay.hasTiming = true;
      toPlay.timing = song.songTiming;
      toPlay.startSeconds = this.$data.seek;
      SOUNDMAN.startMusic(toPlay);
      window.debugTools = DebugTools;
    }
  }

  public seekTrack() {
    if (loadedMusic && loadedSong && playing) {
      bigSkyMusic.seek(this.$data.seek);
    }
  }

  public changeChart(urls: ChartURLs) {
    // Use GAMEMAN and other helpers to load the chart
    // Use FileOperations to do the heavy lifting, use the onload to set something
    // in GAMEMAN or this class that disables the loading bar and allows playing
  }
}
export default App;
</script>
