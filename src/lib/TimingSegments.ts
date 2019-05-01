// Various structures to deal with segments of songs that have different timings
// tslint:disable: max-classes-per-file

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
    NUM,
    Invalid,
}

// XXX: dumb names
export enum SegmentEffectType {
    Row,		// takes effect on a single row
    Range,	    // takes effect for a definite amount of rows
    Indefinite,	// takes effect until the next segment of its type
    NUM,
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

    constructor(beatOrRow = ROW_INVALID, isRow = true) {
        // If it's a row, store it, otherwise convert it to a row
        this.startRow = (isRow ? beatOrRow : NoteHelpers.beatToNoteRow(beatOrRow));
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

/**
 * Identifies when a song needs to warp to a new beat.
 *
 * A warp segment is used to replicate the effects of Negative BPMs without
 * abusing negative BPMs. Negative BPMs should be converted to warp segments.
 * WarpAt=WarpToRelative is the format, where both are in beats.
 * (Technically they're both rows though.)
 */
export class WarpSegment extends TimingSegment {
    private lengthRows: number;

    constructor(startRow?: number, lengthRowsOrBeats?: number, isRows = true) {
        // Do a poor man's overloaded constructor *sigh*
        // constructor() is valid, constructor(row, lengthRows) is vaild,
        // and constructor(row, lengthBeats) is valid.
        // isRows defines whether lengthRowsOrBeats refers to rows or not
        if (startRow === undefined) {
            super();
            this.lengthRows = 0;
            return;
        }
        if (lengthRowsOrBeats === undefined) {
            throw new Error('invalid constructor used - must provide nothing, or both optinoal parameters');
        }
        super(startRow, true);
        if (isRows) {
            this.lengthRows = lengthRowsOrBeats;
        } else {
            this.lengthRows = NoteHelpers.beatToNoteRow(lengthRowsOrBeats);
        }
    }

    public getType() { return TimingSegmentType.WARP; }
    public getEffectType() { return SegmentEffectType.Range; }

    public isNotable() { return this.lengthRows > 0; }

    public getLengthRows() { return this.lengthRows; }
    public getLengthBeats() { return NoteHelpers.noteRowToBeat(this.lengthRows); }
    public getLength() { return this.getLengthBeats(); }

    public setLengthRows(rows: number) { this.lengthRows = rows; }
    public setLengthBeats(beats: number) { this.lengthRows = NoteHelpers.beatToNoteRow(beats); }

    public scale(start: number, length: number, newLength: number) {
        // XXX: this function is duplicated, there should be a better way
        const startBeat    = this.getBeat();
        const endBeat      = startBeat + this.getLength();
        const newStartBeat = NoteHelpers.scalePosition(
            NoteHelpers.noteRowToBeat(start),
            NoteHelpers.noteRowToBeat(length),
            NoteHelpers.noteRowToBeat(newLength),
            startBeat);
        const newEndBeat   = NoteHelpers.scalePosition(
            NoteHelpers.noteRowToBeat(start),
            NoteHelpers.noteRowToBeat(length),
            NoteHelpers.noteRowToBeat(newLength),
            endBeat);
        this.setLengthBeats(newEndBeat - newStartBeat);
        super.scale(start, length, newLength);
    }

    public debugPrint() {
        const type = this.getType();
        const row = this.getRow();
        const beat = this.getBeat();
        const lengthRows = this.getLengthRows();
        const lengthBeats = this.getLengthBeats();
        console.debug(`\t${type}(${row} [${beat}], ${lengthRows} [${lengthBeats}])`);
    }
    public toString(dec: number) {
        const beat = this.getBeat().toFixed(dec);
        const length = this.getLength();
        return `${beat}=${length}`;
    }

    public getValues(): number[] {
        return [this.getLength()];
    }

    public equals(other: TimingSegment): boolean {
        if (this.getType() !== other.getType()) {
            return false;
        }

        if (!(other instanceof WarpSegment)) {
            return false;
        }
        // If they differ in length, return false
        if (!TimingSegment.compareFloat(this.lengthRows, other.lengthRows)) {
            return false;
        }
        return true;
    }
}

/**
 * Identifies when a chart is to have a different tickcount value
 * for hold notes.
 *
 * A tickcount segment is used to better replicate the checkpoint hold
 * system used by various based video games. The number is used to
 * represent how many ticks can be counted in one beat.
 */
export class TickcountSegment extends TimingSegment {
    /** The default amount of ticks per beat. */
    public static DEFAULT_TICK_COUNT = 4;

    /** The amount of hold checkpoints counted per beat */
    private ticksPerBeat: number;

    constructor(startRow = ROW_INVALID, ticks = TickcountSegment.DEFAULT_TICK_COUNT) {
        super(startRow, true);
        this.ticksPerBeat = ticks;
    }

    public getType() { return TimingSegmentType.TICKCOUNT; }
    public getEffectType() { return SegmentEffectType.Indefinite; }
    public isNotable() { return true; } // indefinite segments are always true

    public getTicks() { return this.ticksPerBeat; }
    public setTicks(ticks: number) { this.ticksPerBeat = ticks; }

    public debugPrint() {
        const type = this.getType();
        const row = this.getRow();
        const beat = this.getBeat();
        const ticks = this.getTicks();
        console.debug(`\t${type}(${row} [${beat}], ${ticks})`);
    }
    public toString(dec: number) {
        const beat = this.getBeat().toFixed(dec);
        const ticks = this.getTicks();
        return `${beat}=${ticks}`;
    }

    public getValues(): number[] {
        return [this.getTicks()];
    }

    public equals(other: TimingSegment): boolean {
        if (this.getType() !== other.getType()) {
            return false;
        }

        if (!(other instanceof TickcountSegment)) {
            return false;
        }
        // If they differ in tick count, return false
        if (!TimingSegment.compareFloat(this.ticksPerBeat, other.ticksPerBeat)) {
            return false;
        }
        return true;
    }
}

/**
 * Identifies when a song changes its time signature.
 *
 * This only supports simple time signatures. The upper number
 * (called the numerator here, though this isn't properly a
 * fraction) is the number of beats per measure. The lower number
 * (denominator here) is the note value representing one beat.
 */
export class TimeSignatureSegment extends TimingSegment {
    private numerator: number;
    private denominator: number;

    constructor(startRow = ROW_INVALID, numerator = 4, denominator = 4) {
        super(startRow, true);
        this.numerator = numerator;
        this.denominator = denominator;
    }

    public getType() { return TimingSegmentType.TIME_SIG; }
    public getEffectType() { return SegmentEffectType.Indefinite; }
    public isNotable() { return true; } // indefinite segments are always true

    public getNum() { return this.numerator; }
    public setNum(num: number) { this.numerator = num; }

    public getDen() { return this.denominator; }
    public setDen(den: number) { this.denominator = den; }

    public set(num: number, den: number) { this.numerator = num; this.denominator = den; }

    /**
     * Retrieve the number of note rows per measure within the TimeSignatureSegment.
     *
     * With BeatToNoteRow(1) rows per beat, then we should have BeatToNoteRow(1)*m_iNumerator
     * beats per measure. But if we assume that every BeatToNoteRow(1) rows is a quarter note,
     * and we want the beats to be 1/m_iDenominator notes, then we should have
     * BeatToNoteRow(1)*4 is rows per whole note and thus BeatToNoteRow(1)*4/m_iDenominator is
     * rows per beat. Multiplying by m_iNumerator gives rows per measure.
     * @returns the number of note rows per measure.
     */
    public getNoteRowsPerMeasure() {
        return NoteHelpers.beatToNoteRow(1) * 4 * this.numerator / this.denominator;
    }

    public debugPrint() {
        const type = this.getType();
        const row = this.getRow();
        const beat = this.getBeat();
        const num = this.getNum();
        const den = this.getDen();
        console.debug(`\t${type}(${row} [${beat}], ${num}/${den})`);
    }
    public toString(dec: number) {
        const beat = this.getBeat().toFixed(dec);
        const num = this.getNum();
        const den = this.getDen();
        return `${beat}=${num}=${den}`;
    }

    public getValues(): number[] {
        return [this.getNum(), this.getDen()];
    }

    public equals(other: TimingSegment): boolean {
        if (this.getType() !== other.getType()) {
            return false;
        }

        if (!(other instanceof TimeSignatureSegment)) {
            return false;
        }
        // If they differ in either numerator or denominator, return false
        if (!TimingSegment.compareFloat(this.numerator, other.numerator)) {
            return false;
        }
        if (!TimingSegment.compareFloat(this.denominator, other.denominator)) {
            return false;
        }
        return true;
    }
}

/**
 * Identifies when a song changes its BPM.
 */
export class BPMSegment extends TimingSegment {
    /** The number of beats per second within this BPMSegment. */
    private bps: number = 0;

    constructor(startRow = ROW_INVALID, bpm = 0.0) {
        super(startRow, true);
        this.setBpm(bpm);
    }

    public getType() { return TimingSegmentType.BPM; }
    public getEffectType() { return SegmentEffectType.Indefinite; }
    public isNotable() { return true; } // indefinite segments are always true

    public getBps() { return this.bps; }
    public getBpm() { return this.bps * 60.0; }

    public setBps(bps: number) { this.bps = bps; }
    public setBpm(bpm: number) { this.bps = bpm / 60.0; }

    public debugPrint() {
        const type = this.getType();
        const row = this.getRow();
        const beat = this.getBeat();
        const bpm = this.getBpm();
        console.debug(`\t${type}(${row} [${beat}], ${bpm})`);
    }

    public toString(dec: number) {
        const beat = this.getBeat().toFixed(dec);
        const bpm = this.getBpm().toFixed(dec);
        return `${beat}=${bpm}`;
    }

    public getValues(): number[] {
        return [this.getBpm()];
    }

    public equals(other: TimingSegment): boolean {
        if (this.getType() !== other.getType()) {
            return false;
        }

        if (!(other instanceof BPMSegment)) {
            return false;
        }
        // If they differ in bps, return false
        if (!TimingSegment.compareFloat(this.bps, other.bps)) {
            return false;
        }
        return true;
    }
}

/**
 * Identifies when a song has a stop, DDR/ITG style.
 */
export class StopSegment extends TimingSegment {
    /** The number of seconds to pause at the segment's row. */
    private seconds: number;

    constructor(startRow = ROW_INVALID, seconds = 0.0) {
        super(startRow, true);
        this.seconds = seconds;
    }

    public getType() { return TimingSegmentType.STOP; }
    public getEffectType() { return SegmentEffectType.Row; }
    public isNotable() { return this.seconds > 0; } // indefinite segments are always true

    public getPause() { return this.seconds; }
    public setPause(seconds: number) { this.seconds = seconds; }

    public debugPrint() {
        const type = this.getType();
        const row = this.getRow();
        const beat = this.getBeat();
        const pause = this.getPause();
        console.debug(`\t${type}(${row} [${beat}], ${pause})`);
    }
    public toString(dec: number) {
        const beat = this.getBeat().toFixed(dec);
        const pause = this.getPause();
        return `${beat}=${pause}`;
    }

    public getValues(): number[] {
        return [this.getPause()];
    }

    public equals(other: TimingSegment): boolean {
        if (this.getType() !== other.getType()) {
            return false;
        }

        if (!(other instanceof StopSegment)) {
            return false;
        }
        return TimingSegment.compareFloat(this.seconds, other.seconds);
    }
}

/**
 * Identifies when a song has a delay, or pump style stop.
 */
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
        const type = this.getType();
        const row = this.getRow();
        const beat = this.getBeat();
        const pause = this.getPause();
        console.debug(`\t${type}(${row} [${beat}], ${pause})`);
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
