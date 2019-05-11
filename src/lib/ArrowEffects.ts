import SongPosition from './SongPosition';
import GAMESTATE from './GameState';
import { PassByRef } from './GameConstantsAndTypes';

interface CacheDisplayedBeat {
    beat: number;
    displayedBeat: number;
    velocity: number;
}

interface CacheNoteStat {
    beat: number;
    notesLower: number; // int
    notesUpper: number; // int
}

// Not quite sure what this does but it seems theme related -Struz
const ARROW_SPACING = 1;

/** Functions that return properties of arrows based on Style and PlayerOptions. */
class ArrowEffects {
    /**
     * Holds a vector sorted by real beat, the beat that would be displayed
     * in the NoteField (because they are affected by scroll segments), and
     * also the velocity.
     * This vector will be populated on Player::Load() be used a lot in
     * ArrowEffects to determine the target beat in O(log N).
     */
    public static displayedBeatCache: CacheDisplayedBeat[] = [];
    /** Holds a vector sorted by beat, the cumulative number of notes from
     * the start of the song.
     */
    public static noteStatCache: CacheNoteStat[] = [];

    // OPTIONS - may need to move these to another class later
    /** timeSpacing of 0 means cmod, mmod as we are using beat instead of time. */
    public static timeSpacing = 0;
    public static maxScrollBpm = 0;
    // next two used if !timeSpacing (xMods)
    public static scrollSpeed = 100;
    public static speedScrollSpeed = 1;
    // next two used it timeSpacing (CMod)
    public static scrollBpm = 400;
    public static speedScrollBpm = 1;

    // Next one was on PlayerState for some reason
    /** Stores the bpm that was picked for reading the chart if the player is using an mmod. */
    public static readBpm = 400;

    /* For visibility testing: if bAbsolute is false, random modifiers must return
     * the minimum possible scroll speed. */
    public static getYOffset(
        noteBeat: number, peakYOffsetOut: PassByRef<number>,
        isPastPeakOut: PassByRef<boolean>) {

        // Fail fast if no song
        if (GAMESTATE.curSong === undefined) { return 0; }

        peakYOffsetOut.value = Number.MAX_VALUE;
        isPastPeakOut.value = true;

        let yOffset = 0;
        const position = GAMESTATE.position; // TODO: get position from args

        const songBeat = position.songBeatVisible;
        const curSteps = GAMESTATE.curSong.getSteps(0); // TODO: use a proper index
        // curSteps is unused for now as we're just relying on song timing
        const timingData = GAMESTATE.curSong.songTiming;

        /* Usually, timeSpacing is 0 or 1, in which case we use entirely beat spacing or
         * entirely time spacing (respectively). Occasionally, we tween between them. */
        if (this.timeSpacing !== 1) {
            // !== 1 means cmod, mmod
            // No editor, no constant spacing
            yOffset = ArrowEffects.getDisplayedBeat(noteBeat) - ArrowEffects.getDisplayedBeat(songBeat);
            yOffset *= timingData.getDisplayedSpeedPercent(position.songBeatVisible, position.musicSecondsVisible);
            yOffset *= 1 - this.timeSpacing;
        }

        if (this.timeSpacing !== 0) {

            const songSeconds = GAMESTATE.position.musicSecondsVisible;
            const noteSeconds = timingData.getElapsedTimeFromBeat(noteBeat);
            // DEBUGGING: the song is literally ahead of the beat here, hence why we have the weird shit
            // happening. Why is it not looking ahead properly?
            const secondsUntilStep = noteSeconds - songSeconds;
            const bpm = this.scrollBpm;
            const bps = (bpm / 60); // If we support music rate we need to divide by it here
            const yOffsetTimeSpacing = secondsUntilStep * bps;
            yOffset += yOffsetTimeSpacing * this.timeSpacing;
        }
        yOffset *= ARROW_SPACING;

        // Factor in scroll speed
        let scrollSpeed = this.scrollSpeed;
        if (this.maxScrollBpm !== 0) {
            scrollSpeed = this.maxScrollBpm / (this.readBpm * 1); // If we support music rate change the 1 here
        }

        if (yOffset < 0) {
            return yOffset * scrollSpeed;
        }
        yOffset *= scrollSpeed;
        peakYOffsetOut.value *= scrollSpeed;
        return yOffset;
        // Below here was special options for mods, ignored
    }

    public static getDisplayedBeat(beat: number) {
        // binary search
        const data = ArrowEffects.displayedBeatCache;
        const max = data.length - 1;
        let l = 0;
        let r = max;
        while (l <= r) {
            const m = (l + r) / 2;
            if ((m === 0 || data[m].beat <= beat) && (m === max || beat < data[m + 1].beat)) {
                return data[m].displayedBeat + data[m].velocity * (beat - data[m].beat);
            } else if (data[m].beat <= beat) {
                l = m + 1;
            } else {
                r = m - 1;
            }
        }
        return beat;
    }
}
export default ArrowEffects;
