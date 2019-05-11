/** The width of a tap note sprite before any scaling. */
export const TAPNOTE_WIDTH_PX = 64;
/** The height of a tap note sprite before any scaling. */
export const TAPNOTE_HEIGHT_PX = 64;

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

/** The margin on each side of the lane outside of the note tracks. */
export const LANE_MARGIN = 64;
