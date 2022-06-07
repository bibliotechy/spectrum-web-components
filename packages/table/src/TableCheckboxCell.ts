/* 
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
    // PropertyValues,
    SpectrumElement,
    TemplateResult,
} from '@spectrum-web-components/base';
import '@spectrum-web-components/checkbox/sp-checkbox.js';
import {
    property,
    query,
} from '@spectrum-web-components/base/src/decorators.js';
import { ifDefined } from '@spectrum-web-components/base/src/directives.js';
import cellStyles from './table-cell.css.js';
import headCellStyles from './table-head-cell.css.js';
import styles from './table-checkbox-cell.css.js';
import { Checkbox } from '@spectrum-web-components/checkbox';

/**
 * @element sp-table
 */
export class TableCheckboxCell extends SpectrumElement {
    public static override get styles(): CSSResultArray {
        return [cellStyles, headCellStyles, styles];
    }

    @property({ reflect: true })
    public role = 'gridcell';

    @property({ type: Number, reflect: true })
    public override tabIndex = -1;

    @query('.checkbox')
    public checkbox!: Checkbox;

    @property({ type: Boolean })
    public indeterminate = false;

    @property({ type: Boolean })
    public checked = false;

    @property({ type: Boolean })
    public disabled = false;

    @property({ type: Boolean, reflect: true, attribute: 'selects-single' })
    public selectsSingle = false;

    protected override render(): TemplateResult {
        return html`
            <sp-checkbox
                ?checked=${this.checked}
                ?indeterminate=${this.indeterminate}
                ?disabled=${this.disabled}
                aria-hidden=${ifDefined(this.selectsSingle)}
                @change=${() => {
                    this.dispatchEvent(
                        new Event('change', {
                            bubbles: true,
                            cancelable: true,
                            composed: true,
                        })
                    );
                }}
                class="checkbox"
            ></sp-checkbox>
        `;
    }

    // protected override update(changes: PropertyValues): void {
    //     if (changes.has('checked' || 'indeterminate')) {
    //         this.tabIndex = 0;
    //     }
    //     if (changes.has('disabled')) {
    //         this.tabIndex = -1;
    //     }
    //     super.update(changes);
    // }
}
