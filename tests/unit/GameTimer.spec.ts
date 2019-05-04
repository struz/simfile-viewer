// tslint:disable: max-line-length

import { expect } from 'chai';
import { Helpers } from '@/lib/GameConstantsAndTypes';
import GameTimer from '@/lib/GameTimer';

const MICROSECONDS_PER_SECOND = 1000000;
const NUM_GETTIME_TRIES = 1;

describe('GameTimer.getTime()', () => {
    // TODO: a way to re-initialise the timer for these tests
    // to make sure it works properly from startup.
    // Currently it is initialised in other tests so we can't test that easily.

    it('increases over time', (done) => {
        // Do a bunch of timing tests to ensure we aren't lucky
        // TODO: try to bake resiliency into one test
        for (let i = 0; i < NUM_GETTIME_TRIES; i++) {
            const time = GameTimer.getTime();

            // Wait one second
            let now = new Date().getTime();
            while (new Date().getTime() < now + 1100) {
                // do nothing
            }
            const time2 = GameTimer.getTime();
            expect(time2.secs, 'loop=' + i).to.be.gte(time.secs + 1);

            // Wait half a second
            now = new Date().getTime();
            const halfSecondInUs = MICROSECONDS_PER_SECOND / 2;
            while (new Date().getTime() < now + 500) {
                // do nothing
            }
            const time3 = GameTimer.getTime();

            // Logic to cover a few different scenarios
            let expectedSecs: number;
            let expectedUs: number;
            // If we expected to roll over our microseconds, our comparison will be different
            if (time2.us > halfSecondInUs) {
                expectedUs = time2.us - MICROSECONDS_PER_SECOND;
                expectedSecs = time2.secs + 1;
            } else {
                expectedSecs = time2.secs;
                expectedUs = time2.us + halfSecondInUs;
            }

            expect(time3.secs, 'loop=' + i).to.equal(expectedSecs);
            expect(time3.us, 'loop=' + i).to.be.gte(expectedUs);
        }
        done();
    }).timeout(10000);
});

describe('GameTimer.add()', () => {
    const zero = new GameTimer(0, 0);

    it('adds from zero correctly', () => {
        const one = zero.add(1);
        expect(one.secs).to.equal(1);
        expect(one.us).to.equal(0);

        const fivePointNineFive = zero.add(5.95);
        expect(fivePointNineFive.secs).to.equal(5);
        expect(fivePointNineFive.us).to.equal(MICROSECONDS_PER_SECOND * 0.95);
    });

    it('adds from > 0 correctly', () => {
        const one = new GameTimer(1, 0);

        const onePointFive = one.add(0.5);
        expect(onePointFive.secs).to.equal(1);
        expect(onePointFive.us).to.equal(MICROSECONDS_PER_SECOND / 2);
    });
});

describe('GameTimer.subtract()', () => {
    it('subtracts correctly', () => {
        const timerFive = new GameTimer(5, 0);
        const timerOne = new GameTimer(1, 0);
        const timerHalf = new GameTimer(0, MICROSECONDS_PER_SECOND / 2);
        const timerCustom = new GameTimer(1, 123456);

        let actual = timerFive.subtract(timerHalf);
        expect(actual, 'minus half second').to.equal(4.5);

        actual = timerFive.subtract(timerOne);
        expect(actual, 'minus one second').to.equal(4);

        actual = timerFive.subtract(timerCustom);
        expect(actual, 'minus one second, 123456 us').to.equal(3.876544);
    });
});

describe('GameTimer.lessThan()', () => {
    it('compares correctly', () => {
        const zero = new GameTimer(0, 0);
        const one = new GameTimer(1, 0);
        const onePointFive = new GameTimer(1, MICROSECONDS_PER_SECOND / 2);

        expect(zero.lessThan(one)).to.equal(true);
        expect(onePointFive.lessThan(one)).to.equal(false);
        expect(one.lessThan(one)).to.equal(false);
    });
});

describe('GameTimer', () => {
    it('.isZero() identifies as zero', () => {
        const zero = new GameTimer(0, 0);
        const notZero = new GameTimer(1, 0);

        expect(zero.isZero()).to.equal(true);
        expect(notZero.isZero()).to.equal(false);
    });
    it('.touch() updates timer', () => {
        const zero = new GameTimer(0, 0);
        expect(zero.secs).to.equal(0);
        expect(zero.us).to.equal(0);

        zero.touch();
        expect(zero.secs).not.to.equal(0);
    });
    it('.getDeltaTime() gets reasonably accurate delta', () => {
        const nowTimer = new GameTimer();
        const secs = nowTimer.secs;
        const us = nowTimer.us;

        // Wait half a second
        const now = new Date().getTime();
        const halfSecondInUs = MICROSECONDS_PER_SECOND / 2;
        while (new Date().getTime() < now + 500) {
            // do nothing
        }

        const delta = nowTimer.getDeltaTime();
        expect(delta).to.be.greaterThan(0.4).and.lessThan(0.6);
        if (us > MICROSECONDS_PER_SECOND / 2) {
            expect(nowTimer.secs).to.be.greaterThan(secs);
            expect(nowTimer.us).to.be.lte(us);
        } else {
            expect(nowTimer.secs).to.equal(secs);
            expect(nowTimer.us).to.be.greaterThan(us);
        }
    });
    it('.ago() gets reasonably accurate delta', () => {
        const nowTimer = new GameTimer();

        // Wait half a second
        const now = new Date().getTime();
        const halfSecondInUs = MICROSECONDS_PER_SECOND / 2;
        while (new Date().getTime() < now + 500) {
            // do nothing
        }

        const delta = nowTimer.ago();
        expect(delta).to.be.greaterThan(0.4).and.lessThan(0.6);
    });
    // TODO: test for .half() - not really sure what it's for - Struz
});
