// tslint:disable: max-line-length

interface GameEnum {
    NUM: number;
}

// The different game categories available to play.
// Taken from commit b95e49216eb2974b8e0f69b6603595df1c698ccd
export enum StepsTypeCategory {
    Single, // One person plays on one side.
    Double, // One person plays on both sides.
    Couple, // Two players play on their own side.
    Routine, // Two players share both sides together.
}

// The different steps types for playing.
// Taken from commit b95e49216eb2974b8e0f69b6603595df1c698ccd
export enum StepsType {
    dance_single = 0,
    dance_double,
    dance_couple,
    dance_solo,
    dance_threepanel,
    dance_routine,
    pump_single,
    pump_halfdouble,
    pump_double,
    pump_couple,
    pump_routine,
    kb7_single,
    ez2_single,
    ez2_double,
    ez2_real,
    para_single,
    ds3ddx_single,
    beat_single5,
    beat_versus5,
    beat_double5,
    beat_single7,
    beat_versus7,
    beat_double7,
    maniax_single,
    maniax_double,
    techno_single4,
    techno_single5,
    techno_single8,
    techno_double4,
    techno_double5,
    techno_double8,
    popn_five,
    popn_nine,
    lights_cabinet,
    kickbox_human,
    kickbox_quadarm,
    kickbox_insect,
    kickbox_arachnid,
    NUM, 	// leave this at the end
    Invalid,
}

// The collective information about a Steps' type
export class StepsTypeInfo {
    // The name of the step type
    public stepTypeName: string;
    // The number of tracks, or columns, of this type.
    public numTracks: number;
    // A flag to determine if we allow this type to be autogen'ed to other types.
    public allowAutogen: boolean;
    // The most basic StyleType that this StpesTypeInfo is used with.
    public stepsTypeCategory: StepsTypeCategory;

    constructor(stepTypeName: string, numTracks: number,
                allowAutogen: boolean, stepsTypeCategory: StepsTypeCategory) {
        this.stepTypeName = stepTypeName;
        this.numTracks = numTracks;
        this.allowAutogen = allowAutogen;
        this.stepsTypeCategory = stepsTypeCategory;
    }

    public toString(): string {
        return this.stepTypeName;
    }
}

// Information about all the step types we support. Taken from StepMania
// GameManager.cpp at line 50, commit b95e49216eb2974b8e0f69b6603595df1c698ccd
// The indexes here must match the indexes in the enum.
// TODO: this is really ugly without the full enum names linked here - Fix when have time.
export const StepsTypeInfos: StepsTypeInfo[] = [
    // dance
    new StepsTypeInfo('dance-single', 4, true, StepsTypeCategory.Single),
    new StepsTypeInfo('dance-double', 8, true, StepsTypeCategory.Double),
    new StepsTypeInfo('dance-couple', 8, true, StepsTypeCategory.Couple),
    new StepsTypeInfo('dance-solo', 6, true, StepsTypeCategory.Single),
    new StepsTypeInfo('dance-threepanel', 3, true, StepsTypeCategory.Single), // thanks to kurisu
    new StepsTypeInfo('dance-routine', 8, false, StepsTypeCategory.Routine),
    // pump
    new StepsTypeInfo('pump-single', 5, true, StepsTypeCategory.Single),
    new StepsTypeInfo('pump-halfdouble', 6, true, StepsTypeCategory.Double),
    new StepsTypeInfo('pump-double', 10, true, StepsTypeCategory.Double),
    new StepsTypeInfo('pump-couple', 10, true, StepsTypeCategory.Couple),
    // uh, dance-routine has that one bool as false... wtf? -aj
    new StepsTypeInfo('pump-routine', 10, true, StepsTypeCategory.Routine),
    // kb7
    new StepsTypeInfo('kb7-single', 7, true, StepsTypeCategory.Single),
    // new StepsTypeInfo('kb7-small', 7, true, StepsTypeCategory.Single),
    // ez2dancer
    new StepsTypeInfo('ez2-single', 5, true, StepsTypeCategory.Single), // Single: TL,LHH,D,RHH,TR
    new StepsTypeInfo('ez2-double', 10, true, StepsTypeCategory.Double), // Double: Single x2
    new StepsTypeInfo('ez2-real', 7, true, StepsTypeCategory.Single), // Real: TL,LHH,LHL,D,RHL,RHH,TR
    // parapara paradise
    new StepsTypeInfo('para-single', 5, true, StepsTypeCategory.Single),
    // ds3ddx
    new StepsTypeInfo('ds3ddx-single', 8, true, StepsTypeCategory.Single),
    // beatmania
    new StepsTypeInfo('bm-single5', 6, true, StepsTypeCategory.Single), // called "bm" for backward compat
    new StepsTypeInfo('bm-versus5', 6, true, StepsTypeCategory.Single), // called "bm" for backward compat
    new StepsTypeInfo('bm-double5', 12, true, StepsTypeCategory.Double), // called "bm" for backward compat
    new StepsTypeInfo('bm-single7', 8, true, StepsTypeCategory.Single), // called "bm" for backward compat
    new StepsTypeInfo('bm-versus7', 8, true, StepsTypeCategory.Single), // called "bm" for backward compat
    new StepsTypeInfo('bm-double7', 16, true, StepsTypeCategory.Double), // called "bm" for backward compat
    // dance maniax
    new StepsTypeInfo('maniax-single', 4, true, StepsTypeCategory.Single),
    new StepsTypeInfo('maniax-double', 8, true, StepsTypeCategory.Double),
    // technomotion
    new StepsTypeInfo('techno-single4', 4, true, StepsTypeCategory.Single),
    new StepsTypeInfo('techno-single5', 5, true, StepsTypeCategory.Single),
    new StepsTypeInfo('techno-single8', 8, true, StepsTypeCategory.Single),
    new StepsTypeInfo('techno-double4', 8, true, StepsTypeCategory.Double),
    new StepsTypeInfo('techno-double5', 10, true, StepsTypeCategory.Double),
    new StepsTypeInfo('techno-double8', 16, true, StepsTypeCategory.Double),
    // pop'n music
    new StepsTypeInfo('pnm-five', 5, true, StepsTypeCategory.Single), // called "pnm" for backward compat
    new StepsTypeInfo('pnm-nine', 9, true, StepsTypeCategory.Single), // called "pnm" for backward compat
    // cabinet lights and other fine StepsTypes that don't exist lol
    new StepsTypeInfo('lights-cabinet', 6, false, StepsTypeCategory.Single), // XXX disable lights autogen for now
    // kickbox mania
    new StepsTypeInfo('kickbox-human', 4, true, StepsTypeCategory.Single),
    new StepsTypeInfo('kickbox-quadarm', 4, true, StepsTypeCategory.Single),
    new StepsTypeInfo('kickbox-insect', 6, true, StepsTypeCategory.Single),
    new StepsTypeInfo('kickbox-arachnid', 8, true, StepsTypeCategory.Single),
];

// TODO: pull difficulty stuff into another file
// Player number stuff
export enum Difficulty {
    Beginner,
    Easy,
    Medium,
    Hard,
    Challenge,
    Edit,
    NUM,
    Invalid,
}

const OldStyleStringToDifficultyMap: Map<string, Difficulty> = new Map([
    ['beginner', Difficulty.Beginner],
    ['easy', Difficulty.Easy],
    ['basic', Difficulty.Easy],
    ['light', Difficulty.Easy],
    ['medium', Difficulty.Medium],
    ['another', Difficulty.Medium],
    ['trick', Difficulty.Medium],
    ['standard', Difficulty.Medium],
    ['difficult', Difficulty.Medium],
    ['hard', Difficulty.Hard],
    ['ssr', Difficulty.Hard],
    ['maniac', Difficulty.Hard],
    ['heavy', Difficulty.Hard],
    ['smaniac', Difficulty.Challenge],
    ['challenge', Difficulty.Challenge],
    ['expert', Difficulty.Challenge],
    ['oni', Difficulty.Challenge],
    ['edit', Difficulty.Edit],
]);

// Define the mininum and maximum chart difficulty value allowed.
const MIN_METER = 1;
const MAX_METER = 35;

/** Hacky way to pass things by reference without too much overhead. */
export interface PassByRef<T> {
    value: T;
}

// Disabled so we can group collective things up in this file
// tslint:disable-next-line: max-classes-per-file
export class Helpers {
    public static stringToStepsType(stepsType: string): StepsType {
        for (let i = 0; i < StepsTypeInfos.length; i++) {
            if (StepsTypeInfos[i].stepTypeName === stepsType) {
                return i;
            }
        }
        return StepsType.Invalid;
    }

    public static getStepsTypeInfo(st: StepsType) {
        if (st >= StepsType.NUM) {
            throw new Error(`getStepsTypeInfo(): Invalid steps type index ${st}`);
        }
        return StepsTypeInfos[st];
    }

    public static oldStyleStringToDifficulty(oldDifficulty: string): Difficulty {
        const difficulty = OldStyleStringToDifficultyMap.get(oldDifficulty.toLowerCase());
        if (difficulty === undefined) {
            return Difficulty.Invalid;
        }
        return difficulty;
    }

    public static HHMMSSToSeconds(HHMMSS: string) {
        const arrayBits = HHMMSS.split(':');
        while (arrayBits.length < 3) {
            arrayBits.splice(0, 0, '0'); // pad missing bits
        }
        let seconds = 0;
        seconds += this.stringToInt(arrayBits[0]) * 60 * 60;
        seconds += this.stringToInt(arrayBits[1]) * 60;
        seconds += this.stringToFloat(arrayBits[2]);
        return seconds;
    }

    /**
     * Return a list of values for the enum, not including Invalid.
     * Enum must have a .NUM element for this to work.
     *
     * Uses some any magic, but we expect to only return numbers.
     */
    public static forEachEnum(gameEnum: { NUM: number }): number[] {
        const iterator: number[] = [];
        const keys = Object.keys(gameEnum);
        const values = keys.map((k) => {
            if (k === 'NUM') { return; }
            const value = (gameEnum as any)[k as any];
            if (value < gameEnum.NUM) {
                iterator.push(value);
            }
        });
        return iterator;
    }

    /** Clamp a number to be between min and max. */
    public static clamp(num: number, min: number, max: number): number {
        return Math.min(Math.max(num, min), max);
    }

    // StringToInt and StringToFloat are wrappers around std::stoi and std::stof
    // which handle the exception by returning 0.  Reporting the exception would
    // be cumbersome, and there are probably a million things that rely on an
    // "invalid" string being silently converted to 0.  This includes cases where
    // someone uses an empty string and expects it to come out 0, probably
    // frequently used in metrics. -Kyz

    /** Like parseInt(x, 10) but instead of NaN it returns 0. */
    public static stringToInt(str: string) {
        const int = parseInt(str, 10);
        if (isNaN(int)) {
            return 0;
        }
        return int;
    }
    /** Like parseFloat(x) but instead of NaN it returns 0. */
    public static stringToFloat(str: string) {
        const float = parseFloat(str);
        if (isNaN(float)) {
            return 0.0;
        }
        return float;
    }

    /** Interpolate within the ranges and interlopant. */
    public static lerp(x: number, l: number, h: number) {
        return (h - l) * x + l;
    }

    /** Scale the target number so that the two targets match.
     *
     * This does not modify x, so it MUST assign the result to something!
     * Do the multiply before the divide so that integer scales have more precision.
     *
     * One such example: scale(x, 0, 1, L, H); interpolate between L and H.
     */
    public static scale(x: number, l1: number, h1: number, l2: number, h2: number) {
        return ( l1 === 0 && h1 === 1 ) ? Helpers.lerp(x, l2, h2) : (x - l1) * (h2 - l2) / (h1 - l1) + l2;
    }
}
export default Helpers;
