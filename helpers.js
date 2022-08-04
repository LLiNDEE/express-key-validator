import fs from 'fs';
import yaml from 'js-yaml';
import { strictMode } from './index.js';

const validTemplates = ['missing_params', 'invalid_params', 'unknown_params'];
export const customTemplates = {};
export let CONFIG_PATH = 'validator.config.yml';

export const getMissingParams = (incomingKeys, expectedKeys) => {
	const keys = Object.keys(expectedKeys);
	const incoming_keys = Object.keys(incomingKeys);
	const missingParams = keys.filter((k) => !incoming_keys.includes(k));
	if (missingParams.length > 0) {
		return {
			success: false,
			missingParams: missingParams,
		};
	}

	return {
		success: true,
	};
};

export const generateError = (type, config) => {
	return {
		type: type,
		success: false,
		...config,
	};
};

export const checkInvalidParams = (incomingKeys, expectedKeys) => {
	let isValid = true;
	const invalidParams = [];

	Object.entries(expectedKeys).forEach(([param, v]) => {
		const rules = v.rules;

		let exist = false;
		rules.forEach((ruleObject) => {
			let incomingValue = incomingKeys[param];

			if (typeof ruleObject === 'object') {
				if (ruleObject.rule === 'default') {
					if (
						typeof incomingValue === 'undefined' ||
						incomingValue.trim() === ''
					) {
						incomingKeys[param] = ruleObject.value;
					}
				}
			}

			if (transformType[ruleObject.rule]) {
				incomingKeys[param] = transformType[ruleObject.rule](incomingValue);
				return;
			}

			if (typeof incomingValue === 'undefined' || incomingValue.trim() === '') {
				if (!strictMode && typeof incomingValue === 'undefined') return;
				if (exist) return;
				if (checkDefaultValue(rules)) return;
				isValid = false;
				exist = true;
				const formattedRules = formatRules(rules);
				return invalidParams.push({
					[param]: { 'expected_type(s)': formattedRules },
				});
			}

			if (typeof ruleObject === 'object') {
				if (ruleObject.rule === 'default') {
					if (incomingValue.trim() === '') incomingKeys[param] = value;
					return;
				}

				if (ruleObject.rule === 'email' && ruleObject?.regex !== '') {
					if (
						!validateType[ruleObject.rule](incomingValue, ruleObject?.regex)
					) {
						if (exist) return;
						isValid = false;
						exist = true;
						const formattedRules = formatRules(rules);
						return invalidParams.push({
							[param]: { 'expected_type(s)': formattedRules },
						});
					}
					return;
				}

				if (ruleObject.rule === 'required') return;

				if (ruleObject?.value) {
					if (!validateType[ruleObject.rule](incomingValue, ruleObject.value)) {
						if (exist) return;
						isValid = false;
						exist = true;
						const formattedRules = formatRules(rules);
						return invalidParams.push({
							[param]: { 'expected_type(s)': formattedRules },
						});
					}
				} else {
					if (!validateType[ruleObject.rule](incomingValue)) {
						if (exist) return;
						isValid = false;
						exist = true;
						const formattedRules = formatRules(rules);
						return invalidParams.push({
							[param]: { 'expected_type(s)': formattedRules },
						});
					}
				}
			}
		});
	});

	if (!isValid) {
		return {
			success: false,
			invalidParams: invalidParams,
		};
	}

	return {
		success: true,
		transformed_keys: incomingKeys,
	};
};

const checkDefaultValue = (rules) => {
	let hasDefaultValue = false;

	rules.forEach((ruleObject) => {
		if (ruleObject.rule === 'default') return (hasDefaultValue = true);
	});

	return hasDefaultValue;
};

export const getUnknownParams = (receivedParams, expectedParams) => {
	const unknownParams = [];
	Object.entries(receivedParams).forEach(([key, value]) => {
		if (!expectedParams[key]) unknownParams.push(key);
	});

	if (unknownParams.length > 0) {
		return {
			success: false,
			unknownParams: unknownParams,
		};
	}

	return {
		success: true,
	};
};

const formatRules = (rules) => {
	const formattedRules = [];
	rules.forEach((ruleObject) => {
		if (typeof ruleObject.rule === 'string' && ruleObject.rule !== 'required') {
			formattedRules.push(ruleObject.rule);
		}
		resolveInvalidMessage(ruleObject.rule, ruleObject.value) !== '' &&
			formattedRules.push(
				resolveInvalidMessage(ruleObject.rule, ruleObject.value)
			);
	});
	return formattedRules;
};

export const resolveInvalidMessage = (type, value) =>
	type === 'min'
		? `Minimum length of ${value}`
		: type === 'max'
		? `Maximum length of ${value}`
		: type === 'enum'
		? `Allowed values: ${value}`
		: type === 'regex'
		? `Did not match the regex: ${value}`
		: '';

export const validateType = {
	string: (v) => isString(v) && v.trim() !== '',
	integer: (v) => isNumber(+v),
	min: (v, m) => checkMinValue(v, m),
	max: (v, m) => checkMaxValue(v, m),
	enum: (v, enums) => checkEnum(v, enums),
	email: (email, regex = undefined) => checkEmail(email, regex),
	positive: (v) => isPositive(v),
	negative: (v) => isNegative(v),
	regex: (v, regex) => testRegex(v, regex),
};

export const transformType = {
	lowercase: (v) => v.toLowerCase(),
	uppercase: (v) => v.toUpperCase(),
	trim: (v) => v.trim(),
};

export const readConfig = () => {
	try {
		if (!validateConfigPath()) {
			return console.log(
				`CONFIG-ERROR!\r\n Config file named '${CONFIG_PATH}' does not exist.`
			);
		}

		const fileContents = fs.readFileSync(CONFIG_PATH, 'utf8');
		const data = yaml.load(fileContents);

		if (!data || data === undefined) return;
		setCustomTemplate(data);
	} catch (e) {
		return false;
	}
};

const validateConfigPath = () => {
	try {
		if (!CONFIG_PATH.includes('.yml')) CONFIG_PATH = CONFIG_PATH + '.yml';
		return fs.existsSync(CONFIG_PATH);
	} catch (e) {
		return false;
	}
};

const setCustomTemplate = (data) => {
	Object.entries(data).forEach(([k, v]) => {
		if (!validTemplates.includes(k)) return;
		customTemplates[k] = v?.template;
	});
};

export const generateCustomTemplate = (template, data = []) => {
	let stringTemplate = JSON.stringify(template);
	console.log(data);
	if (stringTemplate.includes('$params$')) {
		stringTemplate = stringTemplate.replace('$params$', data);
	}
	return JSON.parse(stringTemplate);
};

const isNumber = (v) => typeof v === 'number' && !isNaN(v) && v;
const isString = (v) => typeof v === 'string';
const isArray = (v) => Array.isArray(v);
const checkMinValue = (value, minValue) =>
	value && value.length >= minValue && value && minValue;
const checkMaxValue = (value, maxValue) =>
	value && value.length <= maxValue && value && maxValue;
const checkEnum = (value, enums) => enums.includes(value);
const checkEmail = (email, regex) =>
	email &&
	email.includes('@') &&
	email.includes('.') &&
	email.length > 3 &&
	email.match(regex ? regex : regExpEmail);
const isPositive = (value) => Math.sign(value) === 1;
const isNegative = (value) => Math.sign(value) === -1;
const testRegex = (value, regex) => value.match(regex);

const regExpEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
