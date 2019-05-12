import Entity from './Entity';

interface ScreenManagerOptions {
    renderCanvas: HTMLCanvasElement;
    width: number;
    height: number;
}

/** Responsible for managing all game entities. */
export class EntityManager {
    // Singleton
    public static getInstance() {
        if (!EntityManager.instance) {
            EntityManager.instance = new EntityManager();
        }
        return EntityManager.instance;
    }
    private static instance: EntityManager;

    private entities: Entity[] = [];

    // Private constructor for singleton
    private constructor() {}

    public registerEntity(entity: Entity) {
        this.entities.push(entity);
        return this;
    }

    public deregisterEntity(entity: Entity) {
        for (let i = 0; i < this.entities.length; i++) {
            if (this.entities[i] === entity) {
                // TODO: Not the most efficient implementation. Change later.
                this.entities.splice(i, 1);
            }
        }
        return this;
    }

    /** Update all the entities we know about. */
    public update(deltaTime: number) {
        this.entities.forEach((entity) => {
            entity.update(deltaTime);
        });
        return this;
    }
}
const ENTITYMAN = EntityManager.getInstance();
export default ENTITYMAN;
