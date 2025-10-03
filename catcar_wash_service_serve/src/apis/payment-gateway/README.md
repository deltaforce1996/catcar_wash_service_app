# Payment Gateway API

This module handles payment processing using Beam Checkout service and includes webhook handling for payment notifications.

## Features

- Payment creation and management
- Beam Checkout integration
- Webhook signature verification
- Payment status tracking

## Webhook Integration

### Beam Webhook Signature Guard

The `BeamWebhookSignatureGuard` validates incoming webhook requests from Beam Checkout to ensure they are authentic and haven't been tampered with.

#### Configuration

Add the following environment variable to your `.env` file:

```env
BEAM_WEBHOOK_HMAC_KEY=your_webhook_hmac_key_from_beam_lighthouse
```

#### Usage

The webhook endpoint is automatically protected by the signature guard:

```typescript
@Post('webhook')
@UseGuards(BeamWebhookSignatureGuard)
async handleBeamWebhook(
  @Body() webhookPayload: BeamWebhookPayloadUnion,
  @Headers('x-beam-event') eventType: BeamWebhookEventType,
): Promise<SuccessResponse<any>>
```

#### Supported Webhook Events

- `charge.succeeded` - When a charge has been successfully processed

#### Webhook Signature Verification

The guard performs the following verification steps:

1. **Header Validation**: Checks for required headers (`x-beam-signature`, `x-beam-event`)
2. **Event Type Validation**: Ensures the event type is supported
3. **Signature Verification**: Uses HMAC-SHA256 to verify the webhook signature
4. **Timing-Safe Comparison**: Prevents timing attacks during signature comparison

#### Example Webhook Request

```http
POST /api/v1/payment-gateway/webhook
Content-Type: application/json
X-Beam-Signature: TIJ+djHBA1D4dviJ0EmFmctWf/w498Scaqjz4v0qNDU=
X-Beam-Event: charge.succeeded

{
  "chargeId": "ch_30GtUweMWec7r2hHIsV5xxQeJKp",
  "merchantId": "merchantId",
  "referenceId": "order#10001",
  "status": "SUCCEEDED",
  "currency": "THB",
  "amount": 3000000,
  "source": "PAYMENT_LINK",
  "sourceId": "sourceId",
  "transactionTime": "2025-07-23T10:16:12Z",
  "paymentMethod": {
    "paymentMethodType": "CARD",
    "card": {
      "last4": "1234",
      "brand": "VISA"
    }
  },
  "customer": {
    "primaryPhone": {
      "countryCode": "+66",
      "number": "0123456789"
    },
    "email": "beamcheckout@email.com"
  },
  "createdAt": "2025-07-23T10:15:56.102401Z",
  "updatedAt": "2025-07-23T10:16:17.418991Z"
}
```

## API Endpoints

### Payment Management

- `POST /api/v1/payment-gateway/payments` - Create a new payment
- `GET /api/v1/payment-gateway/payments/:id/status` - Get payment status
- `DELETE /api/v1/payment-gateway/payments/:id` - Cancel payment
- `POST /api/v1/payment-gateway/payments/:id/callback` - Handle payment callback

### Webhook

- `POST /api/v1/payment-gateway/webhook` - Handle Beam webhook notifications

## Security

- All webhook requests are validated using HMAC-SHA256 signature verification
- Event types are validated against a whitelist
- Timing-safe comparison prevents timing attacks
- Comprehensive logging for security monitoring

## Error Handling

The webhook guard will throw `UnauthorizedException` for:
- Missing webhook signature
- Missing event type
- Invalid event type
- Invalid webhook signature
- Missing webhook HMAC key configuration

## Testing

To test webhook signature verification, you can use the example data provided in the [Beam documentation](https://docs.beamcheckout.com/v1/guides/webhook):

- `X-Beam-Signature`: `CJ9Itj/ZY18MqOj5ohTmPqe1Q7USJqIItIKZmHDrkuM=`
- `HMAC Key`: `KOFELguf5L1ltuDlkDHGUkPPnQhrgYYijTR4Fqh7APc=`
- Request Body: (as shown in the documentation)