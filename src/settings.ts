import { App, PluginSettingTab, Setting, TextAreaComponent, TextComponent } from 'obsidian';
import VirtFolderPlugin  from './main';

export interface VirtFolderSettings
{
	ignorePath: string;
}

export const DEFAULT_SETTINGS: Partial<VirtFolderSettings> = 
{
	ignorePath: ''
};

export class VirtFolderSettingTab extends PluginSettingTab
{
	plugin: VirtFolderPlugin;
	counter: TextComponent;

	constructor(app: App, plugin: VirtFolderPlugin) {
		super(app, plugin);
		this.plugin = plugin;
		this.init_settings();
	}

	display(): void
	{
		let { containerEl } = this;
		containerEl.empty();
	
		// validate on change !!

		let default_value = this.plugin.settings.ignorePath;
	
		new Setting(containerEl)
		.setName("List of ignored paths")
		.setDesc("Each line is interpreted as the start of an ignored path")
		.addTextArea((textArea: TextAreaComponent) =>
		{
			textArea
				.setValue(default_value)
				.setPlaceholder('Enter one or more paths relative to the archive root')
				.onChange(async (value) =>
				{

					this.plugin.settings.ignorePath = value;
					await this.plugin.saveSettings();

					this.update_filter(value);
					this.update_counter();
					this.update_note_list();
				});

			textArea.inputEl.setAttr("rows", 6);
			textArea.inputEl.setAttr("cols", 40);
		});

		new Setting(containerEl)
		.setName("Ignored files")
		.addText((text: TextComponent) =>
		{
			text.setValue('0').setDisabled(true);
			this.counter = text;
		});

		this.update_counter();
	}

	update_counter()
	{
		let count = this.plugin.data.base.get_filtred_count();
		this.counter.setValue(count.toString());
	}

	update_note_list()
	{
		this.plugin.data.base.rescan();
		this.plugin.update_data();
	}
	
	update_filter(value:string)
	{
		let filter = this.parse_text_area(value);
		this.plugin.data.base.set_filter(filter);
	}

	parse_text_area(value:string)
	{
		return value.split(/\r|\n/).map(n => n.trim()).filter(n=>n);
	}

	init_settings()
	{
		this.update_filter(this.plugin.settings.ignorePath);
	}
}