import Steps from './Steps';
import TimingData from './TimingData';
import { StepsType } from './GameConstantsAndTypes';

// Holds all music metadata and steps for one song
export class Song {
    // Probably not useful for my purposes - Struz
    // See Song.h in StepMania for descriptions.
    public fileName = '';
    public groupName = '';

    public mainTitle = '';
    public subTitle = '';
    public artist = '';
    public mainTitleTranslit = '';
    public subTitleTranslit = '';
    public artistTranslit = '';

    // Version of the song/file
    public version = 0;
    // Genre of the song/file
    public genre = '';
    public credit = '';
    public origin = '';
    // omitted musicFile, previewFile, instrumentTrackFile

    public musicLengthSec = 0;
    public musicSampleStartSec = 0;
    public musicSampleLengthSec = 0;
    public displayBpmType = 0;
    public specifiedBpmMin = 0;
    public specifiedBpmMax = 0;

    // Omitted bannerFile, jacketFile, CDFile, DiscFile, LyricsFile,
    // BackgroundFile, CDTitleFile, previewVidFile, attacks, attackString
    // hasMusic, hasBanner, hasBackground

    // Data for translating beats<->seconds
    public songTiming: TimingData = new TimingData();

    // These 3 were private in C++ but we've made them public here for now
    // The first second that a note is hit
    public firstSecond = 0;
    // The last second that a note is hit
    public lastSecond = 0;
    // The last second of the song for playing purposes
    public specifiedLastSecond = 0;

    // The steps that belong to this Song
    private steps: Steps[];
    // The steps of a particular StepsType that belong to this Song
    // Indexed by the enum of the step type
    private stepsByType: Steps[][];
    // The steps that are of unrecognised styles
    private unknownStyleSteps = 'placeholder unknown style steps';

    constructor() {
        this.stepsByType = [];
        for (let i = 0; i < StepsType.NUM; i++) {
            this.stepsByType[i] = [];
        }
        this.steps = [];
    }

    public addSteps(steps: Steps): void {
        // TODO: check that the steps type is valid?
        this.steps.push(steps);
        this.stepsByType[steps.stepsType].push(steps);
    }

    public hasSteps(): boolean {
        return this.steps.length > 0;
    }

    public getSteps(index: number) {
        return this.steps[index];
    }

    public tidyUpData() {
        this.songTiming.tidyUpData(false);

        for (const steps of this.steps) {
            steps.timingData.tidyUpData(true);
        }
    }
}
export default Song;
