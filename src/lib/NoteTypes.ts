import { PlayerNumber, PLAYER_INVALID } from './PlayerNumber';

// Types for holding tap notes and scores

// tslint:disable: max-classes-per-file

export class TapNoteResult {
    // TODO: implement
}

export class HoldNoteResult {
    // TODO: implement
}

/** What is the TapNote's core type? */
export enum TapNoteType {
    Empty, 		    /** There is no note here. */
    Tap,		    /** The player simply steps on this. */
    HoldHead,	    /** This is graded like the Tap type, but should be held. */
    HoldTail,	    /** In 2sand3s mode, holds are deleted and hold_tail is added. */
    Mine,		    /** In most modes, it is suggested to not step on these mines. */
    Lift,		    /** Lift your foot up when it crosses the target area. */
    Attack,		    /** Hitting this note causes an attack to take place. */
    AutoKeysound,	/** A special sound is played when this note crosses the target area. */
    Fake,		    /** This arrow can't be scored for or against the player. */
    NUM,
    Invalid,
}

/** The list of a TapNote's sub types. */
export enum TapNoteSubType {
    Hold,   /** The start of a traditional hold note. */
    Roll,   /** The start of a roll note that must be hit repeatedly. */
    // Mine,
    NUM,
    Invalid,
}

// I'm not sure how useful this will be for a viewer - Struz
/** The different places a TapNote could come from. */
export enum TapNoteSource {
    Original,	/** This note is part of the original NoteData. */
    Addition,	/** This note is additional note added by a transform. */
    NUM,
    Invalid,
}

/** The various properties of a tap note. */
export class TapNote {
    /** Factory for non-default TapNotes */
    public static create(
        type: TapNoteType,
        subType: TapNoteSubType,
        source: TapNoteSource): TapNote {
        if (type > TapNoteType.Fake) {
            console.debug(`Invalid tap note type ${type} (most likely) due to random vanish issues.`);
            type = TapNoteType.Empty;
        }
        const tapNote = new TapNote();
        tapNote.type = type;
        tapNote.subType = subType;
        tapNote.source = source;
        return tapNote;
    }

    /** The core note type that is about to cross the target area. */
    public type: TapNoteType = TapNoteType.Empty;
    /** The sub type of the note. This is only used if the type is HoldHead. */
    public subType: TapNoteSubType = TapNoteSubType.Invalid;
    /** The originating source of the TapNote. */
    public source: TapNoteSource = TapNoteSource.Original;
    /** The result of hitting or missing the TapNote. */
    public result: TapNoteResult = new TapNoteResult();
    /** The Player that is supposed to hit this note. This is mainly for Routine Mode. */
    public pn: PlayerNumber = PLAYER_INVALID;

    // Empty until filled in by NoteData.  These exist so that the notefield
    // doesn't have to call GetElapsedTimeFromBeat 2-6 times for every note
    // during rendering. -Kyz
    public occursAtSecond: number = 0;
    public endSecond: number = 0;  // occursAtSecond plus duration
    // highestSubtypeOnRow is for rendering a tap as a hold head if
    // there is a hold head on the same row.  It needs to be a TapNoteSubType
    // instead of a bool to handle rolls. -Kyz
    public highestSubtypeOnRow: TapNoteSubType = TapNoteSubType.Hold;
    // ommitted idInChart, idInColumn, rowId - as these are for passing to mods

    // ommitted attackModifiers, attackDurationSeconds - these are for attacks

    // ommitted keySoundIndex as we don't support keysounds

    // also used for HoldHead only;
    /** The duration of the hold in note rows. */
    public duration: number = 0;
    public holdResult: HoldNoteResult = new HoldNoteResult();

    public equals(other: TapNote) {
        if (this.type !== other.type ||
            this.subType !== other.subType ||
            this.source !== other.source ||
            this.duration !== other.duration ||
            this.pn !== other.pn) {
            return false;
        }
        return true;
    }

    // This was a struct in C++ which allowed copy by assignation.
    // We deep copy here to get the same result.
    public copy(): TapNote {
        return Object.assign(Object.create(Object.getPrototypeOf(this)), this);
    }
}

/** A collection of functions that manipulate note types and data. */
export class NoteHelpers {
    public static beatToNoteRow(beatNum: number) {
        return Math.round(beatNum * ROWS_PER_BEAT);
    }
    public static beatToNoteRowNotRounded(beatNum: number) {
        return Math.trunc(beatNum * ROWS_PER_BEAT);
    }
    public static noteRowToBeat(row: number) {
        return row / ROWS_PER_BEAT;
    }

    /**
     * Scales the position.
     * @param start - the starting row of the scaling region
     * @param length - the length of the scaling region
     * @param newLength - the new length of the scaling region
     * @param position - the position to scale
     * @return the scaled position
     */
    public static scalePosition(start: number, length: number, newLength: number, position: number): number {
        if (position < start) {
            return position;
        }
        if (position >= start + length) {
            return position - length + newLength;
        }
        return start + (position - start) * newLength / length;
    }

    /**
     * Convert the NoteType to a beat representation.
     * @param nt the NoteType to check.
     * @return the proper beat.
     */
    public static noteTypeToBeat(nt: NoteType) {
        switch (nt) {
            case NoteType.N_4TH:   return 1;	    // quarter notes
            case NoteType.N_8TH:   return 1 / 2;	// eighth notes
            case NoteType.N_12TH:  return 1 / 3;	// quarter note triplets
            case NoteType.N_16TH:  return 1 / 4;	// sixteenth notes
            case NoteType.N_24TH:  return 1.0 / 6;	// eighth note triplets
            case NoteType.N_32ND:  return 1 / 8;	// thirty-second notes
            case NoteType.N_48TH:  return 1 / 12;   // sixteenth note triplets
            case NoteType.N_64TH:  return 1 / 16;   // sixty-fourth notes
            case NoteType.N_192ND: return 1 / 48;   // sixty-fourth note triplets
            case NoteType.Invalid: return 1 / 48;
            default:
                throw new Error(`Unrecognized note type: ${nt}`);
        }
    }

    public static noteTypeToRow(nt: NoteType) {
        switch (nt) {
            case NoteType.N_4TH: return 48;
            case NoteType.N_8TH: return 24;
            case NoteType.N_12TH: return 16;
            case NoteType.N_16TH: return 12;
            case NoteType.N_24TH: return 8;
            case NoteType.N_32ND: return 6;
            case NoteType.N_48TH: return 4;
            case NoteType.N_64TH: return 3;
            case NoteType.N_192ND:
            case NoteType.Invalid:
                return 1;
            default:
                throw new Error(`Unrecognized note type: ${nt}`);
        }
    }

    /**
     * Retrieve the proper quantized NoteType for the note.
     * @param row The row to check for.
     * @return the quantized NoteType.
     */
    public static getNoteType(row: number): NoteType {
        if (row % (ROWS_PER_MEASURE / 4) === 0) {
            return NoteType.N_4TH;
        } else if (row % (ROWS_PER_MEASURE / 8) === 0) {
            return NoteType.N_8TH;
        } else if (row % (ROWS_PER_MEASURE / 12) === 0) {
            return NoteType.N_12TH;
        } else if (row % (ROWS_PER_MEASURE / 16) === 0) {
            return NoteType.N_16TH;
        } else if (row % (ROWS_PER_MEASURE / 24) === 0) {
            return NoteType.N_24TH;
        } else if (row % (ROWS_PER_MEASURE / 32) === 0) {
            return NoteType.N_32ND;
        } else if (row % (ROWS_PER_MEASURE / 48) === 0) {
            return NoteType.N_48TH;
        } else if (row % (ROWS_PER_MEASURE / 64) === 0) {
            return NoteType.N_64TH;
        }
        return NoteType.N_192ND;
    }

    public static beatToNoteType(beat: number) {
        return this.getNoteType(NoteHelpers.beatToNoteRow(beat));
    }

    /**
     * Determine if the row has a particular type of quantized note.
     * @param row the row in the Steps.
     * @param t the quantized NoteType to check for.
     * @return true if the NoteType is t, false otherwise.
     */
    public static isNoteOfType(row: number, t: NoteType) {
        return this.getNoteType(row) === t;
    }
}
export default NoteHelpers;

/**
 * The number of rows per beat.
 * This is a divisor for our "fixed-point" time/beat representation. It must be
 * evenly divisible by 2, 3, and 4, to exactly represent 8th, 12th and 16th notes.
 */
export const ROWS_PER_BEAT: number = 48;

/** The max number of rows allowed for a Steps pattern. */
// tslint:disable-next-line: no-bitwise
export const MAX_NOTE_ROW: number = (1 << 30);

/** The list of quantized note types allowed at present. */
export enum NoteType {
    N_4TH,	 /** quarter note */
    N_8TH,	 /** eighth note */
    N_12TH,	 /** quarter note triplet */
    N_16TH,	 /** sixteenth note */
    N_24TH,	 /** eighth note triplet */
    N_32ND,	 /** thirty-second note */
    N_48TH,  /** sixteenth note triplet */
    N_64TH,	 /** sixty-fourth note */
    N_192ND, /** sixty-fourth note triplet */
    NUM,
    Invalid,
}

// STEPMANIA-TODO: Remove these constants that aren't time signature-aware
export const BEATS_PER_MEASURE = 4;
export const ROWS_PER_MEASURE = ROWS_PER_BEAT * BEATS_PER_MEASURE;

export class TapNotes {
    public static EMPTY = TapNote.create(
        TapNoteType.Empty, TapNoteSubType.Invalid, TapNoteSource.Original);
    public static ORIGINAL_TAP = TapNote.create(
        TapNoteType.Tap, TapNoteSubType.Invalid, TapNoteSource.Original);
    public static ORIGINAL_LIFT = TapNote.create(
        TapNoteType.Lift, TapNoteSubType.Invalid, TapNoteSource.Original);
    public static ORIGINAL_HOLD_HEAD = TapNote.create(
        TapNoteType.HoldHead, TapNoteSubType.Hold, TapNoteSource.Original);
    public static ORIGINAL_ROLL_HEAD = TapNote.create(
        TapNoteType.HoldHead, TapNoteSubType.Roll, TapNoteSource.Original);
    public static ORIGINAL_MINE = TapNote.create(
        TapNoteType.Mine, TapNoteSubType.Invalid, TapNoteSource.Original);
    public static ORIGINAL_ATTACK = TapNote.create(
        TapNoteType.Attack, TapNoteSubType.Invalid, TapNoteSource.Original);
    public static ORIGINAL_AUTO_KEYSOUND = TapNote.create(
        TapNoteType.AutoKeysound, TapNoteSubType.Invalid, TapNoteSource.Original);
    public static ORIGINAL_FAKE = TapNote.create(
        TapNoteType.Fake, TapNoteSubType.Invalid, TapNoteSource.Original);
    public static ADDITION_TAP = TapNote.create(
        TapNoteType.Tap, TapNoteSubType.Invalid, TapNoteSource.Addition);
    public static ADDITION_MINE = TapNote.create(
        TapNoteType.Mine, TapNoteSubType.Invalid, TapNoteSource.Addition);

    // The original code was in C++ so the above were structs that
    // could be copied on assign. We use these functions to get around this.
    public static newEmpty() { return this.EMPTY.copy(); }
    public static newOriginalTap() { return this.ORIGINAL_TAP.copy(); }
    public static newOriginalLift() { return this.ORIGINAL_LIFT.copy(); }
    public static newOriginalHoldHead() { return this.ORIGINAL_HOLD_HEAD.copy(); }
    public static newOriginalRollHead() { return this.ORIGINAL_ROLL_HEAD.copy(); }
    public static newOriginalMine() { return this.ORIGINAL_MINE.copy(); }
    public static newOriginalAttack() { return this.ORIGINAL_ATTACK.copy(); }
    public static newOriginalAutoKeysound() { return this.ORIGINAL_AUTO_KEYSOUND.copy(); }
    public static newOriginalFake() { return this.ORIGINAL_FAKE.copy(); }
    public static newAdditionTap() { return this.ADDITION_TAP.copy(); }
    public static newAdditionMine() { return this.ADDITION_MINE.copy(); }
}
