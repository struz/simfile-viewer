// tslint:disable: max-line-length

import { expect } from 'chai';
import NoteData from '@/lib/NoteData';
import { TapNote, TapNoteType } from '@/lib/NoteTypes';

describe('NoteData', () => {
    const nd = new NoteData();
    nd.setNumTracks(4);

    const generateTapNote = () => {
        const tn = new TapNote();
        tn.type = TapNoteType.Tap;
        return tn;
    };

    // Set up tracks
    const expectedTracks: Array<Array<[number, TapNote]>> = [
        [
            [25, generateTapNote()],
            [72, generateTapNote()],
            [99, generateTapNote()],
            [223, generateTapNote()],
        ],
        [
            [25, generateTapNote()],
            [74, generateTapNote()],
            [99, generateTapNote()],
            [821, generateTapNote()],
            [850, generateTapNote()],
            [1010, generateTapNote()],
            [1011, generateTapNote()],
            [1543, generateTapNote()],
        ],
    ];
    for (let i = 0; i < expectedTracks.length; i++) {
        expectedTracks[i].forEach((value) => {
            nd.tapNotes[i].set(value[0], value[1]);
        });
    }

    it('loops through one track of note data properly', () => {
        // Mirrors FOREACH_NONEMPTY_ROW_IN_TRACK
        const track = 0;
        let i = 0;
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
            i++;
        }
    });

    it('loops through multiple tracks of note data properly', () => {
        // This one is an interesting function. It gets the next non empty tap note row,
        // but we still have to iterate through the rows to get the tap note(s). This could
        // probably be optimised - Struz
        // Mirrors FOREACH_NONEMPTY_ROW_ALL_TRACKS
        for (const row = {value: -1}; nd.getNextTapNoteRowForAllTracks(row); row.value++) {
            // This row isn't empty so find the non-empty tap note(s)
            for (let track = 0; track < nd.getNumTracks(); track++) {
                const tn = nd.getTapNote(track, row.value);
                if (tn.type !== TapNoteType.Empty) {
                    // We found a non-empty tap note! Check it matches the expected value.
                    const expected = expectedTracks[track].find((value) => value[0] === row.value);
                    if (expected !== undefined) {
                        expect(expected[0]).to.equal(row.value);
                        expect(expected[1]).to.equal(tn);
                    }
                }
            }
        }
    });
});
