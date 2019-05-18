import { TapNoteSubType } from '../NoteTypes';
import { TapNoteDirection, TAPNOTE_WIDTH_PX, LANE_MARGIN, directionToLaneIndex } from './EntitiesConstants';
import RESOURCEMAN, { DOWN_HOLD_BODY_ACTIVE_SHEET_NAME, DOWN_HOLD_BOTTOM_CAP_ACTIVE_SHEET_NAME } from '../ResourceManager';
import ArrowEffects from '../ArrowEffects';
import { RECEPTOR_MARGIN_TOP_PX } from './TapNoteReceptorSprite';
import GameSpriteGroup, { GameSpriteGroupDef } from './GameSpriteGroup';

const NOTESKIN = 'USWCelETT';

class HoldSprite extends GameSpriteGroup {
    private direction: TapNoteDirection;
    private noteSubType: TapNoteSubType;
    private noteBeat: number;

    // TODO: this class should basically just serve to group together two
    // sprites. We should make a generic way of doing these groupings.

    // We need to group the body and the cap, drawing them smoothly.


    /** Create a new hold note sprite.
     * @param direction the direction the arrow for the hold is in.
     * @param noteSubType the type of hold (hold / roll).
     * @param noteBeat the beat the head of the hold falls on.
     */
    constructor(direction: TapNoteDirection, noteSubType: TapNoteSubType,
                noteBeat: number, duration: number) {
        const laneIndex = directionToLaneIndex(direction);

        const defs: GameSpriteGroupDef[] = [];
        if (noteSubType === TapNoteSubType.Hold) {
            // The hold body
            defs.push({
                // Set the x based on the note track
                x: LANE_MARGIN + (TAPNOTE_WIDTH_PX * laneIndex),
                y: 0,  // TODO: calculate
                spriteInfo: RESOURCEMAN.getSpriteInfo(DOWN_HOLD_BODY_ACTIVE_SHEET_NAME),
                spriteNum: 0,
            });
            // The hold cap
            defs.push({
                // Set the x based on the note track
                x: LANE_MARGIN + (TAPNOTE_WIDTH_PX * laneIndex),
                y: 0,  // TODO: calculate
                spriteInfo: RESOURCEMAN.getSpriteInfo(DOWN_HOLD_BOTTOM_CAP_ACTIVE_SHEET_NAME),
                spriteNum: 0,
            });
        } else {
            //
        }
        super(defs);

        this.direction = direction;
        this.noteSubType = noteSubType;
        this.noteBeat = noteBeat;

        // Ensure it starts animated
        this.sprites.forEach((sprite) => sprite.play());
    }

    public getDirection() { return this.direction; }
    public getNoteSubType() { return this.noteSubType; }
    public getBeat() { return this.noteBeat; }

    public update(deltaTime: number) {
        // TODO make calls
        return this;
    }

    private setHoldCapYPosBasedOnEndBeat() {
        // TODO: duration
    }
}
export default HoldSprite;
