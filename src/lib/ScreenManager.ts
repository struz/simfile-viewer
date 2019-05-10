import * as PIXI from 'pixi.js';

import DownReceptor from '@/assets/noteskins/USWCelETT/_Down_Receptor_Go_4x1.png';
import DownTapNote from '@/assets/noteskins/USWCelETT/_Down_Tap_Note_16x8.png';
import RESOURCEMAN from './ResourceManager';

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
    /** Have we finished loading our assets? */
    private readyToDraw = false;

    /** Created sprites, stored by name. */
    private sprites: Map<string, PIXI.Sprite> = new Map();

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
}
const SCREENMAN = ScreenManager.getInstance();
export default SCREENMAN;

// TODO: ScreenManager should just have an update function which controls everything based on external representation.
// Its job is to expire arrow visual representations when no longer necessary, etc.
