import {S3Client, ListObjectsV2Command, GetObjectCommand} from '@aws-sdk/client-s3';
import util from 'util';

const debug = util.debuglog('email-templates');

class S3 {
	constructor(config, view) {
		this.types = ['subject', 'html', 'text'];
		this.config = config;
		this.view = view;
		this.s3Client = new S3Client(config.clientConfig);

		this.fetchTemplates.bind(this);
		this.readFile.bind(this);
	}

	async _fetchtemplates(template) {
		const command = new ListObjectsV2Command({
			Bucket: this.config.bucket,
			Prefix: `${this.view.root}/${template}/`,
		});
		const objects = await this.s3Client.send(command);
		debug(`file contents: ${objects.Contents}`);
		return objects.Contents;
	}

	async streamToString(stream, contentType = 'utf-8') {
		return new Promise((resolve, reject) => {
			const chunks = [];
			stream.on('data', chunk => chunks.push(chunk));
			stream.on('error', reject);
			stream.on('end', () => resolve(Buffer.concat(chunks).toString(contentType)));
		});
	}

	async readFile(templatefile, contentType = 'utf-8') {
		const input = new GetObjectCommand(
			{
				Bucket: this.config.bucket,
				Key: templatefile,
			},
		);
		const resp = await this.s3Client.send(input);
		return this.streamToString(resp.Body, contentType);
	}

	async fetchTemplates(template) {
		const templates = await this._fetchtemplates(template);
		const contents = {};
		for (template of templates) {
			const templateName = template.Key.split('/').at(-1);
			const templateType = templateName.split('.')[0];
			if (this.types.includes(templateType)) {
				const content = await this.readFile(template.Key);
				contents[templateType] = content;
			} else {
				debug(`Ignoring file: ${template}`);
			}
		}

		return contents;
	}
}

module.exports = S3;
