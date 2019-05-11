import * as PIXI from 'pixi.js';
import RESOURCEMAN, { GameSpriteInfo } from '../ResourceManager';
import SCREENMAN from '../ScreenManager';

// Abstract class to parent all sprite subsets
abstract class GameSprite {
    public static checkDependencies() {
        // We can't do anything if the resource manager isn't initialised
        if (!RESOURCEMAN.isDoneLoading()) { throw new Error('RESOURCEMAN has not finished loading'); }
    }

    protected sprite: PIXI.AnimatedSprite;
    protected spriteDef: GameSpriteInfo;

    public constructor(spriteInfo: GameSpriteInfo, spriteIndex = 0) {
        this.spriteDef = spriteInfo;
        this.sprite = new PIXI.AnimatedSprite(this.spriteDef.textures[spriteIndex]);

        // Anchor rotation around the center point
        this.sprite.anchor.x = 0.5;
        this.sprite.anchor.y = 0.5;

        // Translate frames of animation into an animation speed modifier
        this.sprite.animationSpeed = 1 / this.spriteDef.animLength;
        this.sprite.loop = spriteInfo.animLoop;
    }

    public getSprite() { return this.sprite; }
    public setPos(x: number, y: number) {
        this.sprite.x = x;
        this.sprite.y = y;
        return this;
    }
    public setPosX(x: number) {
        this.sprite.x = x;
        return this;
    }
    public setPosY(y: number) {
        this.sprite.y = y;
        return this;
    }
    public addToStage() {
        SCREENMAN.getPixiApp().stage.addChild(this.sprite);
        return this;
    }
}
export default GameSprite;
