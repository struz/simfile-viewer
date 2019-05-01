import { TapNote, TapNoteSubType, TapNotes } from './NoteTypes';
import TimingData from './TimingData';
import { TapNoteType } from './NoteTypes';
import { NotImplementedError } from './Error';
import { DEBUG_ASSERT } from './Debug';

// NoteData is organized by:
//   track - corresponds to different columns of notes on the screen
//   row/index - corresponds to subdivisions of beats

// I'm not sure why tey use a map instead of an array here - Struz
type TrackMap = Map<number, TapNote>;

/** Holds data about the notes that the player is supposed to hit. */
export class NoteData {
    // IMPORTANT: this is one hell of a class.....needs doing asap!
    // We need all track iterators and shit, it's wild

    // There's no point in inserting empty notes into the map.
    // Any blank space in the map is defined to be empty.
    public tapNotes: TrackMap[] = []; // TODO: make this private once we have a standard way of iterating over it
    public loaded: boolean = false;

    public setOccurranceTimeForAllTaps(timingData: TimingData) { throw new NotImplementedError(); }
    public countNotesInColumn(
        timingData: TimingData,
        noteCounts: Array<Map<TapNoteType, number>>,
        holdDurations: Array<Map<TapNoteSubType, number>>) { throw new NotImplementedError(); }

    public getNumTracks() { return this.tapNotes.length; }
    public setNumTracks(newNumTracks: number) {
        this.tapNotes.length = newNumTracks;
        for (let i = 0; i < newNumTracks; i++) {
            // If we extended it then make sure we create the new maps)
            this.tapNotes[i] = (this.tapNotes[i] === undefined ? new Map<number, TapNote>() : this.tapNotes[i]);
        }
    }
    public isComposite() { throw new NotImplementedError(); }
    public equals(other: NoteData) { return this.tapNotes === other.tapNotes; }

    public getTapNote(track: number, row: number): TapNote {
        const trackMap = this.tapNotes[track];
        const noteRow = trackMap.get(row);
        return (noteRow === undefined) ? TapNotes.EMPTY : noteRow;
    }

    public findTapNote(track: number, row: number) { throw new NotImplementedError(); }
    public removeTapNote(track: number, row: number) { this.tapNotes[track].delete(row); }

    // I wonder if we'll need this - Struz
    /**
     * Return an iterator range for [rowBegin,rowEnd).
     *
     * This can be used to efficiently iterate trackwise over a range of notes.
     * It's like FOREACH_NONEMPTY_ROW_IN_TRACK_RANGE, except it only requires
     * two map searches (iterating is constant time), but the iterators will
     * become invalid if the notes they represent disappear, so you need to
     * pay attention to how you modify the data.
     * @param iTrack the column to use.
     * @param iStartRow the starting point.
     * @param iEndRow the ending point.
     * @param begin the eventual beginning point of the range.
     * @param end the eventual end point of the range.
     */
    public getTapNoteRange(track: number, startRow: number, endRow: number,
                           iterator: undefined, constIterator: undefined) { throw new NotImplementedError(); }
    // Omitted overloaded getTapNoteRange()

    // Omitted all the iterator funcs - need to work out how I'll handle this

    public getTapNoteRangeInclusive() { throw new NotImplementedError(); }
    // Omitted overloaded getTapNoteRangeInclusive()

    public getTapNoteRangeExclusive() { throw new NotImplementedError(); }
    // Omitted overloaded getTapNoteRangeExclusive()

    /* Returns the row of the first TapNote on the track that has a row greater than rowInOut. */
    public getNextTapNoteRowForTrack(track: number) { throw new NotImplementedError(); }
    public getNextTapNoteRowForAllTracks() { throw new NotImplementedError(); }
    public getPrevTapNoteRowForTrack(track: number) { throw new NotImplementedError(); }
    public getPrevTapNoteRowForAllTracks() { throw new NotImplementedError(); }

    public moveTapNoteTrack(dest: number, src: number) { throw new NotImplementedError(); }
    public setTapNote(track: number, row: number, tn: TapNote) {
        DEBUG_ASSERT(track >= 0 && track < this.getNumTracks());

        if (row < 0) {
            return;
        }
        // There's no point in inserting empty notes into the map.
        // Any blank space in the map is defined to be empty.
        // If we're trying to insert an empty at a spot where another note
        // already exists, then we're really deleting from the map.
        if (tn === TapNotes.EMPTY) {
            const trackMap = this.tapNotes[track];
            // remove the element at this position (if any).
            // This will return either true or false.
            trackMap.delete(row);
        } else {
            this.tapNotes[track].set(row, tn);
        }
    }
    /**
     * @brief Add a hold note, merging other overlapping holds and destroying
     * tap notes underneath.
     * @param iTrack the column to work with.
     * @param iStartRow the starting row.
     * @param iEndRow the ending row.
     * @param tn the tap note.
     */
    public addHoldNote(track: number, startRow: number, endRow: number, tn: TapNote) {
        throw new NotImplementedError();
    }

    public clearRangeForTrack(rowBegin: number, rowEnd: number, track: number) { return new NotImplementedError(); }
    public clearRange(rowBegin: number, rowEnd: number) { return new NotImplementedError(); }
    public clearAll() {
        for (const track of this.tapNotes) {
            track.clear();
        }
    }
    public copyRange() { return new NotImplementedError(); }
    public copyAll() { return new NotImplementedError(); }

    public isRowEmpty(row: number) { return new NotImplementedError(); }
    // TODO: finish me off sometime from NoteData.h
}
export default NoteData;
