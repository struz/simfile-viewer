import TimingData, { DetailedTimeInfo } from './TimingData';
import { GameTimer } from './GameTimer';

// TODO: support delays and offsets?
const gVisualDelaySeconds = 0;

/** Tracks how far through the song we are.
 *  Is basically a struct rather than a class.
 */
export class SongPosition {
    public musicSeconds = 0;
    public songBeat = 0;
    public songBeatNoteOffset = 0;
    public curBps = 0;
    /** A flag to determine if we're in the middle of a freeze/stop. */
    public freeze = false;
    /** A flag to determine if we're in the middle of a delay (Pump style stop). */
    public delay = false;
    public lastBeatUpdate = new GameTimer();
    public musicSecondsVisible = 0; // Disabled because we don't support delays
    public songBeatVisible = 0;

    public reset() {
        this.musicSecondsVisible = 0;
        this.songBeatVisible = 0;

        this.musicSeconds = 0;
        // todo: move me to FOREACH_EnabledPlayer( p ) after [NUM_PLAYERS]ing
        this.songBeat = 0;
        this.songBeatNoteOffset = 0;
        this.curBps = 0;
        this.freeze = false;
        this.delay = false;
    }

    public updateSongPosition(positionSeconds: number, timing: TimingData, timestamp: GameTimer) {
        if (!timestamp.isZero()) {
            this.lastBeatUpdate = timestamp;
        } else {
            this.lastBeatUpdate.touch();
        }

        const beatInfo: DetailedTimeInfo = new DetailedTimeInfo();
        beatInfo.second = positionSeconds;
        timing.getDetailedInfoForSecond(beatInfo);
        this.songBeat = beatInfo.beat;
        this.curBps = beatInfo.bpsOut;
        this.freeze = beatInfo.freezeOut;
        this.delay = beatInfo.delayOut;

        // ASSERT_M ( this.songBeat > -2000 )

        this.musicSeconds = positionSeconds;
        this.songBeatNoteOffset = timing.getBeatFromElapsedTimeNoOffset(this.musicSecondsVisible);

        this.musicSecondsVisible = positionSeconds - gVisualDelaySeconds;
        this.songBeatVisible = timing.getBeatFromElapsedTime(this.musicSecondsVisible);
    }
}
export default SongPosition;
