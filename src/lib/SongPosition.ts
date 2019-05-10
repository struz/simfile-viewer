import TimingData, { GetBeatArgs } from './TimingData';
import { GameTimer } from './GameTimer';
import { ASSERT } from './Debug';

// TODO: support delays and offsets?
const gVisualDelaySeconds = 0;

/** Tracks how far through the song we are.
 *  Is basically a struct rather than a class.
 */
export class SongPosition {
    public musicSeconds = 0;
    public songBeat = 0;
    public songBeatNoOffset = 0;
    public curBps = 0;
    /** A flag to determine if we're in the middle of a freeze/stop. */
    public freeze = false;
    /** A flag to determine if we're in the middle of a delay (Pump style stop). */
    public delay = false;
    /** The row used to start a warp. */
    public warpBeginRow = 0;
    /** The beat to warp to afterwards. */
    public warpDestination = 0;
    public lastBeatUpdate = new GameTimer(); // time of last this.songBeat etc. update
    public musicSecondsVisible = -1;
    public songBeatVisible = -1;

    public reset() {
        this.musicSecondsVisible = 0;
        this.songBeatVisible = 0;

        this.musicSeconds = 0;
        // todo: move me to FOREACH_EnabledPlayer( p ) after [NUM_PLAYERS]ing
        this.songBeat = 0;
        this.songBeatNoOffset = 0;
        this.curBps = 0;
        this.freeze = false;
        this.delay = false;
        this.warpBeginRow = -1; // Set to -1 because some song may want to warp to row 0. -aj
        this.warpDestination = -1; // Set when a warp is encountered. also see above. -aj
    }

    public updateSongPosition(positionSeconds: number, timing: TimingData, timestamp: GameTimer) {
        if (!timestamp.isZero()) {
            this.lastBeatUpdate = timestamp;
        } else {
            this.lastBeatUpdate.touch();
        }

        const beatInfo = new GetBeatArgs();
        beatInfo.elapsedTime = positionSeconds;
        timing.getBeatAndBpsFromElapsedTime(beatInfo);
        this.songBeat = beatInfo.beat;
        this.curBps = beatInfo.bpsOut;
        this.freeze = beatInfo.freezeOut;
        this.delay = beatInfo.delayOut;
        this.warpBeginRow = beatInfo.warpBeginOut;
        this.warpDestination = beatInfo.warpDestOut;

        ASSERT(this.songBeat > -2000, `Song beat ${this.songBeat} at ${positionSeconds} is less than -2000`);

        this.musicSeconds = positionSeconds;
        // ignore light beat - we don't support lights -Struz
        this.songBeatNoOffset = timing.getBeatFromElapsedTimeNoOffset(this.musicSecondsVisible);

        // we don't support visual delay yet, clone the values -Struz
        this.musicSecondsVisible = this.musicSeconds;
        this.songBeatVisible = this.songBeat;
    }
}
export default SongPosition;
