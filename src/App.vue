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
      <screen></screen>
      <v-btn v-on:click="play">Test</v-btn>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import Screen from './components/Screen.vue';
import { Howl } from 'howler';
import GameLoop from './lib/GameLoop';
import SCREENMAN from '@/lib/ScreenManager.ts';

// Register our main loop as soon as the page loads
(() => {
  function main() {
    const stopMain = window.requestAnimationFrame( main );

    // Your main loop contents
    GameLoop.gameLoop();
  }

  main(); // Start the cycle
})();

import GAMESTATE from '@/lib/GameState';
import MsdFile from '@/lib/MsdFile';
import NoteLoaderSM from '@/lib/NoteLoaderSM';
import Song from '@/lib/Song';

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

export default {
  name: 'App',
  components: {
    Screen,
  },
  data() {
    return {
      //
    };
  },
  methods: {
    play: () => {
      if (loadedMusic && loadedSong && !playing) {
        playing = true;
        bigSkyMusic.play();
        GAMESTATE.loadNextSong(song);
      }
    },
  },
};
</script>
