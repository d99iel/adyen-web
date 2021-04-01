import { h } from 'preact';
import { useState, useEffect, useRef } from 'preact/hooks';
import { renderFormField } from '../../../internal/FormFields';
import Field from '../../../internal/FormFields/Field';
import Address from '../../../internal/Address';
import { boletoValidationRules } from './validate';
import { boletoFormatters } from './utils';
import SendCopyToEmail from '../../../internal/SendCopyToEmail/SendCopyToEmail';
import useCoreContext from '../../../../core/Context/useCoreContext';
import { BoletoInputDataState } from '../../types';
import useForm from '../../../../utils/useForm';
import SocialSecurityNumberBrazil from '../SocialSecurityNumberBrazil/SocialSecurityNumberBrazil';

function BoletoInput(props) {
    const { i18n } = useCoreContext();
    const addressRef = useRef(null);
    const { handleChangeFor, triggerValidation, setSchema, setData, setValid, setErrors, data, valid, errors, isValid } = useForm<
        BoletoInputDataState
    >({
        schema: ['firstName', 'lastName', 'socialSecurityNumber', 'billingAddress', 'shopperEmail'],
        defaultData: props.data,
        rules: boletoValidationRules,
        formatters: boletoFormatters
    });

    // Email field toggle
    const [showingEmail, setShowingEmail] = useState<boolean>(false);
    const toggleEmailField = () => setShowingEmail(!showingEmail);

    // Handle form schema updates
    useEffect(() => {
        const newSchema = [
            ...(props.personalDetailsRequired ? ['firstName', 'lastName', 'socialSecurityNumber'] : []),
            ...(props.billingAddressRequired ? ['billingAddress'] : []),
            ...(showingEmail ? ['shopperEmail'] : [])
        ];
        setSchema(newSchema);
    }, [showingEmail, props.personalDetailsRequired, props.billingAddressRequired]);

    const handleAddress = address => {
        setData('billingAddress', address.data);
        setValid('billingAddress', address.isValid);
        setErrors('billingAddress', address.errors);
    };

    const [status, setStatus] = useState('ready');
    this.setStatus = setStatus;

    this.showValidation = () => {
        triggerValidation();
        if (props.billingAddressRequired) {
            addressRef.current.showValidation();
        }
    };

    useEffect(() => {
        const billingAddressValid = props.billingAddressRequired ? Boolean(valid.billingAddress) : true;
        props.onChange({ data, valid, errors, isValid: isValid && billingAddressValid });
    }, [data, valid, errors]);

    const buttonModifiers = [...(!props.personalDetailsRequired && !props.billingAddressRequired && !props.showEmailAddress ? ['standalone'] : [])];

    return (
        <div className="adyen-checkout__boleto-input__field">
            {props.personalDetailsRequired && (
                <div className={'adyen-checkout__fieldset adyen-checkout__fieldset--address adyen-checkout__fieldset--personalDetails'}>
                    <div className="adyen-checkout__fieldset__title">{i18n.get('personalDetails')}</div>

                    <div className="adyen-checkout__fieldset__fields">
                        <Field label={i18n.get('firstName')} classNameModifiers={['firstName', 'col-50']} errorMessage={!!errors.firstName}>
                            {renderFormField('text', {
                                name: 'firstName',
                                autocorrect: 'off',
                                spellcheck: false,
                                value: data.firstName,
                                onInput: handleChangeFor('firstName', 'input'),
                                onChange: handleChangeFor('firstName')
                            })}
                        </Field>

                        <Field label={i18n.get('lastName')} classNameModifiers={['lastName', 'col-50']} errorMessage={!!errors.lastName}>
                            {renderFormField('text', {
                                name: 'lastName',
                                autocorrect: 'off',
                                spellcheck: false,
                                value: data.lastName,
                                onInput: handleChangeFor('lastName', 'input'),
                                onChange: handleChangeFor('lastName')
                            })}
                        </Field>

                        <SocialSecurityNumberBrazil
                            data={data.socialSecurityNumber}
                            error={errors.socialSecurityNumber}
                            valid={valid.socialSecurityNumber}
                            onInput={handleChangeFor('socialSecurityNumber', 'input')}
                            onChange={handleChangeFor('socialSecurityNumber')}
                        />
                    </div>
                </div>
            )}

            {props.billingAddressRequired && (
                <Address
                    label="billingAddress"
                    data={{ ...props.data.billingAddress, country: 'BR' }}
                    onChange={handleAddress}
                    requiredFields={['street', 'houseNumberOrName', 'postalCode', 'city', 'stateOrProvince']}
                    ref={addressRef}
                />
            )}

            {props.showEmailAddress && (
                <SendCopyToEmail
                    value={data.shopperEmail}
                    errors={errors.shopperEmail}
                    onToggle={toggleEmailField}
                    onInput={handleChangeFor('shopperEmail', 'input')}
                    onChange={handleChangeFor('shopperEmail')}
                />
            )}

            {props.showPayButton && props.payButton({ status, label: i18n.get('boletobancario.btnLabel'), classNameModifiers: buttonModifiers })}
        </div>
    );
}

BoletoInput.defaultProps = {
    data: {},
    showEmailAddress: true,
    personalDetailsRequired: true,
    billingAddressRequired: true
};

export default BoletoInput;
