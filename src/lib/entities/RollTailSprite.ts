import BodyAndCapNote from './BodyAndCapNote';
import { TapNoteDirection } from './EntitiesConstants';
import RESOURCEMAN, {
    DOWN_ROLL_BODY_INACTIVE_SHEET_NAME,
    DOWN_ROLL_BOTTOM_CAP_INACTIVE_SHEET_NAME} from '../ResourceManager';

// This is different from HoldTailSprite because when we add the active portions
// it will need to be animated.
// The current plan is to do this by quick switching the visibility of the 4 sprites.
// .destroy() will need to be overloaded to cleanup the non active sprites, but the
// active ones can be left to the parent.
class RollTailSprite extends BodyAndCapNote {
    /**
     * @param direction the direction of the arrow at the head of the hold.
     * @param noteBeat the beat the head of this hold tail lands on.
     * @param duration the duration of the hold in beats.
     */
    public constructor(direction: TapNoteDirection, noteBeat: number, duration: number) {
        // TODO: for some reason the roll body has an extra pixel at the bottom. Cut it off.
        // TODO: also, we can't use the same trick as with the holds to flip the Y index because
        //       this one actually needs to point up. We need to find a way to anchor at the bottom and
        //       draw up.
        // Might have to go back to calculating the size and then hiding the top part.
        // So what is drawing in reverse actually doing?
        // - Flips UVs
        // - So that drawing happens.

        // If the roll/hold is < the height of the original, we need to set the UVs such that we
        // start drawing midway down. We can do that by clamping the texture at creation.
        // If the roll/hold is > the height of the original, we do some very slight scale adjustments
        // to get them to line up without needing to do weird UV stuff on the final leg.
        // UV stuff on the final tile would be the best solution, of course.

        // What we could do is use tiling sprite for multiples of the height then do the UV
        // adjustment for the final piece. This is probably the best overall solution, but
        // the most code change.
        const bodySpriteInfo = RESOURCEMAN.getSpriteInfo(DOWN_ROLL_BODY_INACTIVE_SHEET_NAME);
        const capSpriteInfo = RESOURCEMAN.getSpriteInfo(DOWN_ROLL_BOTTOM_CAP_INACTIVE_SHEET_NAME);
        super(direction, noteBeat, duration, bodySpriteInfo, capSpriteInfo);
    }
}
export default RollTailSprite;
