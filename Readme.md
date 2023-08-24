## Email-templates

This version of email-templates can fetch email templates from s3 and local both. If 
`source_type` is provided as s3 then `s3Config` should be present with the `bucketName` and
s3Config.

```
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
```

The root provided in the view config, template with template name will be used to form the s3 key.

Please refer for here[https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/interfaces/s3clientresolvedconfig.html] detailed s3 client config.

## Attachments from s3

It can also fetch attachments from s3. You can provide the s3 key as path in the attachment section.
```
					{
						filename: 'signature.jpeg',
						path: 'emails/signature.jpeg',
						// Cid should be same as configured in the email template.
						cid: 'signature',
					}
```

Improvements:

1. Introduce the cache on readfile so it doesn't download the file on each request.
2. Filepath insides html templates can not be downloaded from s3 e.g. style src as filepath.
