const rateLimit = require('axios-rate-limit')
const axios = rateLimit(require('axios').create(), { maxRequests: 2, perMilliseconds: 1000, maxRPS: 2 });

function ServiceNow(instance, userid, password) {
    this.instance = axios.create(generateConfig)
}

const getInstance = instance => instance.indexOf(".") >= 0 ? instance : `${instance}.service-now.com`;

const generateConfig = function(instance, username, password) {
    if(!table) {
        throw new Error('must supply a table name')
    }

    if (!instance) {
        throw new Error('must supply and instance name')
    }

    return {
        baseUrl: `https://${instance}/api/now/v2/table/`,
        auth: {
            username: username,
            password: password
        }
    }
}

// Add custom network options
ServiceNow.prototype.setNetworkOptions = function (options) {
    if (Object.keys(options).length > 0) {
        return axios.create(options);
    } else {
        throw new Error("Invalid Options")
    }
}


//GET - Sample data to check the fields and filters
ServiceNow.prototype.getSampleData = function (type, callback) {
    const options = {
        url: `https://${this.instance}/api/now/v2/table/${type}?sysparm_limit=1`,
        method: 'get',
        auth: {
            username: `${this.userid}`,
            password: `${this.password}`
        }
    };
    return axios(options)
}

//GET-Service now Table data
ServiceNow.prototype.getTableData = function (fields, filters, type, limit) {
    let sysparm_fields = 'sysparm_fields=';
    let sysparm_query = 'sysparm_query=';
    let sysparm_limit = 'sysparm_limit=';
    let url = `${type}?sysparm_display_value=false&sysparm_input_display_value=true`;
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

    return this.instance.get(url)
}

//POST- Create new record in ServiceNow Table
ServiceNow.prototype.createNewTask = function (data, type, callback) {
    const options = {
        url: `https://${getInstance(this.instance)}/api/now/table/${type}?sysparm_input_display_value=true&sysparm_display_value=true`,
        method: 'post',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        },
        data: data,
        auth: {
            username: `${this.userid}`,
            password: `${this.password}`
        }
    }
    return axios(options)
}

//GET- Sysid for table records for reference
ServiceNow.prototype.getSysId = function (type, number) {
    const options = {
        url: `https://${getInstance(this.instance)}/api/now/v2/table/${type}?sysparm_query=number=${number}&sysparm_fields=sys_id`,
        method: 'get',
        auth: {
            username: `${this.userid}`,
            password: `${this.password}`
        }
    };
    return axios(options)
        .then(function(result) {
            return result.data.result[0].sys_id;
        })
}

//POST - Update task record in ServiceNow
ServiceNow.prototype.UpdateTask = function (type, number, data) {
    const self = this;
    this.getSysId(type, number)
        .then(function(sys_id) {
        const options = {
            url: `https://${getInstance(self.instance)}/api/now/table/${type}/${sys_id}?sysparm_input_display_value=true&sysparm_display_value=true`,
            method: 'put',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'Authorization': 'Basic '+btoa(username+':'+password)
            },
            data: data,
            // auth: {
            //     username: `${self.userid}`,
            //     password: `${self.password}`
            // }
        }
        return axios(options)
    });
}

//DELETE - Delete record from Servicenow table
ServiceNow.prototype.DeleteTask = function (type, number, callback) {
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
