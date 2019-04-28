// Types for holding tap notes and scores

/**
 * The number of rows per beat.
 * This is a divisor for our "fixed-point" time/beat representation. It must be
 * evenly divisible by 2, 3, and 4, to exactly represent 8th, 12th and 16th notes.
 */
const ROWS_PER_BEAT: number = 48;

/** The max number of rows allowed for a Steps pattern. */
// tslint:disable-next-line: no-bitwise
const MAX_NOTE_ROW: number = (1 << 30);

/** The list of quantized note types allowed at present. */
enum NoteType {
    NOTE_TYPE_4TH,	 /** quarter note */
    NOTE_TYPE_8TH,	 /** eighth note */
    NOTE_TYPE_12TH,	 /** quarter note triplet */
    NOTE_TYPE_16TH,	 /** sixteenth note */
    NOTE_TYPE_24TH,	 /** eighth note triplet */
    NOTE_TYPE_32ND,	 /** thirty-second note */
    NOTE_TYPE_48TH,  /** sixteenth note triplet */
    NOTE_TYPE_64TH,	 /** sixty-fourth note */
    NOTE_TYPE_192ND, /** sixty-fourth note triplet */
    NUM_NoteType,
    NoteType_Invalid,
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
