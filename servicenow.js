const rateLimit = require('axios-rate-limit')
const superagent = require('superagent-use')(require('superagent'))
const Throttle = require('superagent-throttle')
const { Basic, Bearer } = require('superagent-authorization')
const prefix = require('superagent-prefix')

let throttle = new Throttle({
    active: true,     // set false to pause queue
    rate: 5,          // how many requests can be sent every `ratePer`
    ratePer: 10000,   // number of ms in which `rate` requests may be sent
    concurrent: 2     // how many requests can be sent concurrently
})

function ServiceNow(host, username, password) {
    if (!this.agent) {
        this.agent = superagent
            .use(prefix(`https://${getInstance(host)}/api/now/v2/table/`))
            .use(throttle.plugin())
            .use(Basic(username, password))
    }
}

const getInstance = instance => instance.indexOf(".") >= 0 ? instance : `${instance}.service-now.com`

//GET - Sample data to check the fields and filters
ServiceNow.prototype.getSampleData = function (type, callback) {
    const url = `${type}?sysparm_limit=1`
    return axios(options)
}

//GET-Service now Table data
ServiceNow.prototype.getTableData = function (fields, filters, type, limit) {
    let sysparm_fields = 'sysparm_fields=';
    let sysparm_query = 'sysparm_query=';
    let sysparm_limit = 'sysparm_limit=';
    let url = `/${type}?sysparm_display_value=false&sysparm_input_display_value=true`;
    if (fields.length > 0) {
        fields.forEach(field => {
            sysparm_fields += field + ','
        });
        sysparm_fields = sysparm_fields.replace(/,\s*$/, "");
        url = `${url}&${sysparm_fields}`;
    }
    if (filters.length > 0) {
        filters.forEach(filter => {
            sysparm_query += filter + '^'
        });
        sysparm_query = sysparm_query.replace(/\^\s*$/, "");
        url = `${url}&${sysparm_query}`;
    }

    if (limit > 0) {
        sysparm_limit += limit;
        url = `${url}&${sysparm_limit}`;
    }

    return this.agent.get(url)
        .then(function (response) {
            if (response.status === 200) {
                return response._body.result
            }
        })
}

//GET-Service now Table data
ServiceNow.prototype.getRecord = function (fields, filters, type, limit) {
    // let sysparm_fields = 'sysparm_fields=';
    // let sysparm_query = 'sysparm_query=';
    // let sysparm_limit = 'sysparm_limit=';
    let url = `/${type}`;
    // if (fields.length > 0) {
    //     fields.forEach(field => {
    //          += field + ','
    //     });
    //     sysparm_fields = sysparm_fields.replace(/,\s*$/, "");
    //     url = `${url}&${sysparm_fields}`;
    // }
    // if (filters.length > 0) {
    //     filters.forEach(filter => {
    //         sysparm_query += filter + '^'
    //     });
    //     sysparm_query = sysparm_query.replace(/\^\s*$/, "");
    //     url = `${url}&${sysparm_query}`;
    // }

    // if (limit > 0) {
    //     sysparm_limit += limit;
    //     url = `${url}&${sysparm_limit}`;
    // }

    return this.agent
        .query('sysparm_fields=', fields.join(','))
        .query('sysparm_query=', filters.join(','))
        .query('sysparm_limit=', limit)
        .query('sysparm_display_value=', 'false')
        .query('sysparm_input_display_value=', 'true')
        .get(url)
        .then(function (response) {
            if (response.status === 200) {
                return response.body.result[0]
            }
        })
}


//POST- Create new record in ServiceNow Table
ServiceNow.prototype.createNewRecord = function (data, type, callback) {
    const url = `/${type}?sysparm_input_display_value=true&sysparm_display_value=true`
    return this.agent.post(url)
        .then(function (response) {
            if (response.status === 200) {
                return response._body.result
            }
        })
}

//GET- Sysid for table records for reference
ServiceNow.prototype.getSysId = function (type, number) {
    const url = `/${type}?sysparm_query=number=${number}&sysparm_fields=sys_id`
    return this.agent.get(url)
        .then(function (response) {
            if (response.status === 200) {
                return response._body.result[0].sys_id
            }
        })
}

//POST - Update task record in ServiceNow
ServiceNow.prototype.UpdateRecord = function (type, sys_id, data) {
        const url = `/${type}/${sys_id}`
        return self.agent.put(url)
        .query({sysparm_query: `sys_id=${sys_id}`})
            .query({sysparm_input_display_value: true})
            .query({sysparm_display_value: true})
            .withCredentials()
            .send(data)
            .then(function (response) {
                if (response.status === 200) {
                    return response.body.result
                }
            })
        
}

//DELETE - Delete record from Servicenow table
ServiceNow.prototype.DeleteRecord = function (type, number, callback) {
    this.getSysId(type, number, (sys_id) => {
        const options = {
            url: `https://${getInstance(this.instance)}/api/now/table/${type}/${sys_id}`,
            method: 'delete',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            },
            auth: {
                username: `${this.userid}`,
                password: `${this.password}`
            }
        }
        axios(options).then((val) => {
            var res = {
                raw: val,
                status: val.status
            }
            if (callback == undefined) {
                console.log();
                console.log('Fix below errors');
                console.log();
                console.log('(1) ==> Cannot find Callback function...');
                console.log('*********** Sample Request **********');
                console.log(`ServiceNow.DeleteTask('incident','INC0010006',(res)=>console.log(res))`);
                console.log();
            } else {
                callback(res);
            }
        }).catch((err) => {
            if (callback == undefined) {
                console.log();
                console.log('Fix below errors');
                console.log();
                console.log('(1) ==> Cannot find Callback function...');
                console.log('*********** Sample Request **********');
                console.log(`ServiceNow.DeleteTask('incident','INC0010006',(res)=>console.log(res))`);
                console.log();
                console.log('(2) ==> Bad Request...');
                console.log(err);
            } else {
                callback(err);
            }
        });
    });
}

//GET - Get Attachment metadata
ServiceNow.prototype.getAttachmentMetaData = function (sys_id, callback) {
    const options = {
        url: `https://${getInstance(this.instance)}/api/now/attachment/${sys_id}`,
        method: 'get',
        auth: {
            username: `${this.userid}`,
            password: `${this.password}`
        }
    };
    axios(options).then((val) => {
        if (callback == undefined) {
            console.log();
            console.log('Fix below errors');
            console.log();
            console.log('(1) ==> Cannot find Callback function...');
            console.log('*********** Sample Request **********');
            console.log(`ServiceNow.getAttachmentMetaData('0254de0c4f889200086eeed18110c74c',(res)=>console.log(res))`);
            console.log();
        } else {
            callback(val.data.result);
        }
    }).catch((err) => {
        if (callback == undefined) {
            console.log();
            console.log('Fix below errors');
            console.log();
            console.log('(1) ==> Cannot find Callback function...');
            console.log('*********** Sample Request **********');
            console.log(`ServiceNow.getAttachmentMetaData('0254de0c4f889200086eeed18110c74c',(res)=>console.log(res))`);
            console.log();
            console.log('(2) ==> Bad Request...');
            console.log(err);
        } else {
            callback(err);
        }
    });
}

//GET - Get All Attachments metadata from table_sys_id
ServiceNow.prototype.getAllAttachmentsMetaData = function (table_sys_id, callback) {
    const options = {
        url: `https://${getInstance(this.instance)}/api/now/attachment?table_sys_id=${table_sys_id}`,
        method: 'get',
        auth: {
            username: `${this.userid}`,
            password: `${this.password}`
        }
    };
    axios(options).then((val) => {
        if (callback == undefined) {
            console.log();
            console.log('Fix below errors');
            console.log();
            console.log('(1) ==> Cannot find Callback function...');
            console.log('*********** Sample Request **********');
            console.log(`ServiceNow.getAllAttachmentsMetaData('a83820b58f723300e7e16c7827bdeed2',(res)=>console.log(res))`);
            console.log();
        } else {
            callback(val.data.result);
        }
    }).catch((err) => {
        if (callback == undefined) {
            console.log();
            console.log('Fix below errors');
            console.log();
            console.log('(1) ==> Cannot find Callback function...');
            console.log('*********** Sample Request **********');
            console.log(`ServiceNow.getAllAttachmentsMetaData('a83820b58f723300e7e16c7827bdeed2',(res)=>console.log(res))`);
            console.log();
            console.log('(2) ==> Bad Request...');
            console.log(err);
        } else {
            callback(err);
        }
    });
}

//GET - Get Attachment
ServiceNow.prototype.getAttachment = function (sys_id, callback) {
    const options = {
        url: `https://${getInstance(this.instance)}/api/now/attachment/${sys_id}/file`,
        method: 'get',
        auth: {
            username: `${this.userid}`,
            password: `${this.password}`
        }
    };
    axios(options).then((val) => {
        if (callback == undefined) {
            console.log();
            console.log('Fix below errors');
            console.log();
            console.log('(1) ==> Cannot find Callback function...');
            console.log('*********** Sample Request **********');
            console.log(`ServiceNow.getAttachmentMetaData('0254de0c4f889200086eeed18110c74c',(res)=>console.log(res))`);
            console.log();
        } else {
            callback(val);
        }
    }).catch((err) => {
        if (callback == undefined) {
            console.log();
            console.log('Fix below errors');
            console.log();
            console.log('(1) ==> Cannot find Callback function...');
            console.log('*********** Sample Request **********');
            console.log(`ServiceNow.getAttachmentMetaData('0254de0c4f889200086eeed18110c74c',(res)=>console.log(res))`);
            console.log();
            console.log('(2) ==> Bad Request...');
            console.log(err);
        } else {
            callback(err);
        }
    });
}

ServiceNow.prototype.getChangeTasks = function (type, number, callback) {
    const options = {
        url: `https://${getInstance(this.instance)}/api/now/table/${type}?change_request=${number}&sysparm_fields=number,sys_id`,
        method: 'get',
        auth: {
            username: `${this.userid}`,
            password: `${this.password}`
        }
    };
    axios(options).then((val) => {
        if (callback == undefined) {
            console.log();
            console.log('Fix below errors');
            console.log();
            console.log('(1) ==> Cannot find Callback function...');
            console.log('*********** Sample Request **********');
            console.log(`ServiceNow.getChangeTasks('change_task', 'CHG0000016', (res)=>console.log(res))`);
            console.log();
        } else {
            callback(val.data.result);
        }
    }).catch((err) => {
        if (callback == undefined) {
            console.log();
            console.log('Fix below errors');
            console.log();
            console.log('(1) ==> Cannot find Callback function...');
            console.log('*********** Sample Request **********');
            console.log(`ServiceNow.getChangeTasks('change_task', 'CHG0000016', (res)=>console.log(res))`);
            console.log();
            console.log('(2) ==> Bad Request...');
            console.log(err);
        } else {
            callback(err);
        }
    });
};

module.exports = ServiceNow;
