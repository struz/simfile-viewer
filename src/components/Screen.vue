<template>
  <div class="pixi-renderer">
    <canvas ref="renderCanvas"></canvas>
    <!-- All child <template> elements get added in here -->
    <slot></slot>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { CombinedVueInstance } from 'vue/types/vue';

import SCREENMAN, { ScreenManager } from '@/lib/ScreenManager';

interface ScreenManagerWrapper {
  ScreenManager: ScreenManager | null; // The application object
}

interface ScreenComponent {
  ScreenManagerWrapper: ScreenManagerWrapper;
  EventBus: Vue;
}

export default {
  data(): ScreenComponent {
    return {
      // These need to be contained in an object because providers are not reactive.
      ScreenManagerWrapper: {
        // Expose PIXI and the created app to all descendants.
        ScreenManager: null,
      },
      // Expose the event bus to all descendants so they can listen for the app-ready event.
      EventBus: new Vue(),
    };
  },
  // Allows descendants to inject everything.
  provide(): ScreenComponent {
    return {
      ScreenManagerWrapper: this.ScreenManagerWrapper,
      EventBus: this.EventBus,
    };
  },

  mounted() {
    // Determine the width and height of the renderer wrapper element.
    const renderCanvas = this.$refs.renderCanvas as HTMLCanvasElement;
    const width = renderCanvas.offsetWidth;
    const height = renderCanvas.offsetHeight;

    // Add us to the ScreenManager. If we already existed throw an error as this
    // should not happen.
    if (SCREENMAN.isInit()) { throw new Error('Tried to remount while SCREENMAN already initialised'); }
    SCREENMAN.initPixi({
      renderCanvas,
      width,
      height,
    });

    this.EventBus.$emit('ready');
  },
};
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
}
</style>