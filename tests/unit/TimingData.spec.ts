// tslint:disable: max-line-length

import { expect } from 'chai';
import TimingData, { LineSegment } from '@/lib/TimingData';
import { TimingSegment } from '@/lib/TimingSegments';
describe('TimingData', () => {
    describe('line segments', () => {
        interface LineSegmentTest {
            it: string;
            segments: Map<number, LineSegment[]>;
            inputsOutputs: Array<[number, LineSegment]>;
        }

        const createLineSegment =
            (startBeat: number, startSecond: number, endBeat: number,
             endSecond: number, startExpandSecond: number,
             endExpandSecond: number, bps: number, timeSegment: TimingSegment | null) => {
                const lineSegment = new LineSegment();
                lineSegment.startBeat = startBeat;
                lineSegment.startSecond = startSecond;
                lineSegment.endBeat = endBeat;
                lineSegment.endSecond = endSecond;
                lineSegment.startExpandSecond = startExpandSecond;
                lineSegment.endExpandSecond = endExpandSecond;
                lineSegment.bps = bps;
                lineSegment.timeSegment = timeSegment;
                return lineSegment;
        };

        // We have to use an output array so we can do === compares to make
        // sure we're getting back the same LineSegment.
        const createManyElemTestSegments = () => {
            const segments = new Map<number, LineSegment[]>();
            const beats = [1, 1.5, 2.0, 5.0, 10, 100];
            const expected: LineSegment[] = [];
            for (const beat of beats) {
                const lineSegment = new LineSegment();
                expected.push(lineSegment);
                segments.set(beat, [lineSegment]);
            }
            return { segments, expected };
        };
        const manyElemTestSegments = createManyElemTestSegments();

        const createSingleElemTestSegments = () => {
            const segments = new Map<number, LineSegment[]>();
            const expected = [new LineSegment()];
            segments.set(1.5, [expected[0]]);
            return { segments, expected };
        };
        const singleElemTestSegments = createSingleElemTestSegments();

        const findLineSegmentTests: LineSegmentTest[] = [
            {
                it: 'findLineSegment() works on a map with one element which is > input',
                segments: singleElemTestSegments.segments,
                inputsOutputs: [
                    [100, singleElemTestSegments.expected[0]],
                ],
            },
            {
                it: 'findLineSegment() works on a map with one element which is < input',
                segments: singleElemTestSegments.segments,
                inputsOutputs: [
                    [2.2, singleElemTestSegments.expected[0]],
                ],
            },
            {
                it: 'findLineSegment() works on a map with one element which is == to input',
                segments: singleElemTestSegments.segments,
                inputsOutputs: [
                    [1.5, singleElemTestSegments.expected[0]],
                ],
            },

            {
                it: 'findLineSegment() gets the right results from the map',
                segments: manyElemTestSegments.segments,
                inputsOutputs: [
                    [0, manyElemTestSegments.expected[0]],
                    [1, manyElemTestSegments.expected[0]],
                    [1.1, manyElemTestSegments.expected[0]],
                    [1.5, manyElemTestSegments.expected[1]],
                    [1.5, manyElemTestSegments.expected[1]],
                    [110, manyElemTestSegments.expected[5]],
                ],
            },
        ];
        // TODO: expected should be a list of input/output pairs

        findLineSegmentTests.forEach((lineSegmentTest) => {
            it(lineSegmentTest.it, () => {
                for (const inputOutput of lineSegmentTest.inputsOutputs) {
                    const output = TimingData.findLineSegment(lineSegmentTest.segments, inputOutput[0]);
                    expect(output).to.equal(inputOutput[1]);
                }
            });
        });

        // it('findLineSegment() finds the correct line', () => {
        //     // IMPORTANT:
        // });
        // it('findLineSegment() works on a map with one element', () => {
        //     // IMPORTANT:
        // });
    });
});
