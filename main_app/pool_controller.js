const workerPool = require('workerpool');

let proxyPool = null;

const init = async (opts)=>{
    const pool = workerPool.pool('./dic_worker.js',opts);
    proxyPool = await pool.proxy();

}

const get = () =>{
    return proxyPool;
}

exports.init = init;
exports.get = get;