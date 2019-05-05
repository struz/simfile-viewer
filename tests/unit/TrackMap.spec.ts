// tslint:disable: max-line-length

import { expect } from 'chai';
import { TrackMap } from '@/lib/NoteData';
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
        tm.set(2, tn2);
        tm.set(3, tn3);

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
    // TODO: a test for how the iterator acts when you go .next(), .set() a new value in between
    // two existing values, then .next() again. Does the iterator use the live array?
});
