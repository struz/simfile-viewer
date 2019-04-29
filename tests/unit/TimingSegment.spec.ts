// tslint:disable: max-line-length

import { expect } from 'chai';
import { TimingSegment } from '../../src/lib/TimingSegments';

describe('TimingSegment compareFloat', () => {
  it('compares defined floats correctly', () => {
    expect(TimingSegment.compareFloat(0.9, 1.1)).to.equal(false);
    expect(TimingSegment.compareFloat(1.1, 0.9)).to.equal(false);
    expect(TimingSegment.compareFloat(1.1, 1.1)).to.equal(true);
    expect(TimingSegment.compareFloat(Number.MAX_VALUE, Number.MAX_VALUE)).to.equal(true);
  });
  it('compares calculated floats correctly', () => {
    // This next one is a classic gotcha
    expect(TimingSegment.compareFloat(1.1 + 1.2, 1.3)).to.equal(false);
    expect(TimingSegment.compareFloat(1.5 + 1.5, 3)).to.equal(true);
  });
});