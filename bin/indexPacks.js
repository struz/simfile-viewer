"use strict";
exports.__esModule = true;
// Index all of the packs under 'packs/'
// Must be run from the root project directory
var fs_1 = require("fs");
// List all the packs
var packs = [];
fs_1.readdirSync('packs', { withFileTypes: true })
    .forEach(function (pack) {
    if (!pack.isDirectory()) {
        return;
    }
    packs.push({
        name: pack.name,
        charts: []
    });
});
// Enumerate the charts in the pack
packs.forEach(function (pack) {
    var packPath = "packs/" + pack.name;
    fs_1.readdirSync(packPath, { withFileTypes: true }).forEach(function (chart) {
        if (!chart.isDirectory()) {
            return;
        }
        var chartName = chart.name;
        var oggFilename;
        var simFilename;
        var chartPath = packPath + "/" + chart.name;
        fs_1.readdirSync(chartPath, { withFileTypes: true }).forEach(function (file) {
            if (!file.isFile()) {
                return;
            }
            if (file.name.endsWith('.sm')) {
                simFilename = file.name;
            }
            if (file.name.endsWith('.ogg')) {
                oggFilename = file.name;
            }
        });
        // Sanity check
        if (oggFilename === '') {
            throw new Error('ogg file not found for chart ${chartName}');
        }
        pack.charts.push({
            name: chartName,
            oggFilename: oggFilename === '' ? null : oggFilename,
            simFilename: simFilename
        });
    });
});
// Dump the packs into a JSON file
fs_1.writeFileSync('public/packs.json', JSON.stringify(packs), 'utf8');
