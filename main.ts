import {App, Modal, Plugin, Editor, MarkdownView, Notice, PluginSettingTab, Setting} from 'obsidian';

interface KbdPluginSettings {
	shortcutFormat: string;
}

const DEFAULT_SETTINGS: KbdPluginSettings = {
	shortcutFormat: '<kbd class="kbd">{shortcut}</kbd>'
}

export default class KbdPlugin extends Plugin {
	settings: KbdPluginSettings;

	async onload() {
		await this.loadSettings();

		// Add command to insert keyboard shortcut
		this.addCommand({
			id: 'insert-keyboard-shortcut',
			name: 'Insert Keyboard Shortcut',
			editorCallback: (editor: Editor) => {
				const onSubmit = (shortcut: string) => {
					if (shortcut) {
						const formattedShortcut = this.settings.shortcutFormat.replace('{shortcut}', shortcut);
						editor.replaceSelection(formattedShortcut);
					}
				};

				// Create and show modal for shortcut input
				new KbdInputModal(this.app, onSubmit).open();
			}
		});

		// Register markdown processor to style shortcuts
		this.registerMarkdownPostProcessor((element, context) => {
			const kbdElements = element.querySelectorAll('.kbd');
			kbdElements.forEach(el => {
				// Add any additional styling or processing here if needed
				el.addClass('kbd-plugin');
			});
		});

		// Add settings tab
		this.addSettingTab(new KbdSettingTab(this.app, this));
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class KbdInputModal extends Modal {
	shortcut: string;
	onSubmit: (shortcut: string) => void;

	constructor(app: App, onSubmit: (shortcut: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;

		contentEl.createEl('h2', { text: 'Enter Keyboard Shortcut' });

		new Setting(contentEl)
			.setName('Shortcut')
			.addText(text => text
				.setPlaceholder('e.g., Ctrl+C')
				.onChange(value => {
					this.shortcut = value;
				}));

		new Setting(contentEl)
			.addButton(btn => btn
				.setButtonText('Insert')
				.setCta()
				.onClick(() => {
					this.close();
					this.onSubmit(this.shortcut);
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}


class KbdSettingTab extends PluginSettingTab {
	plugin: KbdPlugin;

	constructor(app: App, plugin: KbdPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Keyboard Shortcuts Settings' });

		new Setting(containerEl)
			.setName('Shortcut Format')
			.setDesc('Format for inserting keyboard shortcuts. Use {shortcut} as placeholder.')
			.addText(text => text
				.setPlaceholder(DEFAULT_SETTINGS.shortcutFormat)
				.setValue(this.plugin.settings.shortcutFormat)
				.onChange(async (value) => {
					this.plugin.settings.shortcutFormat = value;
					await this.plugin.saveSettings();
				}));
	}
}
