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
canvas {
  width: 100%;
  height: 100%;
}
</style>