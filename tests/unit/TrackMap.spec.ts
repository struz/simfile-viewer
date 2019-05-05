// tslint:disable: max-line-length

import { expect } from 'chai';
import NoteData, { TrackMap, FOREACH_NONEMPTY_ROW_IN_TRACK } from '@/lib/NoteData';
import { TapNote } from '@/lib/NoteTypes';

describe('TrackMap', () => {
    it('wraps Map effectively', () => {
        const tm = new TrackMap();
        expect(tm.get(0)).to.equal(undefined);
        expect(tm.size).to.equal(0);

        const tn = new TapNote();
        tm.set(0, tn);
        expect(tm.get(0)).to.equal(tn);
        expect(tm.size).to.equal(1);

        // Iterators
        const keys = tm.keys();
        expect(keys.next().value).to.equal(0);
        const values = tm.values();
        expect(values.next().value).to.equal(tn);
        const entries = tm.entries();
        let entry = entries.next().value;
        expect(entry[0]).to.equal(0);
        expect(entry[1]).to.equal(tn);

        for (entry of tm) {
            expect(entry[0]).to.equal(0);
            expect(entry[1]).to.equal(tn);
        }

        tm.delete(0);
        expect(tm.size).to.equal(0);
    });
    it('stays ordered', () => {
        const tm = new TrackMap();
        tm.set(1, new TapNote());
        tm.set(3, new TapNote());

        let expected = [1, 3];
        let i = 0;
        for (const entry of tm) {
            expect(entry[0]).to.equal(expected[i]);
            i++;
        }

        tm.set(2, new TapNote());
        expected = [1, 2, 3];
        i = 0;
        for (const entry of tm) {
            expect(entry[0]).to.equal(expected[i]);
            i++;
        }

        tm.delete(2);
        expected = [1, 3];
        i = 0;
        for (const entry of tm) {
            expect(entry[0]).to.equal(expected[i]);
            i++;
        }
    });
    it('iterates forward and backward', () => {
        const tm = new TrackMap();
        const tn1 = new TapNote();
        const tn2 = new TapNote();
        const tn3 = new TapNote();
        tm.set(1, tn1);
        tm.set(3, tn3);
        tm.set(2, tn2);

        let expected = [[1, tn1], [2, tn2], [3, tn3]];
        let i = 0;
        for (const entry of tm.entries()) {
            expect(entry[0]).to.equal(expected[i][0]);
            expect(entry[1]).to.equal(expected[i][1]);
            i++;
        }
        expected = [[3, tn3], [2, tn2], [1, tn1]];
        i = 0;
        for (const entry of tm.reverseEntries()) {
            expect(entry[0]).to.equal(expected[i][0]);
            expect(entry[1]).to.equal(expected[i][1]);
            i++;
        }
    });
    // it('supports peeking', () => {
    //     const tm = new TrackMap();
    //     const tn1 = new TapNote();
    //     const tn2 = new TapNote();
    //     const tn3 = new TapNote();
    //     tm.set(1, tn1);
    //     tm.set(3, tn3);
    //     tm.set(2, tn2);

    //     let expected = [[1, tn1], [2, tn2], [3, tn3]];
    //     const it = tm.entries();
    //     let entry = it.peek();
    //     expect(entry.value[0]).to.equal(expected[0][0]);
    //     expect(entry.value[1]).to.equal(expected[0][1]);

    //     entry = it.next();
    //     expect(entry.value[0]).to.equal(expected[0][0]);
    //     expect(entry.value[1]).to.equal(expected[0][1]);
    // });
    it('can skip to particular value before iterating', () => {
        const tm = new TrackMap();
        const tn1 = new TapNote();
        const tn2 = new TapNote();
        const tn3 = new TapNote();
        tm.set(1, tn1);
        tm.set(3, tn3);
        tm.set(2, tn2);

        let expected = [[3, tn3]];
        let i = 0;
        for (const entry of tm.entries(3)) {
            expect(entry[0]).to.equal(expected[i][0]);
            expect(entry[1]).to.equal(expected[i][1]);
            i++;
        }
        expected = [[2, tn2], [1, tn1]];
        i = 0;
        for (const entry of tm.reverseEntries(2)) {
            expect(entry[0]).to.equal(expected[i][0]);
            expect(entry[1]).to.equal(expected[i][1]);
            i++;
        }
    });
    it('can be limited to a range while iterating', () => {
        const tm = new TrackMap();
        const tn3 = new TapNote();
        const tn10 = new TapNote();
        const tn15 = new TapNote();
        const tn20 = new TapNote();
        const tn25 = new TapNote();
        tm.set(3, tn3);
        tm.set(10, tn10);
        tm.set(15, tn15);
        tm.set(20, tn20);
        tm.set(25, tn25);

        let expected = [[10, tn10], [15, tn15], [20, tn20]];
        let i = 0;
        for (const entry of tm.entries(10, 20)) {
            expect(entry[0]).to.equal(expected[i][0]);
            expect(entry[1]).to.equal(expected[i][1]);
            i++;
        }
        expected = expected.reverse();
        i = 0;
        for (const entry of tm.reverseEntries(20, 10)) {
            expect(entry[0]).to.equal(expected[i][0]);
            expect(entry[1]).to.equal(expected[i][1]);
            i++;
        }
    });
    it('supports FOREACH_NONEMPTY_ROW_IN_TRACK', () => {
        const tm = new TrackMap();
        const tn1 = new TapNote();
        const tn3 = new TapNote();
        const tn5 = new TapNote();
        tm.set(1, tn1);
        tm.set(3, tn3);
        tm.set(5, tn5);

        // TODO: find a way to have this work when nd.tapNotes is encapsulated
        // TODO: this dumbass iterator just iterate sthe actual notedata object.
        // SEE IF WE NEED THIS BEFORE DOING IT
        // let i = 0;
        // const nd = new NoteData();
        // nd.setNumTracks(1);
        // nd.tapNotes[0] = tm;
        // FOREACH_NONEMPTY_ROW_IN_TRACK(nd, 0, 0, (ndata, track, row) => {
        //     expect()
        //     i++;
        // });
    });
    // TODO: a test for how the iterator acts when you go .next(), .set() a new value in between
    // two existing values, then .next() again. Does the iterator use the live array?
});
