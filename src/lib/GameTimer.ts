import { DetailedTimeInfo } from './TimingData';
import { NotImplementedError } from './Error';

/** A mirror of RageTimer */
export class GameTimer {
    // TODO: fill me out
    // TODO: will track deltas of timing
    public isZero(): boolean { throw new NotImplementedError(); }
    public touch(): void { throw new NotImplementedError(); }
    public getDetailedInfoForSecond(args: DetailedTimeInfo): void { throw new NotImplementedError(); }
}
export default GameTimer;
