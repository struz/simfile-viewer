import * as PIXI from 'pixi.js';
import Entity from './Entity';

import GameSprite, { Drawable } from './GameSprite';
import { TapNoteDirection, directionToLaneIndex,
    LANE_MARGIN, TAPNOTE_WIDTH_PX, HOLD_BOTTOM_CAP_HEIGHT_PX } from './EntitiesConstants';
import { GameSpriteInfo } from '../ResourceManager';
import ArrowEffects from '../ArrowEffects';
import { RECEPTOR_MARGIN_TOP_PX } from './TapNoteReceptorSprite';

// Base class for long note types like holds & rolls.
// Represents the tail portion of a long note. The head is still a TapNote.
// It is an entity of its own, with sub-entities that are sprites.
class BodyAndCapNote extends Entity implements Drawable {
    /** The direction of the arrow at the head of the long note. */
    protected direction: TapNoteDirection;
    /** The beat the head of this long note lands on. */
    protected noteBeat: number;
    /** The duration of this long note in beats. */
    protected duration: number;

    /** The sprite showing the tiling area of really long notes. */
    protected bodyTilingSprite: GameSprite[] | undefined;
    /** The sprite showing the beginning of the body of the long note. */
    protected bodySprite: GameSprite;
    /** The sprite showing the bottom of the long note. */
    protected bottomCapSprite: GameSprite;

    /** Are we a candidate for rendering? */
    private onStage: boolean;
    /** The Y height of the long note. */
    private height: number;

    /**
     * @param direction the direction of the arrow at the head of the long note.
     * @param noteBeat the beat the head of this long note lands on.
     * @param duration the duration of the long note in beats.
     */
    public constructor(direction: TapNoteDirection, noteBeat: number, duration: number,
                       bodySpriteInfo: GameSpriteInfo, capSpriteInfo: GameSpriteInfo) {
        super();
        this.direction = direction;
        this.noteBeat = noteBeat;
        this.duration = duration;
        this.onStage = false;

        // We anchor to the top of the hold, but the middle of the cap, so do some maths
        // to make them line up. This height does not include to the tip of the cap.
        this.height = this.calculateLongNoteHeight();

        // Work out the dimensions for the first segment of the long note. Often this
        // will be all we need to display it fully. This segment is special because
        // it starts drawing the texture from part way down, so that it will always
        // line up with the texture of the bottom cap.
        let firstBodySegmentTexStartY = 0;
        let firstBodySegmentTexHeight = 0;
        firstBodySegmentTexStartY = bodySpriteInfo.height - (this.height % bodySpriteInfo.height);
        firstBodySegmentTexHeight = bodySpriteInfo.height - firstBodySegmentTexStartY;

        // If we can't fit the long note entirely into the first section then we need a tiling section.
        if (this.height > bodySpriteInfo.height) {
            this.bodyTilingSprite = [];

            let remainingHeight = this.height - firstBodySegmentTexHeight;
            while (remainingHeight > 0) {
                const segmentHeight = Math.min(remainingHeight, bodySpriteInfo.height);
                let bodySegmentTex: PIXI.Texture;
                if (segmentHeight === bodySpriteInfo.height) {
                    bodySegmentTex = bodySpriteInfo.textures[0][0];
                } else {
                    // Only create new textures for custom dimensions
                    bodySegmentTex = new PIXI.Texture(
                        bodySpriteInfo.textures[0][0].baseTexture,
                        new PIXI.Rectangle(0, 0, bodySpriteInfo.width, segmentHeight),
                    );
                }
                const bodySegmentSprite = new PIXI.Sprite(bodySegmentTex);
                this.bodyTilingSprite.push(new GameSprite(bodySegmentSprite));

                remainingHeight -= segmentHeight;
            }
        }

        // Create the first (and sometimes only) segment of the body sprite
        const bodySpriteTex = new PIXI.Texture(
            bodySpriteInfo.textures[0][0].baseTexture,
            new PIXI.Rectangle(
                0, firstBodySegmentTexStartY,
                bodySpriteInfo.width, firstBodySegmentTexHeight,
            ));
        const bodySprite = new PIXI.Sprite(bodySpriteTex);
        this.bodySprite = new GameSprite(bodySprite);
        // Create the cap
        const bottomCapSprite = new PIXI.Sprite(capSpriteInfo.textures[0][0]);
        this.bottomCapSprite = new GameSprite(bottomCapSprite);

        // Configure the sprite positions after creating the GameSprites in case their
        // constructor does anything funky to the sprites.

        // Set the x based on the note track
        const laneIndex = directionToLaneIndex(this.direction);
        const laneX = LANE_MARGIN + (TAPNOTE_WIDTH_PX * laneIndex);
        bodySprite.x = laneX;
        if (this.bodyTilingSprite !== undefined) {
            this.bodyTilingSprite.forEach((gs) => gs.getSprite().x = laneX);
        }
        bottomCapSprite.x = laneX;

        // Make sure we anchor the Y to the top of each component so we have an easy time
        // with maths.
        bodySprite.anchor.y = 0;
        if (this.bodyTilingSprite !== undefined) {
            this.bodyTilingSprite.forEach((gs) => gs.getSprite().anchor.y = 0);
        }
        bottomCapSprite.anchor.y = 0;

        this.updateSprites();
    }

    public destroy() {
        this.removeFromStage();
        super.destroy();
    }

    public isOnStage() { return this.onStage; }
    public addToStage() {
        if (this.onStage) { return this; }

        this.onStage = true;
        // It is very important that the bottom cap is added first
        // If Z indexing is disabled this is the only way to ensure it draws below.
        this.bottomCapSprite.addToStage();
        if (this.bodyTilingSprite !== undefined) {
            this.bodyTilingSprite.forEach((gs) => gs.addToStage());
        }
        this.bodySprite.addToStage();
        return this;
    }
    public removeFromStage() {
        if (!this.onStage) { return this; }

        this.onStage = false;
        this.bottomCapSprite.removeFromStage();
        if (this.bodyTilingSprite !== undefined) {
            this.bodyTilingSprite.forEach((gs) => gs.removeFromStage());
        }
        this.bodySprite.removeFromStage();
        return this;
    }

    public update(deltaTime: number): this {
        this.updateSprites();
        return this;
    }

    private calculateLongNoteHeight() {
        const peakYOffset = {value: 0};
        const isPastPeakOut = {value: false};
        // Add the RECEPTOR_MARGIN_TOP_PX because the beat is synced to the top of the view screen
        // and we want it synced to the receptors.
        const headYPos = ArrowEffects.getYOffset(
            this.noteBeat, peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;
        const capYPos = ArrowEffects.getYOffset(
            this.noteBeat + this.duration,
            peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;
        // Because we anchor to the top of the bottom cap we need to subtract half the height
        // to get it to line up with where it should be placed.
        return capYPos - headYPos - (HOLD_BOTTOM_CAP_HEIGHT_PX / 2);
    }

    private updateSprites() {
        const peakYOffset = {value: 0};
        const isPastPeakOut = {value: false};
        // Add the RECEPTOR_MARGIN_TOP_PX because the beat is synced to the top of the view screen
        // and we want it synced to the receptors.
        const headYPos = ArrowEffects.getYOffset(
            this.noteBeat, peakYOffset, isPastPeakOut) + RECEPTOR_MARGIN_TOP_PX;

        // Add the non tiling part of the sprite directly at the top
        const bodySprite = this.bodySprite.getSprite();
        bodySprite.y = headYPos;

        // If applicable, update the tiling portion
        if (this.bodyTilingSprite !== undefined) {
            let tilingPosY = headYPos + bodySprite.height;
            this.bodyTilingSprite.forEach((gs) => {
                gs.getSprite().y = tilingPosY;
                tilingPosY += gs.getSprite().height;
            });
        }

        this.bottomCapSprite.setPosY(headYPos + this.height);
    }
}
export default BodyAndCapNote;
