import { type State, type ChildDom } from "vanjs-core";
export interface SelectOption<T = string | number> {
    value: T;
    label: string | State<string>;
    description?: string | State<string>;
    icon?: ChildDom;
    disabled?: boolean;
}
export interface SelectDropdownProps<T = string | number> {
    id?: string;
    name?: string;
    options: SelectOption<T>[] | State<SelectOption<T>[]>;
    value?: State<T> | T;
    defaultValue?: T;
    placeholder?: string | State<string>;
    searchable?: boolean;
    searchPlaceholder?: string | State<string>;
    disabled?: boolean | State<boolean>;
    class?: string;
    onChange?: (value: T, option: SelectOption<T>) => void;
}
export declare function SelectDropdown<T = string | number>(props: SelectDropdownProps<T>): HTMLDivElement;
export type DropdownMenuItem = {
    type?: "item";
    label: string | State<string>;
    icon?: ChildDom;
    badge?: string | number;
    disabled?: boolean;
    destructive?: boolean;
    onClick?: (e: MouseEvent) => void;
} | {
    type: "header";
    label: string | State<string>;
} | {
    type: "divider";
};
export interface DropdownMenuProps {
    id?: string;
    trigger: (isOpen: State<boolean>) => ChildDom;
    items: DropdownMenuItem[];
    align?: "left" | "right";
    class?: string;
}
export declare function DropdownMenu(props: DropdownMenuProps): HTMLDivElement;
//# sourceMappingURL=dropdown.d.ts.map