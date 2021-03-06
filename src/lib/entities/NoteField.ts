import Entity from './Entity';
import GAMESTATE from '../GameState';
import ArrowEffects from '../ArrowEffects';
import NoteHelpers, { TapNoteType, TapNoteSubType } from '../NoteTypes';
import TapNoteSprite from './TapNoteSprite';
import { laneIndexToDirection } from './EntitiesConstants';
import TapMineSprite from './TapMineSprite';
import GameSprite, { Drawable } from './GameSprite';
import HoldTailSprite from './HoldTailSprite';
import RollTailSprite from './RollTailSprite';

// The note tracks can hold any drawable note
type DrawableNoteSprite = Drawable;

class NoteTrackData {
    /** The tap notes and the note rows they land on. */
    public tapNotes: Map<number, DrawableNoteSprite>;
    /** The end points of holds. Required so we can cull holds when they end. */
    public holdCaps: Map<number, DrawableNoteSprite>;

    constructor() {
        this.tapNotes = new Map();
        this.holdCaps = new Map();
    }
}

/** The note field. Doesn't inherently draw anything itself
 *  but controls other entities which are drawn.
 */
class NoteField extends Entity {
    // TODO: Eventually optimise this into a genericized vesion of TrackMap.
    // Map is keyed as noteRow=>TapNoteSprite
    /** One map of note rows to the sprites they draw for each note track. */
    private noteTracks: NoteTrackData[];

    constructor() {
        super();
        this.noteTracks = [];
        this.resetTracks(4);
    }

    public resetTracks(numTracks: number) {
        // Cleanup any old notes
        for (const track of this.noteTracks) {
            for (const tn of track.tapNotes) {
                tn[1].destroy();
            }
            for (const tn of track.holdCaps) {
                tn[1].destroy();
            }
        }

        // Reset the tracks
        this.noteTracks = [];
        for (let i = 0; i < numTracks; i++) {
            this.noteTracks.push(new NoteTrackData());
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
            const mid = (low + high) / 2; // float (because it's a beat)

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
            const m = Math.trunc((l + r) / 2); // int
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

        const firstRow = NoteHelpers.beatToNoteRow(firstBeatToDraw);
        const lastRow = NoteHelpers.beatToNoteRow(lastBeatToDraw);

        // TODO: draw beat bars?

        // We use a direct loop here so we can access the data immediately but the abstraction
        // is lost. Build a generic version of this efficient abstraction somewhere.

        // TODO: fix steps index below and replace with actual steps index when we have it later
        const nd = GAMESTATE.curSong.getSteps(GAMESTATE.selectedSteps).getNoteData();
        for (let t = 0; t < nd.tapNotes.length; t++) {
            for (const tnEntry of nd.tapNotes[t]) {
                // IMPORTANT: this array MUST be ordered or this continue/break logic won't work.
                if (tnEntry[0] < firstRow) { continue; }
                if (tnEntry[0] > lastRow) { break; }
                if (tnEntry[1].type !== TapNoteType.Tap &&
                    tnEntry[1].type !== TapNoteType.HoldHead &&
                    tnEntry[1].type !== TapNoteType.Mine) { continue; }

                // If we don't have the note already, create it
                if (this.noteTracks[t].tapNotes.has(tnEntry[0])) { continue; }

                const beat = NoteHelpers.noteRowToBeat(tnEntry[0]);
                const direction = laneIndexToDirection(t);
                let tnSprite: GameSprite;
                switch (tnEntry[1].type) {
                    case TapNoteType.Tap:
                        tnSprite = new TapNoteSprite(
                            direction,
                            beat,
                        );
                        break;

                    case TapNoteType.HoldHead:
                        tnSprite = new TapNoteSprite(
                            direction,
                            beat,
                        );
                        let tailSprite: HoldTailSprite | RollTailSprite | undefined;
                        if (tnEntry[1].subType === TapNoteSubType.Hold) {
                            tailSprite = new HoldTailSprite(
                                direction,
                                beat,
                                NoteHelpers.noteRowToBeat(tnEntry[1].duration),
                            );
                        } else {
                            tailSprite = new RollTailSprite(
                                direction,
                                beat,
                                NoteHelpers.noteRowToBeat(tnEntry[1].duration),
                            );
                        }
                        this.noteTracks[t].holdCaps.set(tnEntry[0], tailSprite.addToStage());
                        break;

                    case TapNoteType.Mine:
                        tnSprite = new TapMineSprite(
                            direction,
                            beat,
                        );
                        break;
                    default:
                        throw new Error(`Unprocessable TapNoteType encountered: ${tnEntry[1].type}`);
                }
                this.noteTracks[t].tapNotes.set(tnEntry[0], tnSprite.setZIndex(-tnEntry[0]).addToStage());
            }
        }

        // Clean up the notes that are out of range
        // We could do the cleanup in the same loop above but we might end up doing too many .has() lookups
        // Instead, do a separate loop
        const toDestroy: Array<[number, DrawableNoteSprite, Map<number, DrawableNoteSprite>]> = [];
        for (const track of this.noteTracks) {
            for (const tnsEntry of track.tapNotes) {
                if (tnsEntry[0] < firstRow || tnsEntry[0] > lastRow) {
                    // The sprite is out of our valid window for management, destroy it
                    // Avoid doing it in here in case it changes the internals and ruins
                    // iteration.
                    toDestroy.push([tnsEntry[0], tnsEntry[1], track.tapNotes]);
                }
            }
            for (const tnsEntry of track.holdCaps) {
                // We only cull holds based on their end since the start note is often off-screen
                if (tnsEntry[0] > lastRow) {
                    toDestroy.push([tnsEntry[0], tnsEntry[1], track.holdCaps]);
                }
            }
        }
        toDestroy.forEach((tnsAndTrackEntry) => {
            tnsAndTrackEntry[2].delete(tnsAndTrackEntry[0]);
            tnsAndTrackEntry[1].destroy(); // destroy the entity
        });
    }

    public update(deltaTime: number) {
        this.updateNotes(deltaTime);
        return this;
    }
}
export default NoteField;
