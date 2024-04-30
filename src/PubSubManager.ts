import { createClient, RedisClientType } from "redis"
export class PubSubManager {
    private static instance:PubSubManager;
    private redisClient: RedisClientType;
    private subscriptions: Map<string, string[]>;

    // Private constructor to prevent direct construction calls with the `new` operator
    private constructor() {
        this.redisClient = createClient();
        this.redisClient.connect();
        this.subscriptions = new Map();
    }
    // The static method that controls the access to the singleton instance
    public static getInstance(): PubSubManager {
        if(!PubSubManager.instance){
            PubSubManager.instance = new PubSubManager();
        }
        return PubSubManager.instance;
    }

    userSubscribe(userId:string, stock:string){
        if (!this.subscriptions.has(stock)) {
            this.subscriptions.set(stock, []);
        }
        this.subscriptions.get(stock)?.push(userId);
        if (this.subscriptions.get(stock)?.length===1) {
            this.redisClient.subscribe(stock, (message)=>{
                this.handleMessage(stock, message)
            })
        }
    }

    // Define the method that will be called when a message is published to the subscribed channel
    private handleMessage(stock: string, message: string){
        console.log(`Message received on channel ${stock}: ${message}`);
        this.subscriptions.get(stock)?.forEach((sub)=>{
            console.log(`Sending message to user: ${sub}`);
        })
    }


    userUnSubscribe(userId:String, stock:string){
        this.subscriptions.set(stock, this.subscriptions.get(stock)?.filter((sub)=> sub !==userId) || []);
        if(this.subscriptions.get(stock)?.length===0){
            this.redisClient.unsubscribe(stock);
            console.log(`UnSubscribed to Redis channel: ${stock}`);
        }
    }

    // Cleanup on instance destruction
    public async disconnect() {
        await this.redisClient.quit();
    }
}