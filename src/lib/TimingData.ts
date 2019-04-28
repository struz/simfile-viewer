import { TimingSegment } from './TimingSegments';

// Holds data for translating beats<->seconds.
export class TimingData {
    private beat0OffsetInSecs: number = 0;

    public setOffset(offset: number) {
        if (offset !== this.beat0OffsetInSecs) {
            this.beat0OffsetInSecs = offset;
            // TODO: it's changed, we probably need to recompute the data for anything using it
            // see: TimingData::set_offset in StepMania
        }
    }

    public getOffset() {
        return this.beat0OffsetInSecs;
    }

    public addSegment(seg: TimingSegment) {
        // TODO: add debug logging flag and put a debug log here
        const tst = seg.getType();

        // TODO: omg this is a complex function
    }
}
export default TimingData;
