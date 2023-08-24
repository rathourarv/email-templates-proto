import util from 'util';
import * as nodemailer from 'nodemailer';
import path from 'path';
import consolidate from 'consolidate';
import Local from './lib/local';
import previewEmail from 'preview-email';
import * as _ from 'lodash';
import S3 from './lib/s3';

const debug = util.debuglog('email-templates');

class Email {
	constructor(options) {
		this.options = _.merge({
			s3Config: {
				bucket: '',
				clientConfig: {},
			},
			views: {
				// S3 or local
				sourceType: 'local',
				root: path.resolve('emails'),
				extension: 'pug',
				engineSource: consolidate,
			},
			// Locals to pass to templates for rendering
			send: false,
			preview: true,
			transporter: {},
		}, options);
		this.send = this.send.bind(this);
		this.render = this.render.bind(this);
	}

	async fethAttachments(templateProvider, attachments) {
		const attachementWithContent = attachments.filter(attachment => !attachment.hasOwnProperty('path'));
		const attachmentsWithPath = attachments.filter(attachment => attachment.hasOwnProperty('path'));
		const updated = [];
		for (const attachment of attachmentsWithPath) {
			const content = await templateProvider.readFile(attachment.path, 'base64');
			delete attachment.path;
			updated.push({
				...attachment,
				content,
				encoding: 'base64',
			});
		}

		return attachementWithContent.concat(updated);
	}

	async render(contents, message, locals) {
		const renderer = this.options.views.engineSource[this.options.views.extension];
		const subject = message.subject ? message.subject : await renderer.render(contents.subject, locals);
		const text = message.text ? message.text : await renderer.render(contents.text, locals);
		const html = message.html ? message.html : await renderer.render(contents.html, locals);

		return {
			...message,
			subject,
			text,
			html,
		};
	}

	async send(template, message, locals = {}) {
		debug('template %s', template);
		debug('message %O', message);
		debug('locals (keys only): %O', Object.keys(locals));

		let templateProvider = new Local(this.options.views);
		if (this.options.views.sourceType === 's3') {
			templateProvider = new S3(this.options.s3Config, this.options.views);
			message.attachments = await this.fethAttachments(templateProvider, message.attachments);
		}

		// Get all available templates
		const templates = await templateProvider.fetchTemplates(template, locals);

		// Render and Assign the object variables over to the message
		message = await this.render(templates, message, locals);

		if (this.options.preview) {
			debug('using `preview-email` to preview email');
			await previewEmail(message);
		}

		if (!this.options.send) {
			debug('send disabled so we are ensuring JSONTransport');
			this.options.transporter = nodemailer.createTransport({
				jsonTransport: true,
			});
		}

		const res = await this.options.transporter.sendMail(message);
		debug('message sent');
		res.originalMessage = message;
		return res;
	}
}

module.exports = Email;

