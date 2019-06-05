<template>
  <div class="pixi-renderer">
    <canvas ref="renderCanvas"></canvas>
    <!-- All child <template> elements get added in here -->
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';

import SCREENMAN, { ScreenManager } from '@/lib/ScreenManager';

// See https://vuejs.org/v2/guide/typescript.html for why we do the below
@Component
class Screen extends Vue {
  public $refs!: {
    renderCanvas: HTMLCanvasElement,
  };

  public data() {
    return {};
  }
  public provide() {
    return {};
  }

  public mounted() {
    console.log('mounted');
    // Determine the width and height of the renderer wrapper element.
    const renderCanvas = this.$refs.renderCanvas;
    const width = renderCanvas.offsetWidth;
    const height = renderCanvas.offsetHeight;

    // Add us to the ScreenManager if we haven't been already.
    if (!SCREENMAN.isInit()) {
      SCREENMAN.initPixi({
        renderCanvas,
        width,
        height,
      });
    }
  }
}
export default Screen;
</script>

<style scoped>
/* The default dimensions for the screen */
canvas {
  width: 320px;
  height: 600px;
}

/* For screens less than 320px width, use 100% of the screen space */
@media only screen and (max-width: 320px) { 
  canvas {
    width: 100%;
  }
}

/* If a screen is less than 600px high, use the entire screen. */
@media only screen and (max-height: 600px) {
  canvas {
    height: 100%;
  }
}
</style>