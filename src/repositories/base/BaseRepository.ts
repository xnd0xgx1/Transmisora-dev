export abstract class BaseRepository<T> {

    public readonly collection;

    constructor(collection: T) {
        this.collection = collection;
    }

    /**
     * create a new Object.
     * 
     * @param obj 
     * @returns 
     */
    create(obj: T): Promise<T> {
        let objN = new this.collection(obj);
        return objN.save();
    }

    /**
     * Get all objects.
     * 
     * @returns 
     */
    getAll(): Promise<T[]> {
        return this.collection.find();
    }

    /**
     * Gets an object based on its ID.
     * 
     * @param id 
     * @returns 
     */
    getById(id: string): Promise<T> {
        return this.collection.findById(id);
    }

    /**
     * Update the object.
     * 
     * @param obj 
     * @returns 
     */
    async update(obj: any): Promise<T> {
        let objDb = await this.collection.findById(obj._id);
        if (objDb !== undefined) {
            Object.assign(objDb, obj);
            return objDb.save();
        }
        else
            return obj;
    }

    /**
     * Delete an object.
     * 
     * @param id 
     * @returns 
     */
    async delete(id: string): Promise<boolean> {
        return await this.collection.deleteOne({ _id: id });
    }
}
