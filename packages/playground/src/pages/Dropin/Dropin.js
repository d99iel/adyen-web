import AdyenCheckout from '@adyen/adyen-web';
import '@adyen/adyen-web/dist/adyen.css';
import { createSession } from '../../services';
import { amount, shopperLocale, countryCode, returnUrl } from '../../config/commonConfig';
import '../../../config/polyfills';
import '../../style.scss';

const initCheckout = async () => {
    const session = await createSession({
        amount,
        reference: 'ABC123',
        returnUrl,
        countryCode
    });

    const checkout = await AdyenCheckout({
        session,
        countryCode,
        clientKey: process.env.__CLIENT_KEY__,
        locale: shopperLocale,
        environment: process.env.__CLIENT_ENV__,
        onPaymentCompleted: (result, component) => {
            console.log('onPaymentCompleted', result);
            switch (result.status) {
                case 'authorised':
                    component.setStatus('success');
                    break;
                default:
                    component.setStatus('error');
            }
        },
        onError: error => {
            console.log('AdyenCheckout error:', error.message, error.type);
        },
        paymentMethodsConfiguration: {}
    });

    const dropin = checkout.create('dropin').mount('#dropin-container');

    return [checkout, dropin];
};

initCheckout().then(([checkout, dropin]) => {
    window.checkout = checkout;
    window.dropin = dropin;
});
