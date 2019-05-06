// tslint:disable: max-line-length

import { expect } from 'chai';
import NoteData, { FOREACH_NONEMPTY_ROW_IN_TRACK, FOREACH_NONEMPTY_ROW_ALL_TRACKS } from '@/lib/NoteData';
import { TapNote, TapNoteType } from '@/lib/NoteTypes';
import { PassByRef } from '@/lib/GameConstantsAndTypes';

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
        let i = 0;
        const track = 0;
        const testFn = (row: PassByRef<number>) => {
            expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
            i++;
        };

        // Mirrors FOREACH_NONEMPTY_ROW_IN_TRACK
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            testFn(row);
        }

        // Tests FOREACH_NONEMPTY_ROW_IN_TRACK
        const outerRow = {value: 0};
        i = 0;
        FOREACH_NONEMPTY_ROW_IN_TRACK(testFn, nd, track, outerRow);
        expect(outerRow.value).to.not.equal(0);
    });

    it('loops through multiple tracks of note data', () => {
        // This one is an interesting function. It gets the next non empty tap note row,
        // but we still have to iterate through the rows to get the tap note(s). This could
        // probably be optimised - Struz

        const testFn = (row: PassByRef<number>) => {
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
        };

        // Mirrors FOREACH_NONEMPTY_ROW_ALL_TRACKS
        for (const row = {value: -1}; nd.getNextTapNoteRowForAllTracks(row); row.value++) {
            // This row isn't empty so find the non-empty tap note(s)
            testFn(row);
        }

        // Tests FOREACH_NONEMPTY_ROW_ALL_TRACKS
        const outerRow = {value: 0};
        FOREACH_NONEMPTY_ROW_ALL_TRACKS(testFn, nd, outerRow);
        expect(outerRow.value).to.not.equal(0);
    });

    it('allows .set() on existing rows while iterating', () => {
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
        expect(i).to.equal(expectedTracks[track].length);
    });

    it('allows .set() on new rows behind the iterator while iterating', () => {
        const newTapNote = generateTapNote();
        const track = 0;
        let i = 0;
        // Loop through the track, verify the data, and midway through add a TapNote behind us
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            // Expect that we don't head past the end
            expect(i).to.be.lessThan(expectedTracks[track].length);
            expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
            if (i === 2) {
                // Add the TapNote behind us
                newTapNote.type = TapNoteType.Mine;
                nd.setTapNote(track, 20, newTapNote);
            }
            i++;
        }

        // Loop through again and check for the changed TapNote
        i = 0;
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            if (row.value === 20) {
                expect(nd.getTapNote(track, row.value)).to.equal(newTapNote);
            } else {
                expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
                i++;
            }
        }
        expect(i).to.equal(expectedTracks[track].length);
    });

    it('allows .set() on new rows ahead of the iterator while iterating', () => {
        // .set() on rows ahead should result in the iterator picking up the new rows
        // as we get to them, when using the below pattern. It would likely work
        // differently if we just kept the same iterator.
        const newTapNote = generateTapNote();
        const track = 0;
        let i = 0;
        // Loop through the track, verify the data, and midway through add a TapNote ahead of us
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            // Expect that we don't head past the end
            expect(i).to.be.lessThan(expectedTracks[track].length);
            if (i === 2) {
                // Add the TapNote in front of us
                newTapNote.type = TapNoteType.Mine;
                nd.setTapNote(track, 150, newTapNote);
            }
            if (row.value === 150) {
                expect(nd.getTapNote(track, row.value)).to.equal(newTapNote);
            } else {
                expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
                i++;
            }
        }

        // Loop through again and check for the changed TapNote
        i = 0;
        for (const row = {value: -1}; nd.getNextTapNoteRowForTrack(track, row); row.value++) {
            if (row.value === 150) {
                expect(nd.getTapNote(track, row.value)).to.equal(newTapNote);
            } else {
                expect(nd.getTapNote(track, row.value)).to.equal(expectedTracks[track][i][1]);
                i++;
            }
        }
        expect(i).to.equal(expectedTracks[track].length);
    });

    // TODO: iterator .delete() test. Just assuming for now.
    // TODO: probably refactor these into table tests if we can.
});
