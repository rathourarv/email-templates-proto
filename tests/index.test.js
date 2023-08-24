import Email from '../index';
import path from 'path';

const root = path.join(__dirname, 'fixtures', 'emails');

describe('verify email templates', () => {
	it('verify send email using local files', async () => {
		const email = new Email({
			views: {root},
			message: {
				from: 'test+from@gmail.com',
			},
			transporter: {
				jsonTransport: true,
			},
		});
		const res = await email.send(
			'test',
			{
				to: 'test+to@gmail.com',
				cc: 'test+cc@gmail.com',
				bcc: 'test+bcc@gmail.com',
				attachments: [
					{
						filename: 'signature.jpeg',
						path: path.join(root, 'images', 'signature.jpeg'),
						// Cid should be same as configured in the email template.
						cid: 'signature',
					},
				],
			},
			{name: 'test'});
		const message = JSON.parse(res.message);
		console.log(message);
	});

	it('verify send email using s3 files', async () => {
		const email = new Email({
			s3Config: {
				bucket: 'testing-email-templates',
				clientConfig: {
					region: 'ap-southeast-2',
				},
			},
			views: {
				root: 'emails',
				sourceType: 's3',
			},
			transporter: {
				jsonTransport: true,
			},
		});
		const res = await email.send(
			'test',
			{
				to: 'test+to@gmail.com',
				cc: 'test+cc@gmail.com',
				bcc: 'test+bcc@gmail.com',
				attachments: [
					{
						filename: 'signature.jpeg',
						path: 'emails/signature.jpeg',
						// Cid should be same as configured in the email template.
						cid: 'signature',
					},
				],
			},
			{name: 'test'});
		const message = JSON.parse(res.message);
		console.log(message);
	});
});
