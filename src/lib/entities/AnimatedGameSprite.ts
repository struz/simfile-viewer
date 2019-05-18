// import GameSprite from './GameSprite';
// import { GameSpriteInfo } from '../ResourceManager';

// // A game sprite, but animated. The underlying sprite *can* be a tiled sprite.
// // This is pretty much a reimplementation of a lot of PIXI.AnimatedSprite, so we
// // can have both animated and tiled sprites at once.
// class AnimatedGameSprite extends GameSprite {
//     private framesSinceLastAnimChange: number;
//     // Number of rendered frames @ 60fps to switch between keyframes
//     private animationSpeed: number;
//     private loop: boolean;
//     private currentFrame: number; // the current frame of animation playing
//     private tex

//     constructor(spriteInfo: GameSpriteInfo, spriteIndex = 0) {
//         super(spriteInfo, spriteIndex);

//         this.framesSinceLastAnimChange = 0;
//         this.currentFrame = 0;
//         this.animationSpeed = 1 / this.spriteDef.animLength;
//         this.loop = spriteInfo.animLoop;
//     }

//     public update(deltaTime: number): this {
//         // TODO: animation
//         const elapsed = this.animationSpeed * deltaTime;
//         const previousFrame = this.currentFrame;
//         return this;
//     }
// }
// export default AnimatedGameSprite;

// TODO: how do we do an animated AND tiled sprite, efficiently, without wanting to kill ourselves?
// TODO: will require googling