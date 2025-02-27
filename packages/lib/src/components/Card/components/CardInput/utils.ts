import { getImageUrl } from '../../../../utils/get-image';
import { ErrorPanelObj } from '../../../../core/Errors/ErrorPanel';
import Language from '../../../../language/Language';
import { hasOwnProperty } from '../../../../utils/hasOwnProperty';
import { CardInputProps, LayoutObj, SortErrorsObj } from './types';
import {
    CREDIT_CARD,
    CREDIT_CARD_NAME_BOTTOM,
    CREDIT_CARD_NAME_TOP,
    KCP_CARD,
    KCP_CARD_NAME_BOTTOM,
    KCP_CARD_NAME_TOP,
    SSN_CARD,
    SSN_CARD_NAME_BOTTOM,
    SSN_CARD_NAME_TOP
} from './layouts';
import { StringObject } from '../../../internal/Address/types';

export const getCardImageUrl = (brand: string, loadingContext: string): string => {
    const imageOptions = {
        type: brand === 'card' ? 'nocard' : brand || 'nocard',
        extension: 'svg',
        loadingContext
    };

    return getImageUrl(imageOptions)(brand);
};

export const getLayout = ({ props, showKCP, showBrazilianSSN, countrySpecificSchemas = null }: LayoutObj): string[] => {
    let layout = CREDIT_CARD;
    const hasRequiredHolderName = props.hasHolderName && props.holderNameRequired;

    if (hasRequiredHolderName) {
        layout = props.positionHolderNameOnTop ? CREDIT_CARD_NAME_TOP : CREDIT_CARD_NAME_BOTTOM;
    }

    if (showKCP) {
        layout = KCP_CARD;
        if (hasRequiredHolderName) {
            layout = props.positionHolderNameOnTop ? KCP_CARD_NAME_TOP : KCP_CARD_NAME_BOTTOM;
        }
    }

    if (showBrazilianSSN) {
        layout = SSN_CARD;
        if (hasRequiredHolderName) {
            layout = props.positionHolderNameOnTop ? SSN_CARD_NAME_TOP : SSN_CARD_NAME_BOTTOM;
        }
    }
    // w. Billing address
    if (countrySpecificSchemas) {
        // Flatten array and remove any numbers that describe how fields should be aligned
        const countryBasedAddressLayout: string[] = countrySpecificSchemas['flat'](2).filter(item => typeof item !== 'number') as string[];

        layout = CREDIT_CARD.concat(countryBasedAddressLayout);
        if (hasRequiredHolderName) {
            layout = props.positionHolderNameOnTop
                ? CREDIT_CARD_NAME_TOP.concat(countryBasedAddressLayout)
                : CREDIT_CARD_NAME_BOTTOM.concat(countryBasedAddressLayout);
        }
        // TODO we are not yet creating a layout for AVS + SSN field (w. or w/o holderName) - is AVS + SSN a real world scenario?
    }
    return layout;
};

const mapFieldKey = (key: string, i18n: Language, countrySpecificLabels: StringObject): string => {
    switch (key) {
        case 'holderName':
        case 'taxNumber':
            return i18n.get(`creditCard.${key}`);
        case 'socialSecurityNumber':
            return i18n.get(`boleto.${key}`);
        // address related
        case 'street':
        case 'houseNumberOrName':
        case 'postalCode':
        case 'stateOrProvince':
        case 'city':
        case 'country':
            return countrySpecificLabels?.[key] ? i18n.get(countrySpecificLabels?.[key]) : i18n.get(key);
        // securedFields related
        default: {
            // Map all securedField field types to 'creditCard' - with 2 exceptions
            const type = ['ach', 'giftcard'].includes(key) ? key : 'creditCard';
            return i18n.get(`${type}.${key}.aria.label`);
        }
    }
};

export const sortErrorsForPanel = ({ errors, layout, i18n, countrySpecificLabels }: SortErrorsObj): ErrorPanelObj => {
    // Create array of fields with active errors, ordered according to passed layout
    const fieldList = Object.entries(errors).reduce((acc, [key, value]) => {
        if (value) {
            acc.push(key);
            acc.sort((a, b) => layout.indexOf(a) - layout.indexOf(b));
        }
        return acc;
    }, []);

    if (!fieldList || !fieldList.length) return null;

    // Create array of error messages to display
    const errorMessages = fieldList.map(key => {
        // Get translation for field type
        const errorKey: string = mapFieldKey(key, i18n, countrySpecificLabels);
        // Get corresponding error msg
        const errorMsg = hasOwnProperty(errors[key], 'errorI18n') ? errors[key].errorI18n : i18n.get(errors[key].errorMessage);

        return `${errorKey}: ${errorMsg}.`;
    });

    return !errorMessages.length ? null : { errorMessages, fieldList };
};

export const extractPropsForCardFields = (props: CardInputProps) => {
    return {
        // Extract props for CardFieldsWrapper & StoredCardFieldsWrapper(just needs amount, hasCVC, installmentOptions)
        amount: props.amount,
        billingAddressRequired: props.billingAddressRequired,
        billingAddressRequiredFields: props.billingAddressRequiredFields,
        billingAddressAllowedCountries: props.billingAddressAllowedCountries,
        brandsConfiguration: props.brandsConfiguration,
        enableStoreDetails: props.enableStoreDetails,
        hasCVC: props.hasCVC,
        hasHolderName: props.hasHolderName,
        holderNameRequired: props.holderNameRequired,
        installmentOptions: props.installmentOptions,
        placeholders: props.placeholders,
        positionHolderNameOnTop: props.positionHolderNameOnTop,
        // Extract props for CardFields > CardNumber
        showBrandIcon: props.showBrandIcon,
        // Extract props for StoredCardFields
        lastFour: props.lastFour,
        expiryMonth: props.expiryMonth,
        expiryYear: props.expiryYear
    };
};

export const extractPropsForSFP = (props: CardInputProps) => {
    return {
        allowedDOMAccess: props.allowedDOMAccess,
        autoFocus: props.autoFocus,
        brands: props.brands,
        brandsConfiguration: props.brandsConfiguration,
        clientKey: props.clientKey,
        countryCode: props.countryCode,
        i18n: props.i18n,
        implementationType: props.implementationType,
        keypadFix: props.keypadFix,
        legacyInputMode: props.legacyInputMode,
        loadingContext: props.loadingContext,
        minimumExpiryDate: props.minimumExpiryDate,
        onAdditionalSFConfig: props.onAdditionalSFConfig,
        onAdditionalSFRemoved: props.onAdditionalSFRemoved,
        onAllValid: props.onAllValid,
        onAutoComplete: props.onAutoComplete,
        onBinValue: props.onBinValue,
        onConfigSuccess: props.onConfigSuccess,
        onError: props.onError,
        onFieldValid: props.onFieldValid,
        onLoad: props.onLoad,
        showWarnings: props.showWarnings,
        trimTrailingSeparator: props.trimTrailingSeparator
    };
};
