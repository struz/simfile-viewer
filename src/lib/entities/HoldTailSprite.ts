import BodyAndCapNote from './BodyAndCapNote';
import { TapNoteDirection } from './EntitiesConstants';
import RESOURCEMAN, {
    DOWN_HOLD_BOTTOM_CAP_INACTIVE_SHEET_NAME,
    DOWN_HOLD_BODY_INACTIVE_SHEET_NAME } from '../ResourceManager';

class HoldTailSprite extends BodyAndCapNote {
    /**
     * @param direction the direction of the arrow at the head of the hold.
     * @param noteBeat the beat the head of this hold tail lands on.
     * @param duration the duration of the hold in beats.
     */
    public constructor(direction: TapNoteDirection, noteBeat: number, duration: number) {
        const bodySpriteInfo = RESOURCEMAN.getSpriteInfo(DOWN_HOLD_BODY_INACTIVE_SHEET_NAME);
        const capSpriteInfo = RESOURCEMAN.getSpriteInfo(DOWN_HOLD_BOTTOM_CAP_INACTIVE_SHEET_NAME);
        super(direction, noteBeat, duration, bodySpriteInfo, capSpriteInfo);
    }
}
export default HoldTailSprite;
