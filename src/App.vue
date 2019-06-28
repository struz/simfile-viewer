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

// This can be overridden with the process.env.VUE_APP_PACK_URL_PREFIX environment variable
const DEFAULT_PACK_URL_PREFIX = 'https://s3-us-west-2.amazonaws.com/struz.simfile-viewer/';

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
  public packPathPrefix = process.env.VUE_APP_PACK_URL_PREFIX || DEFAULT_PACK_URL_PREFIX;

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

  public changeChart(urls: ChartURLs) {
    // Use GAMEMAN and other helpers to load the chart
    // Use FileOperations to do the heavy lifting, use the onload to set something
    // in GAMEMAN or this class that disables the loading bar and allows playing
    if (urls.ogg === null) { throw new Error('no ogg not supported yet!'); }

    let newSong: Song | null;
    const absoluteSimURI = `${this.packPathPrefix}packs/${urls.simFile}`;
    const p1 = FileOperations.loadTextFile(absoluteSimURI)
      .then((smText) => {
        const msdFile = new MsdFile(smText);
        newSong = NoteLoaderSM.loadFromSimfile(msdFile);
        console.log('loaded sm data');
      })
      .catch((error) => {
        console.error(`failed to load .sm file at '${absoluteSimURI}': ${error}`);
      });

    let newHowl: Howl | null;
    const absoluteHowlURI = `${this.packPathPrefix}packs/${urls.ogg}`;
    const p2 = FileOperations.loadOggFileAsHowl(absoluteHowlURI, false)
      .then((howl) => {
        newHowl = howl;
        console.log('loaded music');
      })
      .catch((error) => {
        console.error(`failed to load .ogg file at '${absoluteHowlURI}': ${error}`);
      });

    // Once both parts have been loaded, tee up the new song
    Promise.all([p1, p2])
      .then(() => {
        if (newSong === null) { throw new Error('song did not load properly'); }
        if (newHowl === null) { throw new Error('howl did not load properly'); }
        GAMESTATE.loadSong(newSong, newHowl, this.$data.seek);
      })
      .catch((error) => {
        console.error(`failed to load song into game: ${error}`);
      });
    console.log('chart changed: ' +  urls.ogg);
  }
}
export default App;
</script>
