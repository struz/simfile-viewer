import * as PIXI from 'pixi.js';

import DownReceptor from '@/assets/noteskins/USWCelETT/_Down_Receptor_Go_4x1.png';
import DownTapNote from '@/assets/noteskins/USWCelETT/_Down_Tap_Note_16x8.png';
import RESOURCEMAN from './ResourceManager';
import TapNoteReceptorSprite from './entities/TapNoteReceptorSprite';
import { TapNoteDirection, TAPNOTE_WIDTH_PX } from './NoteTypes';

interface ScreenManagerOptions {
    renderCanvas: HTMLCanvasElement;
    width: number;
    height: number;
}

/** Responsible for drawing to the screen.
 * We only allow one ScreenManager and it gets initialised with
 * a canvas and PIXI hook later.
 */
export class ScreenManager {
    // Singleton
    public static getInstance() {
        if (!ScreenManager.instance) {
            ScreenManager.instance = new ScreenManager();
        }
        return ScreenManager.instance;
    }
    private static instance: ScreenManager;

    /** The Aplication object used to interact with PIXI */
    private pixiApp: PIXI.Application | null = null;
    /** Created sprites, stored by name. */
    private sprites: Map<string, PIXI.Sprite> = new Map();

    private receptorsVisible = false;
    private receptorSprites: TapNoteReceptorSprite[] = [];

    // Private constructor for singleton
    private constructor() {}

    public initPixi(options: ScreenManagerOptions) {
        // Create a new PIXI app.
        this.pixiApp = new PIXI.Application({
            width: options.width,
            height: options.height,
            view: options.renderCanvas,
            backgroundColor: 0x000000,
        });
        // Tell the resource manager it can load things now
        RESOURCEMAN.loadSprites();
        // Start the tick loop for animations and other such things
        this.pixiApp.ticker.start();
    }

    public isInit() { return this.pixiApp !== null; }
    public isReadyToDraw() { return this.isInit() && RESOURCEMAN.isDoneLoading(); }
    public getPixiApp() {
        if (this.pixiApp === null) {
            throw new Error('Tried to get null pixiApp. Use isInit() first to ensure it exists.');
        }
        return this.pixiApp;
    }

    public setBgColor(color: number) { this.getPixiApp().renderer.backgroundColor = color; }

    /** Draw the receptors to the screen. If they're already there do nothing. */
    public showReceptors() {
        // TODO: loop over numTracks
        if (this.receptorsVisible) { return; }
        if (this.receptorSprites.length === 0) {
            // Initialise them in arrow order <- v ^ ->
            const initOrder = [
                TapNoteDirection.LEFT,
                TapNoteDirection.DOWN,
                TapNoteDirection.UP,
                TapNoteDirection.RIGHT,
            ];
            // TODO: rework this to center based on the width of the stage
            const xOffset = 96;
            const yOffset = 16;
            for (let i = 0; i < initOrder.length; i++) {
                this.receptorSprites.push(
                    new TapNoteReceptorSprite(initOrder[i])
                    .setPos(
                        xOffset + 32 + (i * TAPNOTE_WIDTH_PX),
                        yOffset + 32)
                    .addToStage());
            }
        }
        for (const receptor of this.receptorSprites) {
            receptor.getSprite().visible = true;
        }
        this.receptorsVisible = true;
    }

    /** Hide the receptors from the screen. */
    public hideReceptors() {
        if (!this.receptorsVisible || this.receptorSprites.length === 0) { return; }
        for (const receptor of this.receptorSprites) {
            receptor.getSprite().visible = false;
        }
        this.receptorsVisible = false;
    }

    public update(deltaTime: number) {
        // TODO:
    }
}
const SCREENMAN = ScreenManager.getInstance();
export default SCREENMAN;

// TODO: ScreenManager should just have an update function which controls everything based on external representation.
// Its job is to expire arrow visual representations when no longer necessary, etc.
