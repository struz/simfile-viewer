import TimingData from '@/lib/TimingData';
import { expect } from 'chai';

// tslint:disable: max-line-length

describe('TimingData', () => {
    let td = new TimingData();
    beforeEach(() => {
        td = new TimingData();

        const beatStartLookup = [];
        // TODO: craft some tests...
    });

    it('empty lookup tables always return undefined', () => {
        const td = new TimingData();
        td.prepareLookup();

        const entriesToCheck = [0, 10, 15, 23, 220, 10029, Number.MAX_VALUE];
        for (const entry of entriesToCheck) {
            const result = td.findEntryInLookup(td.beatStartLookup, entry);
            expect(result).to.equal(undefined);
        }

        td.releaseLookup();
    });
});
