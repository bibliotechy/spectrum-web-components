/* TABLE
Copyright 2022 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/
import {
    CSSResultArray,
    html,
    PropertyValues,
    render,
    SpectrumElement,
    TemplateResult,
} from '@spectrum-web-components/base';
import { property } from '@spectrum-web-components/base/src/decorators.js';
import styles from './table.css.js';
import { TableBody } from './TableBody.js';
import { TableCheckboxCell } from './TableCheckboxCell.js';
import { TableHead } from './TableHead.js';
import type { TableHeadCell } from './TableHeadCell.js';
import { TableRow } from './TableRow.js';
import { virtualize } from '@lit-labs/virtualizer/virtualize.js';

interface Range {
    first: number;
    last: number;
}

export class RangeChangedEvent extends Event {
    // This does not work. See https://github.com/lit/lit/issues/3051 for more info.
    static eventName = 'rangeChanged';

    first: number;
    last: number;

    constructor(range: Range) {
        super(RangeChangedEvent.eventName, { bubbles: true });
        this.first = range.first;
        this.last = range.last;
    }
}

/**
 * @element sp-table
 *
 * @event rangeChanged - Announces a change in the range of visible cells on the table body
 * @event change - Announces a change in the `selected` property of a table row
 */

// when table doesn't have a scroller, it should be height auto and
// the slotted sp table body element should always have overflow visible.
export class Table extends SpectrumElement {
    public static override get styles(): CSSResultArray {
        return [styles];
    }

    get renderItem(): (
        item: Record<string, unknown>,
        index: number
    ) => TemplateResult {
        return this._renderItem;
    }

    set renderItem(
        fn: (item: Record<string, unknown>, index: number) => TemplateResult
    ) {
        this._renderItem = (
            item: Record<string, unknown>,
            index: number
        ): TemplateResult => {
            const value = this.itemValue(item, index);
            const selected = this.selected.includes(value);

            return html`
                <sp-table-row
                    value=${value}
                    aria-rowindex=${index + 1}
                    ?selected=${selected}
                >
                    ${this.selects
                        ? html`
                              <sp-table-checkbox-cell
                                  ?checked=${selected}
                              ></sp-table-checkbox-cell>
                          `
                        : html``}
                    ${fn(item, index)}
                </sp-table-row>
            `;
        };
    }

    private _renderItem: (
        item: Record<string, unknown>,
        index: number
    ) => TemplateResult = () => html``;

    @property({ reflect: true })
    public role = 'grid';

    @property({ type: String, reflect: true })
    public selects: undefined | 'single' | 'multiple';

    @property({ type: Array })
    public selected: string[] = [];

    private selectedSet = new Set<string>();

    @property({ type: Array })
    public items: Record<string, unknown>[] = [];

    @property({ type: Object })
    public itemValue = (_item: unknown, index: number): string => {
        return '' + index;
    };

    private tableBody?: TableBody;

    private tableHeadCheckboxCell?: TableCheckboxCell;

    private get isVirtualized(): boolean {
        return !!this.items.length;
    }

    public override focus(): void {
        const sortableHeadCell = this.querySelector(
            'sp-table-head-cell[sortable]'
        ) as TableHeadCell;
        if (sortableHeadCell) {
            sortableHeadCell.focus();
        }
    }

    private selectAllRows(): void {
        if (this.isVirtualized) {
            this.items.forEach((item, index: number) => {
                this.selectedSet.add(this.itemValue(item, index));
            });
            this.selected = [...this.selectedSet];
        } else {
            const tableRows = [
                ...this.querySelectorAll('sp-table-row'),
            ] as TableRow[];
            tableRows.forEach((row) => {
                row.selected = true; // Visually
                this.selectedSet.add(row.value); // Prepares table state
            });
            this.selected = [...this.selectedSet];
        }

        if (!this.tableHeadCheckboxCell) return;
        this.tableHeadCheckboxCell.checked = true;
        this.tableHeadCheckboxCell.indeterminate = false;
    }

    private deselectAllRows(): void {
        this.selectedSet.clear();
        this.selected = [];

        if (!this.isVirtualized) {
            const selectedRows = [
                ...this.querySelectorAll('[selected]'),
            ] as TableRow[];

            selectedRows.forEach((row) => {
                row.selected = false;
            });
        }

        if (!this.tableHeadCheckboxCell) return;
        this.tableHeadCheckboxCell.checked = false;
        this.tableHeadCheckboxCell.indeterminate = false;
    }

    protected manageSelects(): void {
        const tableHead = this.querySelector('sp-table-head') as TableHead;
        const checkboxes = this.querySelectorAll('sp-table-checkbox-cell');

        if (!!this.selects) {
            let allSelected = false;
            if (this.isVirtualized) {
                allSelected =
                    this.selected.length > 0 &&
                    this.selected.length === this.items.length;
            } else {
                const tableRows = [
                    ...this.querySelectorAll('sp-table-row'),
                ] as TableRow[];

                tableRows.forEach((row) => {
                    row.selected = this.selectedSet.has(row.value);
                    if (!checkboxes || checkboxes.length < 1) {
                        const checkbox = document.createElement(
                            'sp-table-checkbox-cell'
                        );
                        row.insertAdjacentElement('afterbegin', checkbox);
                        checkbox.checked = row.selected;
                    }
                });

                allSelected = this.selected.length === tableRows.length;
            }

            if (!this.tableHeadCheckboxCell) {
                this.tableHeadCheckboxCell = document.createElement(
                    'sp-table-checkbox-cell'
                ) as TableCheckboxCell;
                tableHead.insertAdjacentElement(
                    'afterbegin',
                    this.tableHeadCheckboxCell
                );
            }
            this.tableHeadCheckboxCell.selectsSingle =
                this.selects === 'single';
            this.tableHeadCheckboxCell.checked = allSelected;
            this.tableHeadCheckboxCell.indeterminate =
                this.selected.length > 0 && !allSelected;
        } else {
            checkboxes.forEach((box) => {
                box.remove();
            });
            delete this.tableHeadCheckboxCell;
        }
    }

    protected manageSelected(): void {
        this.selectedSet = new Set(this.selected);

        if (!this.isVirtualized) {
            const rows = [
                ...this.querySelectorAll('sp-table-row'),
            ] as TableRow[];

            rows.forEach((row) => {
                row.selected = this.selectedSet.has(row.value);
            });
            if (this.tableHeadCheckboxCell)
                this.tableHeadCheckboxCell.checked =
                    this.selected.length === rows.length;
        }
    }

    protected manageCheckboxes(): void {
        const tableRows = [
            ...this.querySelectorAll('sp-table-row'),
        ] as TableRow[];
        const tableHead = this.querySelector('sp-table-head') as TableHead;

        if (!!this.selects) {
            this.tableHeadCheckboxCell = document.createElement(
                'sp-table-checkbox-cell'
            );
            const allSelected = this.selected.length === tableRows.length;

            if (this.tableHeadCheckboxCell) {
                this.tableHeadCheckboxCell.selectsSingle =
                    this.selects === 'single';
                this.tableHeadCheckboxCell.checked = allSelected;
                this.tableHeadCheckboxCell.indeterminate =
                    this.selected.length > 0 && !allSelected;
            }

            tableHead.insertAdjacentElement(
                'afterbegin',
                this.tableHeadCheckboxCell
            );

            tableRows.forEach((row) => {
                const checkbox = document.createElement(
                    'sp-table-checkbox-cell'
                );
                row.insertAdjacentElement('afterbegin', checkbox);
                row.selected = this.selectedSet.has(row.value);
                checkbox.checked = row.selected;
            });
        } else {
            tableHead.querySelector('sp-table-checkbox-cell')?.remove();
            tableRows.forEach((row) => {
                row.checkboxCells[0]?.remove();
                if (this.selected.length) {
                    row.selected = this.selectedSet.has(row.value);
                }
            });
        }
    }

    protected handleChange(event: Event): void {
        // Contain the children's change events and convert it to a change event on the table
        // if rowItem doesn't have a value, we assume it's in TableHead (naive!!!)
        const { target } = event;
        const { parentElement: rowItem } = target as HTMLElement & {
            parentElement: TableRow;
        };
        if (!rowItem.value) {
            const { checkbox } = target as TableCheckboxCell;
            if (checkbox.checked || checkbox.indeterminate) {
                this.selectAllRows();
            } else {
                this.deselectAllRows();
            }
        } else {
            switch (this.selects) {
                case 'single': {
                    this.deselectAllRows();
                    if (rowItem.selected) {
                        this.selectedSet.add(rowItem.value);
                        this.selected = [...this.selectedSet];
                    }
                    break;
                }
                case 'multiple': {
                    if (rowItem.selected) {
                        this.selectedSet.add(rowItem.value);
                    } else {
                        this.selectedSet.delete(rowItem.value);
                    }
                    this.selected = [...this.selectedSet];

                    const tableRows = [
                        ...this.querySelectorAll('sp-table-row'),
                    ] as TableRow[];

                    const allSelected =
                        this.selected.length === tableRows.length;

                    if (!this.tableHeadCheckboxCell) return;
                    this.tableHeadCheckboxCell.checked = allSelected;
                    this.tableHeadCheckboxCell.indeterminate =
                        this.selected.length > 0 && !allSelected;
                    break;
                }
                default: {
                    break;
                }
            }
        }
        event.stopPropagation();
        this.dispatchEvent(
            new Event('change', {
                cancelable: true,
                bubbles: true,
                composed: true,
            })
        );
    }

    public scrollToIndex(index?: number): void {
        if (index) {
            this.renderVirtualizedItems(index);
        }
    }

    protected override render(): TemplateResult {
        return html`
            <slot @change=${this.handleChange}></slot>
        `;
    }

    protected override willUpdate(changed: PropertyValues<this>): void {
        if (!this.hasUpdated) {
            const rowValues = new Set<string>();

            if (this.isVirtualized) {
                this.items.forEach((item, index) => {
                    const value = this.itemValue(item, index);
                    rowValues.add(value);
                });
            } else {
                const tableRows = [
                    ...this.querySelectorAll('sp-table-row'),
                ] as TableRow[];
                tableRows.forEach((row) => {
                    rowValues.add(row.value);
                });
            }

            const oldSelectedCount = this.selected.length;

            this.selected = this.selected.filter((selectedItem) =>
                rowValues.has(selectedItem)
            );
            if (oldSelectedCount !== this.selected.length) {
                this.dispatchEvent(
                    new Event('change', {
                        cancelable: true,
                        bubbles: true,
                        composed: true,
                    })
                );
            }
            this.selectedSet = new Set(this.selected);

            this.manageCheckboxes();
        }
        if (changed.has('selects')) {
            this.manageSelects();
        }

        if (changed.has('selected') && this.hasUpdated) {
            this.manageSelected();
        }
    }

    protected override updated(): void {
        if (this.items.length) {
            this.renderVirtualizedItems();
        }
    }

    protected renderVirtualizedItems(index?: number): void {
        if (!this.tableBody) {
            this.tableBody = this.querySelector('sp-table-body') as TableBody;
            if (!this.tableBody) {
                this.tableBody = document.createElement('sp-table-body');
                this.append(this.tableBody);
            }
            // TODO: query Lit team about the `e.stopPropagation()` that happens here.
            this.tableBody.addEventListener(
                'rangeChanged',
                (event: RangeChangedEvent) => {
                    // console.log('rangeChanged');
                    this.dispatchEvent(
                        new RangeChangedEvent({
                            first: event.first,
                            last: event.last,
                        })
                    );
                }
            );
        }
        const config: {
            renderItem?: (
                item: Record<string, unknown>,
                index: number
            ) => TemplateResult;
            scroller?: boolean;
            items?: Array<unknown>;
            scrollToIndex?: {
                index: number;
            };
        } = {
            items: this.items,
            renderItem: this.renderItem,
            scroller: true,
        };
        if (index) {
            config.scrollToIndex = {
                index,
            };
        }
        render(
            html`
                ${virtualize(config)}
            `,
            this.tableBody
        );
    }
}
