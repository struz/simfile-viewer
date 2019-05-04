import hrtime from 'browser-process-hrtime';

/** Seconds per microsecond. */
const TIMESTAMP_RESOLUTION = 1000000;
const NANOSECONDS_PER_MICROSECOND = 1000;

/** A way to keep track of time in a way that shouldn't overflow. */
interface PreciseTime {
    secs: number; /** Seconds */
    us: number;   /** Microseconds */
}

/** A mirror of RageTimer */
export class GameTimer {
    /** Returns the number of seconds and microseconds since init. */
    public static getTime() {
        const time = hrtime();
        const secs = time[0];
        const us = Math.trunc(time[1] / NANOSECONDS_PER_MICROSECOND);
        if (GameTimer.initTimeSecs === 0) {
            GameTimer.initTimeSecs = secs;
            GameTimer.initTimeUs = us;
        }

        let deltaSecs = secs - GameTimer.initTimeSecs;
        let deltaUs = us - GameTimer.initTimeUs;
        if (deltaUs < 0) {
            deltaUs += TIMESTAMP_RESOLUTION;
            --deltaSecs;
        }
        return { secs: deltaSecs, us: deltaUs };
    }

    private static initTimeSecs = 0;
    private static initTimeUs = 0;

    /** Adds a number of seconds to a GameTimer
     *  and returns a GameTimer that contains the added time.
     */
    private static sum(lhs: GameTimer, tm: number): GameTimer {
        /* tm == 5.25  -> secs =  5, us = 5.25  - ( 5) = .25
	     * tm == -1.25 -> secs = -2, us = -1.25 - (-2) = .75 */
        // From what I can gather, tm is a float representing seconds - Struz
        const seconds = Math.trunc(tm); // Int
        const us = Math.trunc( (tm - seconds) * TIMESTAMP_RESOLUTION ); // Int

        const ret = new GameTimer(0, 0); // Prevent unnecessarily checking the time via .touch()
        ret.secs = seconds + lhs.secs;
        ret.us = us + lhs.us;

        if (ret.us >= TIMESTAMP_RESOLUTION) {
            ret.us -= TIMESTAMP_RESOLUTION;
            ++ret.secs;
        }
        return ret;
    }
    /** The difference between two GameTimers in seconds, as a float. */
    private static difference(lhs: GameTimer, rhs: GameTimer) {
        let secs = lhs.secs - rhs.secs;
        let us = lhs.us - rhs.us;

        if (us < 0) {
            us += TIMESTAMP_RESOLUTION;
            --secs;
        }
        return secs + us / TIMESTAMP_RESOLUTION;
    }

    public secs: number;
    public us: number;

    constructor(secs?: number, us?: number) {
        // Constructor: (secs, us)
        if (secs !== undefined && us !== undefined) {
            this.secs = secs;
            this.us = us;
            return;
        }
        // Constructor: ()
        this.secs = 0;
        this.us = 0;
        this.touch();
        return;
    }

    public ago(): number {
        const now = new GameTimer();
        return now.subtract(this);
    }
    public touch(): void {
        const time = GameTimer.getTime();
        this.secs = time.secs;
        this.us = time.us;
    }
    public isZero(): boolean { return this.secs === 0 && this.us === 0; }
    public setZero() { this.secs = 0; this.us = 0; }

    /* Time between last call to GetDeltaTime() (Ago() + Touch()): */
    public getDeltaTime() {
        const now = new GameTimer();
        const diff = GameTimer.difference(now, this);
        // This is just .touch() but saves us a call to getTime()
        this.secs = now.secs;
        this.us = now.us;
        return diff;
    }
    /* (alias) */
    public peekDeltaTime() { return this.ago(); }

    /*
    * Get a timer representing half of the time ago as this one.  This is
    * useful for averaging time.  For example,
    *
    * GameTimer tm;
    * ... do stuff ...
    * GameTimer AverageTime = tm.Half();
    * printf( "Something happened approximately %f seconds ago.\n", tm.Ago() );
    */
    public half() {
        const probableDelay = this.ago() / 2;
        return this.add(probableDelay);
    }

    // TODO operators
    /** Add a number of seconds to this game timer. */
    public add(tm: number) {
        return GameTimer.sum(this, tm);
    }
    public subtract(rhs: GameTimer) {
        return GameTimer.difference(this, rhs);
    }
    public lessThan(rhs: GameTimer) {
        if (this.secs !== rhs.secs) { return this.secs < rhs.secs; }
        return this.us < rhs.us;
    }
}
export default GameTimer;

const zeroTimer = new GameTimer(0, 0);
