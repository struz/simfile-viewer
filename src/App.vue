<template>
  <v-app>
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
      <HelloWorld/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
import HelloWorld from './components/HelloWorld.vue';

import GameLoop from './lib/GameLoop';

// Allow setting a global variable on the window
declare global {
  interface Window {
    totalTime: any;
    GAMESTATE: any;
    song: any;
  }
}

(() => {
  function main() {
    const stopMain = window.requestAnimationFrame( main );

    // Your main loop contents
    GameLoop.gameLoop();
    window.totalTime = GameLoop.totalTime;
  }

  main(); // Start the cycle
})();
// for (let i = 0; i < 1000; i++) {
//   GameLoop.gameLoop();
// }
// console.log(GameLoop.totalTime);

// TODO:
// - load big sky
// - start the loop
// - write to console when a judgement would happen

// Load Big Sky
import MsdFile from './lib/MsdFile';
import NoteLoaderSM from './lib/NoteLoaderSM';
import fs from 'fs';
import GAMESTATE from './lib/GameState';

let bigSkySmFile = '';
const rawFile = new XMLHttpRequest();
rawFile.onreadystatechange = () => {
    if (rawFile.readyState === 4) {
        if (rawFile.status === 200 || rawFile.status === 0) {
            bigSkySmFile = rawFile.responseText;
            console.log('gotcha');

            const msdFile = new MsdFile(bigSkySmFile);
            const song = NoteLoaderSM.loadFromSimfile(msdFile);

            GAMESTATE.setCurSong(song);
            window.GAMESTATE = GAMESTATE;
            window.song = song;
        }
    }
};
rawFile.open('GET', './BigSky.sm', true);
rawFile.send(null);


export default {
  name: 'App',
  components: {
    HelloWorld,
  },
  data() {
    return {
      //
    };
  },
};
</script>
