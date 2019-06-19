"use strict";
// 1. Get list of all objects in s3
// 2. Sort them by pack
// 3. For each pack
// 4.   For each chart
// 5.     assert .sm, assert .ogg, assert file size not greater than X
// 6.     index the chart
exports.__esModule = true;
// Index all of the packs under 'packs/' in the viewer S3 bucket
// Must be run from the root project directory
var aws_cli_js_1 = require("aws-cli-js");
var fs_1 = require("fs");
var BUCKET = 'struz.simfile-viewer';
var PREFIX = 'packs/';
var TOO_BIG_THRESHOLD = 52428800; // 50MB in bytes
/**
 * Turns a key into some metadata about the key.
 * @param key The S3 bucket key to parse
 * @returns null if the key cannot possibly be part of a chart, the metadata otherwise
 */
function keyToMeta(key) {
    var split = key.split('/');
    if (split.length !== 4) {
        return null;
    }
    return {
        pack: split[1],
        chart: split[2],
        filename: split[3]
    };
}
/**
 * Attempts to add a chart to a pack if it has the right information.
 * If it doesn't have enough information then it will not be added.
 *
 * @param pack the pack to add the chart to.
 * @param chart the chart to try and add to the pack.
 * @returns true if the chart was added to the pack, false otherwise.
 */
function addChartToPack(pack, chart) {
    if ((chart.hasOwnProperty('simFilename') && chart.simFilename !== '') &&
        (chart.hasOwnProperty('oggFilename') && chart.oggFilename !== '')) {
        // Can add chart, it's fully filled out
        pack.charts.push(chart);
        return true;
    }
    return false;
}
var aws = new aws_cli_js_1.Aws();
aws.command("s3api list-objects --bucket " + BUCKET + " --prefix " + PREFIX + " --no-paginate").then(function (data) {
    if (data.error !== '') {
        throw new Error(data.error);
    }
    // Because of this alphabetic sorting we're guaranteed to come across all parts of
    // a pack & chart before moving to the next
    data.object.Contents.sort(function (a, b) {
        return a.Key.localeCompare(b.Key);
    });
    var packs = [];
    var currentPack = null;
    var currentChart = null;
    data.object.Contents.forEach(function (s3obj) {
        console.log(s3obj.Key); // this is alphabetically sorted now
        if (s3obj.Size > TOO_BIG_THRESHOLD) {
            return;
        } // too big to consider hosting
        var fileMeta = keyToMeta(s3obj.Key);
        if (fileMeta === null) {
            return;
        } // not a valid file
        if (!fileMeta.filename.toLowerCase().endsWith('.sm') &&
            !fileMeta.filename.toLowerCase().endsWith('.ogg')) {
            return;
        }
        // Initial case
        if (currentPack === null) {
            currentPack = { name: fileMeta.pack, charts: [] };
            currentChart = { name: fileMeta.chart };
        }
        // If the chart name has changed then we won't be finding any more files for it
        if (fileMeta.chart !== currentChart.name) {
            addChartToPack(currentPack, currentChart);
            currentChart = { name: fileMeta.chart };
        }
        // If the pack name has changed then we need to create the new pack
        if (fileMeta.pack !== currentPack.name) {
            packs.push(currentPack);
            currentPack = { name: fileMeta.pack, charts: [] };
        }
        // Parse metadata from the current file
        if (fileMeta.filename.toLowerCase().endsWith('.sm')) {
            currentChart.simFilename = fileMeta.filename;
        }
        if (fileMeta.filename.toLowerCase().endsWith('.ogg')) {
            currentChart.oggFilename = fileMeta.filename;
        }
    });
    // Add the final chart we were processing
    addChartToPack(currentPack, currentChart);
    packs.push(currentPack);
    // Dump the packs into a JSON file
    fs_1.writeFileSync('public/packs.json', JSON.stringify(packs), 'utf8');
})["catch"](function (error) {
    console.error(error);
});
