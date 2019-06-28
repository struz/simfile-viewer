<template>
  <div class="chart-picker">
    <v-select
      :items="packs"
      item-text="name"
      item-value="name"
      label="Pack"
      v-model="selectedPack"
      v-on:change="changePackEvent()">
    </v-select>
    <v-select
      :items="charts"
      item-text="name"
      item-value="name"
      label="Chart"
      v-model="selectedChart"
      v-on:change="changeChartEvent()">
    </v-select>
    <v-select
      :items="steps"
      :item-text="getStepsItemText"
      :item-value="getStepsItemValue"
      label="Steps"
      v-model="selectedSteps"
      v-on:change="changeStepsEvent()">
    </v-select>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import axios from 'axios';
import { Pack, ChartURLs, Chart } from '@/lib/ChartPicker';
import Steps from '@/lib/Steps';
import Song from '@/lib/Song';
import FileOperations from '@/lib/FileOperations';
import NoteLoaderSM from '@/lib/NoteLoaderSM';
import GAMESTATE from '@/lib/GameState';
import MsdFile from '@/lib/MsdFile';

// This can be overridden with the process.env.VUE_APP_PACK_URL_PREFIX environment variable
const DEFAULT_PACK_URL_PREFIX = 'https://s3-us-west-2.amazonaws.com/struz.simfile-viewer/';

const PACK_PATH_PREFIX = process.env.VUE_APP_PACK_URL_PREFIX || DEFAULT_PACK_URL_PREFIX;
const PACK_INDEX_FILENAME = process.env.VUE_APP_PACK_INDEX_FILENAME || 'packs.json';
const DEFAULT_SELECTED_CHART = {name: '<Select a chart>', oggFilename: '', simFilename: ''};

interface StepsItem {
  index: number; // Since we can't have the value as an object
  steps: Steps;
}
// Actually text should be the name of the edit / difficulty slot
// .steps.meter - .steps.description, ordered by .index

// See https://vuejs.org/v2/guide/typescript.html for why we do the below
@Component
class ChartPicker extends Vue {
  public selectedPack = 'Loading';
  public packs: Pack[] = [
    {
      name: 'Loading',
      charts: [],
    },
  ];

  public selectedChart = 'Loading';
  public charts: Chart[] = [
    {
      name: 'Loading',
      oggFilename: 'Loading',
      simFilename: 'Loading',
    },
  ];

  public selectedSteps: number = -1;
  public steps: Steps[] = [];

  public provide() {
    return {};
  }

  public mounted() {
    // Fetch and return the pack data
    axios.get(`${process.env.BASE_URL}${PACK_INDEX_FILENAME}`).then((response) => {
      this.packs = response.data;
      // Insert default/dummy charts
      this.packs.forEach((pack) => {
        pack.charts.unshift(DEFAULT_SELECTED_CHART);
      });
      // Set default pack
      this.selectedPack = this.packs[0].name;
      // Set default chart from default pack
      this.charts = this.packs[0].charts;
      this.selectedChart = DEFAULT_SELECTED_CHART.name;
    }).catch((error) => {
      console.error(`failed to get pack info from url: ${error}`);
    });
  }

  private findPack(name: string): Pack {
    const foundPack = this.packs.find((pack) => pack.name === name);
    if (foundPack === undefined) {
      throw new Error(`Could not find pack with name ${name}`);
    }
    return foundPack;
  }

  private findChart(name: string): Chart {
    const foundChart = this.charts.find((chart) => chart.name === name);
    if (foundChart === undefined) {
      throw new Error(`Could not find chart with name ${name}`);
    }
    return foundChart;
  }

  private changePackEvent(event: any) {
    this.charts = this.findPack(this.selectedPack).charts;
    this.selectedChart = this.charts[0].name;
  }

  private changeChartEvent(event: any) {
    const packName = this.selectedPack;
    const chart = this.findChart(this.selectedChart);

    if (chart === DEFAULT_SELECTED_CHART) { return; } // nothing to load

    const ogg = chart.oggFilename === null ? null :
      `${encodeURIComponent(packName)}/${encodeURIComponent(chart.name)}/` +
      `${encodeURIComponent(chart.oggFilename)}`;
    const simFile = `${encodeURIComponent(packName)}/${encodeURIComponent(chart.name)}` +
                    `/${encodeURIComponent(chart.simFilename)}`;
    const urls: ChartURLs = {ogg, simFile};
    this.changeChart(urls);
    // Emit an event for any other components that might want to do something
    this.$emit('changeChart', urls);
  }

  private changeStepsEvent(event: any) {
    const stepsIndex = this.selectedSteps;

    // const packName = this.selectedPack;
    // const chart = this.findChart(this.selectedChart);

    if (stepsIndex === null) { return; } // nothing to change
    if (GAMESTATE.curSong === undefined) { return; }
    // Find it again here in case we sort the model for display purposes
    const steps = this.steps[stepsIndex];
    GAMESTATE.selectedSteps = GAMESTATE.curSong.getAllSteps().indexOf(steps);
    // Emit an event for any other components that might want to do something
    this.$emit('changeSteps', steps);
  }

  private getStepsItemText(item: Steps) {
    return `${item.meter} - ${item.description}`;
  }
  private getStepsItemValue(item: Steps) { return this.steps.indexOf(item); }

  /**
   * Handle loading a new chart based on the provided URL for an ogg and .sm file.
   * @param urls the relevant URLs to load the chart.
   */
  private changeChart(urls: ChartURLs) {
    if (urls.ogg === null) { throw new Error('no ogg not supported yet!'); }

    let newSong: Song | null;
    const absoluteSimURI = `${PACK_PATH_PREFIX}packs/${urls.simFile}`;
    const p1 = FileOperations.loadTextFile(absoluteSimURI)
      .then((smText) => {
        const msdFile = new MsdFile(smText);
        newSong = NoteLoaderSM.loadFromSimfile(msdFile);
        console.log('loaded sm data');

        // Add it to our model
        this.steps = newSong.getAllSteps();
        this.selectedSteps = 0;
      })
      .catch((error) => {
        console.error(`failed to load .sm file at '${absoluteSimURI}': ${error}`);
      });

    let newHowl: Howl | null;
    const absoluteHowlURI = `${PACK_PATH_PREFIX}packs/${urls.ogg}`;
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
export default ChartPicker;
</script>

<style scoped>

</style>