import { h } from 'preact';
import useCoreContext from '../../../core/Context/useCoreContext';
import Button from '../../internal/Button';
import { updateAmazonCheckoutSession } from '../services';
import { OrderButtonProps, UpdateAmazonCheckoutSessionRequest } from '../types';

export default function OrderButton(props: OrderButtonProps) {
    const { i18n, loadingContext } = useCoreContext();

    this.createOrder = () => {
        const { amazonCheckoutSessionId, amount, clientKey, publicKeyId, region, returnUrl } = props;
        const request: UpdateAmazonCheckoutSessionRequest = {
            amount,
            checkoutResultReturnUrl: returnUrl,
            checkoutSessionId: amazonCheckoutSessionId,
            publicKeyId,
            region
        };

        updateAmazonCheckoutSession(loadingContext, clientKey, request)
            .then(response => {
                if (!response?.action?.type) return console.error(response.errorMessage || 'Could not get the AmazonPay URL');
                if (response.action.type === 'redirect') window.location.assign(response.action.url);
            })
            .catch(error => {
                if (props.onError) props.onError(error, this.componentRef);
            });
    };

    return <Button classNameModifiers={['standalone', 'pay']} label={i18n.get('confirmPurchase')} onClick={this.createOrder} />;
}
