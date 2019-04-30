// Types for holding tap notes and scores

// tslint:disable: max-classes-per-file

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
    // IMPORTANT: finish me
}

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
        if (position < start ) {
            return position;
        }
        if (position >= start + length ) {
            return position - length + newLength;
        }
        return start + (position - start) * newLength / length;
    }
}
export default NoteHelpers;

