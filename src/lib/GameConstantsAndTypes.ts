// tslint:disable: max-line-length

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
    NUM_StepsType, 	// leave this at the end
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
    // The associated ID of this StepType
    public stepsType: StepsType;

    constructor(stepTypeName: string, numTracks: number,
                allowAutogen: boolean, stepsTypeCategory: StepsTypeCategory,
                stepsType: StepsType) {
        this.stepTypeName = stepTypeName;
        this.numTracks = numTracks;
        this.allowAutogen = allowAutogen;
        this.stepsTypeCategory = stepsTypeCategory;
        this.stepsType = stepsType;
    }

    public toString(): string {
        return this.stepTypeName;
    }
}

// Information about all the step types we support. Taken from StepMania
// GameManager.cpp at line 50, commit b95e49216eb2974b8e0f69b6603595df1c698ccd
// The indexes here must match the indexes in the enum.
// TODO: this is really ugly without the full enum names linked here - Fix when have time.
export const StepsTypeInfos: Map<string, StepsTypeInfo> = new Map([
    // dance
    ['dance-single', new StepsTypeInfo('dance-single', 4, true, StepsTypeCategory.Single, StepsType.dance_single)],
    ['dance-double', new StepsTypeInfo('dance-double', 8, true, StepsTypeCategory.Double, StepsType.dance_double)],
    ['dance-couple', new StepsTypeInfo('dance-couple', 8, true, StepsTypeCategory.Couple, StepsType.dance_couple)],
    ['dance-solo', new StepsTypeInfo('dance-solo', 6, true, StepsTypeCategory.Single, StepsType.dance_solo)],
    ['dance-threepanel', new StepsTypeInfo('dance-threepanel', 3, true, StepsTypeCategory.Single, 4)], // thanks to kurisu
    ['dance-routine', new StepsTypeInfo('dance-routine', 8, false, StepsTypeCategory.Routine, 5)],
    // pump
    ['pump-single', new StepsTypeInfo('pump-single', 5, true, StepsTypeCategory.Single, 6)],
    ['pump-halfdouble', new StepsTypeInfo('pump-halfdouble', 6, true, StepsTypeCategory.Double, 7)],
    ['pump-double', new StepsTypeInfo('pump-double', 10, true, StepsTypeCategory.Double, 8)],
    ['pump-couple', new StepsTypeInfo('pump-couple', 10, true, StepsTypeCategory.Couple, 9)],
    // uh, dance-routine has that one bool as false... wtf? -aj
    ['pump-routine', new StepsTypeInfo('pump-routine', 10, true, StepsTypeCategory.Routine, 10)],
    // kb7
    ['kb7-single', new StepsTypeInfo('kb7-single', 7, true, StepsTypeCategory.Single, 11)],
    // ['kb7-small', new StepsTypeInfo('kb7-small', 7, true, StepsTypeCategory.Single, 12)],
    // ez2dancer
    ['ez2-single', new StepsTypeInfo('ez2-single', 5, true, StepsTypeCategory.Single, 12)], // Single: TL,LHH,D,RHH,TR
    ['ez2-double', new StepsTypeInfo('ez2-double', 10, true, StepsTypeCategory.Double, 13)], // Double: Single x2
    ['ez2-real', new StepsTypeInfo('ez2-real', 7, true, StepsTypeCategory.Single, 14)], // Real: TL,LHH,LHL,D,RHL,RHH,TR
    // parapara paradise
    ['para-single', new StepsTypeInfo('para-single', 5, true, StepsTypeCategory.Single, 15)],
    // ds3ddx
    ['ds3ddx-single', new StepsTypeInfo('ds3ddx-single', 8, true, StepsTypeCategory.Single, 16)],
    // beatmania
    ['bm-single5', new StepsTypeInfo('bm-single5', 6, true, StepsTypeCategory.Single, 17)], // called "bm" for backward compat
    ['bm-versus5', new StepsTypeInfo('bm-versus5', 6, true, StepsTypeCategory.Single, 18)], // called "bm" for backward compat
    ['bm-double5', new StepsTypeInfo('bm-double5', 12, true, StepsTypeCategory.Double, 19)], // called "bm" for backward compat
    ['bm-single7', new StepsTypeInfo('bm-single7', 8, true, StepsTypeCategory.Single, 20)], // called "bm" for backward compat
    ['bm-versus7', new StepsTypeInfo('bm-versus7', 8, true, StepsTypeCategory.Single, 21)], // called "bm" for backward compat
    ['bm-double7', new StepsTypeInfo('bm-double7', 16, true, StepsTypeCategory.Double, 22)], // called "bm" for backward compat
    // dance maniax
    ['maniax-single', new StepsTypeInfo('maniax-single', 4, true, StepsTypeCategory.Single, 23)],
    ['maniax-double', new StepsTypeInfo('maniax-double', 8, true, StepsTypeCategory.Double, 24)],
    // technomotion
    ['techno-single4', new StepsTypeInfo('techno-single4', 4, true, StepsTypeCategory.Single, 25)],
    ['techno-single5', new StepsTypeInfo('techno-single5', 5, true, StepsTypeCategory.Single, 26)],
    ['techno-single8', new StepsTypeInfo('techno-single8', 8, true, StepsTypeCategory.Single, 27)],
    ['techno-double4', new StepsTypeInfo('techno-double4', 8, true, StepsTypeCategory.Double, 28)],
    ['techno-double5', new StepsTypeInfo('techno-double5', 10, true, StepsTypeCategory.Double, 29)],
    ['techno-double8', new StepsTypeInfo('techno-double8', 16, true, StepsTypeCategory.Double, 30)],
    // pop'n music
    ['pnm-five', new StepsTypeInfo('pnm-five', 5, true, StepsTypeCategory.Single, 31)], // called "pnm" for backward compat
    ['pnm-nine', new StepsTypeInfo('pnm-nine', 9, true, StepsTypeCategory.Single, 32)], // called "pnm" for backward compat
    // cabinet lights and other fine StepsTypes that don't exist lol
    ['lights-cabinet', new StepsTypeInfo('lights-cabinet', 6, false, StepsTypeCategory.Single, 33)], // XXX disable lights autogen for now
    // kickbox mania
    ['kickbox-human', new StepsTypeInfo('kickbox-human', 4, true, StepsTypeCategory.Single, 34)],
    ['kickbox-quadarm', new StepsTypeInfo('kickbox-quadarm', 4, true, StepsTypeCategory.Single, 35)],
    ['kickbox-insect', new StepsTypeInfo('kickbox-insect', 6, true, StepsTypeCategory.Single, 36)],
    ['kickbox-arachnid', new StepsTypeInfo('kickbox-arachnid', 8, true, StepsTypeCategory.Single, 37)],
]);

// TODO: pull difficulty stuff into another file
// Player number stuff
export enum Difficulty {
    Beginner,
    Easy,
    Medium,
    Hard,
    Challenge,
    Edit,
    NUM_Difficulty,
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

// Disabled so we can group collective things up in this file
// tslint:disable-next-line: max-classes-per-file
export class Helpers {
    public static StringToStepsType(stepsType: string): StepsType {
        const stepsTypeInfo = StepsTypeInfos.get(stepsType);
        if (stepsTypeInfo === undefined) {
            return StepsType.Invalid;
        }
        return stepsTypeInfo.stepsType;
    }

    public static oldStyleStringToDifficulty(oldDifficulty: string): Difficulty {
        const difficulty = OldStyleStringToDifficultyMap.get(oldDifficulty.toLowerCase());
        if (difficulty === undefined) {
            return Difficulty.Invalid;
        }
        return difficulty;
    }
}
export default Helpers;
