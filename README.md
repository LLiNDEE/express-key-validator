# EXPRESS-KEY-VALIDATOR
A simple body-key-validator for your express-app.
Using schemas to define the expected-keys and their expected type.

**Still in BETA and more features will be added soon**

## Installation
Installation is done using **npm install command:**
```> npm install express-key-validator```

## Usage
```
> const express = require('express')
> const Validator = require('express-key-validator')
>
> const app = express()
> app.use(express.json())
> app.use(express.urlencoded({ extended:  true}))
>
> app.use(Validator.validateKeys)
>
> const Schema = Validator.Schema
> const Connect = Validator.Route.Connect
>
> const UserSchema = new Schema.Create({
>    firstname: Schema.isString().exec(),
>    username: Schema.isString().max(16).exec(),
>    password: Schema.isString().min(6).exec(),
>    age: Schema.isInteger().exec(),
> })
>
> Connect("/user", UserSchema)
>
> app.post("/user",(req, res) => {
>    ...
>    res.send("success")
> })
```
### Validation options
```
> Schema.isString() - Checks if the value is of type 'string'
> Schema.isInteger() - Checks if the value is of type 'number'
> Schema.min(3) - Defines the minimum length of the value
> Schema.max(10) - Defines the maximum length of the value
> Schema.isEmail() - Checks if the value is a valid email-address
> Schema.enum([]) - Defines a set of allowed values
> Schema.exec() - Defines the end of the validation rules
```
#### Example
```
> const UserSchema = new Schema.Create({
>    firstname: Schema.isString().min(3).exec(),
>    email: Schema.isString().isEmail().exec()
> })
```

## Response types
**Missing params**
```
> {
>   "type": "missing_param(s)",
>   "success": false,
>   "missing_params": [
>      "firstname"
>    ]
> }
```
**Invalid params**
```
> {
>  "type": "invalid_param(s)",
>  "success": false,
>  "invalid_params": [
>    "firstname"
>   ]
> }
```
Response Options:
```
> const Response = Validator.Response
> Response.Options({detailed: true})
```
Response output:
```
> {
>   "type": "invalid_param(s)",
>   "success": false,
>   "invalid_params": [
>     {
>       "firstname": {
>         "expected_type(s)": [
>            "String"
>          ]
>        }
>      },
>   ]
> }
```

## Contribution
Pull requests are welcome. For any considerable changes, please open an issue first to discuss what you would like to change.
NOTE: This is still in BETA so please let me know if there are any features that you think can be improved or added.