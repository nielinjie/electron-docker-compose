const homeUrl = 'http://localhost'
module.exports = {
    defaultPort: 3000,
    homeUrl:function(foundPort){
        return `${homeUrl}:${foundPort}`
    },
    healthUrl:function(foundPort){
        return `${homeUrl}:${foundPort}`
    },
    //TODO: 增加传入到compose文件的e的定制化。
}