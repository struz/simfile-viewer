import { TapNote } from './NoteTypes';

/*
 * NoteData is organized by:
 *  track - corresponds to different columns of notes on the screen
 *  row/index - corresponds to subdivisions of beats
 */

type TrackMap = Map<number, TapNote>;

/** Holds data about the notes that the player is supposed to hit. */
export class NoteData {
    // IMPORTANT: this is one hell of a class.....needs doing asap!
    // We need all track iterators and shit, it's wild

    // There's no point in inserting empty notes into the map.
    // Any blank space in the map is defined to be empty.
    private tapNotes: TrackMap[];

    constructor(noteData: string) {
        // TODO: do stuff
        this.tapNotes = [];
    }
}
export default NoteData;
