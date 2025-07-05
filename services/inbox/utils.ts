import { cleanTextContent, decodeFormValue } from './parse';

// getValueFromFormData is a function that gets a value from a FormData object.
export const getValueFromFormData = (
    formData: FormData,
    key: string,
    options: {
        decode?: boolean;
        defaultValue?: string;
        trim?: boolean;
        lowercase?: boolean;
        maxLength?: number;
        sanitize?: boolean;
        attributes?: any;
    } = {},
) => {
    // Set the default options
    const {
        decode = false,
        defaultValue = '',
        trim = false,
        lowercase = false,
        maxLength = -1, // -1 means no limit
        sanitize = false,
        attributes = null,
    } = options;

    // Get the value from the form data
    let value = (formData.get(key) as string) || defaultValue;

    // If the decode option is set, decode the value
    if (decode) {
        value = decodeFormValue(value);
    }

    // If the attributes option is set, add the attributes to the value to the start of the string
    if (attributes) {
        // Prefix the value with the attributes
        value = `${attributes}: ${value}`;
    }

    // If the value is a string, clean it up
    value = cleanTextContent(value, {
        trim,
        lowercase,
        maxLength,
        sanitize,
    });

    // Return the value
    return value;
};
