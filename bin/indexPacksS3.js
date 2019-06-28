"use strict";
// 1. Get list of all objects in s3
// 2. Sort them by pack
// 3. For each pack
// 4.   For each chart
// 5.     assert .sm, assert .ogg, assert file size not greater than X
// 6.     index the chart
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
exports.__esModule = true;
// Index all of the packs under 'packs/' in the viewer S3 bucket
// Must be run from the root project directory
var aws_cli_js_1 = require("aws-cli-js");
var fs_1 = require("fs");
var BUCKET = 'struz.simfile-viewer';
var PREFIX = 'packs/';
var PAGE_SIZE = 1000;
var TOO_BIG_THRESHOLD = 15728640; // 15MB in bytes
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
 * @param pack the pack to add the chart to.
 * @param chart the chart to try and add to the pack.
 * @returns true if the chart was added to the pack, false otherwise.
 */
function addChartToPack(pack, chart) {
    if ((chart.hasOwnProperty('simFilename') && chart.simFilename !== '') &&
        (chart.hasOwnProperty('oggFilename') && chart.oggFilename !== '')) {
        // Can add chart, it's fully filled out
        pack.charts.push(chart);
        console.log("Added chart " + chart.name + " to pack " + pack.name);
        return true;
    }
    console.log("Rejected adding chart " + chart.name + " to pack " + pack.name);
    return false;
}
// tslint:disable-next-line: max-line-length
var S3_LIST_COMMAND = "s3api list-objects --bucket " + BUCKET + " --prefix " + PREFIX + " --page-size " + PAGE_SIZE + " --max-items " + PAGE_SIZE;
var aws = new aws_cli_js_1.Aws();
// First we fetch all of the s3 objects into local memory so we can manipulate the whole list
var s3Objects = [];
var numFetchedPages = 0;
aws.command(S3_LIST_COMMAND).then(function (data) { return __awaiter(_this, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (data.error !== '') {
                    throw new Error(data.error);
                }
                console.log("Fetched page " + ++numFetchedPages + " of S3 objects");
                data.object.Contents.forEach(function (s3obj) { return s3Objects.push(s3obj); });
                _a.label = 1;
            case 1:
                if (!(data.object.NextToken !== undefined)) return [3 /*break*/, 3];
                // If there's more data to get, get it one page after another
                console.log('fetching another page');
                return [4 /*yield*/, aws.command(S3_LIST_COMMAND + " --starting-token " + data.object.NextToken)
                        .then(function (data2) {
                        data = data2; // so that the while loop picks up the IsTruncated
                        if (data.error !== '') {
                            throw new Error(data.error);
                        }
                        console.log("Fetched page " + ++numFetchedPages + " of S3 objects");
                        data.object.Contents.forEach(function (s3obj) { return s3Objects.push(s3obj); });
                    })];
            case 2:
                _a.sent();
                return [3 /*break*/, 1];
            case 3: return [2 /*return*/];
        }
    });
}); })
    .then(function () {
    // Then we the objects in alphabetical order of keys.
    // This way we're guaranteed to come across all parts of a pack & chart
    // before moving to the next one.
    s3Objects.sort(function (a, b) {
        return a.Key.localeCompare(b.Key);
    });
    var packs = [];
    var currentPack = null;
    var currentChart = null;
    s3Objects.forEach(function (s3obj) {
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
            console.log("Created new chart " + fileMeta.chart);
            currentChart = { name: fileMeta.chart };
        }
        // If the pack name has changed then we need to create the new pack
        if (fileMeta.pack !== currentPack.name) {
            packs.push(currentPack);
            console.log("Created new pack " + fileMeta.pack);
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
});
