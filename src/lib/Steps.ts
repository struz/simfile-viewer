import NoteData from './NoteData';
import { StepsType, Difficulty } from './GameConstantsAndTypes';
import Song from './Song';
import TimingData from './TimingData';

// Holds note information for a song
export class Steps {
    public timingData: TimingData = new TimingData();
    // Type info for these steps
    public stepsType: StepsType = StepsType.Invalid;
    // Name of steps type - for dealing with unrecognized strings
    public stepsTypeName: string = '';
    // Song these steps are associated with
    public song: Song = new Song();

    // The name of the edit, or some other useful description.
    // This used to also contain the step author's name.
    public description: string = '';
    // The style of the chart. (e.g. "Pad", "Keyboard")
    public chartStyle: string = '';
    // The difficulty that these steps are assigned to.
    public difficulty: Difficulty = Difficulty.Invalid;
    // The numeric difficulty of the Steps, ranging from MIN_METER to MAX_METER.
    public meter: number = -1;
    // NOTE: omitted radar values - I do not know what these are
    // The name of the person who created the Steps
    public credit: string = '';
    // The name of the chart
    public chartName: string = '';
    // How is the BPM displayed for the chart?
    public displayBPMType: number = -1;
    // What is the minimum specified BPM?
    public specifiedBpmMin: number = -1;
    // What is the maximum specified BPM?
    // If this is a range then min should not be equal to max
    public specifiedBpmMax: number = -1;

    // Note data for the song
    private noteData: NoteData;

    constructor(noteData: string) {
        this.noteData = new NoteData(noteData);
        // TODO: parse note data, we don't do compressed
    }

    public getNoteData(): NoteData {
        return this.noteData;
    }
}
export default Steps;
