import process from 'process';
const conf = require('../config.json');
const Inert = require('@hapi/inert');
const Vision = require('@hapi/vision');
const Pack = require('../package.json');
import Path from "path";
import hapi from "@hapi/hapi";
const HapiSwagger = require('hapi-swagger');
import {redisHelper} from './library/redisHelper';

import { routes } from './routes';
import { utils } from './library/utils';

(async () => {
    let host = conf['rpcHost'];
    let port = conf['rpcPort'];
    let schemes = conf['schemes']==undefined?['https']:conf['schemes'];

    let defaultLocalhost = `${host}:${port}`;
    let localhost = conf['localhost'];
    let islhPort = conf['islhPort'];
    let customLocalhost = `${localhost}:${port}`;
    if(islhPort!=undefined){
        if(islhPort){
            customLocalhost = `${localhost}:${port}`;
        }else{
            customLocalhost = localhost;
        }
    }
    localhost = conf['localhost']==undefined?defaultLocalhost:customLocalhost;
    let redis_client = await redisHelper.getInstance(conf['redis']);
    redis_client.on("error", function(error){
        console.log(error);
        process.exit(1);
    })

    const swaggerOptions = {
        info: {
            title: 'XHL Oauth2.0 API',
            version: Pack.version,
        },
        host : localhost,
        schemes : schemes,
        tags:[
            {name:"v1_api", description:"中台数据"},
        ]
    };
    let server = new hapi.Server({
        port:port,
        host:host,
        routes: {
            state: {
                parse: true,
                failAction: 'ignore'
            },
            cors:true
        }
    });

    await server.register([
        Inert,
        Vision,
        {
            plugin: HapiSwagger,
            options: swaggerOptions
        }
    ]);
    server.route({
        method: 'GET',
        path: '/{param*}',
        handler: {
            directory: {
                defaultExtension: 'html',
                path: Path.join(__dirname, '../public')
            }
        }
    });

    await routes.v1_api(server);

    const init = async () => {
        try {
            await server.start();
        }
        catch (error) {
            console.log('init start');
            console.log(error);
            console.log('init end');
            process.exit(1);
        }
        console.log(`Server running at: ${server.info.uri}`);
        console.log(`Server running at: ${server.info.uri}/documentation`);
    };
    process.on('unhandledRejection', (error:any, promise:any) => {
        console.error('unhandledRejection start');
        console.error(error);
        console.error(promise);
        console.error('unhandledRejection end');
        process.exit(1);
    });
    process.on('uncaughtException', (error:any) => {
        console.error('uncaughtException start');
        console.error(error);
        console.error('uncaughtException end');
        process.exit(1);
    });
    init();
})();