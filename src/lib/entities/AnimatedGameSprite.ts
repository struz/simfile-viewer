import * as PIXI from 'pixi.js';
import { GameSpriteInfo } from '../ResourceManager';
import GameSprite from './GameSprite';

// Abstract class to parent all sprite subsets
abstract class AnimatedGameSprite extends GameSprite {
    protected sprite: PIXI.AnimatedSprite;

    public constructor(spriteInfo: GameSpriteInfo, spriteIndex = 0) {
        const sprite = new PIXI.AnimatedSprite(spriteInfo.textures[spriteIndex]);
        super(sprite);
        this.sprite = sprite;

        // Translate frames of animation into an animation speed modifier
        this.sprite.animationSpeed = 1 / spriteInfo.animLength;
        this.sprite.loop = spriteInfo.animLoop;
    }

    public getSprite(): PIXI.AnimatedSprite {
        return this.sprite;
    }
}
export default AnimatedGameSprite;
