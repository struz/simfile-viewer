// tslint:disable: max-line-length

import { expect } from 'chai';
import { Helpers, PassByRef } from '@/lib/GameConstantsAndTypes';

describe('Helpers.clamp', () => {
    it('clamps numbers properly', () => {
        expect(Helpers.clamp(10, 0, 20)).to.equal(10);
        expect(Helpers.clamp(10, 11, 20)).to.equal(11);
        expect(Helpers.clamp(10, 5, 9)).to.equal(9);
        expect(Helpers.clamp(-1, 0, 20)).to.equal(0);
        expect(Helpers.clamp(-1, -10, 1)).to.equal(-1);
        expect(Helpers.clamp(-1, -10, -2)).to.equal(-2);
    });
});

describe('Helpers.HHMMSSToSeconds', () => {
    it('converts HHMMSS to seconds with a full string', () => {
        expect(Helpers.HHMMSSToSeconds('00:00:00')).to.equal(0);
        expect(Helpers.HHMMSSToSeconds('00:00:59')).to.equal(59);
        expect(Helpers.HHMMSSToSeconds('00:01:00')).to.equal(60);
        expect(Helpers.HHMMSSToSeconds('00:59:59')).to.equal(3599);
        expect(Helpers.HHMMSSToSeconds('99:99:99')).to.equal(362439);
    });
    it('converts HHMMSS to seconds with float seconds', () => {
        expect(Helpers.HHMMSSToSeconds('00:00:00.05')).to.equal(0.05);
        expect(Helpers.HHMMSSToSeconds('00:00:59.25')).to.equal(59.25);
        expect(Helpers.HHMMSSToSeconds('00:01:00.63')).to.equal(60.63);
        expect(Helpers.HHMMSSToSeconds('00:59:59.26')).to.equal(3599.26);
        expect(Helpers.HHMMSSToSeconds('99:99:99.22')).to.equal(362439.22);
    });
    it('converts HHMMSS to seconds with omitted entries', () => {
        expect(Helpers.HHMMSSToSeconds('00:00')).to.equal(0);
        expect(Helpers.HHMMSSToSeconds('00:1')).to.equal(1);
        expect(Helpers.HHMMSSToSeconds('59')).to.equal(59);
    });
});

describe('Helpers.forEachEnum', () => {
    enum TestEnum {
        zero,
        one,
        two,
        NUM,
        unlooped,
        unlooped2,
    }

    it('loops over a correctly defined enum', () => {
        const expected = [0, 1, 2];
        let i = 0;
        for (const value of Helpers.forEachEnum(TestEnum)) {
            expect(value).to.equal(expected[i]);
            i++;
        }
    });
});

describe('PassByRef', () => {
    it('allows passing a number by reference', () => {
        const transform = (numToChange: PassByRef<number>) => {
            numToChange.value = 20;
        };
        const num = {value: 5};
        transform(num);
        expect(num.value).to.equal(20);
    });
});
