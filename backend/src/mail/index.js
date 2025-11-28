import SibApiV3Sdk from '@sendinblue/client';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();
apiInstance.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, process.env.BREVO_API_KEY);

const sendSmtpEmail = {
	to: [{ email: 'my-email@example.com', name: 'Recipient Name' }],
	sender: { email: 'your-email@example.com', name: 'Your Name' },
	subject: 'Hello',
	textContent: 'Testing some Brevo awesomeness!',
};

apiInstance.sendTransacEmail(sendSmtpEmail).then(
	function (data) {
		console.log('Email sent successfully:', data);
	},
	function (error) {
		console.error('Error while sending email:', error);
	}
);
