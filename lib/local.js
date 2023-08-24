import path from 'path';
import fs from 'fs/promises';

class Local {
	constructor(view) {
		this.types = ['subject', 'text', 'html'];
		this.view = view;
	}

	async getTemplates(template) {
		const templateDir = path.join(this.view.root, template);
		const files = await fs.readdir(templateDir);
		return files.filter(f => this.types.includes(f.split('.')[0])).map(f => ({templateName: f.split('.')[0], path: path.join(this.view.root, template, f)}));
	}

	async readFile(filePath) {
		return fs.readFile(filePath);
	}

	async fetchTemplates(template) {
		const templates = await this.getTemplates(template);
		const contents = {};
		for (const template of templates) {
			const content = await this.readFile(template.path);
			contents[template.templateName] = content;
		}

		return contents;
	}
}

module.exports = Local;
