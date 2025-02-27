import { getCardImageUrl } from '../utils';
import {
    ENCRYPTED_SECURITY_CODE,
    ENCRYPTED_CARD_NUMBER,
    CVC_POLICY_REQUIRED,
    DATE_POLICY_REQUIRED,
    ENCRYPTED_EXPIRY_DATE,
    OPTIONAL,
    HIDDEN,
    ENCRYPTED_EXPIRY_MONTH,
    ENCRYPTED_EXPIRY_YEAR
} from '../lib/configuration/constants';
import {
    CbObjOnError,
    CbObjOnFocus,
    CbObjOnBrand,
    CbObjOnAllValid,
    CbObjOnFieldValid,
    CbObjOnAutoComplete,
    CbObjOnConfigSuccess,
    CbObjOnLoad
} from '../lib/types';
import { existy } from '../lib/utilities/commonUtils';

/**
 * Emits the onConfigSuccess (ready) event
 * Here we can assume CSF is loaded and ready to be used
 */
function handleOnLoad(cbObj: CbObjOnLoad): void {
    // Propagate onLoad event
    this.props.onLoad(cbObj);

    // eslint-disable-next-line
    this.originKeyErrorTimeout = setTimeout(() => {
        if (this.state.status !== 'ready') {
            // Hide the spinner and lets look at the inputs
            this.setState({ status: 'originKeyError' });
            this.props.onError({ error: 'originKeyError', fieldType: 'defaultError' });
        }
    }, this.originKeyTimeoutMS);
}

/**
 * Emits the onConfigSuccess (ready) event
 * Here we can assume CSF is loaded, configured and ready to be used
 */
function handleOnConfigSuccess(cbObj: CbObjOnConfigSuccess): void {
    clearTimeout(this.originKeyErrorTimeout);

    this.setState({ status: 'ready' }, () => {
        // Propagate onConfigSuccess event
        this.props.onConfigSuccess(cbObj);
    });
}

/**
 * Emits the onAllValid event
 */
function handleOnAllValid(status: CbObjOnAllValid): boolean {
    // Form cannot be valid whilst there is an unsupported card
    if (this.state.hasUnsupportedCard) {
        return false;
    }

    this.setState({ isSfpValid: status.allValid }, () => {
        // New - fixes maestro-with-error-on-optional-cvc-field bug
        this.props.onChange(this.state);
        // Propagate onAllValid event
        this.props.onAllValid(status);
    });

    return true;
}

/**
 * Saves a field value from CSF in the CardInput state
 * Emits the onFieldValid event
 */
function handleOnFieldValid(field: CbObjOnFieldValid): boolean {
    // A card number field cannot be valid whilst there is an unsupported card
    if (this.state.hasUnsupportedCard && field.fieldType === ENCRYPTED_CARD_NUMBER) {
        return false;
    }

    const setValidFieldState = prevState => ({
        data: { ...prevState.data, [field.encryptedFieldName]: field.blob },
        valid: { ...prevState.valid, [field.encryptedFieldName]: field.valid },
        /**
         * For a field that has just received valid:true (field has just been completed & encrypted) - mark the error state for this field as false
         * For a field that has just received valid:false (field was encrypted, now is not)
         *  - field is either in a state of being incomplete but without errors (digit deleted) - so mark the error state for this field as false
         *  or has switched from valid/encrypted state to being in error (digit edited to one that puts the field in error) - so keep any error that
         *  might just have been set
         */
        errors: { ...prevState.errors, [field.fieldType]: prevState.errors[field.fieldType] ?? false }
    });

    this.setState(setValidFieldState, () => {
        this.props.onChange(this.state);

        // Propagate onFieldValid event
        this.props.onFieldValid(field);
    });

    return true;
}

function fieldIsInError(fieldType: string, policy: string, numCharsObj: object, errorsObj) {
    return (policy === OPTIONAL || policy === HIDDEN) && numCharsObj[fieldType] === 0 ? false : errorsObj[fieldType];
}

/**
 * Saves the card brand in state
 * Emits the onBrand event
 */
function handleOnBrand(cardInfo: CbObjOnBrand): void {
    this.setState(
        prevState => {
            /**
             * If we change brand to one where the cvc or date field(s) are not required & are empty - then these fields cannot be in error
             * (scenario: have validated empty form, then choose brand w. optional/hidden cvc or date)...
             * ...else propagate the existing error.
             */
            const cvcFieldInError = fieldIsInError(ENCRYPTED_SECURITY_CODE, cardInfo.cvcPolicy, this.numCharsInField, prevState.errors);

            const dateFieldInError =
                this.numDateFields === 1
                    ? fieldIsInError(ENCRYPTED_EXPIRY_DATE, cardInfo.expiryDatePolicy, this.numCharsInField, prevState.errors)
                    : null;

            // For custom card comp
            const monthFieldInError =
                this.numDateFields === 2
                    ? fieldIsInError(ENCRYPTED_EXPIRY_MONTH, cardInfo.expiryDatePolicy, this.numCharsInField, prevState.errors)
                    : null;

            const yearFieldInError =
                this.numDateFields === 2
                    ? fieldIsInError(ENCRYPTED_EXPIRY_YEAR, cardInfo.expiryDatePolicy, this.numCharsInField, prevState.errors)
                    : null;
            // --
            /** end */

            return {
                brand: cardInfo.brand,
                cvcPolicy: cardInfo.cvcPolicy ?? CVC_POLICY_REQUIRED,
                showSocialSecurityNumber: cardInfo.showSocialSecurityNumber,
                errors: {
                    ...prevState.errors,
                    ...(existy(cvcFieldInError) && { [ENCRYPTED_SECURITY_CODE]: cvcFieldInError }),
                    ...(existy(dateFieldInError) && { [ENCRYPTED_EXPIRY_DATE]: dateFieldInError }),
                    ...(existy(monthFieldInError) && { [ENCRYPTED_EXPIRY_MONTH]: monthFieldInError }),
                    ...(existy(yearFieldInError) && { [ENCRYPTED_EXPIRY_YEAR]: yearFieldInError })
                },
                expiryDatePolicy: cardInfo.expiryDatePolicy ?? DATE_POLICY_REQUIRED
            };
        },
        () => {
            this.props.onChange(this.state);

            // Enhance data object with the url for the brand image, first checking if the merchant has configured their own one for this brand
            const brandImageUrl = this.props.brandsConfiguration[cardInfo.brand]?.icon ?? getCardImageUrl(cardInfo.brand, this.props.loadingContext);
            this.props.onBrand({ ...cardInfo, brandImageUrl });
        }
    );
}

/**
 * Handles validation errors
 */
function handleOnError(cbObj: CbObjOnError, hasUnsupportedCard: boolean = null): boolean {
    const errorCode = cbObj.error;

    this.setState(
        prevState => ({
            errors: { ...prevState.errors, [cbObj.fieldType]: errorCode || false },
            hasUnsupportedCard: hasUnsupportedCard !== null ? hasUnsupportedCard : false,
            // If dealing with an unsupported card ensure these card number related fields are reset re. pasting a full, unsupported card straight in
            ...(hasUnsupportedCard && { data: { ...prevState.data, [ENCRYPTED_CARD_NUMBER]: undefined } }),
            ...(hasUnsupportedCard && { valid: { ...prevState.valid, [ENCRYPTED_CARD_NUMBER]: false } }),
            ...(hasUnsupportedCard && { isSfpValid: false })
        }),
        () => {
            this.props.onChange(this.state);
        }
    );

    return true;
}

function handleFocus(cbObj: CbObjOnFocus): void {
    this.numCharsInField[cbObj.fieldType] = cbObj.numChars;

    this.props.onFocus(cbObj);
}

// Only called for holder name
function handleOnAutoComplete(cbObj: CbObjOnAutoComplete): void {
    this.setState({ autoCompleteName: cbObj.value }, () => {
        this.props.onChange(this.state);
        this.setState({ autoCompleteName: null }); // Nullify ref after sending it (lets shopper edit holder name)
    });
    this.props.onAutoComplete(cbObj);
}

/**
 * Handles cases where no secured fields are necessary (one click payments without CVC)
 * Automatically resolves with a valid state
 */
function handleOnNoDataRequired(): void {
    this.setState({ status: 'ready' }, () => this.props.onChange({ isSfpValid: true }));
}

export default {
    handleFocus,
    handleOnAllValid,
    handleOnAutoComplete,
    handleOnFieldValid,
    handleOnLoad,
    handleOnConfigSuccess,
    handleOnBrand,
    handleOnError,
    handleOnNoDataRequired
};
