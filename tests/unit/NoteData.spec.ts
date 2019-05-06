// tslint:disable: max-line-length

import { expect } from 'chai';
import NoteData from '@/lib/NoteData';
import { TapNote, TapNoteType } from '@/lib/NoteTypes';

describe('NoteData', () => {
    const generateTapNote = () => {
        const tn = new TapNote();
        tn.type = TapNoteType.Tap;
        return tn;
    };
    const expectedTracks: Array<Array<[number, TapNote]>> = [
        [
            [25, generateTapNote()],
            [74, generateTapNote()],
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
        [
            [32, generateTapNote()],
            [74, generateTapNote()],
            [200, generateTapNote()],
            [223, generateTapNote()],
            [1953, generateTapNote()],
        ],
        [
            [74, generateTapNote()],
            [1500, generateTapNote()],
        ],
    ];
    let nd = new NoteData();

    beforeEach('set up NoteData', () => {
        nd = new NoteData();

        // Set up tracks to match expected
        nd.setNumTracks(expectedTracks.length);
        for (let i = 0; i < expectedTracks.length; i++) {
            expectedTracks[i].forEach((value) => {
                nd.tapNotes[i].set(value[0], value[1]);
            });
        }
    });

    it('loops through one track of note data', () => {
        // Mirrors FOREACH_NONEMPTY_ROW_IN_TRACK
        const track = 0;
        let i = 0;
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
            i++;
        }
    });

    it('loops through multiple tracks of note data', () => {
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

    it('allows changing data while iterating', () => {
        // IMPORTANT: this is probably going to die because insertion order + map switching
        // need to come up with a nicer way to handle this so we don't just iterate past the
        // end of the map. This requires a lot of careful thought about the use case.
        // If I choose a particularly different data structure / layout then I can just hide it
        // via the public functions anyway.

        // The main things we're looking for in this test are that inserting data into the
        // track during iteration doesn't:
        // - cause us to iterate beyond the end of the map, into new elements (since map is iterate via insertion order)
        // - cause us to get the wrong values during the iteration
        // We also want to test the same with DELETION

        // TODO: test case where we're inserting a NEW note and not changing a note.
        // That one will probably cause iteration beyond the end.
        // TODO: update the TrackMap class so that if we're inserting at an already present
        // value, then we don't sort.
        // TODO: change to use nd rather than noteData

        const newTapNote = generateTapNote();
        const track = 0;
        let i = 0;
        // Loop through the track, verify the data, and change the TapNote at index 1
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            // Expect that we don't head past the end
            expect(i).to.be.lessThan(expectedTracks[track].length);
            expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
            if (i === 1) {
                newTapNote.type = TapNoteType.Mine;
                nd.setTapNote(track, row.value, newTapNote);
                expect(nd.getTapNote(track, row.value)).to.equal(newTapNote);
            }
            i++;
        }

        // Loop through again and check for the changed TapNote
        i = 0;
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            if (i === 1) {
                expect(nd.getTapNote(track, row.value)).to.equal(newTapNote);
            } else {
                expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
            }
            i++;
        }
    });
});
