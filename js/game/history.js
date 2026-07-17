export class History {
    constructor() {
        this.stack = [];
        this.pointer = -1;
    }

    reset() {
        this.stack = [];
        this.pointer = -1;
    }

    push(action) {
        this.stack = this.stack.slice(0, this.pointer + 1);
        this.stack.push(action);
        this.pointer = this.stack.length - 1;
    }

    canUndo() {
        return this.pointer >= 0;
    }

    canRedo() {
        return this.pointer < this.stack.length - 1;
    }

    undo() {
        if (!this.canUndo()) return null;
        const action = this.stack[this.pointer];
        this.pointer--;
        return { ...action, direction: 'undo' };
    }

    redo() {
        if (!this.canRedo()) return null;
        this.pointer++;
        const action = this.stack[this.pointer];
        return { ...action, direction: 'redo' };
    }
}

export const ActionType = {
    FILL: 'fill',
    ERASE: 'erase',
    NOTE_TOGGLE: 'note_toggle',
    HINT: 'hint',
};
