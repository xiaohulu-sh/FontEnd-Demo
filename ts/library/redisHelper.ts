const sd = require('silly-datetime');
import redis from 'redis';

export class redisHelper{
    private static redisClient:redis.RedisClient;
    private static redis_conf:any;

    public static _expire_t = 300;//一天半
    public static _expire_middle_t = 43200;//12h
    public static _expire_short_t = 300;

    public static P_DATA_POOL = 'dp_';

    /**
     * 
     * @param mq_conf 单例模式
     */
    static async getInstance(redis_conf:any){
        this.redis_conf = redis_conf;
        if(this._empty(this.redisClient)){
            try {
                this.redisClient = await redis.createClient(this.redis_conf);
            } catch (error) {
                // console.log(`MQ ERR: ${error}`);
                process.exit(1);
            }
        }
        return this.redisClient;
    }

    public static async get(key: string) {
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.get(key, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async set(key: string, val:string) {
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.set(key,val, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }
    public static async ttl(key: string) {
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.ttl(key, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async keys(key: string) {
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.keys(key, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async hmget(key: string, arys:Array<string>) {
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.hmget(key, arys, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async hmset(key:string, obj:any){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.hmset(key, obj, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async hlen(key:string){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.hlen(key, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }
    public static async setex(key:string, seconds:number, value:string|number|any){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.setex(key, seconds, value, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }
    public static async del(keys:Array<string>|string){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.del(keys);
            resolve();
        });
    }
    public static async mget(keys:Array<string>){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.mget(keys, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }
    public static async hset(key:string, field:string, value:string){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.hset(key, field, value, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }
    
    public static async expire(key:string, seconds:number){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.expire(key, seconds, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async exists(key:string){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.exists(key, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async lrange(key:string, start:number, stop:number){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.lrange(key, start, stop, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }
    public static async hexists(key:string, field:any){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.hexists(key, field, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }
    public static async hget(key:string, field:string){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.hget(key,field, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async multi_watch(key:string, seconds:number){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.watch(key);
            client.multi()
            .incr(key, function (error:any, reply:any){
            })
            .expire(key, seconds, (error:any, reply:any)=>{
             })
            .exec(function (error:any, reply:any){
                resolve(reply);
            });
        });
    }

    public static async hgetall(key:string){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.hgetall(key, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async hkeys(key:string){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.hkeys(key, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            });
        });
    }

    public static async lpush(key:string, k:string){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.lpush(key, k, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            })
        });
    }

    public static async zadd(kv:any){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.zadd(kv, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            })
        });
    }
    public static async zcount(key:string, min:string|number, max:string|number){
        return new Promise( async(resolve, reject) => {
            let client = await this.getInstance(this.redis_conf);
            client.zcount(key, min, max, function(error:any, reply:any){
                if (error) {
                    console.log(`[${sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss')}]ERR: ${error}`);
                    reject(error);
                } else {
                    resolve(reply);
                }
            })
        });
    }

    private static _empty(obj:any){
        if(obj == '' && obj !== 0){
            return true;
        }
        if(obj == null){
            return true;
        }
        if(obj == undefined){
            return true;
        }
        if(typeof obj == 'object'){
            let len = Object.keys(obj).length;
            if(len > 0){
                return false;
            }
            len = obj.size;
            if(len == undefined || len == 0){
                return true;
            }
        }
        return false;
    }
}