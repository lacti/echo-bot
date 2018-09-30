import * as line from '@line/bot-sdk';
import * as awsTypes from 'aws-lambda';

const lineConfig = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN!,
  channelSecret: process.env.CHANNEL_SECRET!,
};

export const webhook = async (
  gatewayEvent: awsTypes.APIGatewayEvent,
  context: awsTypes.Context,
  callback: awsTypes.Callback,
) => {
  console.log(gatewayEvent);
  const signature = gatewayEvent.headers['X-Line-Signature'] as string;
  if (!signature) {
    return callback(new line.SignatureValidationFailed('no signature'));
  }

  const body = gatewayEvent.body!;
  if (!line.validateSignature(body, lineConfig.channelSecret, signature)) {
    return callback(
      new line.SignatureValidationFailed(
        'signature validation failed',
        signature,
      ),
    );
  }

  try {
    const lineEvents: { events: line.WebhookEvent[] } = JSON.parse(body);
    console.log(JSON.stringify(lineEvents, null, 2));

    const lineClient = new line.Client(lineConfig);
    for (const lineEvent of lineEvents.events) {
      switch (lineEvent.type) {
        case 'message':
          switch (lineEvent.message.type) {
            case 'text':
              await lineClient.replyMessage(lineEvent.replyToken, {
                type: 'text',
                text: lineEvent.message.text,
              });
          }
      }
    }
  } catch (err) {
    return callback(new line.JSONParseError(err.message, body));
  }
  return callback(null, {
    statusCode: 200,
    body: 'OK',
  });
};
