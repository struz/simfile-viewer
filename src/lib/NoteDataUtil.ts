import NoteData from './NoteData';
import { PLAYER_INVALID, PlayerNumber } from './PlayerNumber';
import NoteHelpers, { TapNote, TapNotes, MAX_NOTE_ROW, TapNoteType, BEATS_PER_MEASURE } from './NoteTypes';

/**
 * Utility functions that deal with NoteData.
 *
 * Things should go in here if they can be (cleanly and efficiently)
 * implemented using only NoteData's primitives; this improves abstraction
 * and makes it much easier to change NoteData internally in the future.
 */
export class NoteDataUtil {
// tslint:disable-next-line: variable-name
    public static loadFromSmNoteDataString(out: NoteData, smNoteData_: string): void {
        // Load note data
        let smNoteData: string = '';
        let indexCommentStart = 0;
        let indexCommentEnd = 0;
        let index = 0;

        // Remove comments from the passed in note data
// tslint:disable-next-line: no-conditional-assignment
        while ( (indexCommentStart = smNoteData_.indexOf('//', indexCommentEnd)) !== -1 ) {
            // Append the data in between the last comment and this comment
            smNoteData += smNoteData_.substr(index, indexCommentStart - indexCommentEnd);
            index += indexCommentStart - indexCommentEnd;
            // Move forward to the end of the comment
            indexCommentEnd = smNoteData_.indexOf('\n', indexCommentStart);
            indexCommentEnd = (indexCommentEnd === -1 ? smNoteData_.length : indexCommentEnd + 1);
            index += indexCommentEnd - indexCommentStart;
        }
        smNoteData += smNoteData_.substr(index, smNoteData_.length - indexCommentEnd);

        // Clear notes, but keep the same number of tracks.
        const numTracks = out.getNumTracks();
        out.clearAll();
        out.setNumTracks(numTracks);

        // We don't support composite yet so ignore composite logic - Struz
        this.loadFromSmNoteDataStringWithPlayer(out, smNoteData, PLAYER_INVALID, numTracks);
    }

    public static loadFromSmNoteDataStringWithPlayer(
        out: NoteData, smNoteData: string, pn: PlayerNumber, numTracks: number): void {
        // The code in StepMania is very careful about allocations when doing this,
        // probably because they're dealing with entire full libraries of charts.
        // We do one at a time, we don't care. - Struz

        // General algorithm is:
        // Split notedata on ',' to get measures
        // Split each measure on '\n' to get rows (still as lists of char)
        //    Seems to be logic to end the line when encountering \n \r \t and ' '
        //    Ignore empty lines - ones that have only those characters
        // For each line in a measure parse the characters into the data structures

        // Then cleanup by ensuring no leftover hold notes

        const emptyFilter = (x: string) => {
            return x.length !== 0;
        };
        // Split the song into measures and filter out any empty entries
        const measures = smNoteData.split(',')
            .map((x) => x.trim())
            .filter(emptyFilter);
        for (let measureIndex = 0; measureIndex < measures.length; measureIndex++) {
            const measure = measures[measureIndex];

            // Split the measure into lines, trim them all, and remove any empty entries
            // This emulates the StepMania "find whitespace start & end and line is between that" logic
            const measureLines = measure.split('\n')
                .map((x) => x.trim())
                .filter(emptyFilter);
            for (let lineIndex = 0; lineIndex < measureLines.length; lineIndex++) {
                const line = measureLines[lineIndex];

                // Some calculations for placing data
                const percentIntoMeasure = lineIndex / measureLines.length;
                const beat = (measureIndex + percentIntoMeasure) * BEATS_PER_MEASURE;
                const noteRow = NoteHelpers.beatToNoteRow(beat);

                // Now for the fun stuff
                for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
                    const noteChar = line.charAt(trackIndex);
                    const tn = this.parseTapNoteData(noteChar, out, trackIndex, noteRow);

                    // Optimization: if we pass TAP_EMPTY, NoteData will do a search
                    // to remove anything in this position.  We know that there's nothing
                    // there, so avoid the search.
                    if (tn.type !== TapNoteType.Empty && noteChar !== '3') {
                        tn.pn = pn;
                        out.setTapNote(trackIndex, noteRow, tn);
                    }
                }
            }
        }

        // Make sure we don't have any hold notes that didn't find a tail.
        for (let t = 0; t < out.getNumTracks(); t++) {
            // TODO: create a class-standard way of iterating through tracks
            // preferably keeping the track variable private.
            const track = out.tapNotes[t];
            for (const [row, tn] of track) {
                if (tn.type === TapNoteType.HoldHead && tn.duration === MAX_NOTE_ROW) {
                    const beat = NoteHelpers.noteRowToBeat(row);
                    console.log(`While loading .sm/.ssc note data, there was an unmatched 2 at beat ${beat}`);
                    out.removeTapNote(t, row);
                }
            }
        }
        // We don't use Advanced Type Iterators so we don't need to revalidate ATIs
    }

    /** Parse a single character into a TapNote.
     * @param noteChar the text character defining the qualities of the note.
     * @param nd the NoteData to parse the note into. This is required for finding hold starts.
     * @param track the track that we're parsing.
     * @param noteRow the note row this note is on.
     * @returns A new TapNote.
     */
    public static parseTapNoteData(noteChar: string,
                                   nd: NoteData,
                                   track: number,
                                   noteRow: number): TapNote {
        let tn: TapNote = TapNotes.newEmpty();

        switch (noteChar) {
            case '0': tn = TapNotes.newEmpty(); break;
            case '1': tn = TapNotes.newOriginalTap(); break;
            case '2':
            case '4':
                tn = (noteChar === '2') ? TapNotes.newOriginalHoldHead() : TapNotes.newOriginalRollHead();
                // Set the hold note to have infinite length; We'll clamp it
                // when we hit the tail.
                tn.duration = MAX_NOTE_ROW;
                break;
            case '3':
                // This is the end of a hold, search for the beginning
                const headRow = {value: 0};
                if (!nd.isHoldNoteAtRow(track, noteRow, headRow)) {
                    console.warn(`Unmatched 3 in track=${track} for noteRow=${noteRow}`);
                } else {
                    const holdNote = nd.findTapNote(track, headRow.value);
                    if (holdNote === undefined) {
                        throw new Error(`holdNote should never be undefined: ${track}, ${headRow.value}`);
                    }
                    holdNote.duration = noteRow - headRow.value;
                }
                // This won't write tn, but keep parsing normally anyway.
                break;
            case 'M': tn = TapNotes.newOriginalMine(); break;
            case 'K': tn = TapNotes.newOriginalAutoKeysound(); break;
            case 'L': tn = TapNotes.newOriginalLift(); break;
            case 'F': tn = TapNotes.newOriginalFake(); break;
            default:
                // Invalid data
                tn = TapNotes.newEmpty();
                break;
        }

        // Some optional checks for keysounds stuff. We don't support that yet - Struz
        return tn;
    }
}
export default NoteDataUtil;
