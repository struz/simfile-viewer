// Supporting code for the chart picker and related scripts
export interface Chart {
    name: string;
    oggFilename: string | null; // ogg files are optional for copyright reasons
    simFilename: string;
}

export interface Pack {
    name: string;
    charts: Chart[];
}

export interface ChartURLs {
    ogg: string | null;
    simFile: string;
}
