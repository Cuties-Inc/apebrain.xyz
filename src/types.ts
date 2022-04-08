export type Todo = {
    title: string,
    description?: string,
    due?: Date,
    checkedDate?: Date 
}

export enum InputMode {
    TodoCommand = 0,
    Modal,
    Insert,
}
