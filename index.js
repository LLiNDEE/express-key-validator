const storedRules = []
const connected_keys = []

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
        min: function(val){
            if(isNumber(val))this.TempRules.push(`min(${val})`)
            return this
        },
        max: function(val){
            if(isNumber(val)) this.TempRules.push(`max(${val})`)
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
    if(!missingParams.success){
        return res.status(400).send({
            type: 'missing_param(s)',
            success: false,
            missing_params: missingParams?.missingParams
        })
    }

    const invalidParams = checkInvalidParams(req.body, expected_keys)


    if(!invalidParams.success){
        return res.status(400).send({
            type: 'invalid_param(s)',
            success: false,
            invalid_params: invalidParams.invalidParams
        })
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
                    return invalidParams.push({[k]: {'expected_type(s)': `${(ruleArr[0] === 'min') ? `Minimum length of ${value}` : `Maximum length of ${value}`}`}})
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

const validateType = {
    String: v => isString(v) && v.trim() !== "",
    Integer: v => isNumber(+v),
    min: (v, m) => checkMinValue(v, m),
    max: (v, m) => checkMaxValue(v, m),
}


const isNumber = v => typeof v === 'number' && !isNaN(v) && v
const isNull = v => v === null
const isUndefined = v => v === undefined
const isNullish = v => v == undefined
const isObject = v =>  !!v && typeof v === 'object' && !Array.isArray(v)
const isString = v =>  typeof v === 'string'
const isFunction = v =>  typeof v === 'function'
const isArray = v =>  Array.isArray(v)
const isBoolean = v => typeof v === 'boolean'
const isUpperCase = v => v === v.toUpperCase()
const isLowerCase = v => v === v.toLowerCase()

const checkMinValue = (value, minValue) => value.length >= minValue && value && minValue
const checkMaxValue = (value, maxValue) => value.length <= maxValue && value && maxValue