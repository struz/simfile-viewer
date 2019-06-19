// 1. Get list of all objects in s3
// 2. Sort them by pack
// 3. For each pack
// 4.   For each chart
// 5.     assert .sm, assert .ogg, assert file size not greater than X
// 6.     index the chart

// Index all of the packs under 'packs/' in the viewer S3 bucket
// Must be run from the root project directory
import { Aws } from 'aws-cli-js';
import { writeFileSync } from 'fs';
import { Chart, Pack } from '../src/lib/ChartPicker';

const BUCKET = 'struz.simfile-viewer';
const PREFIX = 'packs/';
const TOO_BIG_THRESHOLD = 52428800; // 50MB in bytes

// We have to map the result to make this nicer for TypeScript
interface CmdResult {
    error: string;
    object: S3Result;
    raw: string;
}
interface S3Result {
    Contents: S3Object[];
}
interface S3Object {
    LastModified: string;
    ETag: string;
    // Owner - but we don't care
    Key: string;
    Size: number; // bytes
}

interface FileMetadata {
    pack: string;
    chart: string;
    filename: string;
}

/**
 * Turns a key into some metadata about the key.
 * @param key The S3 bucket key to parse
 * @returns null if the key cannot possibly be part of a chart, the metadata otherwise
 */
function keyToMeta(key: string): FileMetadata {
    const split = key.split('/');
    if (split.length !== 4) { return null; }
    return {
        pack: split[1],
        chart: split[2],
        filename: split[3],
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
function addChartToPack(pack: Pack, chart: any) {
    if ((chart.hasOwnProperty('simFilename') && chart.simFilename !== '') &&
        (chart.hasOwnProperty('oggFilename') && chart.oggFilename !== '')) {
        // Can add chart, it's fully filled out
        pack.charts.push(chart as Chart);
        return true;
    }
    return false;
}

const aws = new Aws();
aws.command(`s3api list-objects --bucket ${BUCKET} --prefix ${PREFIX} --no-paginate`).then((data: CmdResult) => {
    if (data.error !== '') { throw new Error(data.error); }

    // Because of this alphabetic sorting we're guaranteed to come across all parts of
    // a pack & chart before moving to the next
    data.object.Contents.sort((a: S3Object, b: S3Object) => {
        return a.Key.localeCompare(b.Key);
    });

    const packs: Pack[] = [];
    let currentPack: Pack | null = null;
    let currentChart: any = null;
    data.object.Contents.forEach((s3obj) => {
        console.log(s3obj.Key); // this is alphabetically sorted now
        if (s3obj.Size > TOO_BIG_THRESHOLD) { return; }  // too big to consider hosting

        const fileMeta = keyToMeta(s3obj.Key);
        if (fileMeta === null) { return; }  // not a valid file
        if (!fileMeta.filename.toLowerCase().endsWith('.sm') &&
            !fileMeta.filename.toLowerCase().endsWith('.ogg')) { return; }

        // Initial case
        if (currentPack === null) {
            currentPack = {name: fileMeta.pack, charts: []};
            currentChart = {name: fileMeta.chart};
        }

        // If the chart name has changed then we won't be finding any more files for it
        if (fileMeta.chart !== currentChart.name) {
            addChartToPack(currentPack, currentChart);
            currentChart = {name: fileMeta.chart};
        }

        // If the pack name has changed then we need to create the new pack
        if (fileMeta.pack !== currentPack.name) {
            packs.push(currentPack);
            currentPack = {name: fileMeta.pack, charts: []};
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
    writeFileSync('public/packs.json', JSON.stringify(packs), 'utf8');
})
.catch((error) => {
    console.error(error);
});

