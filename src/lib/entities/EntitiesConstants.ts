/** The width of a tap note sprite before any scaling. */
export const TAPNOTE_WIDTH_PX = 64;
/** The height of a tap note sprite before any scaling. */
export const TAPNOTE_HEIGHT_PX = 64;
/** The height of a hold note bottom cap before any scaling. */
export const HOLD_BOTTOM_CAP_HEIGHT_PX = 32;
/** The margin on each side of the lane outside of the note tracks. */
export const LANE_MARGIN_PX = 0;
/** The margin from the top of the screen to the receptors. */
export const RECEPTOR_MARGIN_TOP_PX = 96; // 1.5x receptor size

/** The default height of the resolution that the note assets were made for  */
// We only care about the height because if we keep the dimensions then we only
// need to transform on either height or width. StepMania uses height so this is for
// consistency.
export const DEFAULT_NOTEFIELD_HEIGHT = 480;  // 640 x 480 because stepmania is ancient

/** Tap note directions in rotation order from the down arrow. */
export enum TapNoteDirection {
    DOWN,
    LEFT,
    UP,
    RIGHT,
}
/** Translation function from direction index to lane index. */
export function directionToLaneIndex(direction: TapNoteDirection) {
    switch (direction) {
        case TapNoteDirection.DOWN: return 1;
        case TapNoteDirection.LEFT: return 0;
        case TapNoteDirection.UP: return 2;
        case TapNoteDirection.RIGHT: return 3;
        default: throw new Error(`unknown TapNoteDirection: ${direction}`);
    }
}
export function laneIndexToDirection(laneIndex: number) {
    switch (laneIndex) {
        case 0: return 1;
        case 1: return 0;
        case 2:
        case 3:
            return laneIndex;
        default: throw new Error(`unknown laneIndex: ${laneIndex}`);
    }
}

export function getPosForLaneNumber(laneIndex: number, scale: number) {
    // The left X column of a lane can be calculated by multiplying the width of a
    // tap note with the index of the lane it sits in.
    // Because we anchor these arrows at 0.5, 0.5 for rotational purposes, we need
    // to calculate the center X of the lane.
    // This is done by adding half the sprite width.
    const baseX = LANE_MARGIN_PX + (TAPNOTE_WIDTH_PX * laneIndex) + (TAPNOTE_WIDTH_PX / 2);
    return Math.floor(baseX * scale);
}
