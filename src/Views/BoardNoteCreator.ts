import Services from 'Base/Services';
import { PropertyNativeType } from 'Data/PropertyManager';
import { TFile } from 'obsidian';
import { InternalWorkspace } from 'Types/Internal';
import { getPropertyKeyFromId } from 'Utils';
import { EMPTY_GROUP_VALUE } from './BoardViewRenderer';

export class BoardNoteCreator {
    private pendingNote: {
        groupValue: unknown;
        subGroupValue?: unknown;
        groupPropertyId?: string | null;
        subGroupPropertyId?: string | null;
    } | null = null;

    handleNewNoteClick(groupValue: unknown, subGroupValue?: unknown, groupPropertyId?: string | null, subGroupPropertyId?: string | null): void {
        // Store the pending note info
        this.pendingNote = {
            groupValue,
            subGroupValue,
            groupPropertyId,
            subGroupPropertyId
        };

        // Trigger native new button
        const newButton = document.querySelector('.bases-toolbar-new-item-menu .text-icon-button');
        if (newButton instanceof HTMLElement) {
            newButton.click();
        } else {
            console.warn('[BoardNoteCreator] New button not found');
            this.pendingNote = null;
        }
    }

    async processPendingNote(): Promise<void> {
        if (!this.pendingNote) return;

        try {
            // Get the active editor's file
            const file = (Services.app.workspace as InternalWorkspace)._activeEditor?.file;

            if (file instanceof TFile) {
                await this.assignGroupValues(
                    file,
                    this.pendingNote.groupValue,
                    this.pendingNote.subGroupValue,
                    this.pendingNote.groupPropertyId,
                    this.pendingNote.subGroupPropertyId
                );
            } else {
                console.warn('[BoardNoteCreator] No active editor file found');
            }
        } finally {
            // Clear the pending note
            this.pendingNote = null;
        }
    }

    private async assignGroupValues(file: TFile, groupValue: unknown, subGroupValue?: unknown, groupPropertyId?: string | null, subGroupPropertyId?: string | null): Promise<void> {
        // Assign group value (skip if EMPTY_GROUP_VALUE or missing property ID)
        if (groupPropertyId && groupValue !== null && groupValue !== EMPTY_GROUP_VALUE) {
            const groupPropertyKey = getPropertyKeyFromId(groupPropertyId);
            await Services.propertyManager.updateFrontmatter(
                file,
                groupPropertyKey,
                this.normalizeValueForPropertyType(groupPropertyKey, groupValue)
            );
        }

        // Assign sub-group value (skip if EMPTY_GROUP_VALUE or missing property ID)
        if (subGroupPropertyId && subGroupValue !== undefined && subGroupValue !== null && subGroupValue !== EMPTY_GROUP_VALUE) {
            const subGroupPropertyKey = getPropertyKeyFromId(subGroupPropertyId);
            await Services.propertyManager.updateFrontmatter(
                file,
                subGroupPropertyKey,
                this.normalizeValueForPropertyType(subGroupPropertyKey, subGroupValue)
            );
        }
    }

    private normalizeValueForPropertyType(propertyKey: string, value: unknown): unknown {
        const propertyType = Services.propertyManager.getPropertyType(propertyKey);
        if (propertyType !== PropertyNativeType.TAGS || value == null) {
            return value;
        }

        if (Array.isArray(value)) {
            return value;
        }

        if (typeof value === 'string') {
            return value.split(',').map(v => v.trim()).filter(Boolean);
        }

        return [String(value)];
    }
}
