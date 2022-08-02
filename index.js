import { getMissingParams, checkInvalidParams, generateError, getUnknownParams, customTemplates, generateCustomTemplate, readConfig} from "./helpers.js";

const connected_keys = [];
const response_options = []
export let strictMode = false;
let secureMode = false;

const validResponseOptions = {
    detailed: 'detailed',
}

const Response = {
    Options: function(options) {
        Object.entries(options).forEach(([k, v]) => {
            if(validResponseOptions[k]) response_options.push({[k]: v})
        })
    },
    GetOptions: function(){
        return response_options
    },
    useCustomTemplate: function () {
        readConfig()
    }
}

class Validator {
    rules = [];
    string(){
        this.rules.push({rule: 'string'});
        return this;
    }
    integer(){
        this.rules.push({rule: 'integer'});
        return this;
    }
    min(minValue){
        this.rules.push({rule: 'min', value: minValue});
        return this;
    }
    max(maxValue){
        this.rules.push({rule: 'max', value: maxValue});
        return this;
    }
    enum(args){
        this.rules.push({rule: 'enum', value: args});
        return this;
    }
    email(object){
        this.rules.push({rule: 'email', ...object});
        return this;
    }
    positive(){
        this.rules.push({rule: 'positive'});
        return this;
    }
    negative(){
        this.rules.push({rule: 'negative'});
        return this;
    }
    required(){
        this.rules.push({rule: 'required'});
        return this;
    }
    lowercase(){
        this.rules.push({rule: 'lowercase'});
        return this;
    }
    uppercase(){
        this.rules.push({rule: 'uppercase'});
        return this;
    }
    trim(){
        this.rules.push({rule: 'trim'});
        return this;
    }
    default(value){
        this.rules.push({rule: 'default', value: value});
        return this;
    }
    regex(value){
        this.rules.push({rule: 'regex', value: value})
        return this;
    }
    Route = {
        Connect: function(route, schema){
            connected_keys.push({[route]: schema});
        }
    }
    Schema(){
        return {
            Create: function(schema){
                return schema;
            }
        };
    }
    useStrictMode(value){
        strictMode = !!value;
        return this;
    }
    useSecureMode(value){
        secureMode = !!value;
        return this;
    }
    validateKeys = validateKeys;
    Response = Response;
}

export default Validator

function validateKeys(req, res, next){

    let expected_keys
    const keys = connected_keys

    const path = req.originalUrl

    Object.entries(keys).forEach(([k, schema]) => {
        Object.entries(schema).forEach(([route, v]) => {
            if(route === path) expected_keys = v
        })
    })

    if(!expected_keys) return next();

    if(secureMode){
        const unknownParams = getUnknownParams(req.body, expected_keys);
        if(!unknownParams.success){

            if(customTemplates?.unknown_params) return res.status(400).send(generateCustomTemplate(customTemplates.missing_params, unknownParams.unknownParams));

            return res.status(400).send(generateError('unknown_param(s)', {unknown_params: unknownParams.unknownParams}));
        }
    }

    const missingParams = getMissingParams(req.body, expected_keys)
    if(!missingParams.success){

        let useTemplate = false;

        if(customTemplates?.missing_params) useTemplate = generateCustomTemplate(customTemplates.missing_params, missingParams.missingParams);

        const requiredParams = [];
        let mp = missingParams.missingParams;
        mp.forEach(param => {
            const paramRules = expected_keys[param].rules;
            paramRules.forEach(rule => {
                if(rule.rule === 'required') requiredParams.push(param);
            })
            if(paramRules.includes('required')) requiredParams.push(param);
        })

        if(strictMode){
            if(useTemplate) return res.status(400).send(useTemplate);
            return res.status(400).send(generateError('missing_param(s)', {missing_params: missingParams.missingParams}));
        }
        if(requiredParams.length > 0) return useTemplate ? res.status(400).send(useTemplate) : res.status(400).send(generateError('missing_param(s)', {missing_params: requiredParams}));
    }

    const invalidParams = checkInvalidParams(req.body, expected_keys)
    if(!invalidParams.success) {
        let renderDetailed = false
        let useTemplate = false;

        response_options.forEach(option => {
            Object.entries(option).forEach(([k, v]) => {
                if(k === 'detailed' && v) renderDetailed = true
            })
        })

        if(customTemplates?.invalid_params) useTemplate = true;

        if(!renderDetailed){
            const invalidKeys = []
            invalidParams.invalidParams.forEach(k => {
                Object.keys(k).forEach(key => invalidKeys.push(key))
            })

            if(useTemplate) return res.status(400).send(generateCustomTemplate(customTemplates.invalid_params, invalidKeys));

            return res.status(400).send(generateError('invalid_param(s)', {invalid_params: invalidKeys}))
        }

        return (useTemplate && !renderDetailed ) ? res.status(400).send(generateCustomTemplate(customTemplates.invalid_params, invalidParams.invalidParams)) : res.status(400).send(generateError('invalid_param(s)', {invalid_params: invalidParams.invalidParams}))
    }

    req.body = invalidParams?.transformed_keys;
    next();

}