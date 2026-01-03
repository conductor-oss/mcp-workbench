/*
 * Copyright 2026 Orkes, Inc.
 *
 * Licensed under the MIT License (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 *
 * https://opensource.org/licenses/MIT
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on
 * an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations under the License.
 */

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';

interface Schema {
    type?: string;
    properties?: Record<string, Schema>;
    items?: Schema;
    required?: string[];
    description?: string;
    enum?: any[];
    default?: any;
    [key: string]: any;
}

interface DynamicFormProps {
    schema: Schema;
    value: any;
    onChange: (value: any) => void;
    className?: string;
}

export const DynamicForm: React.FC<DynamicFormProps> = ({ schema, value, onChange, className }) => {
    // If no schema or empty object, render nothing
    if (!schema || Object.keys(schema).length === 0) return null;

    const handleFieldChange = (key: string, newValue: any) => {
        onChange({ ...value, [key]: newValue });
    };

    if (schema.type === 'object' || schema.properties) {
        return (
            <div className={`space-y-4 ${className}`}>
                {Object.entries(schema.properties || {}).map(([key, fieldSchema]) => {
                    const isRequired = schema.required?.includes(key);
                    return (
                        <div key={key} className="space-y-2">
                            <Label className="text-sm font-medium text-solar-base01">
                                {key} {isRequired && <span className="text-solar-red">*</span>}
                            </Label>
                            {fieldSchema.description && (
                                <p className="text-xs text-solar-base1 mb-1">{fieldSchema.description}</p>
                            )}
                            <SchemaField
                                schema={fieldSchema}
                                value={value?.[key]}
                                onChange={(v) => handleFieldChange(key, v)}
                            />
                        </div>
                    );
                })}
            </div>
        );
    }

    return (
        <SchemaField schema={schema} value={value} onChange={onChange} />
    );
};

const SchemaField: React.FC<{ schema: Schema, value: any, onChange: (v: any) => void }> = ({ schema, value, onChange }) => {
    // Enums (Select)
    if (schema.enum) {
        return (
            <select
                className="flex h-10 w-full rounded-md border border-solar-base1 bg-solar-base3 px-3 py-2 text-sm text-solar-base00 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solar-blue"
                value={value || ''}
                onChange={(e) => onChange(e.target.value)}
            >
                <option value="">-- Select --</option>
                {schema.enum.map((option: any) => (
                    <option key={String(option)} value={option}>{String(option)}</option>
                ))}
            </select>
        );
    }

    // Boolean
    if (schema.type === 'boolean') {
        return (
            <div className="flex items-center space-x-2">
                <Checkbox
                    checked={!!value}
                    onCheckedChange={(checked) => onChange(!!checked)}
                />
                <span className="text-sm text-solar-base1">{value ? 'True' : 'False'}</span>
            </div>
        );
    }

    // Number / Integer
    if (schema.type === 'number' || schema.type === 'integer') {
        return (
            <Input
                type="number"
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
                className="bg-solar-base3 border-solar-base1 text-solar-base00"
            />
        );
    }

    // Array
    if (schema.type === 'array') {
        const items = Array.isArray(value) ? value : [];
        const itemSchema = schema.items || { type: 'string' };

        const addItem = () => {
            // Default value based on type
            let defaultValue: any = "";
            if (itemSchema.type === 'number') defaultValue = 0;
            if (itemSchema.type === 'boolean') defaultValue = false;
            if (itemSchema.type === 'object') defaultValue = {};

            onChange([...items, defaultValue]);
        };

        const removeItem = (index: number) => {
            const newItems = [...items];
            newItems.splice(index, 1);
            onChange(newItems);
        };

        const updateItem = (index: number, val: any) => {
            const newItems = [...items];
            newItems[index] = val;
            onChange(newItems);
        };

        return (
            <div className="space-y-2 border border-solar-base2 rounded p-3 bg-solar-base2/10">
                {items.map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <SchemaField schema={itemSchema} value={item} onChange={(v) => updateItem(idx, v)} />
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(idx)}
                            className="text-solar-red hover:bg-solar-red/10 h-10 w-10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                <Button variant="outline" size="sm" onClick={addItem} className="w-full border-dashed border-solar-base1 text-solar-base1 hover:text-solar-blue">
                    <Plus className="w-4 h-4 mr-2" /> Add Item
                </Button>
            </div>
        );
    }

    // Object (Recursive)
    if (schema.type === 'object') {
        return (
            <div className="border border-solar-base2 rounded p-4 bg-solar-base2/20">
                <DynamicForm
                    schema={schema}
                    value={value || {}}
                    onChange={onChange}
                />
            </div>
        );
    }

    // String (Default)
    return (
        <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className="bg-solar-base3 border-solar-base1 text-solar-base00"
        />
    );
};
