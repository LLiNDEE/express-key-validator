const storedRules = []
const connected_keys = []
let response_options = []

const validResponseOptions = {
    detailed: 'detailed',
    layout: 'layout',
}

const Response = {
    Options: function(options) {
        Object.entries(options).forEach(([k, v]) => {
            if(validResponseOptions[k]) response_options.push({[k]: v})
        })
    },
    GetOptions: function(){
        return response_options
    }
}

const Validator = {
    storedRules: [],
    connected_keys: [],
    Schema: {
        count: 0,
        TempRules: [],
        StoredRules: [],
        isString: function(){
            this.TempRules.push("String")
            return this
        },
        isInteger: function(){
            this.TempRules.push("Integer")
            return this
        },
        min: function(value){
            if(isNumber(val))this.TempRules.push(`min(${value})`)
            return this
        },
        max: function(value){
            if(isNumber(val)) this.TempRules.push(`max(${value})`)
            return this
        },
        enum: function(values){
            if(isArray(values)) this.TempRules.push(`enum(${values})`)
            return this
        },
        isEmail: function(){
            this.TempRules.push("Email")
            return this
        },
        exec: function () {
            storedRules.push(this.TempRules)
            this.count = this.count + 1
            this.TempRules = []
            return this
        },
        Create: function(schema){
            Object.entries(schema).forEach(([k, v], index) => {
                schema[k] = storedRules[index]
            })
            return schema
        },
    },
    Route:{
        Connect: function (route, schema) {
            connected_keys.push({[route]: schema})
        },
    },
    validateKeys,
    Response,

}

module.exports = Validator

//** ----MIDDLEWARE---- */

function validateKeys(req, res, next){

    if (req.method !== "POST") return next()

    let expected_keys
    const path = req.originalUrl
    const keys = connected_keys

    Object.entries(keys).forEach(([k, schema]) => {
        Object.entries(schema).forEach(([route, v]) => {
            if(route === path) expected_keys = v
        })
    })

    if(!expected_keys) return next()

    const missingParams = getMissingParams(req.body, expected_keys)
    if(!missingParams.success) return res.status(400).send(generateError('missing_param(s)', {missing_params: missingParams.missingParams}))

    const invalidParams = checkInvalidParams(req.body, expected_keys)
    if(!invalidParams.success) {
    
        let renderDetailed = false

        response_options.forEach(option => {
            Object.entries(option).forEach(([k, v]) => {
                if(k === 'detailed' && v) renderDetailed = true
            })
        })

        if(!renderDetailed){
            const invalidKeys = []
            invalidParams.invalidParams.forEach(k => {
                Object.keys(k).forEach(key => invalidKeys.push(key))
            })
            return res.status(400).send(generateError('invalid_param(s)', {invalid_params: invalidKeys}))
        }

        return res.status(400).send(generateError('invalid_param(s)', {invalid_params: invalidParams.invalidParams}))
    }

    next()

}

const getMissingParams = (incomingKeys, expectedKeys) => {

    const keys = Object.keys(expectedKeys)
    const incoming_keys = Object.keys(incomingKeys)
    const missingParams = keys.filter(k => !incoming_keys.includes(k))
    if(missingParams.length > 0){
        return {
            success: false,
            missingParams: missingParams
        }
    }

    return {
        success: true
    }
}


const checkInvalidParams = (incomingKeys, expectedKeys) => {
    let isValid = true
    const invalidParams = []

    Object.entries(expectedKeys).forEach(([k, v]) => {
        v.forEach(rule => {
            const isDublicate = invalidParams.some(v => Object.keys(v).includes(k))

            if(rule.includes("(")) {
                const ruleArr = rule.split("(")
                const value = ruleArr[1].split(")")[0];
                if(!validateType[ruleArr[0]](incomingKeys[k], value) && !isDublicate){
                    isValid = false
                    // return invalidParams.push({[k]: {'expected_type(s)': `${(ruleArr[0] === 'min') ? `Minimum length of ${value}` : `Maximum length of ${value}`}`}})
                    return invalidParams.push({[k]: {'expected_type(s)': resolveInvalidMessage(ruleArr[0], value)}})
                }
                return
            }

            if(!validateType[rule](incomingKeys[k]) && !isDublicate){
                isValid = false
                return invalidParams.push({[k]: {'expected_type(s)': v} })
            }


        })
    })

    if(!isValid){
        return {
            success: false,
            invalidParams: invalidParams
        }
    }

    return {
        success: true
    }

}

const resolveInvalidMessage = (type, value) =>
type === 'min' ? `Minimum length of ${value}`
: type === 'max' ? `Maximum length of ${value}`
: type === 'enum' ? `Allowed values: ${value}`
: ""

const validateType = {
    String: v => isString(v) && v.trim() !== "",
    Integer: v => isNumber(+v),
    min: (v, m) => checkMinValue(v, m),
    max: (v, m) => checkMaxValue(v, m),
    enum: (v, enums) => checkEnum(v, enums),
    Email: email => checkEmail(email),
}

const generateError = (type, config) => {
    return {
        type: type,
        success: false,
        ...config
    }
}

const isNumber = v => typeof v === 'number' && !isNaN(v) && v
const isString = v =>  typeof v === 'string'
const isArray = v =>  Array.isArray(v)
const checkMinValue = (value, minValue) => value.length >= minValue && value && minValue
const checkMaxValue = (value, maxValue) => value.length <= maxValue && value && maxValue
const checkEnum = (value, enums) => enums.includes(value)
const checkEmail = email => email && email.includes("@") && email.includes('.') && email.length > 3 && email.match(regExpEmail)

const regExpEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/