// Interface for all objects that need to be manipulated via
// the game screen.
interface Drawable {
    isOnStage(): boolean;
    removeFromStage(): this;
    addToStage(): this;
    setVisibility(visible: boolean): this;
    setPosX(x: number): this;
    setPosY(y: number): this;
    setPos(x: number, y: number): this;
    getPos(): [number, number];
    play(): this;
    stop(): this;
}
export default Drawable;
