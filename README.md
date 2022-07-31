# EXPRESS-KEY-VALIDATOR
A simple body-key-validator for your express-app.
Using schemas to define the expected-keys and their expected type.

**Still in BETA and more features will be added soon**

## Installation
Installation is done using **npm install command:**
```> npm install express-key-validator```

## Usage
```js
> const express = require('express')
> const Validator = require('express-key-validator')
>
> const app = express()
> app.use(express.json())
> app.use(express.urlencoded({ extended:  true}))
>
> app.use(Validator.validateKeys)
>
> 
> const Connect = Validator.Route.Connect
>
> const UserSchema = new Validator().Schema().Create({
>    firstname: new Validator().string().min(3),
>    username: new Validator().string().required(),
>    password: new Validator().string().min(15).required(),
>    age: new Validator().integer().positive(),
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
```js
> string() - Checks if the value is of type 'string'
> integer() - Checks if the value is of type 'number'
> min(3) - Defines the minimum length of the value
> max(10) - Defines the maximum length of the value
> email() - Checks if the value is a valid email-address
> email({regex: *custom regex*}) - Makes it possible to use your own regex for email validation instead of using the default one
> enum([]) - Defines a set of allowed values
> lowercase() - Transform the value to lowercase
> uppercase() - Transform the value to uppercase
> trim() - Trims the value
> default("") - If the received value is undefined, it will use the value passed to the default function. 
> positive() - Checks if the value is a positive number
> negative() - Checks if the value is negative number
> required() - Defines that the param is required and will throw error if the param is not found
```
#### Example
```js
> const UserSchema = new Validator().Schema().Create({
>    firstname: new Validator().string().min(3),
>    email: new Validator().string().email()
```

## Options
Alternative options that can be used.
### StrictMode
```js
const Validator = require('express-key-validator')
new Validator().useStrictMode(true)
```
Setting strictMode to true means that every single param defined in the schema is automatically required. There is no need to use required() when using strictMode.

### SecureMode
```js
const Validator = require('express-key-validator')
new Validator().useSecureMode(true)
```
Setting secureMode to true means that it will ONLY allow params defined in the schema.

## Response types
**Missing params**
```yaml
> {
>   "type": "missing_param(s)",
>   "success": false,
>   "missing_params": [
>      "firstname"
>    ]
> }
```
**Invalid params**
```yaml
> {
>  "type": "invalid_param(s)",
>  "success": false,
>  "invalid_params": [
>    "firstname"
>   ]
> }
```

**Unknown params**
<br> NOTE: This only applies when secureMode is set to true.
```yaml
> {
>  "type": "unknown_param(s)",
>  "success": false,
>  "unknown_params": [
>    "asdasd"
>   ]
> }
```

Response Options:
```js
> const Response = Validator.Response
> Response.Options({detailed: true})
```

Response output:
```yaml
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
