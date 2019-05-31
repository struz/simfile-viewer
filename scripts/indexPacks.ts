// Index all of the packs under 'packs/'
// Must be run from the root project directory
import { readdirSync, writeFileSync, fstat } from 'fs';

interface Chart {
    name: string;
    oggFilename: string | null; // ogg files are optional for copyright reasons
    simFilename: string;
}

interface Pack {
    name: string;
    charts: Chart[];
}

// List all the packs
const packs: Pack[] = [];
readdirSync('packs', {withFileTypes: true})
    .forEach((pack) => {
        if (!pack.isDirectory()) { return; }
        packs.push({
            name: pack.name,
            charts: [],
        });
});

// Enumerate the charts in the pack
packs.forEach((pack) => {
    const packPath = `packs/${pack.name}`;
    readdirSync(packPath, {withFileTypes: true}).forEach((chart) => {
        if (!chart.isDirectory()) { return; }
        const chartName = chart.name;
        let oggFilename: string;
        let simFilename: string;

        const chartPath = `${packPath}/${chart.name}`;
        readdirSync(chartPath, {withFileTypes: true}).forEach((file) => {
            if (!file.isFile()) { return; }
            if (file.name.endsWith('.sm')) { simFilename = file.name; }
            if (file.name.endsWith('.ogg')) { oggFilename = file.name; }
        });

        // Sanity check
        if (oggFilename === '') { throw new Error('ogg file not found for chart ${chartName}'); }

        pack.charts.push({
            name: chartName,
            oggFilename: oggFilename === '' ? null : oggFilename,
            simFilename,
        });
    });
});

// Dump the packs into a JSON file
writeFileSync('public/packs.json', JSON.stringify(packs), 'utf8');
