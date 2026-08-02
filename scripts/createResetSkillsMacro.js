import { resetSkillsMacro } from "./resetSkillsMacro.js";

export async function createResetSkillsMacro() {
  const macroName = "Amnesia: Reset Skills";
  const macroCommand = `const resetSkillsMacro = ${resetSkillsMacro.toString()}; resetSkillsMacro();`;

  const existing = game.macros.getName(macroName);

  if (existing) {
    // Keep the stored command in sync with the current module code, but only for a
    // macro we created — never clobber one the user has customized themselves.
    const createdByModule = existing.getFlag("CoC7.Amnesia", "createdByModule");
    if (createdByModule && existing.command !== macroCommand) {
      await existing.update({ command: macroCommand });
      if (game.Amnesia.debug) console.log(`« Amnesia » | Updated macro "${macroName}"`);
    }
    return;
  }

  await Macro.create({
    name: macroName,
    type: "script",
    scope: "global",
    command: macroCommand,
    flags: { "CoC7.Amnesia": { createdByModule: true } },
    img: "icons/svg/stoned.svg"
  });

  if (game.Amnesia.debug) console.log(`« Amnesia » | Created macro "${macroName}"`);
  ui.notifications.info(`Macro "${macroName}" added to Macro Directory`);
}
