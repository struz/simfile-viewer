// Various structures to deal with segments of songs that have different timings
// tslint:disable: max-classes-per-file
// tslint:disable: no-console

import NoteHelpers from './NoteTypes';

export enum TimingSegmentType {
    BPM,
    STOP,
    DELAY,
    TIME_SIG,
    WARP,
    LABEL,
    TICKCOUNT,
    COMBO,
    SPEED,
    SCROLL,
    FAKE,
    NUM_TimingSegmentType,
    Invalid,
}

// XXX: dumb names
export enum SegmentEffectType {
    Row,		// takes effect on a single row
    Range,	    // takes effect for a definite amount of rows
    Indefinite,	// takes effect until the next segment of its type
    NUM_SegmentEffectType,
    Invalid,
}

export const ROW_INVALID = -1;

export abstract class TimingSegment {
    // for our purposes, two floats within this level of error are equal
    public static EPSILON: number = 1e-6;

    /** Compare two numbers for equality.
     * @param num1 A number.
     * @param num2 Another number.
     * @returns true if they are close enough to be equal, false otherwise.
     */
    public static compareFloat(num1: number, num2: number) {
        if (Math.abs(num1 - num2) > this.EPSILON) {
            return false;
        }
        return true;
    }

    /** The row in which this segment activates */
    private startRow: number = 0;

    constructor(beatOrRow: number, isRow: boolean) {
        // If it's a row, store it, otherwise convert it to a row
        this.startRow = (isRow ? beatOrRow : NoteHelpers.beatToNoteRow(beatOrRow))
    }

    public abstract getType(): TimingSegmentType;
    public abstract getEffectType(): SegmentEffectType;
    public abstract isNotable(): boolean;
    public abstract debugPrint(): void;

    /**
     * Scales itself.
     * @param start Starting row
     * @param length Length in rows
     * @param newLength The new length in rows
     */
    public scale(start: number, length: number, newLength: number): void {
        this.setRow(NoteHelpers.scalePosition(start, length, newLength, this.getRow()));
    }

    public getRow() { return this.startRow; }
    public setRow(row: number) { this.startRow = row; }

    public getBeat() { return NoteHelpers.noteRowToBeat(this.startRow); }
    public setBeat(beat: number) { this.setRow(NoteHelpers.beatToNoteRow(beat)); }

    public toString(dec: number) { return this.getBeat().toString(); }
    public abstract getValues(): number[];

    public lessThan(other: TimingSegment) {
        return this.getRow() < other.getRow();
    }

    // overloads should not call this base version; derived classes
    // should only compare contents, and this compares position.
    public equals(other: TimingSegment): boolean {
        return this.getRow() === other.getRow();
    }
}

export class DelaySegment extends TimingSegment {
    /** The number of seconds to pause at the segment's row. */
    private seconds: number = -1;

    constructor(startRow = ROW_INVALID, seconds = 0) {
        super(startRow, true);
        this.seconds = seconds;
    }

    public getType() { return TimingSegmentType.DELAY; }
    public getEffectType() { return SegmentEffectType.Row; }

    public getPause() { return this.seconds; }
    public setPause(seconds: number) { this.seconds = seconds; }

    public isNotable() { return this.seconds > 0; }
    public getValues() { return [this.getPause()]; }
    public debugPrint() {
        console.debug(`\t${this.getType()}(${this.getRow()} [${this.getBeat()}], ${this.getPause()})`);
    }
    public toString(dec: number) {
        const beat = this.getBeat().toFixed(dec);
        const pause = this.getPause().toFixed(dec);
        return `${beat}=${pause}`;
    }

    public equals(other: TimingSegment): boolean {
        if (this.getType() !== other.getType()) {
            return false;
        }

        if (!(other instanceof DelaySegment)) {
            return false;
        }
        return TimingSegment.compareFloat(this.seconds, other.seconds);
    }
}
