import NoteData from './NoteData';
import Helpers, { StepsType, Difficulty } from './GameConstantsAndTypes';
import TimingData from './TimingData';
import { NoteDataUtil } from './NoteDataUtil';
import Song from './Song';

/**
 * Enforce a limit on the number of chars for the description.
 *
 * In In The Groove, this limit was 12: we do not need such a limit now.
 */
export const MAX_STEPS_DESCRIPTION_LENGTH = 255;

/** The different ways of displaying the BPM. */
export enum DisplayBPM {
    ACTUAL, /** Display the song's actual BPM. */
    SPECIFIED, /** Display a specified value or values. */
    RANDOM, /** Display a random selection of BPMs. */
    NUM,
    Invalid,
}

/**
 * Holds note information for a Song.
 * A Song may have one or more Notes.
 */
export class Steps {
    /**
     * The TimingData used by the Steps.
     * This is required to allow Split Timing.
     */
    public timingData: TimingData = new TimingData();
    // Type info for these steps
    public stepsType: StepsType = StepsType.Invalid;
    /** The string form of the StepsType, for dealing with unrecognized styles. */
    public stepsTypeName: string = '';
    /** The Song these Steps are associated with */
    public song: Song;

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
    public displayBPMType: number = DisplayBPM.ACTUAL;
    // What is the minimum specified BPM?
    public specifiedBpmMin: number = 0;
    // What is the maximum specified BPM?
    // If this is a range then min should not be equal to max
    public specifiedBpmMax: number = 0;

    // Note data for the song
    private noteData: NoteData = new NoteData();
    // Compressed note data for the song
    private noteDataCompressed: string;
    private noteDataIsFilled: boolean = false;

    constructor(noteData: string, song: Song) {
        this.noteDataCompressed = noteData;
        this.song = song;
    }

    public getNoteData() { return this.noteData; }
    public getCompressedNoteData() { return this.noteDataCompressed; }
    public isNoteDataFilled() { return this.noteDataIsFilled; }
    public getTimingData() { return this.timingData.empty() ? this.song.songTiming : this.timingData; }

    public decompress() {
        if (this.noteDataIsFilled) {
            return; // already decompressed
        }

        // load from compressed
        // Omitted composite - not supporting (for now) - Struz
        this.noteDataIsFilled = true;
        this.noteData.setNumTracks(Helpers.getStepsTypeInfo(this.stepsType).numTracks);
        NoteDataUtil.loadFromSmNoteDataString(this.noteData, this.noteDataCompressed);
    }

    public tidyUpData(): void {
        // Don't set the StepsType to dance single if it's invalid.  That just
        // causes unrecognized charts to end up where they don't belong.
        // Leave it as StepsType_Invalid so the Song can handle it specially.  This
        // is a forwards compatibility feature, so that if a future version adds a
        // new style, editing a simfile with unrecognized Steps won't silently
        // delete them. -Kyz
        if (this.stepsType === StepsType.Invalid) {
            const stepsTypeString = this.stepsTypeName;
            console.warn(`Detected steps with unknown style '${stepsTypeString}' in sm data`);
        } else if (this.stepsTypeName === '') {
            // TODO: lookup the StepsTypeInfo for the stepsType and set the typeName using it
        }

        if (this.difficulty === Difficulty.Invalid) {
            // TODO: something about setting the difficulty based on the description
        }

        if (this.difficulty === Difficulty.Invalid) {
            if (this.meter === 1) {
                this.difficulty = Difficulty.Beginner;
            } else if (this.meter <= 3) {
                this.difficulty = Difficulty.Easy;
            } else if (this.meter <= 6) {
                this.difficulty = Difficulty.Medium;
            } else {
                this.difficulty = Difficulty.Hard;
            }
        }

        if (this.meter < 1) {
            // meter is invalid!
            // TODO: translate prediction function, if it ever seems useful - Struz
            // this.meter = this.predictMeter()
        }
    }
}
export default Steps;
