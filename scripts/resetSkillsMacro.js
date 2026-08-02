// Amnesia Reset Skills Macro - creates a macro to reset character skills to base values
export const resetSkillsMacro = async () => {
    if (!game.user.isGM) return ui.notifications.warn("Only GM can reset skills");

    const characterActors = game.actors.filter(a => a.type === "character");
    if (!characterActors.length) return ui.notifications.info("No characters found");

    const options = characterActors.map(a =>
      `<option value="${a.id}">${a.name}</option>`
    ).join("");

    // DialogV2 is promise-based: the clicked button's callback return value becomes
    // the resolved value of wait(). The callback receives the native dialog element.
    const selectedIds = await foundry.applications.api.DialogV2.wait({
      window: { title: "Reset Character Skills" },
      content: `
        <p>Select character(s) to reset skills to base values:</p>
        <select id="actorSelect" multiple size="${Math.min(characterActors.length, 10)}" style="width:100%">
          ${options}
        </select>
      `,
      buttons: [
        {
          action: "reset",
          label: "Reset",
          default: true,
          callback: (event, button, dialog) => {
            const select = dialog.element.querySelector("#actorSelect");
            return select ? Array.from(select.selectedOptions).map(o => o.value) : [];
          }
        },
        {
          action: "cancel",
          label: "Cancel"
        }
      ],
      // Closing the dialog resolves to null instead of throwing.
      rejectClose: false
    });

    // Cancel button (no callback) resolves to its action string "cancel";
    // closing resolves to null. Only the Reset callback returns an array.
    if (!Array.isArray(selectedIds) || !selectedIds.length) return;

    for (const actorId of selectedIds) {
      const actor = game.actors.get(actorId);
      if (!actor) continue;

      for (const skill of actor.items.filter(i => i.type === "skill")) {
        const baseValue = await game.Amnesia.getBaseSkillValue(actor, skill);
        if (baseValue === null) {
          console.warn(`« Amnesia » | Could not determine base value for skill ${skill.name} on actor ${actor.name}`);
          continue;
        }

        // Ensure experience object exists before updating the skill
        const experience = skill.system.experience || { value: 0, spent: 0 };
        await skill.update({
          "system.base": baseValue,
          "system.value": baseValue,
          "system.experience": experience,
          "system.flags.developement": false // Reset flagged for development
        });
      }
      console.log(`« Amnesia » | Reset skills for ${actor.name}`);
    }
    ui.notifications.info(`« Amnesia » | Skills reset for ${selectedIds.length} character(s).`);
  };
