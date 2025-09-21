export const registerSettings = () => {
    game.settings.register("amnesia", "characterJsonPath", {
        name: "Character JSON Directory",
        hint: "Select the directory where The Dhole's House format character JSON files are stored.",
        scope: "world",
        config: true,
        type: String,
        filePicker: "folder", // Enables the FilePicker dialog
        default: "" // Default to an empty string
    });
    
    game.settings.register('amnesia', 'debug', {
        name: 'Debug Mode',
        hint: 'Enables extra debug logging for Amnesia module.',
        scope: 'world',
        config: true,
        type: Boolean,
        default: false,
        onChange: (value) => {
            if (game.Amnesia) {
                game.Amnesia.debug = value;
            }
        }
    });
};