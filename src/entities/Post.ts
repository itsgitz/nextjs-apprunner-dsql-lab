import { Entity, Property, PrimaryKey } from "@mikro-orm/core";
import { uuidv7 } from "uuidv7";

@Entity()
export class Post {
    @PrimaryKey({ type: "uuid" })
    id: string = uuidv7();

    @Property({ type: "string", length: 255 })
    title!: string;

    @Property({ type: "text" })
    content!: string;

    @Property({ type: "string", length: 100, nullable: true })
    author?: string;

    @Property({ columnType: "boolean", default: false })
    published: boolean = false;

    @Property({ columnType: "timestamp", defaultRaw: "CURRENT_TIMESTAMP" })
    createdAt?: Date = new Date();

    @Property({
        columnType: "timestamp",
        defaultRaw: "CURRENT_TIMESTAMP",
        onUpdate: () => new Date(),
    })
    updatedAt?: Date = new Date();
}
