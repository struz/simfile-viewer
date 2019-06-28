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
            <chart-picker></chart-picker>
          </v-flex>
        </v-layout>
        <v-flex>
          <v-btn v-on:click="playPauseTrack">Play/Pause</v-btn>
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
import SOUNDMAN from './lib/GameSoundManager';
import GAMESTATE from './lib/GameState';
import { DebugTools } from './lib/Debug';

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

declare global {
  interface Window {
    debugTools: any;
    noteField: any;
    GAMESTATE: any;
    SOUNDMAN: any;
  }
}
// For live debugging
window.debugTools = DebugTools;
window.GAMESTATE = GAMESTATE;
window.SOUNDMAN = SOUNDMAN;

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

  public seekTrack() {
    SOUNDMAN.musicSeek(this.$data.seek);
  }

  public playPauseTrack() {
    if (!GAMESTATE.isPaused()) {
      GAMESTATE.pause();
      SOUNDMAN.pauseMusic();
    } else {
      GAMESTATE.play();
      SOUNDMAN.resumeMusic();
    }
  }
}
export default App;
</script>
