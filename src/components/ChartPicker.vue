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
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { Component } from 'vue-property-decorator';
import axios from 'axios';
import { Pack, ChartURLs, Chart } from '@/lib/ChartPicker';

const PACK_INDEX_FILENAME = process.env.VUE_APP_PACK_INDEX_FILENAME || 'packs.json';
const DEFAULT_SELECTED_CHART = {name: '<Select a chart>', oggFilename: '', simFilename: ''};

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

    const ogg = chart.oggFilename === null ? null : `${packName}/${chart.name}/${chart.oggFilename}`;
    const simFile = `${packName}/${chart.name}/${chart.simFilename}`;
    const urls: ChartURLs = {ogg, simFile};
    this.$emit('changeChart', urls);
  }

}
export default ChartPicker;
</script>

<style scoped>

</style>