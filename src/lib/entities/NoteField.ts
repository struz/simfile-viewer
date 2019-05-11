import Entity from './Entity';
import GAMESTATE from '../GameState';
import ArrowEffects from '../ArrowEffects';
import NoteHelpers, { TapNoteType } from '../NoteTypes';
import TapNoteSprite from './TapNoteSprite';
import { laneIndexToDirection } from './EntitiesConstants';
import SCREENMAN from '../ScreenManager';


/** The note field. Doesn't inherently draw anything itself
 *  but controls other entities which are drawn.
 */
class NoteField extends Entity {
    // Eventually optimise this into a genericized vesion of TrackMap.
    // Map is keyed as noteRow=>TapNoteSprite
    private noteTracks: Array<Map<number, TapNoteSprite>>;

    constructor() {
        super();
        this.noteTracks = [];
        this.resetTracks(4);
    }

    public resetTracks(numTracks: number) {
        // Cleanup any old notes
        for (const track of this.noteTracks) {
            for (const tn of track) {
                tn[1].destroy();
            }
        }

        // Reset the tracks
        this.noteTracks = [];
        for (let i = 0; i < numTracks; i++) {
            this.noteTracks.push(new Map());
        }
    }

    public findFirstDisplayedBeat(drawDistanceAfterTargetsPixels: number) {
        const songBeat = GAMESTATE.position.songBeat;

        let low = 0;
        let high = songBeat;

        // I'm not sure what the cache does. TODO: work it out -Struz
        const hasCache = ArrowEffects.noteStatCache.length !== 0;
        if (!hasCache) {
            low = high - 4;  // Only scan one measure of 4/4 for performance?? -Struz
        }

        const NUM_ITERATIONS = 24;
        const MAX_NOTES_AFTER = 64;

        let firstBeatToDraw = low;

        // This looks like some kind of beat-and-iteration-bounded binary search -Struz
        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const mid = (low + high) / 2;

            const isPastPeakYOffset = {value: false};
            const peakYOffset = {value: 0};
            const yOffset = ArrowEffects.getYOffset(mid, peakYOffset, isPastPeakYOffset);

            if (yOffset < drawDistanceAfterTargetsPixels ||
                (hasCache && this.getNumNotesRange(mid, songBeat) > MAX_NOTES_AFTER)) {

                // off screen / too many notes
                firstBeatToDraw = mid; // move towards songBeat
                low = mid;
            } else {
                high = mid;
            }
        }
        return firstBeatToDraw;
    }

    public findLastDisplayedBeat(drawDistanceBeforeTargetsPixels: number) {
        // Fail fast if no song timing
        if (GAMESTATE.curSong === undefined) { return 0; }

        const displayedPosition = GAMESTATE.position;
        const displayedTiming = GAMESTATE.curSong.songTiming;
        // Probe for last note to draw. Worst case is 0.25x + boost.
        // Adjust search distance so that notes don't pop onto the screen.
        let searchDistance = 10;
        let lastBeatToDraw = displayedPosition.songBeat + searchDistance;
        const speedMultiplier = displayedTiming.getDisplayedSpeedPercent(
            displayedPosition.songBeatVisible, displayedPosition.musicSecondsVisible);

        const NUM_ITERATIONS = 20;

        for (let i = 0; i < NUM_ITERATIONS; i++) {
            const isPastPeakYOffset = {value: false};
            const peakYOffset = {value: 0};
            const yOffset = ArrowEffects.getYOffset(lastBeatToDraw, peakYOffset, isPastPeakYOffset);

            if (yOffset > drawDistanceBeforeTargetsPixels) { // off screen
                lastBeatToDraw -= searchDistance;
            } else { // on screen
                lastBeatToDraw += searchDistance;
            }
            searchDistance /= 2;
        }

        if (speedMultiplier < 0.75) {
            lastBeatToDraw = Math.min(lastBeatToDraw, displayedPosition.songBeat + 16);
        }
        return lastBeatToDraw;
    }

    public getNumNotesFromBeginning(beat: number) {
        // binary search
        const data = ArrowEffects.noteStatCache;
        const max = data.length - 1;
        let l = 0;
        let r = max;
        while (l <= r) {
            const m = (l + r) / 2;
            if ((m === 0 || data[m].beat <= beat) && (m === max || beat < data[m + 1].beat)) {
                return data[m];
            } else if (data[m].beat <= beat) {
                l = m + 1;
            } else {
                r = m - 1;
            }
        }
        return {beat: 0, notesLower: 0, notesUpper: 0};
    }

    public getNumNotesRange(low: number, high: number) {
        const noteStatLow = this.getNumNotesFromBeginning(low);
        const noteStatHigh = this.getNumNotesFromBeginning(high);
        return noteStatHigh.notesUpper - noteStatLow.notesLower;
    }

    public updateNotes(deltaTime: number) {
        // Fail fast if no song
        if (GAMESTATE.curSong === undefined) { return this; }
        const songBeat = GAMESTATE.position.songBeatVisible;

        const PIXELS_TO_DRAW_OFFSCREEN = 1000;
        const firstBeatToDraw = this.findFirstDisplayedBeat(PIXELS_TO_DRAW_OFFSCREEN);
        const lastBeatToDraw = this.findLastDisplayedBeat(PIXELS_TO_DRAW_OFFSCREEN);
        // console.log(`fbtd=${firstBeatToDraw}, lbtd=${lastBeatToDraw}`);

        const firstRow = NoteHelpers.beatToNoteRow(firstBeatToDraw);
        const lastRow = NoteHelpers.beatToNoteRow(lastBeatToDraw);

        // TODO: draw beat bars?

        // for each column
        // - build lists of holds and taps and compare them against what we've got as entities already
        // - repurpose any entities that are outside the first and last beat to draw

        // grand vision: each note is self updating, we just have to manage their lifecycle here

        // if we calculate the first and last beats on screen then we cull anything outside that
        // beat range in our existing, and add new ones lower down.

        // we want to avoid over iterating so maybe iterate over the note data



        // SO: they use the Y coords for how far away to put things. We could probably simplify it
        // by just using a grid, but give it a try first.



        // The C++ code uses a const iterator here. Performance? -Struz
        // What it does is set the start and end iterators to the range it wants to iterate over
        const outerRow = {value: 0};

        // We use a direct loop here so we can access the data immediately but the abstraction
        // is lost. Build a generic version of this efficient abstraction somewhere.
        // TODO: fix steps index below
        const nd = GAMESTATE.curSong.getSteps(0).getNoteData();
        for (let t = 0; t < nd.tapNotes.length; t++) {
            for (const tn of nd.tapNotes[t]) {
                // IMPORTANT: TODO: assert ordering
                if (tn[0] < firstRow) { continue; }
                if (tn[0] > lastRow) { break; }
                if (tn[1].type !== TapNoteType.Tap && tn[1].type !== TapNoteType.HoldHead) { continue; }

                // If we don't have the note already, create it
                if (this.noteTracks[t].has(tn[0])) { continue; }

                const beat = NoteHelpers.noteRowToBeat(tn[0]);
                this.noteTracks[t].set(tn[0], new TapNoteSprite(
                    laneIndexToDirection(t),
                    NoteHelpers.beatToNoteType(beat),
                    beat,
                ).addToStage());
            }
        }

        // Cleanup notes out of range
        // TODO:
    }

    public update(deltaTime: number) {
        this.updateNotes(deltaTime);
        return this;
    }
}
export default NoteField;